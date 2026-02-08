import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

// Monad Mainnet Chain
const monadMainnet = {
  id: 143,
  name: 'Monad Mainnet',
  network: 'monad',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] },
    public: { http: ['https://rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://monadvision.com/' },
  },
};

export const config = createConfig({
  chains: [monadMainnet, mainnet, sepolia],
  connectors: [
    injected(),
    walletConnect({ projectId }),
  ],
  transports: {
    [monadMainnet.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
