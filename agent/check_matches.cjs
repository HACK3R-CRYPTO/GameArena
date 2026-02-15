const { createPublicClient, http, parseAbi } = require('viem');
const client = createPublicClient({ transport: http('https://rpc.monad.xyz') });
const abi = parseAbi([
    'function matches(uint256) view returns (uint256 id, address challenger, address opponent, uint256 wager, uint8 gameType, uint8 status, address winner, uint256 createdAt)'
]);
const ARENA_ADDRESS = '0x30af30ec392b881b009a0c6b520ebe6d15722e9b';

async function run() {
    const m25 = await client.readContract({ address: ARENA_ADDRESS, abi, functionName: 'matches', args: [25n] });
    const m26 = await client.readContract({ address: ARENA_ADDRESS, abi, functionName: 'matches', args: [26n] });
    console.log('Match 25:', m25.map(x => x?.toString ? x.toString() : x));
    console.log('Match 26:', m26.map(x => x?.toString ? x.toString() : x));
}
run().catch(console.error);
