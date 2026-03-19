'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, walletConnect } from 'wagmi/connectors';
import { ReactNode } from 'react';

// OnchainKit configuration
const config = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'AOX App',
      appLogoUrl: 'https://aox.llc/logo.png',
      preference: 'smartWalletOnly',
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'ed0954223df16d7761fcc0402032eb81',
      metadata: {
        name: 'AOX App',
        description: 'Agent Opportunity Exchange - Web3 Intelligence Marketplace',
        url: 'https://aox.llc',
        icons: ['https://aox.llc/logo.png'],
      },
    }),
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org'),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
