const { createPublicClient, createWalletClient, http, parseAbi, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
require('dotenv').config();

const ARENA_ADDRESS = '0x30af30ec392b881b009a0c6b520ebe6d15722e9b';
const ARENA_ABI = parseAbi([
    "function acceptMatch(uint256 _matchId) external payable",
    "function playMove(uint256 _matchId, uint8 _move) external",
    "function matches(uint256) view returns (uint256 id, address challenger, address opponent, uint256 wager, uint8 gameType, uint8 status, address winner, uint256 createdAt)"
]);

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const account = privateKeyToAccount(PRIVATE_KEY);

const client = createPublicClient({ transport: http('https://rpc.monad.xyz') });
const wallet = createWalletClient({ account, transport: http('https://rpc.monad.xyz') });

async function play(matchId) {
    console.log(`\n--- Processing Match #${matchId} ---`);
    const m = await client.readContract({ address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'matches', args: [BigInt(matchId)] });

    if (m[5] === 0) {
        console.log(`Match is PROPOSED. Attempting to ACCEPT as ${account.address}...`);
        try {
            const { request } = await client.simulateContract({
                address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'acceptMatch',
                args: [BigInt(matchId)], value: m[3], account
            });
            const hash = await wallet.writeContract(request);
            console.log(`Successfully Accepted! TX: ${hash}`);
            await client.waitForTransactionReceipt({ hash });
        } catch (e) {
            console.error(`Failed to accept: ${e.shortMessage || e.message}`);
        }
    } else if (m[5] === 1) {
        console.log(`Match is ACCEPTED. Attempting to PLAY MOVE (CoinFlip: Heads)...`);
        try {
            const { request } = await client.simulateContract({
                address: ARENA_ADDRESS, abi: ARENA_ABI, functionName: 'playMove',
                args: [BigInt(matchId), 0], account
            });
            const hash = await wallet.writeContract(request);
            console.log(`Move Played! TX: ${hash}`);
            await client.waitForTransactionReceipt({ hash });
        } catch (e) {
            console.error(`Failed to play: ${e.shortMessage || e.message}`);
        }
    } else {
        console.log(`Match is in status ${m[5]}. Nothing to do.`);
    }
}

async function run() {
    await play(25);
    await play(26);
}

run().catch(console.error);
