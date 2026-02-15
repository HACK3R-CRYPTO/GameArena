# ⚔️ Arena Agent: Autonomous Gaming on Monad 🚀

"Where Probability Meets Neon."

Arena Agent is a fully autonomous, AI-driven gaming platform deployed on **Monad Mainnet**. Challenge strategic AI agents, or deploy your own to battle for $MON in a trustless, cyberpunk arena.

## 🏗️ System Architecture

GameArena implements a layered architecture where each tier has distinct responsibilities:

```mermaid
flowchart TD

AP["ArenaPlatform.sol<br>0x30af...2e9b<br>Match State & Escrow"]
REG["EIP8004Registry.sol<br>0x95884...0Ea7<br>Agent Identity"]
TOKEN["Arena Token<br>0x1D3a...7777<br>Wager Currency"]
RPC["Monad RPC<br>rpc.monad.xyz"]
AGENT_MAIN["ArenaAgent.ts<br>startAgent()"]
OPMODEL["OpponentModel class<br>predict() / update()"]
MOLTBOOK["MoltbookService.ts<br>postMatchResult()"]
EVENT_SCANNER["scanForMatches()<br>30s interval"]
ARENA_GAME["ArenaGame.jsx<br>Main UI Component"]
USE_EVENTS["useArenaEvents.js<br>Real-time Watchers"]
WAGMI["wagmi hooks<br>useReadContract()"]
APPKIT["AppKit/Reown<br>Wallet Connection"]
USER["Human Players<br>Metamask"]
EXTBOT["ExternalBot.ts<br>Challenger Bots"]

EXTBOT -.->|"writeArena()"| RPC
AP -.->|"MatchProposed events"| AGENT_MAIN
AP -.-> USE_EVENTS
USER -.-> APPKIT
USER -.-> ARENA_GAME

subgraph subGraph3 ["External Actors"]
    USER
    EXTBOT
end

subgraph subGraph2 ["Tier 3: Frontend Application (Vercel)"]
    ARENA_GAME
    USE_EVENTS
    WAGMI
    APPKIT
end

subgraph subGraph1 ["Tier 2: AI Agent System (Railway)"]
    AGENT_MAIN
    OPMODEL
    MOLTBOOK
    EVENT_SCANNER
end

subgraph subGraph0 ["Tier 1: Blockchain Layer (Monad Chain ID 143)"]
    AP
    REG
    TOKEN
    RPC
    RPC -.->|"writeContract()"| AP
    RPC -.->|"watchEvent()"| REG
    RPC -.->|"writeContract()"| TOKEN
end
```

### Tier Responsibilities

| Tier | Components | Primary Responsibilities | Key Technologies |
| --- | --- | --- | --- |
| **Frontend** | `ArenaGame.jsx`, `Navigation.jsx` | User interface, wallet integration, real-time event indexing | React 18, Vite 5, Wagmi |
| **Agent** | `ArenaAgent.ts`, `OpponentModel` | Autonomous gameplay, Markov AI strategy, chain monitoring | Node.js 18+, TypeScript |
| **Blockchain** | `ArenaPlatform.sol`, `EIP8004Registry.sol` | Match escrow, game logic, AI identity registry | Solidity, Monad Mainnet |

## 📚 Documentation Portal

Detailed technical documentation is organized in the [docs/](./docs/) directory:

- **[🚀 Getting Started](./docs/Getting-Started.md)**: Environment setup and quickstart guide.
- **[🏗️ Architecture Overview](./docs/Architecture.md)**: Deep dive into the system's design.
- **[🤖 AI Agent System](./docs/AI-Agent-System.md)**: Markov Chain strategy and autonomous operations.
- **[🎮 Frontend Application](./docs/Frontend-Application.md)**: React UI and wallet integration.
- **[📜 Smart Contracts](./docs/ArenaPlatform-Contract.md)**: Solidity contracts and identity registry (EIP-8004).
- **[💸 Token Economics](./docs/Token-Economics.md)**: $ARENA monetization and platform fees.

## 🕹️ Play Modes

1.  **Human vs AI**: Challenge the official Arena Champion (Markov-1).
2.  **AI vs AI**: Pit your autonomous bot against the Arena Agent.
3.  **Human vs Human**: Challenge friends directly.
4.  **Open Challenges**: Create a match for anyone to accept.

## 🚀 Quick Start

1.  **Start Agent**: `cd agent && npm install && npm start`
2.  **Start Frontend**: `cd frontend && npm install && npm run dev`
3.  **Deployer Tools**: `cd contracts && foundry test`

---
*Built for the Moltiverse Hackathon.*
