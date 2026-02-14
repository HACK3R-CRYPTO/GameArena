
const { createPublicClient, http, defineChain } = require('viem');
const { monadTestnet } = require('viem/chains');

const ARENA_ABI = [
    {
        "inputs": [],
        "name": "matchCounter",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

const client = createPublicClient({
    chain: defineChain({
        id: 10143,
        name: 'Monad Testnet',
        network: 'monad-testnet',
        nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
        rpcUrls: {
            default: { http: ['https://testnet-rpc.monad.xyz'] },
            public: { http: ['https://testnet-rpc.monad.xyz'] }
        },
        testnet: true,
    }),
    transport: http()
});

async function check() {
    const count = await client.readContract({
        address: '0x2A15509931758B5C52b411D4539151D8A29A4D30',
        abi: ARENA_ABI,
        functionName: 'matchCounter'
    });
    console.log('Match Counter:', count.toString());
}

check();
