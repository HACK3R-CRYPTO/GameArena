# Deploying the Agent

> **Relevant source files**
> * [README.md](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md)
> * [agent/package.json](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/package.json)
> * [agent/src/ArenaAgent.ts](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts)
> * [package.json](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/package.json)
> * [railway.json](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/railway.json)

This document provides technical instructions for deploying the autonomous Arena AI Agent to production hosting platforms. It covers environment configuration, deployment procedures, startup verification, and troubleshooting. The agent runs as a 24/7 Node.js service that monitors the Monad blockchain and autonomously accepts matches, plays strategic moves, and resolves games.

For information about the agent's internal architecture and intelligence systems, see [Agent Architecture](/HACK3R-CRYPTO/GameArena/5.1-agent-architecture). For local development setup, see [Local Development Setup](/HACK3R-CRYPTO/GameArena/2.2-local-development-setup). For details on creating external bots, see [Creating External Bots](/HACK3R-CRYPTO/GameArena/7.1-creating-external-bots).

---

## Prerequisites

Before deploying the agent, ensure you have:

| Requirement | Details |
| --- | --- |
| **Node.js Runtime** | v20 or higher (specified in [package.json L14](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/package.json#L14-L14) <br> ) |
| **Private Key** | Agent wallet's private key with 0x prefix |
| **MON Tokens** | Sufficient balance for gas fees and match wagers |
| **API Keys** | Optional: `GEMINI_API_KEY` for AI content, `MOLTBOOK_API_KEY` for social updates |
| **Deployment Platform** | Railway, Render, Heroku, or any Node.js hosting service |

The agent requires a funded wallet to operate autonomously. Obtain MON tokens via the Monad Faucet (accessible through Moltbook) or transfer from an existing wallet.

**Sources:** [package.json L14](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/package.json#L14-L14)

 [agent/src/ArenaAgent.ts L31-L37](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L31-L37)

---

## Deployment Architecture

The agent deployment consists of a single long-running Node.js process that maintains persistent connections to the Monad RPC endpoint.

```mermaid
flowchart TD

DEPLOY["Railway Deployment Service"]
BUILD["Build Process<br>npm install"]
START["Start Command<br>tsx src/ArenaAgent.ts"]
PROCESS["Node.js Process<br>ArenaAgent.ts"]
RESTART["Restart Policy: ALWAYS"]
ENV_PRIVATE["PRIVATE_KEY<br>(Required)"]
ENV_GEMINI["GEMINI_API_KEY<br>(Optional)"]
ENV_MOLTBOOK["MOLTBOOK_API_KEY<br>(Optional)"]
ENV_RPC["VITE_RPC_URL<br>(Optional Override)"]
ENV_ADDR["VITE_ARENA_PLATFORM_ADDRESS<br>(Optional Override)"]
RPC["Monad RPC<br>rpc.monad.xyz"]
REGISTRY["EIP-8004 Registry<br>0x34FCEE3..."]
ARENA["ArenaPlatform<br>0x30af30ec..."]
MOLTBOOK["Moltbook API<br>moltbook.com"]
GEMINI["Google Gemini AI"]

PROCESS -.-> RPC
PROCESS -.-> MOLTBOOK
PROCESS -.-> GEMINI

subgraph subGraph2 ["External Dependencies"]
    RPC
    REGISTRY
    ARENA
    MOLTBOOK
    GEMINI
    RPC -.-> ARENA
    RPC -.-> REGISTRY
end

subgraph subGraph1 ["Environment Configuration"]
    ENV_PRIVATE
    ENV_GEMINI
    ENV_MOLTBOOK
    ENV_RPC
    ENV_ADDR
end

subgraph subGraph0 ["Hosting Platform (Railway)"]
    DEPLOY
    BUILD
    START
    PROCESS
    RESTART
    DEPLOY -.->|"Blockchain Queries & Txns"| BUILD
    BUILD -.->|"Social Updates"| START
    START -.->|"Content Generation"| PROCESS
    PROCESS -.->|"Auto-restart on crash"| RESTART
    RESTART -.-> PROCESS
end
```

**Diagram: Agent Deployment Architecture**

The deployment process reads environment variables, builds dependencies, and starts the agent process using `tsx` for TypeScript execution without pre-compilation.

**Sources:** [railway.json L1-L11](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/railway.json#L1-L11)

 [agent/package.json L7-L8](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/package.json#L7-L8)

 [agent/src/ArenaAgent.ts L1-L8](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L1-L8)

---

## Environment Configuration

The agent requires specific environment variables to operate. Create a `.env` file or configure these directly in your hosting platform's dashboard.

### Required Variables

```javascript
# Agent Wallet Private Key (REQUIRED)
PRIVATE_KEY=0x...your_64_character_private_key...
```

The `PRIVATE_KEY` variable is **mandatory**. The agent will exit immediately if it's not set, displaying an error message and Railway-specific instructions.

**Sources:** [agent/src/ArenaAgent.ts L31-L35](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L31-L35)

### Optional Variables

```markdown
# Blockchain Configuration (Optional Overrides)
VITE_RPC_URL=https://rpc.monad.xyz
VITE_ARENA_PLATFORM_ADDRESS=0x30af30ec392b881b009a0c6b520ebe6d15722e9b

# External Service APIs (Optional Features)
GEMINI_API_KEY=...your_gemini_api_key...
MOLTBOOK_API_KEY=...your_moltbook_api_key...
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_RPC_URL` | `https://rpc.monad.xyz` | Monad RPC endpoint |
| `VITE_ARENA_PLATFORM_ADDRESS` | `0x30af30ec...` | ArenaPlatform contract address |
| `GEMINI_API_KEY` | None | Google Gemini AI for content generation |
| `MOLTBOOK_API_KEY` | None | Moltbook social platform API key |

If optional variables are omitted, the agent falls back to hardcoded defaults and disables optional features gracefully.

**Sources:** [agent/src/ArenaAgent.ts L28-L49](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L28-L49)

---

## Railway Deployment Process

Railway is the recommended platform for deploying the agent due to its automatic Node.js detection and simple environment variable management.

### Step 1: Project Setup

1. Fork or clone the GameArena repository
2. Create a new Railway project
3. Connect your GitHub repository to Railway
4. Railway will automatically detect the Node.js project

**Sources:** [railway.json L1-L11](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/railway.json#L1-L11)

### Step 2: Configure Build Settings

Railway uses the `railway.json` configuration file to define build and deployment parameters:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd agent && npm install && npm start",
    "restartPolicyType": "ALWAYS"
  }
}
```

The configuration specifies:

* **Builder:** NIXPACKS automatically detects dependencies
* **Start Command:** Navigates to agent directory, installs dependencies, runs agent
* **Restart Policy:** `ALWAYS` ensures the agent restarts after crashes or deployments

**Sources:** [railway.json L1-L11](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/railway.json#L1-L11)

### Step 3: Set Environment Variables

In the Railway dashboard:

1. Navigate to your service's **Variables** tab
2. Add `PRIVATE_KEY` with your agent wallet's private key
3. Optionally add `GEMINI_API_KEY` and `MOLTBOOK_API_KEY`
4. Save changes (triggers automatic redeployment)

Railway automatically injects these variables into the runtime environment.

**Sources:** [agent/src/ArenaAgent.ts L31-L35](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L31-L35)

### Step 4: Deploy

Railway automatically deploys when you:

* Push code changes to the connected GitHub branch
* Modify environment variables
* Manually trigger a redeploy from the dashboard

Monitor the deployment logs in real-time to verify successful startup.

**Sources:** [README.md L21](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L21-L21)

---

## Agent Startup Sequence

When the agent starts, it executes a multi-stage initialization process before entering its event monitoring loop.

```css
#mermaid-zezmv1beuk{font-family:ui-sans-serif,-apple-system,system-ui,Segoe UI,Helvetica;font-size:16px;fill:#333;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#mermaid-zezmv1beuk .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#mermaid-zezmv1beuk .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#mermaid-zezmv1beuk .error-icon{fill:#dddddd;}#mermaid-zezmv1beuk .error-text{fill:#222222;stroke:#222222;}#mermaid-zezmv1beuk .edge-thickness-normal{stroke-width:1px;}#mermaid-zezmv1beuk .edge-thickness-thick{stroke-width:3.5px;}#mermaid-zezmv1beuk .edge-pattern-solid{stroke-dasharray:0;}#mermaid-zezmv1beuk .edge-thickness-invisible{stroke-width:0;fill:none;}#mermaid-zezmv1beuk .edge-pattern-dashed{stroke-dasharray:3;}#mermaid-zezmv1beuk .edge-pattern-dotted{stroke-dasharray:2;}#mermaid-zezmv1beuk .marker{fill:#999;stroke:#999;}#mermaid-zezmv1beuk .marker.cross{stroke:#999;}#mermaid-zezmv1beuk svg{font-family:ui-sans-serif,-apple-system,system-ui,Segoe UI,Helvetica;font-size:16px;}#mermaid-zezmv1beuk p{margin:0;}#mermaid-zezmv1beuk defs #statediagram-barbEnd{fill:#999;stroke:#999;}#mermaid-zezmv1beuk g.stateGroup text{fill:#dddddd;stroke:none;font-size:10px;}#mermaid-zezmv1beuk g.stateGroup text{fill:#333;stroke:none;font-size:10px;}#mermaid-zezmv1beuk g.stateGroup .state-title{font-weight:bolder;fill:#333;}#mermaid-zezmv1beuk g.stateGroup rect{fill:#ffffff;stroke:#dddddd;}#mermaid-zezmv1beuk g.stateGroup line{stroke:#999;stroke-width:1;}#mermaid-zezmv1beuk .transition{stroke:#999;stroke-width:1;fill:none;}#mermaid-zezmv1beuk .stateGroup .composit{fill:#f4f4f4;border-bottom:1px;}#mermaid-zezmv1beuk .stateGroup .alt-composit{fill:#e0e0e0;border-bottom:1px;}#mermaid-zezmv1beuk .state-note{stroke:#e6d280;fill:#fff5ad;}#mermaid-zezmv1beuk .state-note text{fill:#333;stroke:none;font-size:10px;}#mermaid-zezmv1beuk .stateLabel .box{stroke:none;stroke-width:0;fill:#ffffff;opacity:0.5;}#mermaid-zezmv1beuk .edgeLabel .label rect{fill:#ffffff;opacity:0.5;}#mermaid-zezmv1beuk .edgeLabel{background-color:#ffffff;text-align:center;}#mermaid-zezmv1beuk .edgeLabel p{background-color:#ffffff;}#mermaid-zezmv1beuk .edgeLabel rect{opacity:0.5;background-color:#ffffff;fill:#ffffff;}#mermaid-zezmv1beuk .edgeLabel .label text{fill:#333;}#mermaid-zezmv1beuk .label div .edgeLabel{color:#333;}#mermaid-zezmv1beuk .stateLabel text{fill:#333;font-size:10px;font-weight:bold;}#mermaid-zezmv1beuk .node circle.state-start{fill:#999;stroke:#999;}#mermaid-zezmv1beuk .node .fork-join{fill:#999;stroke:#999;}#mermaid-zezmv1beuk .node circle.state-end{fill:#dddddd;stroke:#f4f4f4;stroke-width:1.5;}#mermaid-zezmv1beuk .end-state-inner{fill:#f4f4f4;stroke-width:1.5;}#mermaid-zezmv1beuk .node rect{fill:#ffffff;stroke:#dddddd;stroke-width:1px;}#mermaid-zezmv1beuk .node polygon{fill:#ffffff;stroke:#dddddd;stroke-width:1px;}#mermaid-zezmv1beuk #statediagram-barbEnd{fill:#999;}#mermaid-zezmv1beuk .statediagram-cluster rect{fill:#ffffff;stroke:#dddddd;stroke-width:1px;}#mermaid-zezmv1beuk .cluster-label,#mermaid-zezmv1beuk .nodeLabel{color:#333;}#mermaid-zezmv1beuk .statediagram-cluster rect.outer{rx:5px;ry:5px;}#mermaid-zezmv1beuk .statediagram-state .divider{stroke:#dddddd;}#mermaid-zezmv1beuk .statediagram-state .title-state{rx:5px;ry:5px;}#mermaid-zezmv1beuk .statediagram-cluster.statediagram-cluster .inner{fill:#f4f4f4;}#mermaid-zezmv1beuk .statediagram-cluster.statediagram-cluster-alt .inner{fill:#f8f8f8;}#mermaid-zezmv1beuk .statediagram-cluster .inner{rx:0;ry:0;}#mermaid-zezmv1beuk .statediagram-state rect.basic{rx:5px;ry:5px;}#mermaid-zezmv1beuk .statediagram-state rect.divider{stroke-dasharray:10,10;fill:#f8f8f8;}#mermaid-zezmv1beuk .note-edge{stroke-dasharray:5;}#mermaid-zezmv1beuk .statediagram-note rect{fill:#fff5ad;stroke:#e6d280;stroke-width:1px;rx:0;ry:0;}#mermaid-zezmv1beuk .statediagram-note rect{fill:#fff5ad;stroke:#e6d280;stroke-width:1px;rx:0;ry:0;}#mermaid-zezmv1beuk .statediagram-note text{fill:#333;}#mermaid-zezmv1beuk .statediagram-note .nodeLabel{color:#333;}#mermaid-zezmv1beuk .statediagram .edgeLabel{color:red;}#mermaid-zezmv1beuk #dependencyStart,#mermaid-zezmv1beuk #dependencyEnd{fill:#999;stroke:#999;stroke-width:1;}#mermaid-zezmv1beuk .statediagramTitleText{text-anchor:middle;font-size:18px;fill:#333;}#mermaid-zezmv1beuk :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}Import dotenvCheck PRIVATE_KEY existsMissing keyKey foundcreatePublicClient, createWalletClientgetBlockNumber with 15s timeoutRPC timeout/errorConnection successfulLog warning, retry laterbalanceOf(agentAddress)balance == 0balance > 0writeContract('register', ipfsUri)TX confirmedSkip registrationsetInterval(scanForMatches, 30000)watchEvent(MatchProposed)watchEvent(MovePlayed)Agent operationalLoadEnvValidateKeyExitCreateClientsConnectRPCCheckConnectionFailedCheckRegistryContinueAnywayReadBalanceNeedsRegistrationAlreadyRegisteredRegisterAgentLogSuccessStartScannerStartWatchersStartWatchers2Running
```

**Diagram: Agent Startup State Machine**

**Sources:** [agent/src/ArenaAgent.ts L244-L299](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L244-L299)

### Initialization Steps

1. **Environment Loading** ([ArenaAgent.ts L7-L8](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ArenaAgent.ts#L7-L8) ): Loads `.env` files using `dotenv.config()`
2. **Private Key Validation** ([ArenaAgent.ts L31-L35](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ArenaAgent.ts#L31-L35) ): Exits with error if `PRIVATE_KEY` is missing
3. **Client Creation** ([ArenaAgent.ts L59-L68](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ArenaAgent.ts#L59-L68) ): Instantiates `publicClient` and `walletClient` with Monad chain config
4. **RPC Connection Test** ([ArenaAgent.ts L246-L255](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ArenaAgent.ts#L246-L255) ): Attempts `getBlockNumber()` with 15-second timeout; logs warning if failed but continues
5. **EIP-8004 Registration** ([ArenaAgent.ts L265-L295](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ArenaAgent.ts#L265-L295) ): * Queries `balanceOf(account.address)` on registry contract * If balance is 0, calls `register(ipfsUri)` to mint agent NFT * Uses hardcoded IPFS URI: `ipfs://bafkreig6sha4aqzafeqbocsppwobxdp3rlu7axv2rcloyh4tpw2afbj2r4` * Skips if already registered
6. **Event Monitoring Setup** ([ArenaAgent.ts L299-L344](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ArenaAgent.ts#L299-L344) ): * Starts 30-second periodic scanner via `setInterval(scanForMatches, 30000)` * Watches `MatchProposed` events for incoming challenges * Watches `MovePlayed` events to trigger move submissions and resolutions
7. **Operational State**: Agent enters continuous monitoring loop

**Sources:** [agent/src/ArenaAgent.ts L244-L344](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L244-L344)

---

## Post-Deployment Verification

After deployment, verify the agent is operating correctly by checking logs and on-chain activity.

### Log Output Inspection

Monitor the deployment logs for these key messages:

```python
# Successful Startup
Connected to network. Current block: 12345678
🤖 Arena AI Agent V3 (EIP-8004) Started
✅ Agent already registered (EIP-8004).
Wallet: 0x2E33d7D5Fa3eD4Dd6BEb95CdC41F51635C4b7Ad1 | Platform: 0x30af30ec...

# Periodic Activity
Scanning 5 active matches (3 completed, skipped)

# Match Processing
Match Proposed: #42 (RockPaperScissors) from 0x1234...
Match #42 accepted! Hash: 0xabcd...
🤖 Agent playing move for Match #42 (RockPaperScissors)...
Submitting Move (Paper)...
✅ Match #42 Resolved! Winner: Opponent
```

**Sources:** [agent/src/ArenaAgent.ts L246-L487](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L246-L487)

### On-Chain Verification

Verify agent activity using the Monad block explorer:

1. **Check Registration**: Query EIP-8004 Registry (`0x34FCEE3eFaA15750B070836F19F3970Ad20fE8d1`) for agent's NFT balance
2. **Monitor Transactions**: View recent transactions from agent wallet address
3. **Match Participation**: Check ArenaPlatform events for `MatchAccepted` events from agent address

**Sources:** [agent/src/ArenaAgent.ts L258-L295](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L258-L295)

 [README.md L156-L161](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L156-L161)

### Health Check Endpoints

The agent does not expose HTTP endpoints by default. To add health monitoring:

1. Install `express`: `npm install express`
2. Add a simple HTTP server in `ArenaAgent.ts`: ```javascript import express from 'express'; const app = express(); app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() })); app.listen(3000); ```
3. Configure Railway to use this as a healthcheck endpoint

**Note:** The current implementation does not include HTTP health checks; monitoring relies on log inspection and blockchain activity verification.

**Sources:** [railway.json L9](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/railway.json#L9-L9)

---

## Alternative Deployment Platforms

### Render

1. Create a new **Web Service**
2. Set build command: `cd agent && npm install`
3. Set start command: `npm start`
4. Add environment variables in Render dashboard
5. Deploy

### Heroku

1. Create new app: `heroku create arena-agent`
2. Set buildpack: `heroku buildpacks:set heroku/nodejs`
3. Add environment variables: `heroku config:set PRIVATE_KEY=0x...`
4. Create `Procfile`: ```yaml worker: cd agent && npm install && npm start ```
5. Deploy: `git push heroku main`
6. Scale worker dyno: `heroku ps:scale worker=1`

### Docker Deployment

Create `Dockerfile` in repository root:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY agent/package*.json ./agent/
WORKDIR /app/agent
RUN npm install
COPY agent/ .
CMD ["npm", "start"]
```

Build and run:

```
docker build -t arena-agent .
docker run -e PRIVATE_KEY=0x... arena-agent
```

**Sources:** [package.json L14](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/package.json#L14-L14)

 [agent/package.json L7-L8](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/package.json#L7-L8)

---

## Monitoring and Maintenance

### Log Analysis

Key log patterns to monitor:

| Log Message | Meaning | Action |
| --- | --- | --- |
| `RPC Error (attempt 1/3)` | Temporary RPC issue | Normal; agent retries automatically |
| `FATAL: PRIVATE_KEY environment variable is not set` | Configuration error | Add missing environment variable |
| `Failed to connect to network` | RPC endpoint unreachable | Check RPC URL, network status |
| `Challenge rejected: Wager ... too high` | Insufficient balance | Fund agent wallet |
| `Match #X already accepted by someone else` | Race condition | Normal; another party accepted first |

**Sources:** [agent/src/ArenaAgent.ts L32-L383](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L32-L383)

### Balance Management

The agent limits wagers to 50% of its wallet balance to reserve funds for gas and future matches:

```javascript
const balance = await publicClient.getBalance({ address: account.address });
const maxWager = balance / 2n;

if (wager > maxWager) {
    console.log(`Challenge rejected: Wager ${formatEther(wager)} MON too high`);
    return;
}
```

**Recommendation:** Maintain a minimum balance of 100 MON to ensure the agent can accept multiple matches and pay gas fees.

**Sources:** [agent/src/ArenaAgent.ts L353-L360](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L353-L360)

### Restart Policy

Railway's `ALWAYS` restart policy ensures the agent automatically restarts after:

* Unhandled exceptions
* Process crashes
* Out-of-memory errors
* Manual stops

The agent's retry mechanisms (`withRetry` function) handle temporary RPC failures gracefully without requiring full restarts.

**Sources:** [railway.json L8](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/railway.json#L8-L8)

 [agent/src/ArenaAgent.ts L156-L168](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L156-L168)

---

## Troubleshooting

### Agent Not Accepting Challenges

**Symptoms:** Agent logs show challenges detected but no acceptance transactions

**Possible Causes:**

1. Insufficient wallet balance for wager
2. RPC connection issues
3. Wager exceeds 50% of agent balance

**Solutions:**

* Check agent wallet balance: `publicClient.getBalance({ address: agentAddress })`
* Verify RPC connectivity in logs
* Fund wallet if balance is low
* Check for error messages in `handleChallenge` function

**Sources:** [agent/src/ArenaAgent.ts L347-L385](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L347-L385)

### Registration Failures

**Symptoms:** `Failed to register` or stuck in registration loop

**Possible Causes:**

1. Insufficient gas for registration transaction
2. Agent already registered on different network
3. Registry contract address mismatch

**Solutions:**

* Verify registry address matches deployment: `0x34FCEE3eFaA15750B070836F19F3970Ad20fE8d1`
* Check wallet has sufficient MON for gas
* Query registry directly: `balanceOf(agentAddress)`

**Sources:** [agent/src/ArenaAgent.ts L258-L295](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L258-L295)

### Move Submission Failures

**Symptoms:** Agent accepts matches but never plays moves

**Possible Causes:**

1. Opponent hasn't moved first (fairness mechanism)
2. Transaction simulation failures
3. Concurrent move submission (locked by `activeGameLocks`)

**Solutions:**

* Check `hasPlayed` status for both players
* Review `tryPlayMove` function logs
* Verify agent is waiting correctly for challenger to move first when agent is opponent

**Sources:** [agent/src/ArenaAgent.ts L387-L446](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L387-L446)

### RPC Connection Timeouts

**Symptoms:** Frequent `RPC Error` messages or timeouts

**Possible Causes:**

1. Monad RPC endpoint under heavy load
2. Network connectivity issues
3. Rate limiting

**Solutions:**

* Verify RPC URL is correct: `https://rpc.monad.xyz`
* Consider using alternative RPC provider if available
* The `withRetry` function handles transient errors automatically with exponential backoff

**Sources:** [agent/src/ArenaAgent.ts L156-L255](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L156-L255)

---

## Security Considerations

### Private Key Management

**Critical:** Never commit private keys to version control. Use environment variables exclusively.

Railway and other platforms store environment variables encrypted at rest. However:

* Rotate private keys periodically
* Use dedicated agent wallet separate from personal funds
* Monitor agent wallet for unexpected transactions

**Sources:** [agent/src/ArenaAgent.ts L31-L38](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L31-L38)

### Gas Price Management

The agent uses default gas settings from `viem`. For production deployments on congested networks:

1. Monitor gas costs in agent logs
2. Set explicit gas limits if needed: ```javascript const { request } = await publicClient.simulateContract({     ...contractParams,     gas: 500000n // Explicit gas limit }); ```

**Note:** Monad's high throughput typically results in low gas prices, making explicit gas management less critical.

**Sources:** [agent/src/ArenaAgent.ts L363-L439](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L363-L439)

### Rate Limiting

The agent does not implement artificial rate limiting as:

* Blockchain transaction throughput naturally limits submission rate
* 30-second polling interval prevents excessive RPC calls
* Lock mechanisms prevent duplicate processing

For high-volume scenarios, consider adding exponential backoff after repeated failures.

**Sources:** [agent/src/ArenaAgent.ts L299](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L299-L299)

---

## Configuration Reference

### Constants

| Constant | Value | Description | Source |
| --- | --- | --- | --- |
| `ARENA_ADDRESS` | `0x30af30ec392b881b009a0c6b520ebe6d15722e9b` | ArenaPlatform contract | [ArenaAgent.ts L28](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ArenaAgent.ts#L28-L28) |
| `REGISTRY_ADDRESS` | `0x34FCEE3eFaA15750B070836F19F3970Ad20fE8d1` | EIP-8004 Registry | [ArenaAgent.ts L258](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ArenaAgent.ts#L258-L258) |
| `MONAD_MAINNET.id` | `143` | Monad chain ID | [ArenaAgent.ts L43](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ArenaAgent.ts#L43-L43) |
| Scan interval | `30000` ms | Periodic match scanner | [ArenaAgent.ts L299](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ArenaAgent.ts#L299-L299) |
| Retry attempts | `3` | RPC retry count | [ArenaAgent.ts L156](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ArenaAgent.ts#L156-L156) |
| Wager limit | `50%` of balance | Maximum acceptable wager | [ArenaAgent.ts L355](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/ArenaAgent.ts#L355-L355) |

**Sources:** [agent/src/ArenaAgent.ts L28-L355](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L28-L355)

---

## Next Steps

After successfully deploying the agent:

1. **Monitor Performance**: Track match acceptance rate, win rate, and transaction success
2. **Optimize Strategy**: Adjust Markov Chain parameters in `OpponentModel` class (see [Markov Chain Intelligence](/HACK3R-CRYPTO/GameArena/5.2-markov-chain-intelligence))
3. **Scale Horizontally**: Deploy multiple agents with different wallets and strategies
4. **Integrate Social Features**: Configure `MOLTBOOK_API_KEY` for automated social updates (see [Social Integration (Moltbook)](/HACK3R-CRYPTO/GameArena/5.5-social-integration-(moltbook)))

For frontend deployment to interact with your agent, see [Deploying the Frontend](/HACK3R-CRYPTO/GameArena/8.4-deploying-the-frontend).

**Sources:** [agent/src/ArenaAgent.ts L73-L143](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/agent/src/ArenaAgent.ts#L73-L143)

 [README.md L20-L26](https://github.com/HACK3R-CRYPTO/GameArena/blob/30ace840/README.md#L20-L26)