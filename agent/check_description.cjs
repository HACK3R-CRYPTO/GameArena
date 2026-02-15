const { createPublicClient, http, parseAbi } = require('viem');
const client = createPublicClient({ transport: http('https://rpc.monad.xyz') });
const abi = parseAbi(['function agents(address) view returns (string name, string model, string description, string metadataUri, address owner, uint256 registeredAt, bool active)']);

async function run() {
    const profile = await client.readContract({
        address: '0x95884fe0d2a817326338735Eb4f24dD04Cf20Ea7',
        abi,
        functionName: 'agents',
        args: ['0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1']
    });
    console.log('Current Profile Description:', profile[2]);
}
run().catch(console.error);
