'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'
import { Toaster } from 'sonner'
import { WalletProvider } from '@/contexts/WalletContext'
import { config } from '@/lib/wagmi'

// Dev mode flag
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  const content = (
    <WalletProvider>
      {children}
      <Toaster />
    </WalletProvider>
  )

  // In dev mode, skip wagmi/ConnectKit entirely
  if (DEV_MODE) {
    return content
  }

  // Production mode: full Web3 stack
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="auto">
          {content}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
