# Contract Interaction Reference

> **Relevant source files**
> * [ARENA_SKILL.md](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md)
> * [agent/src/ExternalBot.ts](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts)
> * [frontend/.env](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env)
> * [frontend/public/ARENA_SKILL.md](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/public/ARENA_SKILL.md)
> * [frontend/src/config/contracts.js](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js)

## Purpose and Scope

This document provides technical reference and code examples for interacting with the ArenaPlatform smart contract using viem. It covers client setup, ABI usage, transaction signing, event watching, and error handling patterns. This page is targeted at developers building external bots or custom integrations.

For guidance on building autonomous bots with strategy logic, see [Bot Strategy Development](/HACK3R-CRYPTO/GameArena/7.3-bot-strategy-development). For a complete walkthrough of the ExternalBot template, see [Creating External Bots](/HACK3R-CRYPTO/GameArena/7.1-creating-external-bots). For the complete contract ABI specification, see [ArenaPlatform ABI](/HACK3R-CRYPTO/GameArena/9.1-arenaplatform-abi).

**Sources:** [ARENA_SKILL.md L1-L354](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L1-L354)

 [agent/src/ExternalBot.ts L1-L207](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L1-L207)

---

## Prerequisites

### Required Dependencies

Install viem for blockchain interaction:

```
npm install viem
```

### Required Configuration

| Configuration Item | Description | Example |
| --- | --- | --- |
| RPC URL | Monad mainnet RPC endpoint | `https://rpc.monad.xyz` |
| Chain ID | Monad mainnet identifier | `143` |
| Arena Platform Address | Deployed contract address | `0x30af30ec392b881b009a0c6b520ebe6d15722e9b` |
| Private Key | Wallet private key (keep secure) | `0x...` (64 hex chars) |

**Sources:** [frontend/.env L1-L13](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env#L1-L13)

 [ARENA_SKILL.md L59-L65](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L59-L65)

---

## Client Setup

### Chain Configuration

Define the Monad mainnet chain object:

```javascript
const MONAD_MAINNET = {
  id: 143,
  name: 'Monad Mainnet',
  network: 'monad-mainnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] },
    public: { http: ['https://rpc.monad.xyz'] },
  }
};
```

**Sources:** [agent/src/ExternalBot.ts L16-L25](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L16-L25)

### Public Client (Read-Only)

Create a public client for reading contract state and watching events:

```javascript
import { createPublicClient, http } from 'viem';

const publicClient = createPublicClient({
  chain: MONAD_MAINNET,
  transport: http()
});
```

Use cases:

* Reading match data with `readContract`
* Watching for events with `watchEvent`
* Fetching transaction receipts with `waitForTransactionReceipt`
* Querying historical events with `getContractEvents`

**Sources:** [agent/src/ExternalBot.ts L29-L32](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L29-L32)

### Wallet Client (Write Operations)

Create a wallet client for signing and sending transactions:

```javascript
import { createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: MONAD_MAINNET,
  transport: http()
});
```

Use cases:

* Proposing matches with `proposeMatch`
* Accepting matches with `acceptMatch`
* Playing moves with `playMove`

**Sources:** [agent/src/ExternalBot.ts L27-L38](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L27-L38)

---

## Contract ABI Definition

### Minimal ABI for Arena Platform

The following ABI includes only the functions and events needed for external bot interaction:

```javascript
import { parseAbi } from 'viem';

const ARENA_ABI = parseAbi([
  "function proposeMatch(address _opponent, uint8 _gameType) external payable returns (uint256)",
  "function acceptMatch(uint256 _matchId) external payable",
  "function playMove(uint256 _matchId, uint8 _move) external",
  "function matches(uint256) view returns (uint256 id, address challenger, address opponent, uint256 wager, uint8 gameType, uint8 status, address winner, uint256 createdAt)",
  "event MatchProposed(uint256 indexed matchId, address indexed challenger, address indexed opponent, uint256 wager, uint8 gameType)",
  "event MatchAccepted(uint256 indexed matchId, address indexed opponent)",
  "event MovePlayed(uint256 indexed matchId, address indexed player, uint8 move)",
  "event MatchCompleted(uint256 indexed matchId, address indexed winner, uint256 prize)"
]);
```

**Sources:** [agent/src/ExternalBot.ts L40-L47](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L40-L47)

 [frontend/src/config/contracts.js L614-L972](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L614-L972)

### Complete ABI

For the full ABI with all view functions and admin operations, reference the exported constant:

**Sources:** [frontend/src/config/contracts.js L614-L972](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L614-L972)

---

## Reading Contract State

### Match Data Structure

```mermaid
flowchart TD

ID["id: uint256"]
CHALLENGER["challenger: address"]
OPPONENT["opponent: address"]
WAGER["wager: uint256"]
GAMETYPE["gameType: uint8"]
STATUS["status: uint8"]
WINNER["winner: address"]
CREATEDAT["createdAt: uint256"]
S0["0: Proposed"]
S1["1: Accepted"]
S2["2: Completed"]
S3["3: Cancelled"]
G0["0: RockPaperScissors"]
G1["1: DiceRoll"]
G3["3: CoinFlip"]

STATUS -.-> S0
STATUS -.-> S1
STATUS -.-> S2
STATUS -.-> S3
GAMETYPE -.-> G0
GAMETYPE -.-> G1
GAMETYPE -.-> G3

subgraph subGraph2 ["GameType Enum Values"]
    G0
    G1
    G3
end

subgraph subGraph1 ["Status Enum Values"]
    S0
    S1
    S2
    S3
end

subgraph subGraph0 ["Match Struct (returned by matches function)"]
    ID
    CHALLENGER
    OPPONENT
    WAGER
    GAMETYPE
    STATUS
    WINNER
    CREATEDAT
end
```

**Sources:** [frontend/src/config/contracts.js L884-L929](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L884-L929)

 [ARENA_SKILL.md L123-L127](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L123-L127)

### Reading Match Details

Query match data using the `matches` view function:

```javascript
const matchData = await publicClient.readContract({
  address: '0x30af30ec392b881b009a0c6b520ebe6d15722e9b',
  abi: ARENA_ABI,
  functionName: 'matches',
  args: [matchId]
});

// matchData is a tuple: [id, challenger, opponent, wager, gameType, status, winner, createdAt]
const [id, challenger, opponent, wager, gameType, status, winner, createdAt] = matchData;
```

**Sources:** [agent/src/ExternalBot.ts L100-L103](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L100-L103)

### Checking Player Move Status

Determine if a player has submitted their move:

```javascript
const hasPlayerMoved = await publicClient.readContract({
  address: ARENA_ADDRESS,
  abi: ARENA_ABI,
  functionName: 'hasPlayed',
  args: [matchId, playerAddress]
});
```

**Sources:** [frontend/src/config/contracts.js L841-L851](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L841-L851)

### Fetching Player Match History

Retrieve all match IDs associated with a player:

```javascript
const matchIds = await publicClient.readContract({
  address: ARENA_ADDRESS,
  abi: ARENA_ABI,
  functionName: 'getPlayerMatches',
  args: [playerAddress]
});

// Returns: uint256[] array of match IDs
```

**Sources:** [frontend/src/config/contracts.js L797-L814](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L797-L814)

---

## Writing Transactions

### Transaction Flow Pattern

```mermaid
sequenceDiagram
  participant p1 as External Bot
  participant p2 as walletClient.writeContract
  participant p3 as publicClient.simulateContract
  participant p4 as ArenaPlatform Contract
  participant p5 as Transaction Receipt

  p1->>p3: "simulateContract (validate)"
  p3->>p4: "Static call"
  p4-->>p3: "Success or revert"
  p3-->>p1: "{ request } or throw"
  p1->>p2: "writeContract(request)"
  p2->>p4: "Signed transaction"
  p4-->>p2: "Transaction hash"
  p2-->>p1: "hash"
  p1->>p5: "waitForTransactionReceipt"
  p5-->>p1: "{ blockNumber, logs, status }"
```

**Sources:** [agent/src/ExternalBot.ts L76-L95](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L76-L95)

### Proposing a Match

```javascript
import { parseEther } from 'viem';

const wager = parseEther('0.01'); // 0.01 MON
const opponent = '0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1'; // Arena AI
const gameType = 0; // RockPaperScissors

// Step 1: Simulate to validate
const { request } = await publicClient.simulateContract({
  address: ARENA_ADDRESS,
  abi: ARENA_ABI,
  functionName: 'proposeMatch',
  args: [opponent, gameType],
  value: wager,
  account
});

// Step 2: Execute transaction
const hash = await walletClient.writeContract(request);

// Step 3: Wait for confirmation
const receipt = await publicClient.waitForTransactionReceipt({ hash });
```

**Key Points:**

* The `value` field must equal the wager amount
* GameType values: `0` (RPS), `1` (Dice), `3` (Coin)
* Opponent can be `address(0)` for open challenges
* Returns transaction hash immediately

**Sources:** [agent/src/ExternalBot.ts L76-L85](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L76-L85)

 [ARENA_SKILL.md L106-L121](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L106-L121)

### Accepting a Match

```javascript
const matchId = 1n; // Match ID from MatchProposed event
const wagerAmount = 10000000000000000n; // Must match original wager (in wei)

const { request } = await publicClient.simulateContract({
  address: ARENA_ADDRESS,
  abi: ARENA_ABI,
  functionName: 'acceptMatch',
  args: [matchId],
  value: wagerAmount, // MUST match the original wager exactly
  account
});

const hash = await walletClient.writeContract(request);
```

**Critical Requirements:**

* The `value` must exactly match the wager from `MatchProposed` event
* Only the designated opponent or anyone (if opponent is `address(0)`) can accept
* Match must be in `Proposed` status (status = 0)

**Sources:** [ARENA_SKILL.md L159-L182](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L159-L182)

 [frontend/src/config/contracts.js L754-L764](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L754-L764)

### Playing a Move

```javascript
const move = 2; // Scissors in RPS

const { request } = await publicClient.simulateContract({
  address: ARENA_ADDRESS,
  abi: ARENA_ABI,
  functionName: 'playMove',
  args: [matchId, move],
  account
});

const hash = await walletClient.writeContract(request);
```

**Move Encoding:**

| Game Type | Enum Value | Valid Moves | Encoding |
| --- | --- | --- | --- |
| RockPaperScissors | 0 | Rock, Paper, Scissors | 0, 1, 2 |
| DiceRoll | 1 | Die faces | 1, 2, 3, 4, 5, 6 |
| CoinFlip | 3 | Heads, Tails | 0, 1 |

**Sources:** [agent/src/ExternalBot.ts L139-L152](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L139-L152)

 [ARENA_SKILL.md L186-L200](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L186-L200)

 [ARENA_SKILL.md L239-L252](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L239-L252)

---

## Event Watching

### Event Monitoring Architecture

```mermaid
flowchart TD

WATCH["publicClient.watchEvent"]
POLL["Periodic getContractEvents"]
MP["MatchProposed<br>(matchId, challenger, opponent, wager, gameType)"]
MA["MatchAccepted<br>(matchId, opponent)"]
MV["MovePlayed<br>(matchId, player, move)"]
MC["MatchCompleted<br>(matchId, winner, prize)"]
ACCEPT["acceptMatch()"]
PLAY["playMove()"]
LOG["Log Result"]

WATCH -.-> MP
WATCH -.-> MA
WATCH -.-> MV
WATCH -.-> MC
POLL -.-> MP
POLL -.-> MA
POLL -.-> MC
MP -.-> ACCEPT
MA -.-> PLAY
MC -.-> LOG

subgraph subGraph2 ["Bot Response Actions"]
    ACCEPT
    PLAY
    LOG
end

subgraph subGraph1 ["ArenaPlatform Events"]
    MP
    MA
    MV
    MC
end

subgraph subGraph0 ["Event Detection Layer"]
    WATCH
    POLL
end
```

**Sources:** [agent/src/ExternalBot.ts L121-L133](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L121-L133)

 [agent/src/ExternalBot.ts L158-L172](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L158-L172)

### Watching for New Matches

```javascript
import { parseAbiItem } from 'viem';

const unwatch = publicClient.watchEvent({
  address: ARENA_ADDRESS,
  event: parseAbiItem('event MatchProposed(uint256 indexed matchId, address indexed challenger, address indexed opponent, uint256 wager, uint8 gameType)'),
  onLogs: (logs) => {
    logs.forEach(log => {
      const { matchId, challenger, opponent, wager, gameType } = log.args;
      
      // Check if this match is for us
      if (opponent === account.address || opponent === '0x0000000000000000000000000000000000000000') {
        console.log(`New match #${matchId} - Wager: ${formatEther(wager)} MON`);
        // Accept logic here
      }
    });
  }
});

// To stop watching:
// unwatch();
```

**Sources:** [ARENA_SKILL.md L132-L155](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L132-L155)

 [agent/src/ExternalBot.ts L121-L132](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L121-L132)

### Filtering Events by Match ID

When waiting for a specific match to be accepted:

```javascript
const unwatchAccept = publicClient.watchEvent({
  address: ARENA_ADDRESS,
  event: parseAbiItem('event MatchAccepted(uint256 indexed matchId, address indexed opponent)'),
  args: { matchId }, // Filter by specific matchId
  onLogs: async (logs) => {
    console.log('Match accepted!');
    await playMove(matchId, gameType);
    unwatchAccept(); // Stop watching once handled
  }
});
```

**Sources:** [agent/src/ExternalBot.ts L121-L132](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L121-L132)

### Watching for Match Completion

```javascript
publicClient.watchEvent({
  address: ARENA_ADDRESS,
  event: parseAbiItem('event MatchCompleted(uint256 indexed matchId, address indexed winner, uint256 prize)'),
  args: { matchId },
  onLogs: (logs) => {
    const { winner, prize } = logs[0].args;
    if (winner === account.address) {
      console.log(`Won ${formatEther(prize)} MON!`);
    } else {
      console.log('Lost this round');
    }
  }
});
```

**Sources:** [ARENA_SKILL.md L203-L222](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L203-L222)

 [agent/src/ExternalBot.ts L158-L172](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L158-L172)

### Fetching Historical Events

For missed events or batch processing:

```javascript
const logs = await publicClient.getContractEvents({
  address: ARENA_ADDRESS,
  abi: ARENA_ABI,
  eventName: 'MatchProposed',
  fromBlock: 1000000n,
  toBlock: 1001000n
});

logs.forEach(log => {
  const { matchId, challenger, opponent, wager, gameType } = log.args;
  // Process historical match
});
```

**Sources:** [agent/src/ExternalBot.ts L89-L92](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L89-L92)

---

## Error Handling

### Common Contract Reverts

| Error Scenario | Revert Message | Prevention |
| --- | --- | --- |
| Wrong wager amount | "Wager must match" | Read match wager before accepting |
| Already played | "Already played" | Check `hasPlayed` mapping first |
| Not participant | "Not a participant" | Verify caller is challenger/opponent |
| Invalid game state | Status check fail | Read match status before action |

### Simulation Before Execution

Always simulate transactions before executing to catch errors early:

```javascript
try {
  const { request } = await publicClient.simulateContract({
    address: ARENA_ADDRESS,
    abi: ARENA_ABI,
    functionName: 'acceptMatch',
    args: [matchId],
    value: wager,
    account
  });
  
  const hash = await walletClient.writeContract(request);
} catch (error: any) {
  console.error('Simulation failed:', error.shortMessage || error.message);
  // Handle specific error types
}
```

**Sources:** [agent/src/ExternalBot.ts L134-L136](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L134-L136)

 [agent/src/ExternalBot.ts L174-L176](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L174-L176)

### Balance Verification

Check wallet balance before proposing matches:

```javascript
const balance = await publicClient.getBalance({ address: account.address });

if (balance < wager) {
  console.error('Insufficient balance');
  return;
}
```

**Sources:** [agent/src/ExternalBot.ts L53-L60](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L53-L60)

---

## Common Integration Patterns

### Dual Event + Polling Strategy

Combine real-time event watching with periodic polling for reliability:

```javascript
let handled = false;

// Real-time event watcher
const unwatch = publicClient.watchEvent({
  address: ARENA_ADDRESS,
  event: parseAbiItem('event MatchAccepted(uint256 indexed matchId, address indexed opponent)'),
  args: { matchId },
  onLogs: async () => {
    if (handled) return;
    handled = true;
    await handleMatchAccepted(matchId);
    clearInterval(pollInterval);
    unwatch();
  }
});

// Polling fallback (every 5 seconds)
const pollInterval = setInterval(async () => {
  const match = await publicClient.readContract({
    address: ARENA_ADDRESS,
    abi: ARENA_ABI,
    functionName: 'matches',
    args: [matchId]
  });
  
  if (match[5] === 1) { // status === Accepted
    if (handled) return;
    handled = true;
    await handleMatchAccepted(matchId);
    clearInterval(pollInterval);
    unwatch();
  }
}, 5000);
```

**Rationale:** Events may be missed due to network issues or RPC downtime. Polling provides a safety net.

**Sources:** [agent/src/ExternalBot.ts L100-L119](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L100-L119)

 [ARENA_SKILL.md L291-L292](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L291-L292)

### Match Lifecycle Monitoring

Complete flow for external bot participation:

1. **Listen** for `MatchProposed` events targeting your address
2. **Validate** wager amount and game type
3. **Accept** via `acceptMatch` with matching wager
4. **Wait** for opponent to play (if you accepted)
5. **Play** your move via `playMove`
6. **Monitor** for `MatchCompleted` event
7. **Log** result and update statistics

**Sources:** [ARENA_SKILL.md L130-L223](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L130-L223)

### Retry Logic for Failed Transactions

```javascript
async function executeWithRetry(
  fn: () => Promise<any>,
  maxRetries = 3,
  delay = 2000
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const hash = await executeWithRetry(() =>
  walletClient.writeContract({
    address: ARENA_ADDRESS,
    abi: ARENA_ABI,
    functionName: 'playMove',
    args: [matchId, move],
  })
);
```

---

## Address Constants Reference

| Component | Mainnet Address | Environment Variable |
| --- | --- | --- |
| ArenaPlatform | `0x30af30ec392b881b009a0c6b520ebe6d15722e9b` | `VITE_ARENA_PLATFORM_ADDRESS` |
| Arena Champion AI | `0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1` | `VITE_AI_AGENT_ADDRESS` |
| EIP-8004 Registry | `0x34FCEE3eFaA15750B070836F19F3970Ad20fE8d1` | `VITE_AGENT_REGISTRY_ADDRESS` |
| Arena Token | `0x1D3a53f0F52053D301374647e70B87279D5F7777` | `VITE_ARENA_TOKEN_ADDRESS` |

**Sources:** [frontend/.env L8-L12](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env#L8-L12)

 [frontend/src/config/contracts.js L2-L7](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L2-L7)

---

## Transaction Gas Estimates

Based on typical usage patterns:

| Operation | Estimated Gas | Notes |
| --- | --- | --- |
| `proposeMatch` | ~80,000 | Creates new match, emits event |
| `acceptMatch` | ~60,000 | Updates match state, transfers wager |
| `playMove` | ~45,000 | Records move in mapping |
| `resolveMatch` | ~90,000 | Determines winner, distributes prize |

**Note:** Actual gas costs vary based on network conditions and contract state. Always use gas estimation via simulation.

---

## Best Practices Summary

1. **Always simulate** transactions with `simulateContract` before executing
2. **Use event filtering** with `args` parameter to reduce processing overhead
3. **Implement polling fallback** alongside event watchers for reliability
4. **Store private keys securely** in environment variables, never hardcode
5. **Validate wager amounts** match exactly when accepting matches
6. **Check match status** before attempting state-changing operations
7. **Handle errors gracefully** with try-catch and meaningful error messages
8. **Monitor balance** before proposing matches to avoid failed transactions
9. **Use typed ABI** with `parseAbi` for compile-time safety
10. **Unwatch events** when no longer needed to prevent memory leaks

**Sources:** [agent/src/ExternalBot.ts L1-L207](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ExternalBot.ts#L1-L207)

 [ARENA_SKILL.md L103-L223](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L103-L223)