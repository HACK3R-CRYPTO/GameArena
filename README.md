# ⚔️ Arena AI Champion: The First Autonomous Gaming Agent on Monad

[![Monad Testnet](https://img.shields.io/badge/Network-Monad%20Testnet-blueviolet)](https://monad.xyz/)
[![Agent Track](https://img.shields.io/badge/Moltiverse%20Hackathon-Agent%2BToken%20Track-blue)](https://nad.fun/)
[![EIP-8004](https://img.shields.io/badge/Standard-EIP--8004-green)](https://github.com/ethereum/EIPs/pull/8004)

**Arena AI Champion** is a fully autonomous AI gaming agent built for the Monad ecosystem. It allows players to engage in high-stakes, 1v1 strategic matches against an AI that adapts to their gameplay in real-time. Powered by a 1st-order Markov Chain model, the agent learns your patterns to gain a competitive edge while operating entirely on-chain.

---

## 🚀 Experience the Arena

- **🌐 Live Frontend:** [https://game-arena-ten.vercel.app/](https://game-arena-ten.vercel.app/)
- **🤖 Live AI Agent:** [https://gamearena-production.up.railway.app](https://gamearena-production.up.railway.app)
- **🎮 Play Now (Local):** `cd frontend && npm run dev`
- **🤖 Agent Address:** `0xa91D5A0a64ED5eeF11c4359C4631279695A338ef`
- **💎 $ARENA Token:** [Trade on nad.fun](https://nad.fun/token/0x1D3a53f0F52053D301374647e70B87279D5F7777)
- **🔍 Explorer:** [View Platform on Monad Vision](https://monadvision.com/address/0x7820903fC53197Ce02bDf9785AC04dd8e891BBb7)

---

## 🎲 Game Modes

Challenge the AI in four balanced gaming categories:

1.  **✊ Rock-Paper-Scissors**: Advanced pattern recognition battle.
2.  **🎲 Dice Roll**: High-stakes numerical prediction.
3.  **⚔️ Strategy Battle**: Tactical selection from 0-9.
4.  **🪙 Coin Flip**: Pure prediction vs internal probability models.

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

## 📦 Getting Started

### 1. Requirements
- Node.js (v18+)
- Metamask (configured for Monad Testnet)

### 2. Startup
```bash
# Clone the repository
git clone https://github.com/HACK3R-CRYPTO/GameArena.git
cd GameArena

# Install dependencies
npm install
cd frontend && npm install
cd ../agent && npm install

# Start the services
npm run dev # Launches frontend
npm start # Launches AI Agent (requires .env cleanup)
```

---

## 📜 Deployed Contracts (Monad Testnet)

| Contract | Address |
| :--- | :--- |
| **Arena AI Platform** | `0x7820903fC53197Ce02bDf9785AC04dd8e891BBb7` |
| **Arena AI Agent** | `0xa91D5A0a64ED5eeF11c4359C4631279695A338ef` |
| **$ARENA Token** | `0x1D3a53f0F52053D301374647e70B87279D5F7777` |
| **Agent Registry** | `0x95884fe0d2a817326338735Eb4f24dD04Cf20Ea7` |

---

## 🤝 Community & Contact

- **Twitter/X**: [@HACK3R_CRYPTO](https://x.com/HACK3R_CRYPTO)
- **GitHub**: [HACK3R-CRYPTO](https://github.com/HACK3R-CRYPTO)

---

**Built with ❤️ for the Moltiverse Hackathon by Solo Developer.**

