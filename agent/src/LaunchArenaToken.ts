import dotenv from 'dotenv';
import { initSDK } from '@nadfun/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from contracts folder
dotenv.config({ path: '../contracts/.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function launchArenaToken() {
    console.log("🚀 Initializing Arena AI Agent Token Launch (ARENA) on nad.fun...");

    const rpcUrl = 'https://rpc.monad.xyz';
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        console.error("❌ No private key found in ../contracts/.env");
        return;
    }

    try {
        // Initialize nad.fun SDK with mainnet parameters
        const nadSDK = initSDK({
            rpcUrl: rpcUrl,
            privateKey: privateKey as `0x${string}`,
            network: 'mainnet',
        });

        console.log("✅ SDK Initialized. Preparing metadata...");

        // Load image (using vite.svg as placeholder)
        const imagePath = path.join(__dirname, '../../frontend/public/vite.svg');
        const imageBuffer = fs.readFileSync(imagePath);

        console.log("📤 Deploying token to nad.fun...");
        const result = await nadSDK.createToken({
            name: "Arena AI Champion",
            symbol: "ARENA",
            description: "The official governance & rev-share token for the Monad Gaming Arena Agent. Community can speculate on AI win rates and participate in governance. #Monad #AI #Gaming",
            image: imageBuffer,
            imageContentType: "image/svg+xml",
            twitter: "https://x.com/TournamentChain",
            website: "https://moltiverse.dev",
            initialBuyAmount: 0n
        });

        console.log("\n🎉 ARENA TOKEN DEPLOYED! 🎉");
        console.log("-----------------------------------------");
        console.log("Token Address: ", result.tokenAddress);
        console.log("Transaction:   ", result.transactionHash);
        console.log("-----------------------------------------");

        fs.writeFileSync(path.join(__dirname, '../arena_token_address.txt'), result.tokenAddress);
        console.log("Saved address to arena_token_address.txt");

    } catch (error) {
        console.error("❌ Token Launch Failed:", error);
    }
}

launchArenaToken();
