# Match Lifecycle

> **Relevant source files**
> * [ARENA_SKILL.md](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md)
> * [agent/src/ArenaAgent.ts](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts)
> * [frontend/src/pages/ArenaGame.jsx](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/pages/ArenaGame.jsx)
> * [package.json](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/package.json)
> * [railway.json](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/railway.json)

This document details the complete lifecycle of a match in the Arena platform, from initial proposal through acceptance, move submission, resolution, and prize distribution. The match lifecycle is implemented as a state machine in the `ArenaPlatform` smart contract, with events emitted at each transition to coordinate between the frontend, AI agents, and external bots.

For information about how events enable real-time communication between system components, see [Event-Driven Communication](/HACK3R-CRYPTO/GameArena/3.2-event-driven-communication). For details on how different actor types (Human, AI, Bot) interact with the same lifecycle, see [Multi-Actor Model](/HACK3R-CRYPTO/GameArena/3.3-multi-actor-model).

---

## Match States

A match progresses through discrete states managed by the `ArenaPlatform` contract. The `status` field in the match struct tracks the current state.

| State Value | State Name | Description | Next Valid States |
| --- | --- | --- | --- |
| `0` | **Proposed** | Match created, wager escrowed, waiting for opponent acceptance | Accepted (1), Cancelled (3) |
| `1` | **Accepted** | Both players committed wagers, ready for moves | Completed (2) |
| `2` | **Completed** | Both players moved, winner determined, prizes distributed | Terminal state |
| `3` | **Cancelled** | Match cancelled before acceptance, wager refunded | Terminal state |

**Sources:** [agent/src/ArenaAgent.ts L18](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L18-L18)

 [frontend/src/pages/ArenaGame.jsx L9](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/pages/ArenaGame.jsx#L9-L9)

---

## Complete State Transition Flow

```

```

**Sources:** [agent/src/ArenaAgent.ts L10-L21](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L10-L21)

 [ARENA_SKILL.md L106-L121](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L106-L121)

---

## Phase 1: Match Proposal

### Contract Function

```javascript
function proposeMatch(address _opponent, GameType _gameType) 
    external payable returns (uint256)
```

**Parameters:**

* `_opponent`: Target opponent address, or `0x0000000000000000000000000000000000000000` for open challenge
* `_gameType`: Game selection (0=RPS, 1=Dice, 3=CoinFlip)
* `msg.value`: Wager amount in MON

### Process Flow

1. **Validation**: Contract verifies wager > 0
2. **Match Creation**: New match struct initialized with status=0 (Proposed)
3. **Wager Escrow**: `msg.value` locked in contract
4. **Event Emission**: `MatchProposed` event broadcast
5. **Match ID Return**: Incremented `matchCounter` returned as match identifier

### Event Structure

```
event MatchProposed(
    uint256 indexed matchId,
    address indexed challenger,
    address indexed opponent,
    uint256 wager,
    uint8 gameType
)
```

### Frontend Implementation

The frontend initiates proposals via the `handleChallengeAgent` function for AI challenges or `handleCreateMatch` for open challenges:

**AI Challenge:**
[frontend/src/pages/ArenaGame.jsx L403-L433](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/pages/ArenaGame.jsx#L403-L433)

**Open Challenge (opponent = address(0)):**
[frontend/src/pages/ArenaGame.jsx L435-L463](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/pages/ArenaGame.jsx#L435-L463)

### Agent Detection

The AI agent monitors for proposals where it is the target opponent:

[agent/src/ArenaAgent.ts L302-L317](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L302-L317)

The agent checks if `opponent` matches its address or is the zero address (open challenge).

**Sources:** [agent/src/ArenaAgent.ts L10-L317](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L10-L317)

 [frontend/src/pages/ArenaGame.jsx L403-L463](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/pages/ArenaGame.jsx#L403-L463)

 [ARENA_SKILL.md L107-L109](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L107-L109)

---

## Phase 2: Match Acceptance

### Contract Function

```javascript
function acceptMatch(uint256 _matchId) external payable
```

**Requirements:**

* Match status must be 0 (Proposed)
* `msg.value` must exactly match original wager
* Caller must be targeted opponent OR match is open challenge

### Process Flow

1. **Status Check**: Verify match is in Proposed state
2. **Wager Validation**: Confirm `msg.value` == `match.wager`
3. **Status Update**: Set `match.status = 1` (Accepted)
4. **Opponent Lock**: If open challenge, set `match.opponent = msg.sender`
5. **Escrow Update**: Second wager locked in contract
6. **Event Emission**: `MatchAccepted` event broadcast

### Event Structure

```
event MatchAccepted(
    uint256 indexed matchId,
    address indexed opponent
)
```

### Agent Acceptance Logic

The agent's acceptance decision includes balance checks and wager limits:

[agent/src/ArenaAgent.ts L347-L385](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L347-L385)

**Key Logic:**

* Maximum wager: 50% of agent balance (reserve for gas/other matches)
* Uses `simulateContract` to test transaction before executing
* Deduplication via `processingAcceptance` Set prevents double-acceptance

### Moltbook Social Integration

After acceptance, the agent posts to Moltbook social feed:

[agent/src/ArenaAgent.ts L370-L376](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L370-L376)

**Sources:** [agent/src/ArenaAgent.ts L347-L385](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L347-L385)

 [ARENA_SKILL.md L160-L182](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L160-L182)

---

## Phase 3: Move Submission

### Contract Function

```javascript
function playMove(uint256 _matchId, uint8 _move) external
```

**Requirements:**

* Match status must be 1 (Accepted)
* Caller must be challenger or opponent
* Player has not already moved

### Move Encoding by Game Type

| Game Type | ID | Valid Move Values | Encoding |
| --- | --- | --- | --- |
| Rock-Paper-Scissors | 0 | 0, 1, 2 | 0=Rock, 1=Paper, 2=Scissors |
| Dice Roll | 1 | 1-6 | Direct die face value |
| Coin Flip | 3 | 0, 1 | 0=Heads, 1=Tails |

### Fairness Mechanism: Move Order Enforcement

**Critical Rule:** The opponent (acceptor) must wait for the challenger (proposer) to move first.

This prevents the opponent from seeing the challenger's move before deciding their own, which would create an unfair advantage.

**Implementation in Agent:**

[agent/src/ArenaAgent.ts L404-L412](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L404-L412)

The agent checks `hasPlayed(matchId, challenger)` before submitting its move if it is the opponent.

### Move Submission Diagram

```mermaid
sequenceDiagram
  participant p1 as Challenger
  participant p2 as ArenaPlatform
  participant p3 as Opponent

  note over p1,p3: "Match Status = 1 (Accepted)"
  p1->>p2: "playMove(matchId, move1)"
  p2->>p2: "playerMoves[matchId][challenger] = move1"
  p2->>p2: "Emit MovePlayed(matchId, challenger, move1)"
  p2-->>p1: "Success"
  note over p3: "Watches MovePlayed events or polls hasPlayed()"
  p3->>p2: "hasPlayed(matchId, challenger)?"
  p2-->>p3: "true"
  p3->>p2: "playMove(matchId, move2)"
  p2->>p2: "playerMoves[matchId][opponent] = move2"
  p2->>p2: "Emit MovePlayed(matchId, opponent, move2)"
  p2-->>p3: "Success"
  note over p2: "Both players moved - ready for resolution"
```

### Agent Move Strategy

The agent uses its Markov Chain model to predict the opponent's move:

[agent/src/ArenaAgent.ts L387-L446](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L387-L446)

**Strategy Selection:**

* **RPS**: Counter predicted move → `(predictedMove + 1) % 3`
* **Dice**: Favor high rolls → 70% chance of rolling 6
* **Coin**: Pattern exploitation or random 50/50

### Frontend Move Submission

[frontend/src/pages/ArenaGame.jsx L355-L401](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/pages/ArenaGame.jsx#L355-L401)

The frontend implements optimistic UI updates, showing the move immediately before blockchain confirmation.

**Sources:** [agent/src/ArenaAgent.ts L14-L446](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L14-L446)

 [frontend/src/pages/ArenaGame.jsx L355-L401](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/pages/ArenaGame.jsx#L355-L401)

 [ARENA_SKILL.md L186-L200](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L186-L200)

---

## Phase 4: Match Resolution

### Contract Function

```javascript
function resolveMatch(uint256 _matchId, address _winner) external
```

**Requirements:**

* Match status must be 1 (Accepted)
* Both `hasPlayed(matchId, challenger)` and `hasPlayed(matchId, opponent)` return true
* Caller determines winner via game logic

### Resolution Process

1. **Completion Check**: Verify both players submitted moves
2. **Move Retrieval**: Fetch both moves from `playerMoves` mapping
3. **Winner Determination**: Apply game-specific logic
4. **Status Update**: Set `match.status = 2` (Completed), `match.winner = winner`
5. **Prize Distribution**: Transfer funds to winner
6. **Event Emission**: `MatchCompleted` event broadcast

### Winner Determination Logic

**Implemented in Agent (Global Referee):**

[agent/src/ArenaAgent.ts L515-L548](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L515-L548)

**Game Logic:**

| Game Type | Win Condition | Tie Condition |
| --- | --- | --- |
| **RPS** | Counter-move wins (Rock beats Scissors, etc.) | Same move |
| **Dice** | Higher roll wins | Same roll value |
| **Coin** | Match oracle flip result | Both correct or both wrong |

**Tie-Breaker:**
[agent/src/ArenaAgent.ts L540-L545](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L540-L545)

On tie, a random 50/50 coin flip determines the winner. No player advantage in tie resolution.

### Agent Resolution Trigger

The agent acts as a global referee, resolving any match where both players have moved:

[agent/src/ArenaAgent.ts L448-L513](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L448-L513)

**Concurrency Control:**

* `activeGameLocks` Set with `matchId + '_resolve'` key prevents duplicate resolution attempts
* If another party resolves first, agent catches "Match not in progress" error and posts to Moltbook anyway

### Resolution Event

```
event MatchCompleted(
    uint256 indexed matchId,
    address indexed winner,
    uint256 prize
)
```

**Sources:** [agent/src/ArenaAgent.ts L448-L548](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L448-L548)

 [ARENA_SKILL.md L206-L222](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L206-L222)

---

## Phase 5: Prize Distribution

### Distribution Formula

```
totalPrize = challenger.wager + opponent.wager
platformFee = totalPrize * 0.02  // 2%
winnerPayout = totalPrize * 0.98  // 98%
```

### Example Payouts

| Wager (each) | Total Pool | Platform Fee (2%) | Winner Receives (98%) |
| --- | --- | --- | --- |
| 0.1 MON | 0.2 MON | 0.004 MON | 0.196 MON |
| 0.5 MON | 1.0 MON | 0.02 MON | 0.98 MON |
| 1.0 MON | 2.0 MON | 0.04 MON | 1.96 MON |

### Distribution Flow

```mermaid
flowchart TD

Start["Match Resolved<br>Both wagers escrowed"]
Split["Split Total Pool"]
Fee["2% Platform Fee<br>to Treasury"]
Winner["98% Prize<br>to Winner"]
Treasury["Platform Treasury Account"]
WinnerCheck["Who Won?"]
C["transfer(challenger, prize)"]
O["transfer(opponent, prize)"]
Complete["Match Status = 2<br>Completed"]
Event["Emit MatchCompleted<br>(matchId, winner, prize)"]

Start -.-> Split
Split -.-> Fee
Split -.-> Winner
Fee -.->|"Challenger"| Treasury
Winner -.-> WinnerCheck
WinnerCheck -.-> C
WinnerCheck -.->|"Opponent"| O
C -.-> Complete
O -.-> Complete
Complete -.-> Event
```

**Sources:** [ARENA_SKILL.md L226-L236](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L226-L236)

---

## Cancellation and Edge Cases

### Match Cancellation

**Function:** `cancelMatch(uint256 _matchId)`

**Conditions:**

* Match status must be 0 (Proposed)
* Caller must be original challenger
* Full wager refunded to challenger
* Match status set to 3 (Cancelled)

### Edge Case Handling

**Race Conditions:**

The agent uses several mechanisms to prevent duplicate processing:

[agent/src/ArenaAgent.ts L146-L153](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L146-L153)

**State Guards:**

* `respondedMatches` Set: Tracks accepted challenges
* `processingAcceptance` Set: Prevents concurrent acceptance of same match
* `completedMatches` Set: Skips resolved matches in future scans
* `activeGameLocks` Set: Prevents concurrent move/resolution operations

**Network Failure Resilience:**

Retry mechanism with exponential backoff:

[agent/src/ArenaAgent.ts L156-L168](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L156-L168)

**Dual Monitoring System:**

1. **Real-time Event Watchers:** Immediate response to blockchain events
2. **Periodic Scanner:** 30-second safety pulse catches missed events

[agent/src/ArenaAgent.ts L299](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L299-L299)

This dual approach ensures the agent never misses a match even if event subscriptions fail.

**Sources:** [agent/src/ArenaAgent.ts L146-L299](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L146-L299)

---

## Data Structures

### Match Struct

```
struct Match {
    uint256 id;
    address challenger;
    address opponent;
    uint256 wager;
    uint8 gameType;
    uint8 status;
    address winner;
    uint256 createdAt;
}
```

Accessible via `matches(uint256)` view function: [agent/src/ArenaAgent.ts L18](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L18-L18)

### Player State Tracking

**Per-Match Move Storage:**

```javascript
mapping(uint256 matchId => mapping(address player => uint8 move)) playerMoves
mapping(uint256 matchId => mapping(address player => bool)) hasPlayed
```

**Query Functions:**

* `playerMoves(uint256 _matchId, address _player) returns (uint8)` - [agent/src/ArenaAgent.ts L20](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L20-L20)
* `hasPlayed(uint256 _matchId, address _player) returns (bool)` - [agent/src/ArenaAgent.ts L19](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L19-L19)

**Sources:** [agent/src/ArenaAgent.ts L18-L20](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L18-L20)

---

## Frontend Match Display

### Optimized Data Fetching

The frontend uses a three-stage cascading multicall strategy to minimize RPC calls:

**Stage 1:** Fetch all match structs
[frontend/src/pages/ArenaGame.jsx L55-L62](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/pages/ArenaGame.jsx#L55-L62)

**Stage 2:** Check `hasPlayed` for active matches only (status 1 or 2)
[frontend/src/pages/ArenaGame.jsx L68-L93](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/pages/ArenaGame.jsx#L68-L93)

**Stage 3:** Fetch actual moves only for players who have moved
[frontend/src/pages/ArenaGame.jsx L104-L143](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/pages/ArenaGame.jsx#L104-L143)

This optimization reduces RPC calls from O(matches × 5) to O(matches + active_moves).

### Match State Visualization

```mermaid
flowchart TD

A["Match List Component"]
B["Match Status?"]
C["Show 'Waiting for Opponent'<br>Display wager amount"]
D["Show 'Play Move' Button<br>Enable move selection"]
E["Show Winner Badge<br>Display both moves"]
F["Show 'Cancelled' Label<br>Greyed out"]
G["hasPlayed(me)?"]
H["Active - Show Move UI"]
I["Waiting for Opponent"]
J["winner == myAddress?"]
K["Green 'YOU WON' Badge"]
L["Red 'YOU LOST' Badge"]

A -.->|"1 Accepted"| B
B -.->|"0 Proposed"| C
B -.->|"2 Completed"| D
B -.->|"3 Cancelled"| E
B -.-> F
D -.->|"false"| G
G -.->|"true"| H
G -.->|"true"| I
E -.->|"false"| J
J -.-> K
J -.-> L
```

**Sources:** [frontend/src/pages/ArenaGame.jsx L46-L680](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/pages/ArenaGame.jsx#L46-L680)

---

## Complete Lifecycle Timeline

```

```

**Typical Duration:** 30-60 seconds total (human player) | 10-20 seconds (AI vs AI)

**Bottlenecks:**

* Block confirmation times (~2-5 seconds per transaction on Monad)
* Human move selection time (variable)
* Event propagation latency (<1 second)

**Sources:** [agent/src/ArenaAgent.ts L1-L550](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L1-L550)

 [frontend/src/pages/ArenaGame.jsx L1-L850](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/pages/ArenaGame.jsx#L1-L850)