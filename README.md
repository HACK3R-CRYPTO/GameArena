# ⚔️ Arena Agent (Cyberpunk Edition)

> **"Where Probability Meets Neon."**
> A fully autonomous, AI-driven gaming agent deployed on **Monad Testnet**.  
> Challenge the AI in Rock-Paper-Scissors, Dice Roll, or Coin Flip and win $MON.

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Monad](https://img.shields.io/badge/Network-Monad_Testnet-purple.svg) ![Status](https://img.shields.io/badge/Status-Live-green.svg)

## 🌟 Key Features
- **🤖 Autonomous AI Agent**: Uses Markov Chain transitions to model opponent behavior and predict moves.
- **🎨 Cyberpunk Glass UI**: A premium, responsive interface featuring neon glassmorphism, animated grids, and real-time feeds.
- **⚡ Ultra-Fast UX**: Built on `multicall3` for batch data fetching, ensuring instant load times and live updates.
- **🛡️ EIP-8004 Architecture**: Fully compliant with intelligent agent standards for on-chain registration and verification.

---

## 🚀 Experience the Arena

- **🌐 Live Frontend:** [https://game-arena-ten.vercel.app/](https://game-arena-ten.vercel.app/)
- **🤖 Live AI Agent:** [https://gamearena-production.up.railway.app](https://gamearena-production.up.railway.app)
- **🎮 Play Now (Local):** `cd frontend && npm run dev`
- **🤖 Agent Address:** `0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1`
- **💎 $ARENA Token:** [Trade on nad.fun](https://nad.fun/token/0x1D3a53f0F52053D301374647e70B87279D5F7777)
- **🔍 Explorer:** [View Platform on Monad Vision](https://monadscan.com/address/0x30af30ec392b881b009a0c6b520ebe6d15722e9b)

---

## 🎲 Game Modes

Challenge the AI in three balanced gaming categories:

1.  **✊ Rock-Paper-Scissors**: Advanced pattern recognition battle.
2.  **🎲 Dice Roll**: High-stakes numerical prediction.
3.  **🪙 Coin Flip**: Pure prediction vs internal probability models.

*Note: The Arena handles tie-breakers with a "Player Wins Ties" fairness rule.*

---

## 🧠 Autonomous AI Technology

### Adaptive Strategy (Markov Chain)
The agent utilizes a **1st-order Markov Chain** to model opponent behavior. By tracking the transitions between your previous moves, the AI calculates the probability of your future actions and adapts its strategy accordingly.

### EIP-8004 On-Chain Identity
The agent is fully compliant with **EIP-8004**, providing verifiable metadata and model details directly via the **Agent Registry** contract.

### 24/7 Monitoring
The agent operates a continuous autonomous loop, monitoring the Monad blockchain for proposals and move events to ensure seamless match resolution without human intervention.

---

## 🏢 Technical Architecture

- **Smart Contracts**: Solidity (Foundry)
  - `ArenaPlatform.sol`: Escrow, wagering logic, and match arbitration.
  - `AgentRegistry.sol`: On-chain identity and metadata (EIP-8004).
- **AI Agent**: Node.js + Viem
  - Real-time event indexing.
  - Markov transition modeling.
  - Automated transactional responses.
- **Frontend**: React + Vite + Tailwind CSS
  - AppKit/Reown integration for a seamless wallet experience.
  - Real-time match history and event tracking.

---

## 🏗️ How it Works

The project uses a **Hybrid Architecture** combining on-chain security with off-chain AI logic:

1.  **Smart Contract (`ArenaPlatform.sol`)**:
    -   Holds the funds (wagers) in escrow.
    -   Records game state (players, moves, status).
    -   Releases payouts only when a valid winner is declared.

2.  **AI Agent (`ArenaAgent.ts`)**:
    -   Listens to `MatchProposed` events.
    -   Analyzes opponent history using a **Markov Chain Model**.
    -   Submits its move on-chain (`playMove`).
    -   If it wins, it claims the prize (`resolveMatch`).

3.  **Frontend (React + Wagmi)**:
    -   Directly interacts with the contract.
    -   Uses **Optimistic UI** and **Event Listening** to update instantly.
    -   Fetches moves from both **Contract State** (fast) and **Event Logs** (fallback) to ensure data is always visible.

## 📦 Getting Started

### 1. Requirements
- Node.js (v18+)
- Metamask (configured for Monad Testnet)

### 2. Startup Guide

#### A. Frontend (Player Mode)
To play as a human against the AI:
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

#### B. AI Agent (Operator Mode)
To run the autonomous host Agent (The "Boss"):
```bash
cd agent
npm install
# Create .env with PRIVATE_KEY=...
npm start
```
*The Agent will automatically listen for matches and respond using its Markov Model.*

#### C. AI Challenging AI (Developer Mode) 🤖⚔️🤖
Want to pit your own AI against ours? You can run the `ExternalBot` script.
This script is a reference implementation of a challenger bot.

1. Configure your Challenger Wallet in `agent/.env` (or let it generate a random one).
2. Run the bot:
```bash
cd agent
npx ts-node src/ExternalBot.ts
```
The bot will:
- Fund itself (if using a testnet faucet logic or existing funds).
- **Propose a Match** on-chain.
- Wait for the Arena Agent to accept.
- **Submit a Strategic Move**.
- Wait for resolution and claim prizes.

---

## 🏗️ Architecture

```mermaid
graph TD
    User[Human Player] -->|1. Propose Match| Contract[ArenaPlatform Contract]
    ExtBot[External AI Bot] -->|1. Propose Match| Contract
    
    Contract -->|Event: MatchProposed| Agent[Arena AI Agent]
    
    Agent -->|2. Analyze & Accept| Contract
    
    User -->|3. Reveal Move| Contract
    ExtBot -->|3. Reveal Move| Contract
    Agent -->|3. Reveal Move| Contract
    
    Contract -->|4. Resolve & Payout| Winner[Winner Wallet]
```

---

## 📜 Deployed Contracts (Monad Mainnet)

| Contract | Address |
| :--- | :--- |
| **Arena AI Platform** | `0x30af30ec392b881b009a0c6b520ebe6d15722e9b` |
| **Arena AI Agent** | `0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1` |
| **$ARENA Token** | `0x1D3a53f0F52053D301374647e70B87279D5F7777` |
| **Agent Registry** | `0x95884fe0d2a817326338735Eb4f24dD04Cf20Ea7` |

---

## 🤝 Community & Contact

- **Twitter/X**: [@HACK3R_CRYPTO](https://x.com/HACK3R_CRYPTO)
- **GitHub**: [HACK3R-CRYPTO](https://github.com/HACK3R-CRYPTO)

---

**Built with ❤️ for the Moltiverse Hackathon by Solo Developer.**

