'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';
import { type ReactNode, useState } from 'react';

const config = createConfig({
  chains: [base],
  // EIP-6963 auto-discovers all installed wallets (Rabby, MetaMask, etc.)
  multiInjectedProviderDiscovery: true,
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'AOX',
      appLogoUrl: 'https://aox.llc/logo.png',
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'ed0954223df16d7761fcc0402032eb81',
      metadata: {
        name: 'AOX',
        description: 'Agent Opportunity Exchange',
        url: 'https://aox.llc',
        icons: ['https://aox.llc/logo.png'],
      },
    }),
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org'),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
