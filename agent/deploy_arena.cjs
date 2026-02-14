
const { createWalletClient, http, publicActions } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting deployment...");

    // 1. Load Artifacts
    const artifactPath = path.resolve(__dirname, "../contracts/out/ArenaPlatform.sol/ArenaPlatform.json");
    if (!fs.existsSync(artifactPath)) {
        throw new Error("Artifact not found at " + artifactPath);
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abi = artifact.abi;
    const bytecode = artifact.bytecode.object;

    // 2. Setup Client
    const pk = "0x00df65c66cd3506bcfcda2b909de9362fec78c427241edfeed2e4edb50f18103"; // New Agent
    const account = privateKeyToAccount(pk);

    const client = createWalletClient({
        account,
        chain: {
            id: 143,
            name: "Monad Mainnet",
            nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
            rpcUrls: { default: { http: ["https://rpc.monad.xyz"] } }
        },
        transport: http()
    }).extend(publicActions);

    console.log("Deploying from:", account.address);
    const balance = await client.getBalance({ address: account.address });
    console.log("Balance:", balance.toString());

    // 3. Deploy
    // Constructor arg: treasury
    const treasury = "0x56717540445F1B6727266935261f8bf63065DF60";

    const hash = await client.deployContract({
        abi,
        bytecode,
        args: [treasury],
    });

    console.log("Deployment Tx:", hash);

    const receipt = await client.waitForTransactionReceipt({ hash });

    if (receipt.contractAddress) {
        console.log("Deployed ArenaPlatform to:", receipt.contractAddress);
    } else {
        console.error("Deployment failed or no address returned.");
    }
}

main().catch(console.error);
