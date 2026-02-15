const { createPublicClient, createWalletClient, http, parseAbi } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
require('dotenv').config();

const REGISTRY_ABI = parseAbi([
    "function registerAgent(string calldata _name, string calldata _model, string calldata _description, string calldata _metadataUri) external"
]);

const REGISTRY_ADDRESS = '0x95884fe0d2a817326338735Eb4f24dD04Cf20Ea7';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("FATAL: PRIVATE_KEY not found in .env");
    process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);

const MONAD_MAINNET = {
    id: 143,
    name: 'Monad Mainnet',
    network: 'monad-mainnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: {
        default: { http: [process.env.VITE_RPC_URL || 'https://rpc.monad.xyz'] },
        public: { http: [process.env.VITE_RPC_URL || 'https://rpc.monad.xyz'] },
    },
};

const publicClient = createPublicClient({ chain: MONAD_MAINNET, transport: http() });
const walletClient = createWalletClient({ account, chain: MONAD_MAINNET, transport: http() });

async function update() {
    console.log('📝 Updating On-Chain AI Agent Metadata (3 Games)...');
    console.log(`Agent Address: ${account.address}`);

    try {
        const { request } = await publicClient.simulateContract({
            address: REGISTRY_ADDRESS,
            abi: REGISTRY_ABI,
            functionName: 'registerAgent',
            args: [
                "Arena Champion AI",
                "Markov-1 (Adaptive Pattern Learning)",
                "Autonomous Gaming Agent mastering 3 game types: Rock-Paper-Scissors, Dice Roll, and Coin Flip with real-time opponent modeling.",
                "https://moltiverse.dev"
            ],
            account
        });

        const hash = await walletClient.writeContract(request);
        console.log(`✅ Update Transaction Sent! Hash: ${hash}`);
        console.log('Wait 5-10 seconds for the UI to update.');
    } catch (error) {
        console.error('❌ Update failed:', error.message);
    }
}

update();
