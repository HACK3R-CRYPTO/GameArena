# ⚔️ ArenaAgent: AI-Powered Gaming Arena (Monad Mainnet)

ArenaAgent is a high-performance gaming platform on Monad where players challenge a sophisticated AI agent in high-stakes matches.

## 🚀 Live Arena

Access the arena at: `http://localhost:5173`

## 🎮 Game Modes

The Arena features 4 high-speed games:

1.  **Rock-Paper-Scissors**: Classic strategy with pattern recognition. **Player Wins Ties!**
2.  **Dice Roll**: High-stakes randomness. **Player Wins Ties!**
3.  **Strategy Battle**: Tactical selection from 0-9. **Player Wins Ties!**
4.  **Coin Flip**: Pure prediction. **Player Wins Ties!**

## 🧠 AI Agent (Markov Chain)

The Arena uses a 1-st order Markov Chain to analyze player behavior:
- **Pattern Matching**: The agent tracks your move history to predict your next move.
- **Dynamic Response**: The more you play, the smarter it gets.
- **Tie-Breaker**: All games are weighted in favor of the player—on any tie, the player wins!

## 📦 Getting Started

1. **Install Dependencies**:
   ```bash
   cd TournamentChain && npm install
   cd frontend && npm install
   ```

2. **Configure Environment**:
   Ensure your `.env` in `TournamentChain/` has your `PRIVATE_KEY` for the agent.

3. **Start the Agent**:
   ```bash
   npm run agent
   ```

4. **Launch the Frontend**:
   ```bash
   cd frontend && npm run dev
   ```

Our **Arena Champion AI** is a sophisticated autonomous player that:
- **Learns Patterns**: Uses a 1st-order Markov Chain model to track your previous moves and predict your next one.
- **Transparent Logic**: Detailed battle logs in terminal show exactly what the AI played and why.
- **Player Advantage**: Features a 100% "Player Wins Ties" rule to ensure a fair and fun gaming experience.
- **Autonomous Resolution**: Monitors the blockchain 24/7 to accept challenges and resolve matches instantly.

## Key Features

- **EIP-8004 Compliant**: The agent is registered on-chain with verifiable metadata.
- **Dual-Token Economy**: $ARENA token integration powered by Monad.
- **On-Chain Reputation**: Your wins are recorded forever.
- **Anti-Cheat**: All moves and logic are processed via smart contracts and verified agent logic.

## Technical Excellence

Built with React and Phaser. Powered by Solidity. Secured by OpenZeppelin. Fast, responsive, and fully decentralized on Monad.

## Getting Started

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

### 2. AI Agent
```bash
cd agent
npm install
# Configure .env with your PRIVATE_KEY
npm start
```

## Deployed Contracts (Monad Testnet)

- **ArenaPlatform (v6)**: `0x9C077926Eea6D5945fC8Ebc29F0f3ab33d976867`
- **Arena AI Agent**: `0xa91D5A0a64ED5eeF11c4359C4631279695A338ef`
- **TournamentPlatform**: `0x3190d0bb2f983E407F62DeA4e557bCE73ec7E825`
- **GameAssets**: `0x0fC01Df600f960d94A2196913bD3a0F2577eF168`
- **GoldToken**: `0x843182a7a7a4c43cb7fd0d6566088575ef041ffb`
- **DiamondToken**: `0x24642ffabf43d4bd33e1e883a23e10ddfde186c6`
- **ArcadePlatform**: `0xDc8d900E64c5891b0A5D7dF0aFF4e581ee448aFE`
- **WinnerBadge**: `0xcE11B94ccE5DdDaE8556C83F6b1b7c241862a165`
- **GameLottery**: `0x631d234ea1b750540D546b435903a6cde777Ee82`

## Documentation

[Gaming Arena Task](GAMING_ARENA_AGENT_TASK.md): Deep dive into the AI Agent strategy and implementation.

[Frontend README](frontend/README.md): Frontend setup and feature documentation.

## Future Roadmap

- **Advanced AI**: Moving to Deep Reinforcement Learning (DRL) for more complex game states.
- **More Mini-Games**: Flappy Bird, Tower Defense, and Puzzle games integration.
- **Advanced Anti-Cheat**: Implementing Zero-Knowledge Proofs (ZKPs) for score verification.

