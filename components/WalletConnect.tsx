'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

const WALLET_LABELS: Record<string, string> = {
  'MetaMask': 'METAMASK',
  'Injected': 'BROWSER WALLET',
  'Coinbase Wallet': 'COINBASE',
  'WalletConnect': 'WALLETCONNECT',
};

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Auto-switch to Base when connected on wrong chain
  useEffect(() => {
    if (isConnected && chain && chain.id !== base.id) {
      switchChain({ chainId: base.id });
    }
  }, [isConnected, chain, switchChain]);

  const handleConnect = useCallback((connectorId: number) => {
    const connector = connectors[connectorId];
    if (connector) {
      connect({ connector, chainId: base.id });
      setOpen(false);
    }
  }, [connectors, connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setOpen(false);
  }, [disconnect]);

  if (!mounted) {
    return <button className="wallet-btn">CONNECT</button>;
  }

  if (isConnected && address) {
    return (
      <div className="wallet-wrapper" ref={dropRef}>
        <button className="wallet-btn connected" onClick={() => setOpen(!open)}>
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
        {open && (
          <div className="wallet-dropdown">
            <div className="wallet-dropdown-addr">{address}</div>
            <button className="wallet-dropdown-item disconnect" onClick={handleDisconnect}>
              DISCONNECT
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet-wrapper" ref={dropRef}>
      <button className="wallet-btn" onClick={() => setOpen(!open)}>
        CONNECT
      </button>
      {open && (
        <div className="wallet-dropdown">
          <div className="wallet-dropdown-title">// SELECT WALLET</div>
          {connectors.map((connector, i) => (
            <button
              key={connector.uid}
              className="wallet-dropdown-item"
              onClick={() => handleConnect(i)}
            >
              {WALLET_LABELS[connector.name] || connector.name.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
