'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';

export function Navigation() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleConnect = () => {
    const coinbaseConnector = connectors.find((c) => c.id === 'coinbaseWallet');
    if (coinbaseConnector) {
      connect({ connector: coinbaseConnector });
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/ebooks', label: 'Ebooks' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-aox-dark/95 backdrop-blur-md border-b border-aox-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="nav-logo text-xl font-bold text-white">
              A<span className="text-aox-orange">O</span>X
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-mono uppercase tracking-wider transition-colors ${
                  isActive(link.href)
                    ? 'text-aox-cyan'
                    : 'text-aox-muted hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-aox-muted">
              <div className="w-2 h-2 rounded-full bg-aox-green animate-pulse" />
              AGENTS OPERATIONAL
            </div>

            <button
              onClick={isConnected ? () => disconnect() : handleConnect}
              disabled={isPending}
              className={`px-4 py-2 text-xs font-mono font-bold rounded transition-all duration-200 ${
                isConnected
                  ? 'bg-aox-dark3 border border-aox-border text-aox-cyan hover:border-aox-cyan'
                  : 'bg-aox-orange text-aox-dark hover:bg-aox-orange/90'
              }`}
            >
              {isPending ? 'Connecting...' : isConnected ? formatAddress(address!) : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
