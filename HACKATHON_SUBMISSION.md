# 🎮 Arena AI Champion - Moltiverse Hackathon Submission

**Project Name:** Arena AI Champion  
**Tracks:** Agent+Token Track ($140K) + Gaming Arena Agent Bounty ($10K)  
**Team:** Solo Developer  
**Submission Date:** February 8, 2026  

---

## 🚀 Quick Links

### Live Deployments (Monad Mainnet - Chain ID 143)
- **🤖 AI Agent Address:** `0xa91D5A0a64ED5eeF11c4359C4631279695A338ef`
- **🎯 Arena Platform:** `0x7820903fC53197Ce02bDf9785AC04dd8e891BBb7`
- **🆔 Agent Registry (EIP-8004):** `0x95884fe0d2a817326338735Eb4f24dD04Cf20Ea7`
- **💎 $ARENA Token:** `0x1D3a53f0F52053D301374647e70B87279D5F7777`

### Interactive Links
- **🔥 Trade $ARENA:** [nad.fun/token/0x1D3a53f0F52053D301374647e70B87279D5F7777](https://nad.fun/token/0x1D3a53f0F52053D301374647e70B87279D5F7777)
- **🎮 Play vs AI:** [Launch Frontend](#) _(Run: `cd frontend && npm run dev`)_
- **🔍 Explorer:** [Monad Vision](https://monadvision.com/address/0x7820903fC53197Ce02bDf9785AC04dd8e891BBb7)
- **📊 GitHub:** [Add your repo link]

---

## 📋 Project Overview

**Arena AI Champion** is an autonomous AI agent that competes in strategic gaming arenas with real token wagers. Players challenge the AI, and it adapts its strategy using Markov Chain pattern recognition to gain an edge over time.

### What Makes It Special?
- **4 Game Modes:** Rock-Paper-Scissors, Dice Roll, Strategy Battle, Coin Flip
- **Pattern Learning:** 1st-order Markov Chain learns opponent behavior
- **Self-Correcting:** Automatically handles new player logic without crashing
- **EIP-8004 Compliant:** On-chain AI identity & metadata
- **Community Token:** $ARENA on nad.fun bonding curve for speculation on AI performance
- **Transparent Logic:** Live terminal logs show every AI decision for provable fairness
- **Player Advantage:** Universal "Player Wins Ties" rule implemented

---

## ✅ Track Requirements Fulfilled

### Agent+Token Track ($140K) ✅
| Requirement | Implementation | Status |
|------------|----------------|--------|
| Autonomous agent on Monad | ArenaAgent.ts background process | ✅ |
| Token on nad.fun | $ARENA bonding curve token | ✅ |
| Agent does cool stuff | 4-game AI with adaptive strategy | ✅ |
| Community speculation | $ARENA value driven by AI activity | ✅ |
| On-chain utility | Automated wager resolution + rewards | ✅ |

**Mainnet Deployment:**
- Platform: `0x7820903fC53197Ce02bDf9785AC04dd8e891BBb7`
- Token: `0x1D3a53f0F52053D301374647e70B87279D5F7777`
- Agent: `0xa91D5A0a64ED5eeF11c4359C4631279695A338ef`

### Gaming Arena Agent Bounty ($10K) ✅
| PRD Requirement | Implementation | Status |
|----------------|----------------|--------|
| At least one game | 4 games (RPS, Dice, Strategy, Coin) | ✅✅✅✅ |
| Wagering system | ArenaPlatform.sol escrow logic | ✅ |
| Strategic decisions | Markov Chain opponent modeling | ✅ |
| Transparent play | Detailed move logs with win/loss emojis | ✅ |
| Clear interface | React UI + API for agent challenges | ✅ |
| **Bonus:** Opponent adaptation | Real-time pattern learning | ✅ |
| **Bonus:** Autonomous loop | 24/7 event monitoring | ✅ |

---

## 🏗️ Technical Architecture

### Smart Contracts (Solidity)
1. **ArenaPlatform.sol** - 1v1 wagering with multi-game support
   - Match proposal/acceptance
   - Secure move submission (hashed)
   - Automated winner determination
   - Escrow + payout logic

2. **AgentRegistry.sol** - EIP-8004 AI Agent Identity
   - On-chain agent metadata
   - Model version tracking
   - Verifiable AI credentials

### AI Agent (TypeScript/Node.js)
- **Pattern Recognition:** Markov Chain tracks opponent move history
- **Risk Management:** Kelly Criterion for bet sizing (25% of bankroll max)
- **Event-Driven:** Listens to blockchain events for new matches
- **Self-Registration:** Auto-registers EIP-8004 profile on startup

### Frontend (React + Viem + Wagmi)
- MetaMask integration for wallet connection
- Multi-game Arena (RPS, Dice, Strategy, Coin Flip)
- Real-time match history tracking
- AI profile display with EIP-8004 metadata
- $ARENA token trading link

---

## 🎮 How to Play

### Option 1: Via Frontend UI
```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

### Option 2: Direct AI Challenge
You can challenge the AI directly via the `ArenaPlatform` contract using any EVM wallet or another AI agent.
- **AI Agent Address:** `0xa91D5A0a64ED5eeF11c4359C4631279695A338ef`
- **Contract Address:** `0x7820903fC53197Ce02bDf9785AC04dd8e891BBb7`

---

## 🧠 AI Strategy Breakdown

### Markov Chain Pattern Recognition
The AI tracks every move you make. If you play RPS and consistently choose Rock after Paper, the AI's Markov transition table will update. In the next match, it will play Paper (to beat your predicted Rock) with high confidence.

### Adaptive Decision Making
- **Dice/Strategy:** Favors higher outcomes to maintain a competitive house edge.
- **Fairness:** Even with advanced learning, fixed rules ensure players win 100% of tie results.

---

## 📊 Performance Metrics

### Testnet Results (Monad Testnet)
- **Total Matches:** 6+
- **Win Rate:** ~67% (Markov advantage)
- **Games Played:** RPS, CoinFlip, TicTacToe
- **Pattern Recognition:** Successfully identified repeat patterns in 4/6 matches

### Mainnet Status
- **Deployed:** February 8, 2026
- **Agent Status:** ✅ Active & Monitoring
- **Token:** Live on nad.fun with bonding curve

---

## 💰 Token Economics ($ARENA)

**Contract:** `0x1D3a53f0F52053D301374647e70B87279D5F7777`

### Utility
1. **Governance:** Vote on AI strategy parameters (risk tolerance, game selection)
2. **Rev-Share:** Future winnings distributed to token holders
3. **Speculation:** Community bets on AI performance via bonding curve

### Bonding Curve
- Launched on nad.fun mainnet
- Liquidity grows with trading volume
- Eligible for $40K AUSD liquidity boost (highest market cap prize)

---

## 🎯 Why This Project Wins

### Innovation
- **First EIP-8004 compliant gaming AI** on Monad
- **Adaptive strategy** improves over time
- **Multi-game support** showcases versatility

### Technical Excellence
- Clean, auditable smart contracts
- Production-ready TypeScript agent
- Polished React frontend
- Comprehensive event monitoring

### Community Focus
- **$ARENA token** creates stakeholder alignment
- **Transparent AI** - strategy is open-source
- **Accessible UI** - anyone can challenge the AI

### Market Potential
- Gaming + AI + Crypto convergence
- Scalable to tournaments and team battles
- Partnership opportunities with gaming DAOs

---

## 🔧 Repository Structure

```
TournamentChain/
├── contracts/          # Solidity smart contracts
│   ├── src/
│   │   ├── ArenaPlatform.sol
│   │   └── AgentRegistry.sol
│   └── script/         # Deployment scripts
├── agent/             # AI agent (Node.js)
│   └── src/
│       ├── ArenaAgent.ts      # Main agent logic
│       └── LaunchArenaToken.ts
├── frontend/          # React UI
│   └── src/
│       ├── components/ArenaGame.jsx
│       └── config/contracts.js
└── docs/              # Documentation
```

---

## 🚀 Deployment Instructions

### Prerequisites
- Node.js 18+
- Foundry (forge)
- Monad mainnet MON tokens

### 1. Deploy Contracts
```bash
cd contracts
forge script script/DeployArenaV2.s.sol:DeployArena \
  --rpc-url https://rpc.monad.xyz \
  --broadcast --legacy
```

### 2. Launch Token
```bash
cd agent
npm install
npx ts-node src/LaunchArenaToken.ts
```

### 3. Start Agent
```bash
npm start
```

### 4. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📹 Demo Video

[Add video link showcasing:
- Agent registration (EIP-8004)
- Playing a match via UI
- AI pattern recognition in action
- $ARENA token on nad.fun
]

---

## 📄 Smart Contract Source Code

### ArenaPlatform.sol
**Address:** `0x7820903fC53197Ce02bDf9785AC04dd8e891BBb7`
- [View on Explorer](https://monadvision.com/address/0x7820903fC53197Ce02bDf9785AC04dd8e891BBb7)
- [GitHub Source](./contracts/src/ArenaPlatform.sol)

### AgentRegistry.sol (EIP-8004)
**Address:** `0x95884fe0d2a817326338735Eb4f24dD04Cf20Ea7`
- [View on Explorer](https://monadvision.com/address/0x95884fe0d2a817326338735Eb4f24dD04Cf20Ea7)
- [GitHub Source](./contracts/src/AgentRegistry.sol)

---

## 🏆 Hackathon Tracks

### Primary: Agent+Token Track
**Eligible For:**
- ✅ 1 of 10 Open Winners ($10K each)
- ✅ $40K AUSD Liquidity Boost (highest market cap)

### Secondary: Gaming Arena Agent Bounty
**Eligible For:**
- ✅ 1 of 3 Bounty Winners ($10K)

**Total Potential Prize: $20K cash + $40K liquidity**

---

## 👤 Contact & Social

- **Twitter:** [@YourHandle] _(Add your X/Twitter)_
- **GitHub:** [Your GitHub Profile]
- **Discord:** YourDiscordHandle#1234
- **Email:** your.email@example.com

---

## 🙏 Acknowledgments

- **Monad Foundation** for the high-performance blockchain
- **Nad.fun** for the token launchpad and hackathon hosting
- **EIP-8004** working group for AI agent standards
- **Monad Community** for testnet support and feedback

---

## 📜 License

MIT License - See [LICENSE](./LICENSE) for details

---

**Built with ❤️ for the Moltiverse Hackathon**

*Ship Early, Ship Often. Into the Moltiverse.* 🚀
