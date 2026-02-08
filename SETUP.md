# ⚔️ ArenaAgent Setup Guide

## Project Structure

```
TournamentChain/
├── agent/              # Autonomous AI Agent (Node.js/Viem)
│   ├── src/           # Agent logic and pattern recognition (ArenaAgent.ts)
│   └── package.json   # Agent dependencies
├── contracts/          # Monad smart contracts (Foundry)
│   ├── src/           # ArenaPlatform.sol & AgentRegistry.sol
│   ├── script/        # Deployment scripts
│   └── .env           # Network configuration
├── frontend/          # Vite + React frontend
│   ├── src/           # ArenaGame interface & Navigation
│   └── package.json   # Frontend dependencies
```

## Running the Platform

### 1. Smart Contracts
Ensure your `.env` file in `contracts/` contains:
- `PRIVATE_KEY`: Your deployment/agent key
- `RPC_URL`: https://rpc.monad.xyz

### 2. Autonomous AI Agent
The agent monitors the blockchain 24/7 to accept challenges.
```bash
cd agent
npm install
npm start
```
*Tip: The agent uses its own wallet (derived from the .env key) and will show live "Dice Battle" and "RPS" logs in the terminal.*

### 3. Frontend Development
Start the user interface where players can connect wallets and play.
```bash
cd frontend
npm install
npm run dev
```

## Game Mechanics & AI Patterns

### The Arena AI Champion
- **Memory**: Remembers every move you make.
- **Prediction**: Predicts your next move using a Markov-1 model.
- **Fair Play**: Implements a universal tie-breaker where the **Player Always Wins** on ties.
- **EIP-8004**: Fully registered AI profile on Monad.

### 4 Arena Game Types
1. **Rock-Paper-Scissors**: Out-predict the agent.
2. **Dice Roll**: High roll (1-6) wins.
3. **Strategy Battle**: High strategy (0-9) wins.
4. **Coin Flip**: Predict Heads/Tails correctly.
npm run build        # Build for production
npm run preview      # Preview production build
```

## Next Steps

### 1. Smart Contracts

- Copy TournamentPlatform.sol to `contracts/src/`
- Copy game contract to `contracts/src/`
- Update foundry.toml if needed
- Write tests in `contracts/test/`
- Create deployment scripts in `contracts/script/`

### 2. Frontend

- Set up wagmi configuration
- Create Web3 provider setup
- Build game components
- Build tournament UI components
- Integrate game with Web3 hooks

### 3. Integration

- Connect frontend to contracts
- Set up wallet connection
- Implement tournament flows
- Test end-to-end functionality

## Quick Start

### Start Frontend Dev Server
```bash
cd frontend
npm run dev
```

### Build Contracts
```bash
cd contracts
forge build
```

### Run Contract Tests
```bash
cd contracts
forge test
```

## Dependencies Installed

### Frontend
- React 19.2.0
- Vite 7.2.4
- ethers 6.16.0
- wagmi 3.3.2
- viem 2.44.1

### Contracts
- forge-std (Foundry standard library)
- Solidity 0.8.33

## Game Assets

Game assets are already present in:
- `frontend/public/assets/` - Contains sprites, images, fonts
- Assets include: Player sprites, Enemy sprites, Bullets, UI elements

Ready to integrate into React game components.

