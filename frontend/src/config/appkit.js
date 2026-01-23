import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia } from 'viem/chains'

// Get project ID from https://cloud.reown.com
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'YOUR_PROJECT_ID'

const metadata = {
  name: 'TournamentChain',
  description: 'Decentralized Gaming Tournament Platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://tournamentchain.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const networks = [sepolia, mainnet]

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false, // Disable analytics to avoid API calls
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple', 'facebook'],
    smartSessions: false,
    onramp: false,
    swaps: false
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#7b2ff7'
  },
  allWallets: 'HIDE', // Hide the wallet list that's causing the API error
  featuredWalletIds: [],
  includeWalletIds: [],
  excludeWalletIds: []
})

export const config = wagmiAdapter.wagmiConfig
