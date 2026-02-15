import { createPublicClient, createWalletClient, http, parseAbiItem, formatEther, parseEther, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { MoltbookService } from './services/MoltbookService.js';

dotenv.config();
dotenv.config({ path: '../contracts/.env' });

const ARENA_ABI = parseAbi([
    "event MatchProposed(uint256 indexed matchId, address indexed challenger, address indexed opponent, uint256 wager, uint8 gameType)",
    "event MatchAccepted(uint256 indexed matchId, address indexed opponent)",
    "event MovePlayed(uint256 indexed matchId, address indexed player, uint8 move)",
    "function acceptMatch(uint256 _matchId) external payable",
    "function playMove(uint256 _matchId, uint8 _move) external",
    "function resolveMatch(uint256 _matchId, address _winner) external",
    "function matchCounter() view returns (uint256)",
    "function matches(uint256) view returns (uint256 id, address challenger, address opponent, uint256 wager, uint8 gameType, uint8 status, address winner, uint256 createdAt)",
    "function hasPlayed(uint256 _matchId, address _player) view returns (bool)",
    "function playerMoves(uint256 _matchId, address _player) view returns (uint8)"
]);

const REGISTRY_ABI = parseAbi([
    "function registerAgent(string calldata _name, string calldata _model, string calldata _description, string calldata _metadataUri) external",
    "function agents(address) view returns (string name, string model, string description, string metadataUri, address owner, uint256 registeredAt, bool active)"
]);

const ARENA_ADDRESS = (process.env.VITE_ARENA_PLATFORM_ADDRESS || '0x30af30ec392b881b009a0c6b520ebe6d15722e9b') as `0x${string}`;
const REGISTRY_ADDRESS = '0x95884fe0d2a817326338735Eb4f24dD04Cf20Ea7';

if (!process.env.PRIVATE_KEY) {
    console.error(chalk.red("FATAL: PRIVATE_KEY environment variable is not set."));
    console.log(chalk.yellow("On Railway, please add PRIVATE_KEY to your Service variables in the Dashboard."));
    process.exit(1);
}

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const account = privateKeyToAccount(PRIVATE_KEY);

import { type Chain } from 'viem';

const MONAD_MAINNET = {
    id: 143,
    name: 'Monad Mainnet',
    network: 'monad-mainnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: [process.env.VITE_RPC_URL || 'https://rpc.monad.xyz'] },
        public: { http: [process.env.VITE_RPC_URL || 'https://rpc.monad.xyz'] },
    },
    contracts: {
        multicall3: {
            address: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`,
            blockCreated: 0,
        },
    },
} as const;

const publicClient = createPublicClient({
    chain: MONAD_MAINNET,
    transport: http()
});

const walletClient = createWalletClient({
    account,
    chain: MONAD_MAINNET,
    transport: http()
});

const GAME_NAMES = ['RockPaperScissors', 'DiceRoll', 'UNUSED', 'CoinFlip', 'UNUSED_TicTacToe'];

// AI Logic: Markov Chain for Opponent Modeling
class OpponentModel {
    // transitions[gameType][playerAddress][prevMove][nextMove] = count
    transitions: Record<number, Record<string, number[][]>> = {};
    history: Record<number, Record<string, number>> = {};
    matchCount: number = 0;
    wins: Record<string, number> = {};

    update(gameType: number, player: string, move: number) {
        if (!this.transitions[gameType]) this.transitions[gameType] = {};
        if (!this.history[gameType]) this.history[gameType] = {};

        // Game type move counts: RPS=3, Dice=6, Coin=2
        const size = gameType === 0 ? 3 : gameType === 1 ? 6 : 2;

        // Initialize player's transition table if it doesn't exist
        if (!this.transitions[gameType][player]) {
            this.transitions[gameType][player] = Array.from({ length: size }, () => Array(size).fill(0));
        }

        const lastMove = this.history[gameType][player];
        if (lastMove !== undefined && lastMove < size && move < size) {
            // Ensure nested objects exist check is handled by initialization above
            // Safe access knowing initialization is done
            const p = this.transitions[gameType]![player];
            if (p) {
                const row = p[lastMove];
                if (row) {
                    row[move] = (row[move] || 0) + 1;
                }
            }

            // Update stats
            this.matchCount++;
            if (!this.wins[player]) this.wins[player] = 0;
        }
        this.history[gameType][player] = move;
    }

    predict(gameType: number, player: string): number {
        const playerTrans = this.transitions[gameType]?.[player];
        const lastMove = this.history[gameType]?.[player];
        // Game type move counts: RPS=3, Dice=6, Coin=2
        const size = gameType === 0 ? 3 : gameType === 1 ? 6 : 2;

        if (!playerTrans || lastMove === undefined || !playerTrans[lastMove]) {
            return Math.floor(Math.random() * size);
        }

        const counts = playerTrans[lastMove]!;
        const total = counts.reduce((a, b) => a + b, 0);

        if (total === 0) return Math.floor(Math.random() * size);

        let predictedMove = 0;
        for (let i = 1; i < size; i++) {
            if (counts[i]! > counts[predictedMove]!) predictedMove = i;
        }

        if (gameType === 0) { // RPS - counter the predicted move
            return (predictedMove + 1) % 3;
        } else if (gameType === 1) { // Dice Roll (1-6) - pick high value with some randomness
            // Return 0-5 (will be converted to 1-6 when used)
            return Math.random() > 0.3 ? 5 : Math.floor(Math.random() * 6); // Favor 6
        } else if (gameType === 3) { // CoinFlip - exploit patterns or random
            return Math.random() > 0.5 ? predictedMove : 1 - predictedMove;
        } else {
            // Default random fallback for unknown types
            return Math.floor(Math.random() * size);
        }
    }
}

const model = new OpponentModel();
const respondedMatches = new Set<string>();
const processingAcceptance = new Set<string>();
const completedMatches = new Set<string>(); // Skip these on future scans
let lastKnownMatchCount = 0n;
const moltbook = new MoltbookService();

const activeGameLocks = new Set<string>();
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// RETRY HELPER: Handle temporary RPC/Network glitches
async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (e: any) {
            const isLast = i === retries - 1;
            console.log(chalk.yellow(`[${label}] RPC Error (attempt ${i + 1}/${retries}): ${e.shortMessage || e.message}`));
            if (isLast) throw e;
            await sleep(2000 * (i + 1)); // Exponential backoff
        }
    }
    throw new Error(`Failed ${label} after ${retries} retries`);
}

async function scanForMatches() {
    try {
        const matchCounter = await withRetry(() => publicClient.readContract({
            address: ARENA_ADDRESS,
            abi: ARENA_ABI,
            functionName: 'matchCounter',
        }), "matchCounter") as bigint;

        if (matchCounter === 0n) return;

        // Only scan matches we haven't marked as completed
        // Build list of match IDs to check (skip completed ones)
        const toCheck: bigint[] = [];
        for (let i = 0n; i < matchCounter; i++) {
            if (!completedMatches.has(i.toString())) {
                toCheck.push(i);
            }
        }

        const isNew = matchCounter > lastKnownMatchCount;
        if (isNew) {
            console.log(chalk.gray(`New matches detected! Total: ${matchCounter} | Scanning ${toCheck.length} active`));
        } else if (toCheck.length > 0) {
            console.log(chalk.gray(`Scanning ${toCheck.length} active matches (${completedMatches.size} completed, skipped)`));
        } else {
            // Nothing to scan — all matches are completed
            return;
        }
        lastKnownMatchCount = matchCounter;

        if (toCheck.length === 0) return;

        // BATCH FETCH: Only fetch active/pending matches
        const matchContracts = toCheck.map(id => ({
            address: ARENA_ADDRESS,
            abi: ARENA_ABI,
            functionName: 'matches',
            args: [id]
        }));

        const results = await withRetry(() => publicClient.multicall({ contracts: matchContracts }), "multicallMatches");

        for (let i = 0; i < results.length; i++) {
            const res = results[i];
            if (!res || res.status !== 'success') continue;
            const m = res.result as any;
            const matchId = toCheck[i];
            if (matchId === undefined) continue;
            const matchIdStr = matchId.toString();

            // Status 2 = Completed, 3 = Cancelled — mark and skip forever
            if (m[5] === 2 || m[5] === 3) {
                completedMatches.add(matchIdStr);
                continue;
            }

            if (processingAcceptance.has(matchIdStr)) continue;

            // 1. Accept pending matches (Status 0)
            if (m[5] === 0 && (m[2].toLowerCase() === account.address.toLowerCase() || m[2] === '0x0000000000000000000000000000000000000000')) {
                await handleChallenge(matchId, m[1], m[3], m[4]);
            }

            // 2. Process Accepted Matches (Play Move OR Resolve)
            if (m[5] === 1) {
                await tryPlayMove(matchId, m);
                await tryResolveMatch(matchId, m);
            }
        }
    } catch (e) {
        console.error(chalk.red("Error scanning for matches:"), e);
    }
}

async function startAgent() {
    try {
        console.log(chalk.gray('Connecting to Monad RPC...'));
        const blockNumber = await Promise.race([
            publicClient.getBlockNumber(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('RPC connection timeout (15s)')), 15000))
        ]);
        console.log(chalk.blue(`Connected to network. Current block: ${blockNumber}`));
    } catch (err: any) {
        console.error(chalk.red(`Failed to connect to network: ${err.message || err}`));
        console.log(chalk.yellow('Continuing anyway — will retry on first scan...'));
    }
    console.log(chalk.blue.bold('🤖 Arena AI Agent V3 (EIP-8004) Started'));

    const REGISTRY_ADDRESS = '0x34FCEE3eFaA15750B070836F19F3970Ad20fE8d1';
    const REGISTRY_ABI = [
        { inputs: [{ internalType: "string", name: "agentURI", type: "string" }], name: "register", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
        { inputs: [{ internalType: "address", name: "owner", type: "address" }], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }
    ] as const;

    // EIP-8004 Registration (Simpler Check)
    try {
        const balance = await publicClient.readContract({
            address: REGISTRY_ADDRESS,
            abi: REGISTRY_ABI,
            functionName: 'balanceOf',
            args: [account.address]
        }) as bigint;

        if (balance === 0n) {
            console.log(chalk.yellow('📝 Registering AI Agent Profile (EIP-8004)...'));

            console.log(chalk.yellow('📝 Registering AI Agent Profile (EIP-8004)...'));

            // User-provided IPFS CID
            const ipfsUri = "ipfs://bafkreig6sha4aqzafeqbocsppwobxdp3rlu7axv2rcloyh4tpw2afbj2r4";

            const txHash = await walletClient.writeContract({
                address: REGISTRY_ADDRESS,
                abi: REGISTRY_ABI,
                functionName: 'register',
                args: [ipfsUri],
                chain: MONAD_MAINNET,
                account
            });
            console.log(chalk.green(`✅ Agent Registered! TX: ${txHash}`));
        } else {
            console.log(chalk.green('✅ Agent already registered (EIP-8004).'));
        }
    } catch (e) {
        console.log(chalk.gray('EIP-8004 registration check... (skipping if failed)'));
    }

    console.log(chalk.gray(`Wallet: ${account.address} | Platform: ${ARENA_ADDRESS}`));

    setInterval(scanForMatches, 30000); // Check every 30s — event watchers handle real-time
    await scanForMatches();

    publicClient.watchEvent({
        address: ARENA_ADDRESS,
        event: parseAbiItem('event MatchProposed(uint256 indexed matchId, address indexed challenger, address indexed opponent, uint256 wager, uint8 gameType)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                const { matchId, challenger, opponent, wager, gameType } = log.args;
                if (processingAcceptance.has(matchId!.toString())) continue;

                if (opponent?.toLowerCase() === account.address.toLowerCase() || opponent === '0x0000000000000000000000000000000000000000') {
                    if (matchId !== undefined && challenger && wager !== undefined && gameType !== undefined) {
                        await handleChallenge(matchId, challenger, wager, gameType);
                    }
                }
            }
        }
    });

    publicClient.watchEvent({
        address: ARENA_ADDRESS,
        event: parseAbiItem('event MovePlayed(uint256 indexed matchId, address indexed player, uint8 move)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                const { matchId, player } = log.args;
                const matchIdStr = matchId!.toString();

                if (activeGameLocks.has(matchIdStr)) continue;

                const m = await withRetry(() => publicClient.readContract({
                    address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'matches', args: [matchId!]
                }), "readMatchEvent") as any;

                if (m[5] !== 1) continue;

                console.log(chalk.blue(`\nMove Detected: Match #${matchId} by ${player}`));

                // A. Try to play our move (if we are in match)
                await tryPlayMove(matchId!, m);

                // B. Try to Resolve (if both played) -> Global Referee
                await tryResolveMatch(matchId!, m);
            }
        }
    });
}

async function handleChallenge(matchId: bigint, challenger: string, wager: bigint, gameType: number) {
    if (processingAcceptance.has(matchId.toString())) return;
    processingAcceptance.add(matchId.toString());

    console.log(chalk.yellow(`\nMatch Proposed: #${matchId} (${GAME_NAMES[gameType]}) from ${challenger}`));

    const balance = await publicClient.getBalance({ address: account.address });
    // Allow up to 50% of balance (reserve rest for gas/other matches)
    const maxWager = balance / 2n;

    if (wager > maxWager) {
        console.log(chalk.red(`Challenge rejected: Wager ${formatEther(wager)} MON too high (Max allowed: ${formatEther(maxWager)} MON)`));
        return;
    }

    try {
        const { request } = await publicClient.simulateContract({
            address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'acceptMatch', args: [matchId], value: wager, account
        });
        const hash = await walletClient.writeContract(request);
        console.log(chalk.green(`Match #${matchId} accepted! Hash: ${hash}`));
        await publicClient.waitForTransactionReceipt({ hash });

        // Social Update: Match Accepted
        await moltbook.postChallengeAccepted(
            matchId.toString(),
            challenger,
            formatEther(wager),
            GAME_NAMES[gameType] || 'Unknown'
        );
    } catch (error: any) {
        processingAcceptance.delete(matchId.toString()); // Allow retry if failed
        if (error.message?.includes('available')) {
            console.log(chalk.gray(`Match #${matchId} already accepted by someone else.`));
        } else {
            console.error(chalk.red('Failed to accept match:'), error.shortMessage || error.message);
        }
    }
}

async function tryPlayMove(matchId: bigint, matchData: any) {
    const matchIdStr = matchId.toString();
    if (activeGameLocks.has(matchIdStr)) return;

    // Only play if Agent is a participant (Challenger or Opponent)
    const isChallenger = matchData[1].toLowerCase() === account.address.toLowerCase();
    const isOpponent = matchData[2].toLowerCase() === account.address.toLowerCase();

    if (!isChallenger && !isOpponent) return;

    // Check if we already played
    const hasPlayed = await withRetry(() => publicClient.readContract({
        address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'hasPlayed', args: [matchId, account.address]
    }), "hasPlayed") as boolean;

    if (hasPlayed) return;

    // FAIRNESS: If we are the opponent (accepted someone's challenge),
    // wait for the challenger to play first so they can't see our move
    if (isOpponent) {
        const challengerPlayed = await withRetry(() => publicClient.readContract({
            address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'hasPlayed', args: [matchId, matchData[1]]
        }), "challengerPlayed") as boolean;

        if (!challengerPlayed) return; // Wait for challenger to go first
    }

    activeGameLocks.add(matchIdStr);
    try {
        const gameType = matchData[4];
        const opponentAddr = isChallenger ? matchData[2] : matchData[1];

        console.log(chalk.magenta(`🤖 Agent playing move for Match #${matchId} (${GAME_NAMES[gameType]})...`));

        // Predict move based on opponent
        const aiMove = model.predict(gameType, opponentAddr);
        let moveToSend = aiMove;

        // Visual Logging
        let moveLabel = 'Strategic';
        if (gameType === 0) moveLabel = ['Rock', 'Paper', 'Scissors'][aiMove] || 'Unknown';
        else if (gameType === 1) { moveLabel = `Dice ${aiMove + 1}`; moveToSend = aiMove + 1; }
        else if (gameType === 3) moveLabel = ['Heads', 'Tails'][aiMove] || 'Unknown';

        console.log(chalk.yellow(`Submitting Move (${moveLabel})...`));

        const { request } = await publicClient.simulateContract({
            address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'playMove',
            args: [matchId, moveToSend], account
        });
        const hash = await walletClient.writeContract(request);
        console.log(chalk.gray(`TX: ${hash}`));
        await publicClient.waitForTransactionReceipt({ hash });

    } catch (e: any) {
        console.error(chalk.red(`Failed to play move for #${matchId}:`), e.shortMessage || e.message);
    } finally {
        activeGameLocks.delete(matchIdStr);
    }
}

async function tryResolveMatch(matchId: bigint, matchData: any) {
    const matchIdStr = matchId.toString();
    if (activeGameLocks.has(matchIdStr + '_resolve')) return;

    // Check if BOTH have played
    const [challengerPlayed, opponentPlayed] = await withRetry(() => Promise.all([
        publicClient.readContract({ address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'hasPlayed', args: [matchId, matchData[1]] }),
        publicClient.readContract({ address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'hasPlayed', args: [matchId, matchData[2]] })
    ]), "checkBothPlayed") as [boolean, boolean];

    if (!challengerPlayed || !opponentPlayed) return; // Wait for both

    activeGameLocks.add(matchIdStr + '_resolve');
    try {
        console.log(chalk.cyan(`⚖️ Resolving Match #${matchId} (Global Referee Mode)...`));

        // specific game logic fetching
        const [challengerMove, opponentMove] = await withRetry(() => Promise.all([
            publicClient.readContract({ address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'playerMoves', args: [matchId, matchData[1]] }),
            publicClient.readContract({ address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'playerMoves', args: [matchId, matchData[2]] })
        ]), "fetchMoves") as [number, number];

        const winner = determineWinner(matchData[4], matchData[1], Number(challengerMove), matchData[2], Number(opponentMove));

        const { request } = await publicClient.simulateContract({
            address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'resolveMatch',
            args: [matchId, winner as `0x${string}`], account
        });
        const hash = await walletClient.writeContract(request);
        console.log(chalk.green(`✅ Match #${matchId} Resolved! Winner: ${winner === matchData[1] ? 'Challenger' : 'Opponent'}`));

        // Social Update: Match Result
        await moltbook.postMatchResult(
            matchId.toString(),
            matchData[1], // Challenger
            matchData[2], // Opponent
            winner,
            formatEther(matchData[3] * 2n), // Total Prize Estimation (approx)
            GAME_NAMES[matchData[4]] || 'Unknown'
        );

    } catch (e: any) {
        const errMsg = e.shortMessage || e.message || '';
        if (errMsg.includes('Match not in progress')) {
            console.log(chalk.gray(`Match #${matchId} already resolved by another party.`));
            // Still post to Moltbook — we participated in this match
            try {
                const resolvedWinner = matchData[6]; // winner field from match struct
                if (resolvedWinner && resolvedWinner !== '0x0000000000000000000000000000000000000000') {
                    await moltbook.postMatchResult(
                        matchId.toString(),
                        matchData[1], matchData[2], resolvedWinner,
                        formatEther(matchData[3] * 2n),
                        GAME_NAMES[matchData[4]] || 'Unknown'
                    );
                }
            } catch (postErr: any) {
                console.error(chalk.yellow(`[MOLTBOOK] Post failed after external resolve: ${postErr.message}`));
            }
        } else {
            console.error(chalk.red(`Failed to resolve #${matchId}: ${errMsg}`));
        }
    } finally {
        activeGameLocks.delete(matchIdStr + '_resolve');
    }
}

function determineWinner(gameType: number, p1: string, m1: number, p2: string, m2: number): string {
    let p1Wins = false;
    let isTie = false;

    if (gameType === 0) { // RPS
        if (m1 === m2) isTie = true;
        else if ((m1 === 0 && m2 === 2) || (m1 === 1 && m2 === 0) || (m1 === 2 && m2 === 1)) p1Wins = true;
    } else if (gameType === 1) { // Dice
        if (m1 === m2) isTie = true;
        else if (m1 > m2) p1Wins = true;
    } else if (gameType === 3) { // Coin Flip
        // Oracle Flip logic - re-simulated for determination 
        // NOTE: Ideally, the Agent should store the flip result OR use blockhash randomness. 
        // For this hackathon version, we act as the random oracle at resolution time.
        const oracleFlip = Math.random() > 0.5 ? 1 : 0; // 0=Heads, 1=Tails
        console.log(chalk.gray(`🔮 Oracle Flip: ${oracleFlip === 0 ? 'Heads' : 'Tails'}`));

        const p1Correct = m1 === oracleFlip;
        const p2Correct = m2 === oracleFlip;

        if (p1Correct && !p2Correct) p1Wins = true;
        else if (!p1Correct && p2Correct) p1Wins = false;
        else isTie = true; // Both correct or both wrong
    }

    if (isTie) {
        // Fair Tie-Breaker (50/50)
        const luckyWinner = Math.random() > 0.5 ? p1 : p2;
        console.log(chalk.yellow(`🤝 TIE detected! Flipping coin for tie-breaker... Winner: ${luckyWinner === p1 ? 'Challenger' : 'Opponent'}`));
        return luckyWinner;
    }

    return p1Wins ? p1 : p2;
}

startAgent();
