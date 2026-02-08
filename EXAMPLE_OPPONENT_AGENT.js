/**
 * EXAMPLE: How Another Developer's AI Agent Would Challenge Your Arena AI
 * 
 * This is what OTHER developers would write to battle YOUR Arena AI Champion
 */

import { createPublicClient, createWalletClient, http, parseAbiItem, parseEther, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// ========================================
// CONFIGURATION (Other developer fills this)
// ========================================
const THEIR_PRIVATE_KEY = '0x...'; // Their own AI wallet private key
const YOUR_ARENA_AI = '0xa91D5A0a64ED5eeF11c4359C4631279695A338ef'; // YOUR AI address
const ARENA_CONTRACT = '0x7820903fC53197Ce02bDf9785AC04dd8e891BBb7'; // Arena platform

const ARENA_ABI = parseAbi([
    "function proposeMatch(address _opponent, uint8 _gameType) external payable returns (uint256)",
    "function playMove(uint256 _matchId, uint8 _move) external",
    "event MatchProposed(uint256 indexed matchId, address indexed challenger, address indexed opponent, uint256 wager, uint8 gameType)",
    "event MatchAccepted(uint256 indexed matchId, address indexed opponent)",
    "event MovePlayed(uint256 indexed matchId, address indexed player, uint8 move)",
    "event MatchCompleted(uint256 indexed matchId, address indexed winner, uint256 prize)"
]);

// ========================================
// SETUP CLIENTS
// ========================================
const account = privateKeyToAccount(THEIR_PRIVATE_KEY);

const publicClient = createPublicClient({
    chain: {
        id: 143,
        name: 'Monad Mainnet',
        rpcUrls: { default: { http: ['https://rpc.monad.xyz'] } }
    },
    transport: http()
});

const walletClient = createWalletClient({
    account,
    chain: {
        id: 143,
        name: 'Monad Mainnet',
        rpcUrls: { default: { http: ['https://rpc.monad.xyz'] } }
    },
    transport: http()
});

// ========================================
// THEIR AI STRATEGY (Simple Random Bot)
// ========================================
function pickMove(gameType) {
    if (gameType === 0) { // Rock-Paper-Scissors
        return Math.floor(Math.random() * 3); // 0=Rock, 1=Paper, 2=Scissors
    } else if (gameType === 3) { // Coin Flip
        return Math.floor(Math.random() * 2); // 0=Heads, 1=Tails
    }
    return 0;
}

// ========================================
// MAIN: CHALLENGE YOUR ARENA AI
// ========================================
async function challengeArenaAI() {
    console.log('🤖 RandomBot Starting...');
    console.log(`Targeting Arena AI: ${YOUR_ARENA_AI}`);
    
    // STEP 1: Propose a match against YOUR AI
    console.log('\n📤 Proposing match to Arena AI Champion...');
    const gameType = 3; // Coin Flip (simple 50/50)
    const wager = parseEther('0.05'); // Bet 0.05 MON
    
    try {
        const hash = await walletClient.writeContract({
            address: ARENA_CONTRACT,
            abi: ARENA_ABI,
            functionName: 'proposeMatch',
            args: [YOUR_ARENA_AI, gameType], // Challenge YOUR AI specifically
            value: wager
        });
        
        console.log(`✅ Match proposed! TX: ${hash}`);
        console.log('⏳ Waiting for Arena AI to accept...');
        
        // STEP 2: Listen for YOUR AI accepting
        const unwatch = publicClient.watchEvent({
            address: ARENA_CONTRACT,
            event: parseAbiItem('event MatchAccepted(uint256 indexed matchId, address indexed opponent)'),
            onLogs: async (logs) => {
                for (const log of logs) {
                    const { matchId, opponent } = log.args;
                    
                    if (opponent?.toLowerCase() === YOUR_ARENA_AI.toLowerCase()) {
                        console.log(`\n✅ Arena AI accepted match #${matchId}!`);
                        
                        // STEP 3: Make our move
                        const move = pickMove(gameType);
                        console.log(`🎲 Playing move: ${move}`);
                        
                        const moveHash = await walletClient.writeContract({
                            address: ARENA_CONTRACT,
                            abi: ARENA_ABI,
                            functionName: 'playMove',
                            args: [matchId, move]
                        });
                        
                        console.log(`✅ Move played! TX: ${moveHash}`);
                        console.log('⏳ Waiting for Arena AI to respond...');
                        
                        // STEP 4: YOUR AI automatically responds and resolves
                        // (Your ArenaAgent.ts sees the MovePlayed event and handles it)
                    }
                }
            }
        });
        
        // STEP 5: Listen for match result
        publicClient.watchEvent({
            address: ARENA_CONTRACT,
            event: parseAbiItem('event MatchCompleted(uint256 indexed matchId, address indexed winner, uint256 prize)'),
            onLogs: (logs) => {
                for (const log of logs) {
                    const { matchId, winner, prize } = log.args;
                    
                    if (winner?.toLowerCase() === account.address.toLowerCase()) {
                        console.log(`\n🎉 WE WON Match #${matchId}! Prize: ${prize} MON`);
                    } else if (winner?.toLowerCase() === YOUR_ARENA_AI.toLowerCase()) {
                        console.log(`\n😢 Arena AI won Match #${matchId}. We lost!`);
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// ========================================
// RUN THE BOT
// ========================================
challengeArenaAI();

/**
 * WHAT HAPPENS NEXT (Automatic):
 * 
 * 1. This bot proposes match → YOUR ArenaAgent.ts sees MatchProposed event
 * 2. YOUR AI accepts → Calls acceptMatch() with matching wager
 * 3. This bot plays move → YOUR ArenaAgent.ts sees MovePlayed event
 * 4. YOUR AI counters → Analyzes with Markov Chain, plays counter-move
 * 5. YOUR AI resolves → Calls resolveMatch() to determine winner
 * 6. Winner gets paid → Contract sends MON automatically
 * 
 * ALL OF THIS HAPPENS ON-CHAIN, NO API/SERVER NEEDED!
 */
