import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

const monadMainnet = {
  id: 143,
  name: 'Monad Mainnet',
  network: 'monad',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] },
    public: { http: ['https://rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Vision', url: 'https://monadvision.com' },
  },
  testnet: false,
}

const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz/'] },
    public: { http: ['https://testnet-rpc.monad.xyz/'] },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
}

// Get project ID from https://cloud.reown.com
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'YOUR_PROJECT_ID'

const metadata = {
  name: 'TournamentChain',
  description: 'Decentralized Gaming Tournament Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://tournamentchain.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const networks = [monadMainnet, monadTestnet]

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
})

createAppKit({
  adapters: [wagmiAdapter],
  networks: [monadMainnet, monadTestnet],
  defaultNetwork: monadMainnet,
  projectId,
  metadata,
  features: {
    analytics: false,
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple', 'facebook'],
    smartSessions: false,
    onramp: false,
    swaps: false
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#7b2ff7'
  }
})

export const config = wagmiAdapter.wagmiConfig
