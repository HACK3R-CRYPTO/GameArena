import { createPublicClient, createWalletClient, http, parseAbiItem, formatEther, parseEther, parseAbi, hexToBytes } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();
dotenv.config({ path: '../contracts/.env' });

// --- CONFIGURATION ---
const ARENA_ADDRESS = (process.env.VITE_ARENA_PLATFORM_ADDRESS || '0x30af30ec392b881b009a0c6b520ebe6d15722e9b') as `0x${string}`;
// Use a different key for the Challenger, or generate a random one
const PRIVATE_KEY = process.env.TEST_PLAYER_KEY as `0x${string}` || generatePrivateKey();

import { type Chain } from 'viem';

const MONAD_MAINNET = {
    id: 143,
    name: 'Monad Mainnet',
    network: 'monad-mainnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: [process.env.VITE_RPC_URL || 'https://rpc.monad.xyz'] },
        public: { http: [process.env.VITE_RPC_URL || 'https://rpc.monad.xyz'] },
    }
} as const; // Removed 'satisfies Chain' to avoid strict type checking on 'network' property satisfies Chain;

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
    chain: MONAD_MAINNET,
    transport: http()
});

const walletClient = createWalletClient({
    account,
    chain: MONAD_MAINNET,
    transport: http()
});

const ARENA_ABI = parseAbi([
    "function proposeMatch(address _opponent, uint8 _gameType) external payable returns (uint256)",
    "function playMove(uint256 _matchId, uint8 _move) external",
    "function matches(uint256) view returns (uint256 id, address challenger, address opponent, uint256 wager, uint8 gameType, uint8 status, address winner, uint256 createdAt)",
    "event MatchProposed(uint256 indexed matchId, address indexed challenger, address indexed opponent, uint256 wager, uint8 gameType)",
    "event MatchAccepted(uint256 indexed matchId, address indexed opponent)",
    "event MatchCompleted(uint256 indexed matchId, address indexed winner, uint256 prize)"
]);

async function main() {
    console.log(chalk.green.bold('🤖 Starting External Challenger Bot...'));
    console.log(chalk.gray(`Address: ${account.address}`));

    const balance = await publicClient.getBalance({ address: account.address });
    console.log(chalk.cyan(`Balance: ${formatEther(balance)} MON`));

    if (balance === 0n) {
        console.log(chalk.red('\n❌ No funds! Please fund this wallet to play.'));
        console.log(chalk.yellow(`Send MON to: ${account.address}`));
        process.exit(1);
    }

    // 1. Create a Match
    const wager = parseEther('0.01'); // Small wager

    // Pick a random game type: 0=RPS, 1=Dice, 3=CoinFlip (Skip 2/Strategy)
    const availableGames = [0, 1, 3];
    const gameType = availableGames[Math.floor(Math.random() * availableGames.length)];
    const gameLabels = { 0: 'Rock Paper Scissors', 1: 'Dice Roll', 3: 'Coin Flip' };

    const opponent = '0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1'; // Main AI Agent

    const label = gameType !== undefined ? (gameLabels as any)[gameType] : 'Unknown';
    console.log(chalk.yellow(`\n⚔️ Creating Match (Wager: 0.01 MON, Game: ${label})...`));

    try {
        const { request } = await publicClient.simulateContract({
            address: ARENA_ADDRESS,
            abi: ARENA_ABI,
            functionName: 'proposeMatch',
            args: [opponent, gameType || 0], // Default to 0 if undefined
            value: wager,
            account
        });
        const hash = await walletClient.writeContract(request);
        console.log(chalk.green(`Match Proposed! TX: ${hash}`));

        // Wait for MatchID
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        const logs = await publicClient.getContractEvents({
            address: ARENA_ADDRESS, abi: ARENA_ABI, eventName: 'MatchProposed', fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber
        });

        const matchId = logs[0]?.args?.matchId;
        if (matchId === undefined) throw new Error("Failed to get match ID");
        console.log(chalk.blue(`Match ID: ${matchId}`));

        // 2. Wait for Acceptance
        console.log(chalk.gray('Waiting for opponent to accept...'));

        const checkStatus = async () => {
            const m = await publicClient.readContract({
                address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'matches', args: [matchId]
            }) as any;
            if (m[5] === 1) { // Accepted
                console.log(chalk.green('✅ Match Accepted (detected via polling)! Playing move...'));
                if (matchId !== undefined && gameType !== undefined) {
                    await playMove(matchId, gameType as number);
                }
                return true;
            }
            return false;
        };

        const statusInterval = setInterval(async () => {
            if (await checkStatus()) {
                clearInterval(statusInterval);
                unwatchAccept();
            }
        }, 5000);

        const unwatchAccept = publicClient.watchEvent({
            address: ARENA_ADDRESS, event: parseAbiItem('event MatchAccepted(uint256 indexed matchId, address indexed opponent)'),
            args: { matchId },
            onLogs: async (acceptLogs) => {
                console.log(chalk.green('✅ Match Accepted (detected via event)! Playing move...'));
                if (matchId !== undefined && gameType !== undefined) {
                    await playMove(matchId, gameType as number);
                }
                clearInterval(statusInterval);
                unwatchAccept();
            }
        });

    } catch (e: any) {
        console.error(chalk.red('Error:'), e.shortMessage || e.message);
    }
}

async function playMove(matchId: bigint, gameType: number) {
    // 🧠 AI BRAIN: This is where you plug in your own logic!
    // Replace 'getStrategicMove' with your LLM call or algorithm.
    const { move, moveName } = await getStrategicMove(gameType);

    console.log(chalk.magenta(`Playing: ${moveName}`));

    try {
        const { request } = await publicClient.simulateContract({
            address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'playMove',
            args: [matchId, move], account
        });
        const hash = await walletClient.writeContract(request);
        console.log(chalk.gray(`Move TX: ${hash}`));

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log(chalk.green('Move Confirmed! Waiting for resolution...'));

        // 4. Wait for Result
        const unwatch = publicClient.watchEvent({
            address: ARENA_ADDRESS, event: parseAbiItem('event MatchCompleted(uint256 indexed matchId, address indexed winner, uint256 prize)'),
            args: { matchId },
            onLogs: (logs) => {
                const args = logs[0]?.args;
                if (!args) return;
                const { winner, prize } = args;
                if (winner === account.address) {
                    console.log(chalk.green.bold(`🎉 YOU WON ${formatEther(prize!)} MON!`));
                } else {
                    console.log(chalk.red('💀 You lost. Better luck next time.'));
                }
                process.exit(0);
            }
        });

    } catch (e: any) {
        console.error(chalk.red('Failed to play move:'), e.shortMessage || e.message);
    }
}

// 🧠 STRATEGY FUNCTION
// This is the "Brain" of your bot. 
// Currently it uses Math.random(), but you should connect it to an LLM!
async function getStrategicMove(gameType: number): Promise<{ move: number, moveName: string }> {
    let move = 0;
    let moveName = '';

    // TODO: Call your AI API here (e.g. OpenAI, Anthropic, Gemini)
    // const aiDecision = await askChatGPT(`I am playing game type ${gameType}... what should I do?`);

    if (gameType === 0) { // RPS
        // Example: Randomly pick Rock, Paper, or Scissors
        move = Math.floor(Math.random() * 3);
        moveName = (['Rock', 'Paper', 'Scissors'] as string[])[move] || 'Unknown';
    } else if (gameType === 1) { // Dice
        // Example: Roll a die (1-6)
        move = Math.floor(Math.random() * 6) + 1;
        moveName = `Dice Roll ${move}`;
    } else if (gameType === 3) { // Coin Flip
        // Example: Flip a coin (0=Heads, 1=Tails)
        move = Math.floor(Math.random() * 2);
        moveName = (['Heads', 'Tails'] as string[])[move] || 'Unknown';
    }

    return { move, moveName };
}

main();
