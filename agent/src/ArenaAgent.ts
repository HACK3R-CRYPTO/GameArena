import { createPublicClient, createWalletClient, http, parseAbiItem, formatEther, parseEther, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

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
    "function matches(uint256) view returns (uint256 id, address challenger, address opponent, uint256 wager, uint8 gameType, uint8 status, address winner, uint256 createdAt)"
]);

const REGISTRY_ABI = parseAbi([
    "function registerAgent(string calldata _name, string calldata _model, string calldata _description, string calldata _metadataUri) external",
    "function agents(address) view returns (string name, string model, string description, string metadataUri, address owner, uint256 registeredAt, bool active)"
]);

const ARENA_ADDRESS = '0x7820903fC53197Ce02bDf9785AC04dd8e891BBb7';
const REGISTRY_ADDRESS = '0x95884fe0d2a817326338735Eb4f24dD04Cf20Ea7';
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const account = privateKeyToAccount(PRIVATE_KEY);

const MONAD_TESTNET = {
    id: 10143,
    name: 'Monad Testnet',
    network: 'monad-testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://testnet-rpc.monad.xyz'] },
        public: { http: ['https://testnet-rpc.monad.xyz'] },
    }
};

const publicClient = createPublicClient({
    chain: MONAD_TESTNET,
    transport: http()
});

const walletClient = createWalletClient({
    account,
    chain: MONAD_TESTNET,
    transport: http()
});

const GAME_NAMES = ['RockPaperScissors', 'DiceRoll', 'StrategyBattle', 'CoinFlip', 'TicTacToe'];

// AI Logic: Markov Chain for Opponent Modeling
class OpponentModel {
    // transitions[gameType][playerAddress][prevMove][nextMove] = count
    transitions: Record<number, Record<string, number[][]>> = {};
    history: Record<number, Record<string, number>> = {};

    update(gameType: number, player: string, move: number) {
        if (!this.transitions[gameType]) this.transitions[gameType] = {};
        if (!this.history[gameType]) this.history[gameType] = {};
        
        // Game type move counts: RPS=3, Dice=6, Strategy=10, Coin=2, TTT=9
        const size = gameType === 0 ? 3 : gameType === 1 ? 6 : gameType === 2 ? 10 : gameType === 3 ? 2 : 9;
        if (!this.transitions[gameType][player]) {
            this.transitions[gameType][player] = Array(size).fill(0).map(() => Array(size).fill(0));
        }
        
        const lastMove = this.history[gameType][player];
        if (lastMove !== undefined && lastMove < size && move < size) {
            this.transitions[gameType][player][lastMove][move]++;
        }
        this.history[gameType][player] = move;
    }

    predict(gameType: number, player: string): number {
        const playerTrans = this.transitions[gameType]?.[player];
        const lastMove = this.history[gameType]?.[player];
        // Game type move counts: RPS=3, Dice=6, Strategy=10, Coin=2
        const size = gameType === 0 ? 3 : gameType === 1 ? 6 : gameType === 2 ? 10 : 2;

        if (!playerTrans || lastMove === undefined || !playerTrans[lastMove] || !Array.isArray(playerTrans[lastMove])) {
            return Math.floor(Math.random() * size);
        }

        const counts = playerTrans[lastMove];
        const total = counts.reduce((a, b) => a + b, 0);
        
        if (total === 0) return Math.floor(Math.random() * size);

        let predictedMove = 0;
        for (let i = 1; i < size; i++) {
            if (counts[i] > counts[predictedMove]) predictedMove = i;
        }

        if (gameType === 0) { // RPS - counter the predicted move
            return (predictedMove + 1) % 3;
        } else if (gameType === 1) { // Dice Roll (1-6) - pick high value with some randomness
            // Return 0-5 (will be converted to 1-6 when used)
            return Math.random() > 0.3 ? 5 : Math.floor(Math.random() * 6); // Favor 6
        } else if (gameType === 2) { // Strategy Battle - pick high numbers
            return Math.random() > 0.4 ? Math.floor(Math.random() * 3) + 7 : predictedMove; // Favor 7-9
        } else if (gameType === 3) { // CoinFlip - exploit patterns or random
            return Math.random() > 0.5 ? predictedMove : 1 - predictedMove;
        } else { // TicTacToe - strategic positions
            // Favor center (4) and corners (0,2,6,8)
            const strategic = [4, 0, 2, 6, 8];
            return Math.random() > 0.3 ? strategic[Math.floor(Math.random() * strategic.length)] : predictedMove;
        }
    }
}

const model = new OpponentModel();
const respondedMatches = new Set<string>();
const processingAcceptance = new Set<string>();

async function scanForMatches() {
    try {
        const matchCounter = await publicClient.readContract({
            address: ARENA_ADDRESS,
            abi: ARENA_ABI,
            functionName: 'matchCounter',
        }) as bigint;

        for (let i = 0n; i < matchCounter; i++) {
            if (processingAcceptance.has(i.toString())) continue;

            const m = await publicClient.readContract({
                address: ARENA_ADDRESS,
                abi: ARENA_ABI,
                functionName: 'matches',
                args: [i]
            }) as any;

            // 1. Accept pending matches
            if (m[5] === 0 && (m[2].toLowerCase() === account.address.toLowerCase() || m[2] === '0x0000000000000000000000000000000000000000')) {
                await handleChallenge(i, m[1], m[3], m[4]);
            }
        }
    } catch (e) { }
}

async function startAgent() {
    console.log(chalk.blue.bold('🤖 Arena AI Agent V3 (EIP-8004) Started'));
    
    // EIP-8004 Registration
    try {
        const profile = await publicClient.readContract({
            address: REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'agents', args: [account.address]
        }) as any;
        
        if (!profile[4] || profile[1] === '') { // owner check or model empty
            console.log(chalk.yellow('📝 Registering AI Agent Profile (EIP-8004)...'));
            const { request } = await publicClient.simulateContract({
                address: REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'registerAgent',
                args: [
                    "Arena Champion AI",
                    "Markov-1 (Adaptive Pattern Learning)",
                    "Autonomous Gaming Agent mastering 4 game types: Rock-Paper-Scissors, Dice Roll, Strategy Battle, and Coin Flip with real-time opponent modeling.",
                    "https://moltiverse.dev"
                ],
                account
            });
            await walletClient.writeContract(request);
            console.log(chalk.green('✅ Agent Profile Registered!'));
        } else {
            console.log(chalk.cyan(`🆔 AI Agent Profile Verified: ${profile[0]} (${profile[1]})`));
        }
    } catch (e) {
        console.log(chalk.gray('EIP-8004 registration check... (skipping if failed)'));
    }

    console.log(chalk.gray(`Wallet: ${account.address} | Platform: ${ARENA_ADDRESS}`));

    setInterval(scanForMatches, 5000);
    await scanForMatches();

    publicClient.watchEvent({
        address: ARENA_ADDRESS,
        event: parseAbiItem('event MatchProposed(uint256 indexed matchId, address indexed challenger, address indexed opponent, uint256 wager, uint8 gameType)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                const { matchId, challenger, opponent, wager, gameType } = log.args;
                if (processingAcceptance.has(matchId!.toString())) continue;
                
                if (opponent?.toLowerCase() === account.address.toLowerCase() || opponent === '0x0000000000000000000000000000000000000000') {
                    await handleChallenge(matchId!, challenger!, wager!, gameType!);
                }
            }
        }
    });

    publicClient.watchEvent({
        address: ARENA_ADDRESS,
        event: parseAbiItem('event MovePlayed(uint256 indexed matchId, address indexed player, uint8 move)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                const { matchId, player, move } = log.args;
                
                // Block double-responses immediately
                if (respondedMatches.has(matchId!.toString())) continue;

                const m = await publicClient.readContract({
                    address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'matches', args: [matchId!]
                }) as any;

                // Status 1 = Accepted
                if (m[5] !== 1) continue;

                const isSelfChallenge = m[1].toLowerCase() === m[2].toLowerCase();
                const isUserMove = player?.toLowerCase() !== account.address.toLowerCase() || isSelfChallenge;

                if (isUserMove) {
                    console.log(chalk.blue(`\nMove Detected: Match #${matchId} (${GAME_NAMES[m[4]]}) by ${player}`));
                    respondedMatches.add(matchId!.toString());
                    
                    if (player) model.update(m[4], player, move!);
                    await resolveAgainstPlayer(matchId!, player!, move!, m[4]);
                }
            }
        }
    });
}

async function handleChallenge(matchId: bigint, challenger: string, wager: bigint, gameType: number) {
    if (processingAcceptance.has(matchId.toString())) return;
    processingAcceptance.add(matchId.toString());

    console.log(chalk.yellow(`\nMatch Proposed: #${matchId} (${GAME_NAMES[gameType]}) from ${challenger}`));

    const balance = await publicClient.getBalance({ address: account.address });
    const maxWager = balance / 10n; 
    
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
    } catch (error: any) {
        if (error.message?.includes('available')) {
            console.log(chalk.gray(`Match #${matchId} already accepted by someone else.`));
        } else {
            console.error(chalk.red('Failed to accept match:'), error.shortMessage || error.message);
        }
    }
}

async function resolveAgainstPlayer(matchId: bigint, player: string, playerMove: number, gameType: number) {
    console.log(chalk.magenta(`AI responding to player move in match #${matchId}...`));
    
    // AI predicts and counters
    const aiMove = model.predict(gameType, player);
    
    let moveLabel = 'Strategic';
    let playerMoveLabel = 'Strategic';
    
    if (gameType === 0) {
        const rpsLabels = ['Rock', 'Paper', 'Scissors'];
        moveLabel = rpsLabels[aiMove] || 'Unknown';
        playerMoveLabel = rpsLabels[playerMove] || 'Unknown';
    } else if (gameType === 1) {
        moveLabel = `Dice ${aiMove + 1}`; // aiMove is 0-5, display as 1-6
        playerMoveLabel = `Dice ${playerMove}`; // playerMove is already 1-6
    } else if (gameType === 2) {
        moveLabel = `Strategy ${aiMove}`;
        playerMoveLabel = `Strategy ${playerMove}`;
    } else if (gameType === 3) {
        const coinLabels = ['Heads', 'Tails'];
        moveLabel = coinLabels[aiMove] || 'Unknown';
        playerMoveLabel = coinLabels[playerMove] || 'Unknown';
    } else if (gameType === 4) {
        moveLabel = `Cell ${aiMove}`;
        playerMoveLabel = `Cell ${playerMove}`;
    }
    
    console.log(chalk.gray(`AI Move: ${moveLabel} | Player Move: ${playerMoveLabel}`));

    let winner: string = player;

    if (gameType === 0) { // Rock-Paper-Scissors: Rock=0, Paper=1, Scissors=2
        if (aiMove === playerMove) {
            winner = player; // Draw defaults to player
            console.log(chalk.yellow(`🤝 TIE! Both chose ${moveLabel} → Player wins tie-breaker`));
        } else if ((aiMove === 0 && playerMove === 2) || // Rock beats Scissors
                   (aiMove === 1 && playerMove === 0) || // Paper beats Rock
                   (aiMove === 2 && playerMove === 1)) { // Scissors beats Paper
            winner = account.address;
            console.log(chalk.green(`✅ AI WINS! ${moveLabel} beats ${playerMoveLabel}`));
        } else {
            winner = player;
            console.log(chalk.red(`❌ PLAYER WINS! ${playerMoveLabel} beats ${moveLabel}`));
        }
    } else if (gameType === 1) { // Dice Roll: Higher roll wins (moves are 1-6)
        // Note: Frontend sends 1-6, but internally we use 0-5, so add 1 for comparison
        const aiRoll = aiMove + 1;
        const playerRoll = playerMove;
        console.log(chalk.cyan(`🎲 Dice Battle: AI rolled ${aiRoll}, Player rolled ${playerRoll}`));
        if (aiRoll > playerRoll) {
            winner = account.address;
            console.log(chalk.green(`✅ AI WINS! ${aiRoll} > ${playerRoll}`));
        } else if (aiRoll < playerRoll) {
            winner = player;
            console.log(chalk.red(`❌ PLAYER WINS! ${playerRoll} > ${aiRoll}`));
        } else {
            winner = player; // Tie goes to player
            console.log(chalk.yellow(`🤝 TIE! Both rolled ${aiRoll} → Player wins tie-breaker`));
        }
    } else if (gameType === 2) { // Strategy Battle: Higher strategy wins (0-9)
        console.log(chalk.cyan(`⚔️ Strategy Battle: AI=${aiMove}, Player=${playerMove}`));
        if (aiMove > playerMove) {
            winner = account.address;
            console.log(chalk.green(`✅ AI WINS! Strategy ${aiMove} > ${playerMove}`));
        } else if (aiMove < playerMove) {
            winner = player;
            console.log(chalk.red(`❌ PLAYER WINS! Strategy ${playerMove} > ${aiMove}`));
        } else {
            winner = player; // Tie goes to player
            console.log(chalk.yellow(`🤝 TIE! Both chose Strategy ${aiMove} → Player wins tie-breaker`));
        }
    } else if (gameType === 3) { // Coin Flip: Match prediction
        // In coin flip, both players predict the outcome (Heads=0, Tails=1)
        // Simulate actual coin flip
        const actualFlip = Math.random() > 0.5 ? 1 : 0;
        const flipName = actualFlip === 0 ? 'Heads' : 'Tails';
        const aiCorrect = aiMove === actualFlip;
        const playerCorrect = playerMove === actualFlip;
        
        console.log(chalk.cyan(`🪙 Coin landed on: ${flipName} | AI predicted: ${moveLabel}, Player predicted: ${playerMoveLabel}`));
        
        if (aiCorrect && !playerCorrect) {
            winner = account.address;
            console.log(chalk.green(`✅ AI WINS! Correctly predicted ${flipName}`));
        } else if (playerCorrect && !aiCorrect) {
            winner = player;
            console.log(chalk.red(`❌ PLAYER WINS! Correctly predicted ${flipName}`));
        } else {
            winner = player; // Both correct or both wrong = player wins
            if (aiCorrect && playerCorrect) {
                console.log(chalk.yellow(`🤝 TIE! Both predicted correctly → Player wins tie-breaker`));
            } else {
                console.log(chalk.yellow(`🤝 TIE! Both predicted wrong → Player wins tie-breaker`));
            }
        }
    } else if (gameType === 4) { // Tic-Tac-Toe: Strategic cell selection (SIMPLIFIED VERSION)
        // Strategic value: Center=5, Corners=3, Edges=1
        const cellValues = [3, 1, 3, 1, 5, 1, 3, 1, 3]; // Based on position importance
        const aiValue = cellValues[aiMove] || 0;
        const playerValue = cellValues[playerMove] || 0;
        
        console.log(chalk.cyan(`TicTacToe Cell Values: AI Cell ${aiMove}=${aiValue}, Player Cell ${playerMove}=${playerValue}`));
        
        if (aiValue > playerValue) winner = account.address;
        else if (aiValue < playerValue) winner = player;
        else winner = Math.random() > 0.5 ? account.address : player; // Tie breaks randomly
    }

    // Submit AI Move to chain so it appears in frontend
    try {
        let moveToSend = aiMove;
        if (gameType === 1) { // Dice requires 1-6, internal model uses 0-5
            moveToSend = aiMove + 1;
        }

        console.log(chalk.yellow(`Submitting AI Move (${moveLabel}) to chain...`));
        const { request: playRequest } = await publicClient.simulateContract({
            address: ARENA_ADDRESS, 
            abi: ARENA_ABI, 
            functionName: 'playMove', 
            args: [matchId, moveToSend], 
            account
        });
        const playHash = await walletClient.writeContract(playRequest);
        console.log(chalk.gray(`AI Move TX: ${playHash}`));
        
        // Wait for move to be indexed before resolving
        await publicClient.waitForTransactionReceipt({ hash: playHash });
    } catch (err: any) {
        console.log(chalk.red("Failed to submit AI move:"), err.shortMessage || err.message);
    }

    try {
        // Double check status before resolution to avoid "higher priority" (nonce) conflicts from failed simulations
        const m = await publicClient.readContract({
            address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'matches', args: [matchId]
        }) as any;
        if (m[5] !== 1) {
            console.log(chalk.gray(`Match #${matchId} no longer in progress (Status: ${m[5]}).`));
            return;
        }

        const { request } = await publicClient.simulateContract({
            address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'resolveMatch', args: [matchId, winner], account
        });
        const hash = await walletClient.writeContract(request);
        console.log(chalk.bold.green(`Match #${matchId} Resolved! Winner: ${winner === account.address ? 'AI Agent' : 'Player'}`));
        console.log(chalk.gray(`TX Hash: ${hash}`));
    } catch (error: any) {
        console.error(chalk.red(`Failed to resolve match #${matchId}:`), error.shortMessage || error.message);
    }
}

startAgent();
