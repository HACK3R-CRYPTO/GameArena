# TournamentChain Smart Contracts

Smart contracts for TournamentChain. Deploy to Sepolia. Test locally. Verify on Etherscan.

## What These Contracts Do

TournamentPlatform: Manages tournaments. Collects entry fees. Distributes prizes. Tracks winners.

GameAssets: ERC-1155 NFT contract. Players own Weapons and Skins. Batch minting supported.

GoldToken & DiamondToken: ERC-20 tokens. Gold for entry fees. Diamonds for premium rewards.

ArcadePlatform: Free-to-play leaderboard. Stores high scores on-chain. Immutable reputation.

WinnerBadge: Soulbound Token (SBT). Non-transferable badge for tournament champions.

## Prerequisites

Install Foundry. Get Sepolia ETH for gas fees. Have a wallet ready.

Foundry installation: https://book.getfoundry.sh/getting-started/installation

## Installation

Navigate to contracts folder. Install dependencies.

```bash
cd TournamentChain/contracts
forge install
```

Build contracts:

```bash
forge build
```

Run tests:

```bash
forge test
```

All tests must pass before deployment.

## Configuration

Create a `.env` file in the contracts directory:

```
PRIVATE_KEY=0xyour_private_key_with_0x_prefix
ETHERSCAN_API_KEY=your_etherscan_api_key
```

Important notes:
- Private key must include 0x prefix
- Etherscan API key is for verification

## Deployment

### Deploy All Contracts

Deploy everything to Sepolia Testnet:

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url https://sepolia.drpc.org --broadcast --legacy
```

This deploys Tokens, Assets, Tournament Platform, and Lottery. Sets up permissions.

### Deploy Arcade Platform

Deploy the Arcade leaderboard:

```bash
forge script script/DeployArcade.s.sol:DeployArcade --rpc-url https://sepolia.drpc.org --broadcast --legacy
```

## Deployed Contracts

Sepolia Testnet:

- **TournamentPlatform**: `0x14b2303f4eb388e2842e61f1e3b88bcadee3cc73`
- **GameAssets**: `0xa1dbb68470cce59218e8495f5350ffc8c8e36110`
- **GoldToken**: `0x0bd3180bd740e8fb560329ea42f46f65aa5b242d`
- **DiamondToken**: `0xc6d677f0fcb8343ee09063b6849aa40e1fc99bc5`
- **ArcadePlatform**: `0x214124ae23b415b3AEA3bb9e260A56dc022bAf04`
- **WinnerBadge**: `0xb3e19d1215423abadb0a9105c61618aec6b02be6`

## Usage

### Mint Test Tokens

Call `mint` on GoldToken or DiamondToken. Public minting enabled for hackathon testing.

### Create Tournament

Call `createTournament` on TournamentPlatform. Set entry fee, duration, and prize pool.

### Join Tournament

Approve GoldToken spending. Call `joinTournament`. Pay entry fee.

### Submit Score

Call `submitScore` on TournamentPlatform (for paid) or ArcadePlatform (for free).

## Project Structure

```
contracts/
├── src/
│   ├── TournamentPlatform.sol
│   ├── GameAssets.sol
│   ├── GameCurrency.sol
│   ├── ArcadePlatform.sol
│   └── WinnerBadge.sol
├── script/
│   ├── Deploy.s.sol
│   └── DeployArcade.s.sol
├── test/
│   └── TournamentPlatform.t.sol
└── README.md
```

## Security

Contracts include security features:
- **ReentrancyGuard**: Prevents reentrancy attacks.
- **Ownable**: Protects administrative functions.
- **Pausable**: Emergency stop mechanism.
- **ERC-1155**: Standard secure asset management.
