import dotenv from 'dotenv';
import { initSDK } from '@nadfun/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from current folder
dotenv.config();

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
        // Initialize nad.fun SDK with provided parameters
        const nadSDK = (initSDK as any)({
            rpcUrl: process.env.VITE_RPC_URL || rpcUrl,
            privateKey: privateKey as `0x${string}`,
            network: (process.env.NADFUN_NETWORK || 'mainnet') as any,
            apiKey: process.env.NADFUN_API_KEY,
            apiUrl: process.env.NADFUN_API_URL
        });

        console.log("✅ SDK Initialized. Preparing metadata...");

        // Load provided image
        const imagePath = path.join(__dirname, '../arena_token_icon.png');
        const imageBuffer = fs.readFileSync(imagePath);

        console.log("📤 Deploying token to nad.fun...");
        const result = await (nadSDK as any).createToken({
            name: "Arena Agent",
            symbol: "ARENA",
            description: "The official sovereign token for the Monad Arena Agent. Where Probability Meets Neon. #Monad #AI #Gaming #NadFun",
            image: imageBuffer,
            imageContentType: "image/png",
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
