import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors'

// WalletConnect Project ID - get yours at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(), // MetaMask, Brave Wallet, etc.
    walletConnect({ 
      projectId,
      metadata: {
        name: 'AuditChain',
        description: 'Decentralized smart contract audit platform',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://auditchain.app',
        icons: ['https://auditchain.app/icon.png'],
      },
      showQrModal: true,
    }),
    coinbaseWallet({ 
      appName: 'AuditChain',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
