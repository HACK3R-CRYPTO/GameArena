
import { createPublicClient, http, parseAbiItem } from 'viem';
import { mainnet } from 'viem/chains';

const TRANSPORT_URL = 'https://rpc.monad.xyz';
const ARENA_PLATFORM = '0x30af30ec392b881b009a0c6b520ebe6d15722e9b';

const ABI = [
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "matches",
        "outputs": [
            { "internalType": "uint256", "name": "id", "type": "uint256" },
            { "internalType": "address", "name": "challenger", "type": "address" },
            { "internalType": "address", "name": "opponent", "type": "address" },
            { "internalType": "uint256", "name": "wager", "type": "uint256" },
            { "internalType": "uint8", "name": "gameType", "type": "uint8" },
            { "internalType": "uint8", "name": "status", "type": "uint8" },
            { "internalType": "address", "name": "winner", "type": "address" },
            { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" },
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "name": "playerMoves",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" },
            { "internalType": "address", "name": "", "type": "address" }
        ],
        "name": "hasPlayed",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    }
];

const client = createPublicClient({
    chain: {
        id: 143,
        name: 'Monad Mainnet',
        network: 'monad-mainnet',
        nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
        rpcUrls: { default: { http: [TRANSPORT_URL] } }
    },
    transport: http()
});

async function debug() {
    console.log("Debugging Match #1...");
    const id = 1n;

    try {
        const m = await client.readContract({
            address: ARENA_PLATFORM,
            abi: ABI,
            functionName: 'matches',
            args: [id]
        });
        console.log("Match Data:", m);

        const challenger = m[1];
        const opponent = m[2];

        console.log(`Challenger: ${challenger}`);
        console.log(`Opponent: ${opponent}`);

        console.log("Checking hasPlayed...");
        const [challengerPlayed, opponentPlayed] = await Promise.all([
            client.readContract({ address: ARENA_PLATFORM, abi: ABI, functionName: 'hasPlayed', args: [id, challenger] }).catch(e => { console.error("Err C", e); return false; }),
            client.readContract({ address: ARENA_PLATFORM, abi: ABI, functionName: 'hasPlayed', args: [id, opponent] }).catch(e => { console.error("Err O", e); return false; })
        ]);

        console.log(`Challenger Played? ${challengerPlayed}`);
        console.log(`Opponent Played? ${opponentPlayed}`);

        let cMove = null;
        let oMove = null;

        if (challengerPlayed) {
            cMove = await client.readContract({ address: ARENA_PLATFORM, abi: ABI, functionName: 'playerMoves', args: [id, challenger] });
            console.log(`Challenger Move: ${cMove}`);
        }

        if (opponentPlayed) {
            oMove = await client.readContract({ address: ARENA_PLATFORM, abi: ABI, functionName: 'playerMoves', args: [id, opponent] });
            console.log(`Opponent Move: ${oMove}`);
        }

    } catch (error) {
        console.error("Debug Error:", error);
    }
}

debug();
