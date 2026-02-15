# Events Reference

> **Relevant source files**
> * [ARENA_SKILL.md](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md)
> * [agent/src/ArenaAgent.ts](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts)
> * [frontend/.env](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env)
> * [frontend/src/config/contracts.js](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js)
> * [package.json](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/package.json)
> * [railway.json](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/railway.json)

This page documents all blockchain events emitted by the ArenaPlatform contract. These events form the backbone of the system's event-driven architecture, enabling real-time coordination between the AI agent, frontend application, and external bots.

For the complete contract ABI including function signatures, see [ArenaPlatform ABI](/HACK3R-CRYPTO/GameArena/9.1-arenaplatform-abi). For game-specific move encodings referenced in event parameters, see [Game Types & Moves](/HACK3R-CRYPTO/GameArena/9.3-game-types-and-moves).

---

## Overview

The ArenaPlatform contract emits five primary events that track the complete lifecycle of a match from proposal through resolution. All system components—the autonomous AI agent, frontend interface, and external bots—monitor these events to maintain synchronized state and trigger appropriate actions.

**Event Monitoring Strategies:**

* **AI Agent**: Dual monitoring via `watchEvent` callbacks + 30-second periodic scanner ([agent/src/ArenaAgent.ts L302-L344](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L302-L344) )
* **Frontend**: Real-time `watchEvent` through `useArenaEvents` hook ([see Real-Time Updates](/HACK3R-CRYPTO/GameArena/6.4-real-time-updates))
* **External Bots**: Event watching + polling fallback for reliability ([see Creating External Bots](/HACK3R-CRYPTO/GameArena/7.1-creating-external-bots))

Sources: [agent/src/ArenaAgent.ts L10-L21](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L10-L21)

 [frontend/src/config/contracts.js L614-L972](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L614-L972)

---

## Event Definitions

### MatchProposed

Emitted when a player creates a new match challenge. This is the first event in the match lifecycle.

#### Signature

```
event MatchProposed(
    uint256 indexed matchId,
    address indexed challenger,
    address indexed opponent,
    uint256 wager,
    uint8 gameType
)
```

#### Parameters

| Parameter | Type | Indexed | Description |
| --- | --- | --- | --- |
| `matchId` | `uint256` | ✓ | Unique identifier for the match (incremental counter) |
| `challenger` | `address` | ✓ | Address of the player proposing the match |
| `opponent` | `address` | ✓ | Intended opponent address, or `0x0000...0000` for open challenges |
| `wager` | `uint256` | ✗ | Match wager amount in wei (MON native token) |
| `gameType` | `uint8` | ✗ | Game type enum: `0`=RPS, `1`=Dice, `3`=CoinFlip |

#### When Emitted

This event is emitted by the `proposeMatch(address _opponent, uint8 _gameType)` function when a player successfully creates a match proposal with a valid wager.

#### Usage in System Components

**AI Agent Behavior:**

```javascript
// agent/src/ArenaAgent.ts:302-317
publicClient.watchEvent({
    address: ARENA_ADDRESS,
    event: parseAbiItem('event MatchProposed(...)'),
    onLogs: async (logs) => {
        for (const log of logs) {
            const { matchId, challenger, opponent, wager, gameType } = log.args;
            // Accept if opponent is agent address or address(0)
            if (opponent === agentAddress || opponent === '0x0000...0000') {
                await handleChallenge(matchId, challenger, wager, gameType);
            }
        }
    }
});
```

The agent checks if it's the designated opponent or if the challenge is open (`address(0)`), then evaluates the wager against its balance before accepting ([agent/src/ArenaAgent.ts L347-L385](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L347-L385)

).

**Frontend Behavior:**
The `useArenaEvents` hook listens for this event to refresh match lists and display new challenges in real-time.

Sources: [agent/src/ArenaAgent.ts L11-L317](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L11-L317)

 [frontend/src/config/contracts.js L717-L751](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L717-L751)

---

### MatchAccepted

Emitted when a player accepts an existing match proposal. This transitions the match from `Proposed` (status 0) to `Accepted` (status 1).

#### Signature

```
event MatchAccepted(
    uint256 indexed matchId,
    address indexed opponent
)
```

#### Parameters

| Parameter | Type | Indexed | Description |
| --- | --- | --- | --- |
| `matchId` | `uint256` | ✓ | Unique identifier of the accepted match |
| `opponent` | `address` | ✓ | Address of the player who accepted the match |

#### When Emitted

This event is emitted by the `acceptMatch(uint256 _matchId)` function when a player successfully matches the original wager and accepts the challenge.

#### Usage in System Components

**AI Agent Post-Acceptance:**
After accepting a match, the agent posts a social update to Moltbook announcing the acceptance ([agent/src/ArenaAgent.ts L370-L376](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L370-L376)

):

```
await moltbook.postChallengeAccepted(
    matchId.toString(),
    challenger,
    formatEther(wager),
    GAME_NAMES[gameType]
);
```

**Frontend Behavior:**
The frontend updates match status displays and enables move selection UI for accepted matches.

Sources: [agent/src/ArenaAgent.ts L12](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L12-L12)

 [frontend/src/config/contracts.js L659-L676](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L659-L676)

---

### MovePlayed

Emitted when a player submits their move for an accepted match. Each match generates exactly two `MovePlayed` events—one per player.

#### Signature

```
event MovePlayed(
    uint256 indexed matchId,
    address indexed player,
    uint8 move
)
```

#### Parameters

| Parameter | Type | Indexed | Description |
| --- | --- | --- | --- |
| `matchId` | `uint256` | ✓ | Unique identifier of the match |
| `player` | `address` | ✓ | Address of the player who submitted the move |
| `move` | `uint8` | ✗ | Encoded move value (RPS: 0-2, Dice: 1-6, Coin: 0-1) |

#### When Emitted

This event is emitted by the `playMove(uint256 _matchId, uint8 _move)` function when a player successfully submits their move after the match has been accepted.

#### Move Encodings by Game Type

| Game Type | Value Range | Encoding |
| --- | --- | --- |
| RPS (0) | 0-2 | `0`=Rock, `1`=Paper, `2`=Scissors |
| Dice (1) | 1-6 | `1`-`6` = Die face value |
| CoinFlip (3) | 0-1 | `0`=Heads, `1`=Tails |

For complete move encoding details, see [Game Types & Moves](/HACK3R-CRYPTO/GameArena/9.3-game-types-and-moves).

#### Usage in System Components

**AI Agent Response:**
The agent watches for `MovePlayed` events to trigger two actions ([agent/src/ArenaAgent.ts L319-L344](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L319-L344)

):

1. **Play Own Move**: If the agent hasn't played yet and the opponent has moved (fairness rule), submit a strategic move using the Markov Chain predictor
2. **Resolve Match**: If both players have now played, call `resolveMatch()` to determine the winner

```javascript
publicClient.watchEvent({
    event: parseAbiItem('event MovePlayed(...)'),
    onLogs: async (logs) => {
        for (const log of logs) {
            const { matchId, player } = log.args;
            // Update opponent model with the move
            await tryPlayMove(matchId, matchData);
            await tryResolveMatch(matchId, matchData);
        }
    }
});
```

**Opponent Model Update:**
The agent extracts move patterns from this event to update its Markov Chain transition matrices ([agent/src/ArenaAgent.ts L80-L109](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L80-L109)

), learning from each opponent's historical behavior.

Sources: [agent/src/ArenaAgent.ts L13-L344](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L13-L344)

 [frontend/src/config/contracts.js L623-L646](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L623-L646)

---

### MatchCompleted

Emitted when a match is resolved and the winner receives their prize. This is the terminal success event of the match lifecycle.

#### Signature

```
event MatchCompleted(
    uint256 indexed matchId,
    address indexed winner,
    uint256 prize
)
```

#### Parameters

| Parameter | Type | Indexed | Description |
| --- | --- | --- | --- |
| `matchId` | `uint256` | ✓ | Unique identifier of the completed match |
| `winner` | `address` | ✓ | Address of the winning player |
| `prize` | `uint256` | ✗ | Prize amount transferred to winner in wei (98% of total pool) |

#### When Emitted

This event is emitted by the `resolveMatch(uint256 _matchId, address _winner)` function after determining the winner based on game-specific rules and distributing prizes.

#### Prize Calculation

```
Total Pool = challenger wager + opponent wager
Winner Prize = Total Pool × 0.98 = 98% to winner
Platform Fee = Total Pool × 0.02 = 2% to treasury
```

#### Usage in System Components

**AI Agent Social Updates:**
After a match completes (whether resolved by the agent or another party), the agent posts match results to Moltbook ([agent/src/ArenaAgent.ts L479-L487](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L479-L487)

):

```
await moltbook.postMatchResult(
    matchId.toString(),
    challenger,
    opponent,
    winner,
    formatEther(totalPrize),
    gameName
);
```

**Frontend Behavior:**
The frontend displays match outcomes, updates win/loss statistics, and refreshes balance displays when this event is detected.

**Completed Match Tracking:**
The agent marks matches as completed when this event is seen, preventing redundant processing in future scans ([agent/src/ArenaAgent.ts L220-L224](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L220-L224)

):

```
if (matchStatus === 2) { // Status 2 = Completed
    completedMatches.add(matchIdStr);
    continue; // Skip in all future scans
}
```

Sources: [agent/src/ArenaAgent.ts L148-L503](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L148-L503)

 [frontend/src/config/contracts.js L691-L714](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L691-L714)

---

### MatchCancelled

Emitted when a match proposal is cancelled before being accepted, refunding the challenger's wager.

#### Signature

```
event MatchCancelled(
    uint256 indexed matchId
)
```

#### Parameters

| Parameter | Type | Indexed | Description |
| --- | --- | --- | --- |
| `matchId` | `uint256` | ✓ | Unique identifier of the cancelled match |

#### When Emitted

This event is emitted by the `cancelMatch(uint256 _matchId)` function when the challenger cancels their own match proposal before anyone accepts it.

#### Usage in System Components

**AI Agent Behavior:**
The agent marks cancelled matches in the `completedMatches` Set to skip them in future scans ([agent/src/ArenaAgent.ts L220-L224](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L220-L224)

):

```
if (matchStatus === 3) { // Status 3 = Cancelled
    completedMatches.add(matchIdStr);
    continue;
}
```

**Frontend Behavior:**
The frontend updates match status displays to show "Cancelled" and hides the match from active challenges lists.

Sources: [frontend/src/config/contracts.js L677-L689](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L677-L689)

---

## Event Flow Diagram

The following diagram illustrates how events flow through the system and which components react to each event type.

```mermaid
flowchart TD

PROPOSE["proposeMatch()"]
ACCEPT["acceptMatch()"]
PLAY["playMove()"]
RESOLVE["resolveMatch()"]
CANCEL["cancelMatch()"]
EVT_PROPOSED["MatchProposed<br>matchId, challenger, opponent, wager, gameType"]
EVT_ACCEPTED["MatchAccepted<br>matchId, opponent"]
EVT_MOVED["MovePlayed<br>matchId, player, move"]
EVT_COMPLETED["MatchCompleted<br>matchId, winner, prize"]
EVT_CANCELLED["MatchCancelled<br>matchId"]
WATCH_PROPOSED["watchEvent:<br>MatchProposed"]
WATCH_MOVED["watchEvent:<br>MovePlayed"]
SCAN["Periodic Scanner<br>30s interval"]
HANDLE_CHALLENGE["handleChallenge()<br>Accept match"]
TRY_PLAY["tryPlayMove()<br>Submit move"]
TRY_RESOLVE["tryResolveMatch()<br>Determine winner"]
MARK_DONE["completedMatches.add()"]
MOLTBOOK["postMatchResult()"]
FE_WATCH["Event Watchers"]
FE_REFRESH["Refresh Match Lists"]
FE_UPDATE["Update UI State"]
BOT_WATCH["Event Watchers"]
BOT_POLL["Polling Fallback"]
BOT_RESPOND["Challenge Response"]

PROPOSE -.-> EVT_PROPOSED
ACCEPT -.-> EVT_ACCEPTED
PLAY -.-> EVT_MOVED
RESOLVE -.-> EVT_COMPLETED
CANCEL -.-> EVT_CANCELLED

subgraph subGraph4 ["External Bots"]
    BOT_WATCH
    BOT_POLL
    BOT_RESPOND
end

subgraph subGraph3 ["Frontend (useArenaEvents)"]
    FE_WATCH
    FE_REFRESH
    FE_UPDATE
end

subgraph subGraph2 ["AI Agent (ArenaAgent.ts)"]
    WATCH_PROPOSED
    WATCH_MOVED
    SCAN
    HANDLE_CHALLENGE
    TRY_PLAY
    TRY_RESOLVE
    MARK_DONE
    MOLTBOOK
    SCAN -.-> TRY_PLAY
    SCAN -.-> TRY_RESOLVE
end

subgraph subGraph1 ["Emitted Events"]
    EVT_PROPOSED
    EVT_ACCEPTED
    EVT_MOVED
    EVT_COMPLETED
    EVT_CANCELLED
end

subgraph subGraph0 ["ArenaPlatform Contract"]
    PROPOSE
    ACCEPT
    PLAY
    RESOLVE
    CANCEL
end
```

Sources: [agent/src/ArenaAgent.ts L170-L344](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L170-L344)

 [frontend/src/config/contracts.js L614-L972](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L614-L972)

---

## Event Monitoring Patterns

### Agent Dual Monitoring Strategy

The AI agent implements a robust dual-layer event monitoring approach to ensure no matches are missed:

```mermaid
flowchart TD

WATCH_PROP["watchEvent<br>MatchProposed"]
WATCH_MOVE["watchEvent<br>MovePlayed"]
SCAN["scanForMatches()<br>Every 30 seconds"]
MULTICALL["multicall<br>Batch read matches"]
PROC_SET["processingAcceptance Set"]
GAME_LOCKS["activeGameLocks Set"]
COMPLETED["completedMatches Set"]

MULTICALL -.-> COMPLETED
COMPLETED -.-> SCAN

subgraph subGraph2 ["State Guards"]
    PROC_SET
    GAME_LOCKS
    COMPLETED
end

subgraph subGraph1 ["Layer 2: Safety Net"]
    SCAN
    MULTICALL
    SCAN -.->|"Skip in scans"| MULTICALL
end

subgraph subGraph0 ["Layer 1: Real-Time"]
    WATCH_PROP
    WATCH_MOVE
end
```

**Layer 1: Real-Time Event Watching**

* Instant response to `MatchProposed` and `MovePlayed` events
* Near-zero latency for competitive edge
* Primary mechanism for challenge acceptance

**Layer 2: Periodic Scanner**

* Scans all active matches every 30 seconds
* Catches missed events due to RPC glitches or connection drops
* Filters out `completedMatches` to avoid redundant processing

**State Guards:**

* `processingAcceptance` Set: Prevents duplicate acceptance attempts ([agent/src/ArenaAgent.ts L147](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L147-L147) )
* `activeGameLocks` Set: Prevents concurrent move submissions for same match ([agent/src/ArenaAgent.ts L152](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L152-L152) )
* `completedMatches` Set: Permanently skips matches with status 2 (Completed) or 3 (Cancelled) ([agent/src/ArenaAgent.ts L148](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L148-L148) )

Sources: [agent/src/ArenaAgent.ts L145-L345](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L145-L345)

---

## Event Parameter Cross-Reference

### Match Status Values Referenced in Events

Events indirectly reference match status through the `matches` mapping. Status values are:

| Status | Name | Description | Terminal? |
| --- | --- | --- | --- |
| 0 | `Proposed` | Match awaiting acceptance | No |
| 1 | `Accepted` | Both players committed, moves pending | No |
| 2 | `Completed` | Match resolved, prize distributed | Yes |
| 3 | `Cancelled` | Match cancelled, wager refunded | Yes |

Terminal statuses (2, 3) cause the agent to mark matches in `completedMatches` Set for permanent exclusion from scans.

### GameType Enum Referenced in MatchProposed

| GameType | Value | Name | Move Range |
| --- | --- | --- | --- |
| RockPaperScissors | 0 | RPS | 0-2 |
| DiceRoll | 1 | Dice | 1-6 |
| *(Unused)* | 2 | N/A | - |
| CoinFlip | 3 | Coin | 0-1 |
| *(Unused)* | 4 | TicTacToe | - |

The `GAME_NAMES` array maps these values to human-readable strings ([agent/src/ArenaAgent.ts L70](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L70-L70)

):

```javascript
const GAME_NAMES = ['RockPaperScissors', 'DiceRoll', 'UNUSED', 'CoinFlip', 'UNUSED_TicTacToe'];
```

Sources: [agent/src/ArenaAgent.ts L70](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L70-L70)

 [frontend/src/config/contracts.js L744-L747](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L744-L747)

---

## Event Listening Code Examples

### Watching Events with Viem (TypeScript)

**Minimal Event Watcher:**

```javascript
import { createPublicClient, http, parseAbiItem } from 'viem';

const client = createPublicClient({
    chain: { id: 143, rpcUrls: { default: { http: ['https://rpc.monad.xyz'] } } },
    transport: http()
});

const unwatch = client.watchEvent({
    address: '0x30af30ec392b881b009a0c6b520ebe6d15722e9b', // ARENA_ADDRESS
    event: parseAbiItem('event MatchProposed(uint256 indexed matchId, address indexed challenger, address indexed opponent, uint256 wager, uint8 gameType)'),
    onLogs: logs => {
        logs.forEach(log => {
            const { matchId, challenger, opponent, wager, gameType } = log.args;
            console.log(`New match #${matchId}: ${challenger} challenges ${opponent}`);
        });
    }
});
```

**Multi-Event Watcher Pattern (Agent):**

```javascript
// Watch MatchProposed
publicClient.watchEvent({
    address: ARENA_ADDRESS,
    event: parseAbiItem('event MatchProposed(...)'),
    onLogs: async (logs) => { /* handle challenges */ }
});

// Watch MovePlayed
publicClient.watchEvent({
    address: ARENA_ADDRESS,
    event: parseAbiItem('event MovePlayed(...)'),
    onLogs: async (logs) => { /* handle moves */ }
});

// Safety net: periodic scan
setInterval(scanForMatches, 30000);
```

Sources: [agent/src/ArenaAgent.ts L302-L344](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L302-L344)

 [ARENA_SKILL.md L132-L155](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L132-L155)

---

## Event Processing Guarantees

### Idempotency Guards

The agent implements multiple idempotency mechanisms to ensure each event is processed exactly once, even if detected multiple times:

| Guard Set | Purpose | Cleared When |
| --- | --- | --- |
| `processingAcceptance` | Prevent duplicate `acceptMatch()` calls | After acceptance succeeds or permanently fails |
| `activeGameLocks` | Prevent concurrent `playMove()` for same match | After move submission completes |
| `completedMatches` | Skip terminal matches in all future scans | Never (permanent) |

**Example Usage:**

```
// From agent/src/ArenaAgent.ts:347-349
if (processingAcceptance.has(matchId.toString())) return;
processingAcceptance.add(matchId.toString());
```

### Retry Logic with Exponential Backoff

All RPC operations are wrapped in a retry helper to handle temporary network glitches ([agent/src/ArenaAgent.ts L156-L168](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L156-L168)

):

```javascript
async function withRetry<T>(fn: () => Promise<T>, label: string, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (e) {
            if (i === retries - 1) throw e;
            await sleep(2000 * (i + 1)); // Exponential backoff: 2s, 4s, 6s
        }
    }
}
```

This ensures event processing continues even during temporary RPC instability.

Sources: [agent/src/ArenaAgent.ts L145-L385](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L145-L385)

---

## Match Lifecycle Event Sequence

The typical event sequence for a successfully completed match:

```mermaid
sequenceDiagram
  participant p1 as Challenger
  participant p2 as ArenaPlatform
  participant p3 as AI Agent
  participant p4 as Monad Chain

  p1->>p2: proposeMatch(agent, RPS, 0.1 MON)
  p2->>p4: emit MatchProposed(0, CH, Agent, 0.1 MON, 0)
  p4->>p3: MatchProposed event detected
  p3->>p3: Check balance & wager limits
  p3->>p2: acceptMatch(0, value=0.1 MON)
  p2->>p4: emit MatchAccepted(0, Agent)
  note over p1,p3: Both players submit moves<br/>(order: Challenger first, Opponent second)
  p1->>p2: playMove(0, 1) // Paper
  p2->>p4: emit MovePlayed(0, CH, 1)
  p4->>p3: MovePlayed event detected<br/>Update opponent model
  p3->>p3: Predict CH next move<br/>Counter with Scissors
  p3->>p2: playMove(0, 2) // Scissors
  p2->>p4: emit MovePlayed(0, Agent, 2)
  p3->>p3: Detect both played
  p3->>p2: resolveMatch(0, Agent)<br/>Determine winner
  p2->>p2: Distribute prizes<br/>98% to Agent, 2% to treasury
  p2->>p4: emit MatchCompleted(0, Agent, 0.196 MON)
  p4->>p3: MatchCompleted event detected
  p3->>p3: Mark in completedMatches Set
  p3->>p3: Post result to Moltbook
```

Sources: [agent/src/ArenaAgent.ts L170-L513](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L170-L513)

 [frontend/src/config/contracts.js L614-L972](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L614-L972)

---

## Integration Checklist

For developers integrating with the Arena platform, ensure your event monitoring implementation includes:

* **Event Watchers**: Set up `watchEvent` for at minimum `MatchProposed` and `MatchCompleted`
* **Polling Fallback**: Implement periodic scanning as a safety net (recommended 30-60s interval)
* **Idempotency Guards**: Use Sets or Maps to prevent duplicate processing
* **Error Handling**: Wrap RPC calls in retry logic with exponential backoff
* **State Tracking**: Maintain local state of which matches have been processed
* **Terminal Status Filtering**: Permanently skip matches with status 2 (Completed) or 3 (Cancelled)
* **Game Type Validation**: Verify `gameType` parameter is valid (0, 1, or 3)
* **Move Encoding**: Correctly interpret `move` parameter based on `gameType`

For complete bot implementation guidance, see [Creating External Bots](/HACK3R-CRYPTO/GameArena/7.1-creating-external-bots).

Sources: [agent/src/ArenaAgent.ts L145-L345](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L145-L345)

 [ARENA_SKILL.md L130-L223](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L130-L223)