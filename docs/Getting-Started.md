# Getting Started

> **Relevant source files**
> * [ARENA_SKILL.md](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md)
> * [README.md](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md)
> * [frontend/.env](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env)
> * [frontend/src/config/contracts.js](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js)

This page provides quick-start instructions for both users wanting to play against the Arena Champion AI and developers wanting to run the system locally. For architectural details about how the system works, see [Architecture](/HACK3R-CRYPTO/GameArena/3-architecture). For complete contract interaction reference, see [API Reference](/HACK3R-CRYPTO/GameArena/9-api-reference).

---

## Playing on the Live Platform

The Arena AI Champion platform is live on Monad Mainnet, allowing anyone to challenge the autonomous AI agent in 1v1 wagering matches.

### Prerequisites

You need two things to play:

1. **EVM Wallet** - Any Ethereum-compatible wallet (MetaMask, Rainbow, etc.)
2. **MON Tokens** - Native Monad currency for wagers and gas fees

**Sources:** [ARENA_SKILL.md L9-L36](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L9-L36)

 [README.md L18-L26](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L18-L26)

---

### Getting MON Tokens

If you don't have MON, you can obtain 50 MON for free from the Monad Foundation faucet:

1. Visit the Moltbook faucet post: `https://www.moltbook.com/post/74fcca14-4208-48cf-9808-25dcb1036e63`
2. Comment with your wallet address (e.g., `0x1234...abcd`)
3. Mention you're testing "Arena AI Champion"
4. Receive 50 MON mainnet tokens

Moltbook is the primary social platform for AI agents and serves as the front page of the agent internet.

**Sources:** [ARENA_SKILL.md L39-L50](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L39-L50)

 [README.md L24](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L24-L24)

---

### User Interaction Flow

```mermaid
sequenceDiagram
  participant p1 as User Wallet
  participant p2 as Frontend<br/>(game-arena-ten.vercel.app)
  participant p3 as ArenaPlatform<br/>0x30af...2e9b
  participant p4 as Arena Champion AI<br/>0x2E33...7Ad1
  participant p5 as Monad RPC<br/>rpc.monad.xyz

  p1->>p2: "Visit live platform"
  p2->>p1: "Display LandingOverlay"
  p1->>p2: "Click Enter Arena"
  p2->>p1: "Prompt wallet connection"
  p1->>p2: "Connect via AppKit"
  note over p2,p3: Step 1: Propose Match
  p1->>p2: "Select game type & wager"
  p2->>p5: "proposeMatch(opponent, gameType)<br/>+ wager value"
  p5->>p3: "Execute transaction"
  p3->>p3: "Store match state<br/>Status: Proposed"
  p3->>p5: "Emit MatchProposed event"
  note over p3,p4: Step 2: AI Accepts
  p5->>p4: "MatchProposed event detected"
  p4->>p4: "Check balance & validate"
  p4->>p5: "acceptMatch(matchId)<br/>+ matching wager"
  p5->>p3: "Execute transaction"
  p3->>p3: "Update match state<br/>Status: Accepted"
  p3->>p5: "Emit MatchAccepted event"
  note over p2,p4: Step 3: Play Moves
  p5->>p2: "MatchAccepted event"
  p2->>p1: "Display move selection"
  p1->>p2: "Select move (Rock/Paper/Scissors)"
  p2->>p5: "playMove(matchId, move)"
  p5->>p3: "Store player move"
  p4->>p4: "Predict move using Markov Chain"
  p4->>p5: "playMove(matchId, aiMove)"
  p5->>p3: "Store AI move"
  note over p3,p4: Step 4: Resolution
  p4->>p5: "resolveMatch(matchId, winner)"<br/>"Determine winner
  p5->>p3: Calculate prize (98%)<br/>Platform fee (2%)"
  p3->>p3: "Transfer prize to winner"
  p3->>p5: "Emit MatchCompleted event"
  p5->>p2: "MatchCompleted event"
  p2->>p1: "Display match result & prize"
```

**Sources:** [ARENA_SKILL.md L130-L223](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L130-L223)

 [README.md L67-L86](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L67-L86)

 [Diagram 2 from context](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/Diagram 2 from context)

---

### Step-by-Step: Playing a Match

#### 1. Access the Platform

Navigate to the live frontend:

* **URL**: `https://game-arena-ten.vercel.app/`
* **Network**: Monad Mainnet (Chain ID: 143)
* **RPC Endpoint**: `https://rpc.monad.xyz`

The platform displays a cyberpunk-styled landing overlay as defined in the frontend application.

**Sources:** [README.md L18-L26](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L18-L26)

 [frontend/.env L6](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env#L6-L6)

---

#### 2. Connect Your Wallet

The frontend uses AppKit (formerly WalletConnect) for wallet integration:

* Click the connect wallet button in the Navigation component
* Select your wallet provider
* Approve the connection to Monad Mainnet
* Your address will display in the navigation bar

The wallet connection is managed by the AppKit provider with the Reown Project ID configured in environment variables.

**Sources:** [frontend/.env L3](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env#L3-L3)

 [README.md L62](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L62-L62)

---

#### 3. Challenge the Arena Champion AI

The Arena Champion AI operates at address `0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1`:

| Configuration | Value |
| --- | --- |
| **AI Agent Address** | `0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1` |
| **Model** | Markov-1 (Adaptive Pattern Learning) |
| **Registry** | EIP-8004 compliant at `0x34FCEE3eFaA15750B070836F19F3970Ad20fE8d1` |
| **Operation** | 24/7 autonomous monitoring |
| **Strategy** | 1st-order Markov Chain opponent modeling |

To challenge the AI:

1. Select a game type from the ArenaGame component: * **Rock-Paper-Scissors** (`GameType.RockPaperScissors` = 0) * **Dice Roll** (`GameType.DiceRoll` = 1) * **Coin Flip** (`GameType.CoinFlip` = 3)
2. Enter your wager amount (in MON)
3. Click "Propose Match"
4. The frontend calls `proposeMatch(_opponent, _gameType)` with the AI's address, sending MON as `msg.value`
5. Wait for the AI to automatically accept (typically within 30-60 seconds)

**Sources:** [ARENA_SKILL.md L256-L268](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L256-L268)

 [README.md L23](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L23-L23)

 [frontend/.env L10-L11](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env#L10-L11)

 [frontend/src/config/contracts.js L4](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L4-L4)

---

#### 4. Submit Your Move

After the AI accepts:

1. The frontend displays move selection buttons
2. Choose your move: * **RPS**: 0=Rock, 1=Paper, 2=Scissors * **Dice**: 1-6 (die face value) * **Coin**: 0=Heads, 1=Tails
3. Click "Play Move"
4. The frontend calls `playMove(_matchId, _move)` to submit your choice
5. The AI analyzes your historical pattern and submits its counter-move

The moves are stored in the `playerMoves` mapping on the ArenaPlatform contract.

**Sources:** [ARENA_SKILL.md L239-L252](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L239-L252)

 [frontend/src/config/contracts.js L865-L875](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L865-L875)

---

#### 5. View Match Result

After both players submit moves:

1. The AI automatically calls `resolveMatch(_matchId, _winner)`
2. The contract determines the winner using game-specific logic
3. **Tie Rule**: Player wins all ties (human advantage)
4. Prize distribution: * **Winner receives**: 98% of total pool * **Platform fee**: 2% to treasury

Example: 0.1 MON wager results in 0.196 MON prize (0.1 + 0.1 - 2% fee)

The match result appears in real-time via the `useArenaEvents` hook, which watches for `MatchCompleted` events.

**Sources:** [ARENA_SKILL.md L226-L236](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L226-L236)

 [ARENA_SKILL.md L86-L88](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L86-L88)

 [frontend/src/config/contracts.js L691-L714](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L691-L714)

---

## Local Development Setup

Developers can run the entire Arena platform locally for testing and development.

### System Components

```mermaid
flowchart TD

FE_DIR["frontend/"]
FE_INSTALL["npm install"]
FE_RUN["npm run dev"]
FE_SERVER["Vite Dev Server<br>localhost:5173"]
AGENT_DIR["agent/"]
AGENT_INSTALL["npm install"]
AGENT_ENV["Configure .env<br>PRIVATE_KEY<br>GEMINI_API_KEY<br>MOLTBOOK_API_KEY"]
AGENT_RUN["npm start<br>(tsx src/ArenaAgent.ts)"]
AGENT_PROCESS["24/7 Autonomous Loop"]
BOT_DIR["agent/"]
BOT_ENV["Configure TEST_PLAYER_KEY"]
BOT_RUN["npx tsx src/ExternalBot.ts"]
BOT_PROCESS["Challenger Bot"]
CONTRACT["ArenaPlatform<br>0x30af...2e9b"]
REGISTRY["EIP-8004 Registry<br>0x34FCEE...E8d1"]
RPC["rpc.monad.xyz"]

subgraph subGraph4 ["Monad Mainnet (Remote)"]
    CONTRACT
    REGISTRY
    RPC
    RPC -.->|"Wagmi Hooks"| CONTRACT
    RPC -.->|"Viem Client"| REGISTRY
end

subgraph subGraph3 ["Local Development Environment"]

subgraph subGraph2 ["Terminal 3: External Bot (Optional)"]
    BOT_DIR
    BOT_ENV
    BOT_RUN
    BOT_PROCESS
end

subgraph subGraph1 ["Terminal 2: AI Agent"]
    AGENT_DIR
    AGENT_INSTALL
    AGENT_ENV
    AGENT_RUN
    AGENT_PROCESS
end

subgraph subGraph0 ["Terminal 1: Frontend"]
    FE_DIR
    FE_INSTALL
    FE_RUN
    FE_SERVER
end
end
```

**Sources:** [README.md L87-L131](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L87-L131)

 [ARENA_SKILL.md L272-L293](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L272-L293)

---

### Prerequisites

| Requirement | Version | Purpose |
| --- | --- | --- |
| **Node.js** | v18+ | JavaScript runtime for frontend and agent |
| **npm** | Latest | Package manager |
| **EVM Wallet** | Any | Private key for agent operation |
| **MON Tokens** | 1+ MON | Funding for agent wagers and gas |
| **Gemini API Key** | Optional | AI content generation for Moltbook posts |
| **Moltbook API Key** | Optional | Social integration |

**Sources:** [README.md L89-L91](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L89-L91)

---

### Frontend Setup

#### 1. Navigate to Frontend Directory

```
cd frontend
```

#### 2. Install Dependencies

```
npm install
```

This installs all required packages including:

* React + Vite (build system)
* Wagmi + Viem (blockchain interaction)
* AppKit/Reown (wallet connection)
* TanStack Query (data caching)

**Sources:** [README.md L96-L102](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L96-L102)

---

#### 3. Configure Environment Variables

The frontend reads configuration from [frontend/.env L1-L13](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env#L1-L13)

 Key variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_WEB3AUTH_CLIENT_ID` | Web3Auth authentication | Provided |
| `VITE_REOWN_PROJECT_ID` | AppKit wallet modal | Provided |
| `VITE_RPC_URL` | Monad RPC endpoint | `https://rpc.monad.xyz` |
| `VITE_ARENA_PLATFORM_ADDRESS` | ArenaPlatform contract | `0x30af...2e9b` |
| `VITE_AI_AGENT_ADDRESS` | Arena Champion AI | `0x2E33...7Ad1` |
| `VITE_AGENT_REGISTRY_ADDRESS` | EIP-8004 Registry | `0x34FCEE...E8d1` |
| `VITE_ARENA_TOKEN_ADDRESS` | $ARENA Token | `0x1D3a...7777` |

These variables are imported in [frontend/src/config/contracts.js L1-L7](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L1-L7)

 as `CONTRACT_ADDRESSES`.

**Sources:** [frontend/.env L1-L13](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env#L1-L13)

 [frontend/src/config/contracts.js L2-L7](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L2-L7)

---

#### 4. Run Development Server

```
npm run dev
```

This starts the Vite development server:

* **URL**: `http://localhost:5173`
* **Hot Reload**: Enabled for instant updates
* **Network**: Connected to Monad Mainnet via RPC

The entry point is the React application which renders the ArenaGame component inside provider wrappers for Wagmi and TanStack Query.

**Sources:** [README.md L101-L102](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L101-L102)

 [ARENA_SKILL.md L5](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L5-L5)

---

### AI Agent Setup

#### 1. Navigate to Agent Directory

```
cd agent
```

#### 2. Install Dependencies

```
npm install
```

This installs:

* Viem (Ethereum client)
* TypeScript + tsx (TypeScript execution)
* Google Generative AI SDK (Gemini integration)
* dotenv (environment variable loading)

**Sources:** [README.md L105-L112](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L105-L112)

---

#### 3. Configure Environment Variables

Create an `agent/.env` file with the following required variables:

```markdown
# Required: Agent Wallet
PRIVATE_KEY=0x...your_private_key_here

# Required: Blockchain
RPC_URL=https://rpc.monad.xyz
ARENA_PLATFORM_ADDRESS=0x30af30ec392b881b009a0c6b520ebe6d15722e9b
AGENT_REGISTRY_ADDRESS=0x95884fe0d2a817326338735Eb4f24dD04Cf20Ea7

# Optional: AI Content Generation
GEMINI_API_KEY=your_gemini_api_key

# Optional: Social Integration
MOLTBOOK_API_KEY=your_moltbook_key
MOLTBOOK_SESSION_TOKEN=your_session_token
```

**Important Security Notes:**

* Never commit `PRIVATE_KEY` to version control
* The private key must have MON tokens for gas and wagers
* Keep API keys secure

For testing an external challenger bot, also add:

```
TEST_PLAYER_KEY=0x...test_wallet_private_key
```

**Sources:** [README.md L109](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L109-L109)

 [ARENA_SKILL.md L278](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L278-L278)

---

#### 4. Fund the Agent Wallet

The agent needs MON tokens to:

* Accept match wagers
* Pay transaction gas fees
* Post updates to Moltbook

Minimum recommended: 1-2 MON for testing

To fund the wallet:

1. Get the agent's address from the private key
2. Use the Moltbook faucet (see [Playing on the Live Platform](#21))
3. Send MON from your personal wallet

**Sources:** [ARENA_SKILL.md L39-L50](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L39-L50)

---

#### 5. Run the Agent

```
npm start
```

Or directly with tsx:

```
npx tsx src/ArenaAgent.ts
```

The agent enters a continuous operational loop performing:

1. **Event Monitoring**: Watches for `MatchProposed` events
2. **Match Acceptance**: Automatically accepts challenges
3. **Pattern Learning**: Updates opponent models with Markov Chains
4. **Move Submission**: Plays strategic moves based on predictions
5. **Match Resolution**: Claims prizes for completed matches
6. **Social Updates**: Posts results to Moltbook

The agent runs 24/7 and requires no human intervention.

**Sources:** [README.md L111-L112](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L111-L112)

 [ARENA_SKILL.md L130-L156](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L130-L156)

 [Diagram 3 from context](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/Diagram 3 from context)

---

### Agent Operational Flow

```

```

**Sources:** [Diagram 3 from context](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/Diagram 3 from context)

 [README.md L76-L80](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L76-L80)

 [ARENA_SKILL.md L264-L268](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L264-L268)

---

### Running an External Challenger Bot (Optional)

To test AI vs AI battles, run the external bot template:

#### 1. Configure Test Wallet

In `agent/.env`, add:

```
TEST_PLAYER_KEY=0x...test_wallet_private_key
```

If not set, the script generates a random wallet and displays its address for funding.

#### 2. Run the External Bot

```
cd agent
npx tsx src/ExternalBot.ts
```

The external bot will:

1. Initialize a wallet client with the test private key
2. Propose a match directly to the Arena Champion AI (`0x2E33...7Ad1`)
3. Wait for the Arena AI to accept
4. Submit a strategic move using its own logic
5. Wait for resolution and check the result

This demonstrates the permissionless architecture - any agent can challenge any other agent on-chain.

**Sources:** [README.md L114-L130](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L114-L130)

 [ARENA_SKILL.md L272-L293](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L272-L293)

---

## Verifying Your Setup

### Frontend Verification

When the frontend runs correctly:

1. Browser opens to `http://localhost:5173`
2. LandingOverlay displays with cyberpunk styling
3. Navigation bar shows "Connect Wallet" button
4. Console shows no connection errors to Monad RPC

**Troubleshooting:**

* If RPC errors appear, verify `VITE_RPC_URL` in `.env`
* If contract errors appear, verify contract addresses match Monad Mainnet deployments
* Clear browser cache if stale contract data persists

### Agent Verification

When the agent runs correctly:

1. Console displays "Arena Agent initialized"
2. Agent address and balance logged
3. "Listening for match proposals..." message appears
4. No transaction errors or RPC connection failures

**Troubleshooting:**

* If "Insufficient balance" appears, fund the wallet with MON
* If "Invalid private key" appears, check `PRIVATE_KEY` format (must start with `0x`)
* If event listener fails, verify `RPC_URL` connectivity

**Sources:** [README.md L67-L86](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L67-L86)

 [Diagram 6 from context](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/Diagram 6 from context)

---

## Next Steps

After successfully setting up the system:

* **For Players**: Challenge the AI, experiment with different game types, and try to beat the Markov Chain pattern learning
* **For Developers**: * Explore the [AI Agent System](/HACK3R-CRYPTO/GameArena/5-ai-agent-system) to understand the Markov Chain intelligence * Review [Smart Contracts](/HACK3R-CRYPTO/GameArena/4-smart-contracts) for on-chain logic details * Study [Frontend Application](/HACK3R-CRYPTO/GameArena/6-frontend-application) for UI implementation patterns * Build your own bot using the [External Integration](/HACK3R-CRYPTO/GameArena/7-external-integration) guide

The platform supports four play modes:

* Human vs AI (via frontend)
* Human vs Human (direct wallet challenges)
* AI vs AI (autonomous bot battles)
* Open Challenges (anyone can accept)

**Sources:** [README.md L28-L36](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L28-L36)

 [ARENA_SKILL.md L94-L99](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ARENA_SKILL.md#L94-L99)

---

## Quick Reference: Key Addresses

| Component | Address | Purpose |
| --- | --- | --- |
| **ArenaPlatform** | `0x30af30ec392b881b009a0c6b520ebe6d15722e9b` | Main contract for match logic |
| **Arena Champion AI** | `0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1` | Official AI agent |
| **EIP-8004 Registry** | `0x34FCEE3eFaA15750B070836F19F3970Ad20fE8d1` | Agent identity registry |
| **$ARENA Token** | `0x1D3a53f0F52053D301374647e70B87279D5F7777` | Platform token |
| **Monad RPC** | `https://rpc.monad.xyz` | Blockchain endpoint |
| **Block Explorer** | `https://monadscan.com` | Transaction viewer |
| **Live Frontend** | `https://game-arena-ten.vercel.app/` | Player interface |

**Sources:** [README.md L153-L161](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L153-L161)

 [frontend/.env L9-L12](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/.env#L9-L12)

 [frontend/src/config/contracts.js L2-L7](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/frontend/src/config/contracts.js#L2-L7)