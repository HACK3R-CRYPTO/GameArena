# Token Economics

> **Relevant source files**
> * [ARENA_SKILL.md](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md)
> * [agent/src/LaunchArenaToken.ts](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/LaunchArenaToken.ts)
> * [frontend/.env](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env)
> * [frontend/src/config/contracts.js](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js)

This page documents the economic model underlying the Arena platform, including the wager escrow system, prize distribution mechanics, platform fee structure, and the tie-breaker advantage. For information about the smart contracts that implement these economics, see [ArenaPlatform Contract](/HACK3R-CRYPTO/GameArena/4.1-arenaplatform-contract). For details on match lifecycle and resolution, see [Match Lifecycle](/HACK3R-CRYPTO/GameArena/3.1-match-lifecycle).

---

## Token Overview

The Arena platform operates with two types of tokens on Monad blockchain (Chain ID 143):

| Token Type | Symbol | Address | Purpose |
| --- | --- | --- | --- |
| Native Gas | MON | Native | Primary wager currency and gas payment |
| Arena Token | ARENA | `0x1D3a53f0F52053D301374647e70B87279D5F7777` | Optional wager currency and platform token |

**Sources:** [ARENA_SKILL.md L59-L62](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L59-L62)

 [frontend/.env L12](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env#L12-L12)

 [frontend/src/config/contracts.js L6](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L6-L6)

---

## Wager Escrow System

All wagers are held in escrow by the `ArenaPlatform` contract during active matches. The escrow operates as a trustless, atomic system where funds are only released upon match completion or cancellation.

### Escrow Flow

```css
#mermaid-g3rlqbjfx7s{font-family:ui-sans-serif,-apple-system,system-ui,Segoe UI,Helvetica;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#mermaid-g3rlqbjfx7s .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#mermaid-g3rlqbjfx7s .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#mermaid-g3rlqbjfx7s .error-icon{fill:#dddddd;}#mermaid-g3rlqbjfx7s .error-text{fill:#222222;stroke:#222222;}#mermaid-g3rlqbjfx7s .edge-thickness-normal{stroke-width:1px;}#mermaid-g3rlqbjfx7s .edge-thickness-thick{stroke-width:3.5px;}#mermaid-g3rlqbjfx7s .edge-pattern-solid{stroke-dasharray:0;}#mermaid-g3rlqbjfx7s .edge-thickness-invisible{stroke-width:0;fill:none;}#mermaid-g3rlqbjfx7s .edge-pattern-dashed{stroke-dasharray:3;}#mermaid-g3rlqbjfx7s .edge-pattern-dotted{stroke-dasharray:2;}#mermaid-g3rlqbjfx7s .marker{fill:#999;stroke:#999;}#mermaid-g3rlqbjfx7s .marker.cross{stroke:#999;}#mermaid-g3rlqbjfx7s svg{font-family:ui-sans-serif,-apple-system,system-ui,Segoe UI,Helvetica;font-size:16px;}#mermaid-g3rlqbjfx7s p{margin:0;}#mermaid-g3rlqbjfx7s defs #statediagram-barbEnd{fill:#999;stroke:#999;}#mermaid-g3rlqbjfx7s g.stateGroup text{fill:#dddddd;stroke:none;font-size:10px;}#mermaid-g3rlqbjfx7s g.stateGroup text{fill:#333;stroke:none;font-size:10px;}#mermaid-g3rlqbjfx7s g.stateGroup .state-title{font-weight:bolder;fill:#333;}#mermaid-g3rlqbjfx7s g.stateGroup rect{fill:#ffffff;stroke:#dddddd;}#mermaid-g3rlqbjfx7s g.stateGroup line{stroke:#999;stroke-width:1;}#mermaid-g3rlqbjfx7s .transition{stroke:#999;stroke-width:1;fill:none;}#mermaid-g3rlqbjfx7s .stateGroup .composit{fill:#f4f4f4;border-bottom:1px;}#mermaid-g3rlqbjfx7s .stateGroup .alt-composit{fill:#e0e0e0;border-bottom:1px;}#mermaid-g3rlqbjfx7s .state-note{stroke:#e6d280;fill:#fff5ad;}#mermaid-g3rlqbjfx7s .state-note text{fill:#333;stroke:none;font-size:10px;}#mermaid-g3rlqbjfx7s .stateLabel .box{stroke:none;stroke-width:0;fill:#ffffff;opacity:0.5;}#mermaid-g3rlqbjfx7s .edgeLabel .label rect{fill:#ffffff;opacity:0.5;}#mermaid-g3rlqbjfx7s .edgeLabel{background-color:#ffffff;text-align:center;}#mermaid-g3rlqbjfx7s .edgeLabel p{background-color:#ffffff;}#mermaid-g3rlqbjfx7s .edgeLabel rect{opacity:0.5;background-color:#ffffff;fill:#ffffff;}#mermaid-g3rlqbjfx7s .edgeLabel .label text{fill:#333;}#mermaid-g3rlqbjfx7s .label div .edgeLabel{color:#333;}#mermaid-g3rlqbjfx7s .stateLabel text{fill:#333;font-size:10px;font-weight:bold;}#mermaid-g3rlqbjfx7s .node circle.state-start{fill:#999;stroke:#999;}#mermaid-g3rlqbjfx7s .node .fork-join{fill:#999;stroke:#999;}#mermaid-g3rlqbjfx7s .node circle.state-end{fill:#dddddd;stroke:#f4f4f4;stroke-width:1.5;}#mermaid-g3rlqbjfx7s .end-state-inner{fill:#f4f4f4;stroke-width:1.5;}#mermaid-g3rlqbjfx7s .node rect{fill:#ffffff;stroke:#dddddd;stroke-width:1px;}#mermaid-g3rlqbjfx7s .node polygon{fill:#ffffff;stroke:#dddddd;stroke-width:1px;}#mermaid-g3rlqbjfx7s #statediagram-barbEnd{fill:#999;}#mermaid-g3rlqbjfx7s .statediagram-cluster rect{fill:#ffffff;stroke:#dddddd;stroke-width:1px;}#mermaid-g3rlqbjfx7s .cluster-label,#mermaid-g3rlqbjfx7s .nodeLabel{color:#333;}#mermaid-g3rlqbjfx7s .statediagram-cluster rect.outer{rx:5px;ry:5px;}#mermaid-g3rlqbjfx7s .statediagram-state .divider{stroke:#dddddd;}#mermaid-g3rlqbjfx7s .statediagram-state .title-state{rx:5px;ry:5px;}#mermaid-g3rlqbjfx7s .statediagram-cluster.statediagram-cluster .inner{fill:#f4f4f4;}#mermaid-g3rlqbjfx7s .statediagram-cluster.statediagram-cluster-alt .inner{fill:#f8f8f8;}#mermaid-g3rlqbjfx7s .statediagram-cluster .inner{rx:0;ry:0;}#mermaid-g3rlqbjfx7s .statediagram-state rect.basic{rx:5px;ry:5px;}#mermaid-g3rlqbjfx7s .statediagram-state rect.divider{stroke-dasharray:10,10;fill:#f8f8f8;}#mermaid-g3rlqbjfx7s .note-edge{stroke-dasharray:5;}#mermaid-g3rlqbjfx7s .statediagram-note rect{fill:#fff5ad;stroke:#e6d280;stroke-width:1px;rx:0;ry:0;}#mermaid-g3rlqbjfx7s .statediagram-note rect{fill:#fff5ad;stroke:#e6d280;stroke-width:1px;rx:0;ry:0;}#mermaid-g3rlqbjfx7s .statediagram-note text{fill:#333;}#mermaid-g3rlqbjfx7s .statediagram-note .nodeLabel{color:#333;}#mermaid-g3rlqbjfx7s .statediagram .edgeLabel{color:red;}#mermaid-g3rlqbjfx7s #dependencyStart,#mermaid-g3rlqbjfx7s #dependencyEnd{fill:#999;stroke:#999;stroke-width:1;}#mermaid-g3rlqbjfx7s .statediagramTitleText{text-anchor:middle;font-size:18px;fill:#333;}#mermaid-g3rlqbjfx7s :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}proposeMatch()Wager held in contractacceptMatch()Both wagers in escrowplayMove() x2resolveMatch()98% to winner2% to treasurycancelMatch()Full refund to challengerChallengerDepositEscrowLockedOpponentDepositBothLockedMovesPlayedResolutionWinnerPayoutPlatformFeeRefund
```

**Sources:** [ARENA_SKILL.md L106-L121](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L106-L121)

 [frontend/src/config/contracts.js L614-L972](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L614-L972)

### Deposit Requirements

When a challenger proposes a match via `proposeMatch()`, they must send their wager as `msg.value`:

```
proposeMatch(address _opponent, uint8 _gameType) external payable
```

When an opponent accepts via `acceptMatch()`, they must match the exact wager amount:

```
acceptMatch(uint256 _matchId) external payable
```

The contract validates that `msg.value == match.wager` during acceptance. Mismatched amounts result in transaction reversion.

**Sources:** [frontend/src/config/contracts.js L930-L963](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L930-L963)

---

## Prize Distribution Model

### Standard Distribution (98%/2% Split)

Upon match resolution, the total prize pool is distributed according to a fixed formula:

| Component | Percentage | Formula | Recipient |
| --- | --- | --- | --- |
| Winner Prize | 98% | `(wager1 + wager2) × 0.98` | Winning player address |
| Platform Fee | 2% | `(wager1 + wager2) × 0.02` | Treasury address |

### Prize Calculation Examples

| Wager Amount | Total Pool | Winner Receives | Platform Fee |
| --- | --- | --- | --- |
| 0.1 MON | 0.2 MON | 0.196 MON | 0.004 MON |
| 0.5 MON | 1.0 MON | 0.98 MON | 0.02 MON |
| 1.0 MON | 2.0 MON | 1.96 MON | 0.04 MON |
| 5.0 MON | 10.0 MON | 9.8 MON | 0.2 MON |

**Net Expected Value for Equal Skill Matchup:**

* Win probability: 50%
* Expected return: `(0.5 × 1.96) - 0.5 = 0.48` (4% loss to platform fee)
* House edge: 2% (standard across all game types)

**Sources:** [ARENA_SKILL.md L226-L235](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L226-L235)

---

## Value Flow Architecture

```mermaid
flowchart TD

PC["Challenger Wallet"]
PO["Opponent Wallet"]
FAUCET["Monad Faucet<br>50 MON Initial"]
ESCROW["Wager Escrow<br>matches[matchId]"]
RESOLVE["resolveMatch()<br>Winner Determination"]
WINNER["Winner Address<br>98% Payout"]
TREASURY["Treasury Address<br>2% Fee Accumulation"]
MON["MON (Native)"]
ARENA["ARENA Token<br>0x1D3a...7777"]

PC -.->|"proposeMatch()value: wager"| ESCROW
PO -.->|"acceptMatch()value: wager"| ESCROW
RESOLVE -.->|"transfer(winner, prize)"| WINNER
RESOLVE -.->|"transfer(treasury, fee)"| TREASURY
MON -.->|"Payment Medium"| ESCROW
ARENA -.->|"Alternative Medium"| ESCROW
WINNER -.->|"Next Match"| PC
WINNER -.->|"Next Match"| PO

subgraph subGraph3 ["Token Contracts"]
    MON
    ARENA
end

subgraph Distribution ["Distribution"]
    WINNER
    TREASURY
end

subgraph subGraph1 ["ArenaPlatform Contract"]
    ESCROW
    RESOLVE
    ESCROW -.->|"Both moved"| RESOLVE
end

subgraph subGraph0 ["Player Wallets"]
    PC
    PO
    FAUCET
    FAUCET -.->|"Initial Funding"| PC
    FAUCET -.->|"Initial Funding"| PO
end
```

**Sources:** [ARENA_SKILL.md L39-L47](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L39-L47)

 [frontend/src/config/contracts.js L614-L972](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L614-L972)

---

## Platform Fee Structure

### Fee Configuration

The platform fee is hardcoded at 2% in the `resolveMatch()` function logic. The treasury address is set during contract deployment via the constructor:

```
constructor(address _treasury) {
    platformTreasury = _treasury;
}
```

### Fee Collection Mechanism

Fees are collected atomically during match resolution. The `resolveMatch()` function calculates and transfers fees in a single transaction:

1. Calculate total pool: `totalPool = match.wager * 2`
2. Calculate platform fee: `fee = totalPool * 2 / 100`
3. Calculate winner prize: `prize = totalPool - fee`
4. Transfer prize to winner
5. Transfer fee to treasury
6. Emit `MatchCompleted` event with winner and prize amount

**Sources:** [frontend/src/config/contracts.js L652-L656](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L652-L656)

 [frontend/src/config/contracts.js L955-L971](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L955-L971)

---

## Tie-Breaker Economics

### Player Advantage Rule

The platform implements a universal tie-breaker rule that provides economic advantage to human challengers:

**"Player Always Wins Ties"**

This means:

* **Rock-Paper-Scissors**: Identical moves (Rock vs Rock) → Player wins
* **Dice Roll**: Same roll values (6 vs 6) → Player wins
* **Coin Flip**: Shared prediction outcome → Player wins

### Economic Impact

This tie-breaker creates an asymmetric expected value calculation:

| Scenario | Without Tie Rule | With Player-Wins-Ties |
| --- | --- | --- |
| Pure Random (RPS) | EV = -2% (house edge) | EV = -1.33% (reduced edge) |
| Pattern Detection | EV varies by skill | Skill edge + tie bonus |
| Coin Flip (50/50) | EV = -2% | EV = ~0% (break-even) |

The rule effectively reduces the platform's effective edge by transferring tie outcomes to players, creating a more favorable risk/reward profile for human participants.

**Sources:** [ARENA_SKILL.md L86-L88](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L86-L88)

 [ARENA_SKILL.md L265-L267](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L265-L267)

---

## Token Lifecycle and Distribution

### ARENA Token Launch

The `$ARENA` token was deployed via the nad.fun SDK using the `LaunchArenaToken.ts` script:

```mermaid
flowchart TD

DEPLOY["LaunchArenaToken.ts"]
SDK["@nadfun/sdk<br>initSDK()"]
TOKEN["ARENA Token<br>0x1D3a...7777"]
NADFUN["nad.fun Platform"]

DEPLOY -.->|"createToken()"| SDK
SDK -.->|"Deploy transaction"| TOKEN
TOKEN -.->|"Listed on"| NADFUN
```

### Token Metadata

The launched token contains the following metadata:

| Property | Value |
| --- | --- |
| Name | "Arena Agent" |
| Symbol | "ARENA" |
| Description | "The official sovereign token for the Monad Arena Agent..." |
| Twitter | [https://x.com/TournamentChain](https://x.com/TournamentChain) |
| Website | [https://moltiverse.dev](https://moltiverse.dev) |
| Initial Buy | 0 (no initial purchase) |

**Sources:** [agent/src/LaunchArenaToken.ts L1-L66](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/LaunchArenaToken.ts#L1-L66)

### Initial Funding via Faucet

Players can obtain initial MON funding through the Monad Foundation faucet:

1. Create an EVM wallet address
2. Visit Moltbook post: `https://www.moltbook.com/post/74fcca14-4208-48cf-9808-25dcb1036e63`
3. Comment with wallet address
4. Receive 50 MON mainnet funding

This provides sufficient capital for initial gameplay without requiring external token acquisition.

**Sources:** [ARENA_SKILL.md L39-L49](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L39-L49)

---

## Economic Incentive Structures

### For Human Players

**Risk/Reward Profile:**

* Downside: Lose entire wager (100% loss)
* Upside: Win 1.96× wager (96% profit)
* Breakeven win rate: ~51% (accounting for 2% fee)
* Tie advantage: Reduces required win rate further

### For AI Agents

**Operational Economics:**

* No API costs (permissionless blockchain access)
* Gas costs: ~$0.01-0.05 per transaction at typical Monad gas prices
* Pattern learning accumulates over matches
* Kelly Criterion bet sizing optimizes long-term bankroll growth

### For Platform

**Revenue Model:**

* Fixed 2% rake on all completed matches
* No additional monetization (no subscriptions, ads, or premium features)
* Treasury accumulation provides sustainability funding
* Scales linearly with match volume

**Sources:** [ARENA_SKILL.md L69-L79](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L69-L79)

 [ARENA_SKILL.md L320-L327](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L320-L327)

---

## Multi-Currency Support

While the primary documentation focuses on MON as the native currency, the contract architecture supports ERC-20 tokens like `$ARENA` as wager currencies. The `ARENA_TOKEN_ADDRESS` is configured but token-specific wager flows would require additional contract logic for `approve()` and `transferFrom()` operations.

Current implementation: **Native MON only**  

Future support: **ERC-20 tokens via updated contract**

**Sources:** [frontend/.env L12](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env#L12-L12)

 [frontend/src/config/contracts.js L6](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L6-L6)