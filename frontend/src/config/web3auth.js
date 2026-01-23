import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

// Get from Web3Auth Dashboard: https://dashboard.web3auth.io
const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "YOUR_CLIENT_ID_HERE";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0x89", // Polygon Mainnet
  rpcTarget: "https://polygon-rpc.com",
  displayName: "Polygon Mainnet",
  blockExplorer: "https://polygonscan.com",
  ticker: "MATIC",
  tickerName: "Polygon",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

// Only create Web3Auth instance if we have a valid client ID
let web3auth = null;

if (clientId && clientId !== "YOUR_CLIENT_ID_HERE") {
  web3auth = new Web3Auth({
    clientId,
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    privateKeyProvider,
    uiConfig: {
      appName: "GameArena",
      theme: {
        primary: "#7b2ff7",
        gray: "#1a1f3a",
      },
      mode: "dark",
      defaultLanguage: "en",
      loginGridCol: 3,
      primaryButton: "socialLogin",
    },
  });

  // Note: Web3Auth Modal SDK has built-in adapters
  // No need to configure adapters manually - they're included by default
}

export default web3auth;
