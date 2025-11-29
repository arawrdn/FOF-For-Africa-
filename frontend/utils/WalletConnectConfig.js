import { createWalletKit } from '@reown/walletkit';

// Your Project ID from the saved information
const projectId = 'a5f9260bc9bca570190d3b01f477fc45'; 

// Target chain (e.g., Ethereum Mainnet - Chain ID 1)
const defaultChainId = 1; 

export const { WalletKitProvider, useWalletKit } = createWalletKit({
  projectId,
  defaultChainId,
  chains: [
    // Define the network(s) your DApp supports
    {
      chainId: 1,
      name: 'Ethereum',
      rpcUrl: 'YOUR_ETHEREUM_RPC_URL', // Use a provider like Alchemy or Infura
    },
    // Add other networks if needed, e.g., Polygon
  ],
});
