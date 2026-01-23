# TournamentChain Frontend

React frontend for TournamentChain. Connects players to tournaments. Runs Wave Defense game. Visualizes on-chain data.

## What This Frontend Does

You connect your wallet. You browse tournaments. You mint assets. You play the Wave Defense game directly in the browser. You track your leaderboard status in real-time.

## Prerequisites

Install Node.js 18 or higher. Install npm. Have a browser wallet (MetaMask) or use Social Login.

## Installation

Navigate to frontend directory:

```bash
cd TournamentChain/frontend
```

Install dependencies:

```bash
npm install
```

Create `.env` file:

```env
VITE_PROJECT_ID=your_walletconnect_project_id
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
```

## Development

Start development server:

```bash
npm run dev
```

Server runs on http://localhost:5173

## Build

Build for production:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

## Key Components

### Wave Defense Game
Located in `src/pages/WaveDefenseGame.jsx`. A Phaser-based survival shooter. Runs in the browser. Interacts with `GameAssets` to load your NFT skins and weapons.

### Tournament Browser
Located in `src/pages/TournamentBrowser.jsx`. Fetches active tournaments from `TournamentPlatform`. Filters by entry fee and status.

### Profile & Inventory
Located in `src/pages/Profile.jsx`. Displays your Gold/Diamond balance. Shows your NFT assets. Allows minting of test tokens.

### Leaderboard
Located in `src/pages/Leaderboard.jsx`. Fetches global rankings from `ArcadePlatform`. Real-time sorting and display.

## Configuration

Contract addresses are stored in `src/config/contracts.js`. Update these after redeploying contracts.

```javascript
export const CONTRACT_ADDRESSES = {
  TOURNAMENT_PLATFORM: '0x14b2303f4eb388e2842e61f1e3b88bcadee3cc73',
  GAME_ASSETS: '0xa1dbb68470cce59218e8495f5350ffc8c8e36110',
  GOLD_TOKEN: '0x0bd3180bd740e8fb560329ea42f46f65aa5b242d',
  DIAMOND_TOKEN: '0xc6d677f0fcb8343ee09063b6849aa40e1fc99bc5',
  ARCADE_PLATFORM: '0x214124ae23b415b3AEA3bb9e260A56dc022bAf04',
  WINNER_BADGE: '0xb3e19d1215423abadb0a9105c61618aec6b02be6',
  GAME_LOTTERY: '0xd06fce565798942949ae735f5e588fbf9e96afda'
};
```

## Project Structure

```
frontend/
├── src/
│   ├── assets/         # Game assets (sprites, sounds)
│   ├── components/     # UI Components
│   ├── config/         # Contract addresses & ABIs
│   ├── context/        # Auth & State context
│   ├── pages/          # Route pages
│   └── App.jsx         # Main entry point
├── public/             # Static files
├── index.html
├── package.json
└── README.md
```

## Support

For issues or questions:
- **Wagmi Docs**: https://wagmi.sh
- **Phaser Docs**: https://phaser.io
- **Vite Docs**: https://vitejs.dev
