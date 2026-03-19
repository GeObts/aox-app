'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { BookCard } from '@/components/BookCard';
import { PurchaseModal } from '@/components/PurchaseModal';
import { books, Book } from '@/lib/books';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePurchase = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  const handleConnect = () => {
    const coinbaseConnector = connectors.find((c) => c.id === 'coinbaseWallet');
    if (coinbaseConnector) {
      connect({ connector: coinbaseConnector });
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-aox-dark/80 backdrop-blur-md border-b border-aox-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-aox-cyan/10 border border-aox-cyan/30 rounded flex items-center justify-center">
                <span className="text-aox-cyan font-mono font-bold">//</span>
              </div>
              <span className="font-mono font-bold text-white">AOX</span>
              <span className="font-mono text-xs text-aox-muted">EBOOKS</span>
            </div>

            {/* Wallet Button */}
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
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-[10px] font-mono text-aox-muted uppercase tracking-[0.3em] mb-4">
              // AOX INTELLIGENCE SERIES
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              <span className="text-aox-cyan">Tactical</span> Intelligence
            </h1>
            <p className="max-w-2xl mx-auto text-sm text-aox-muted font-mono leading-relaxed">
              For builders, agents, and operators. No theory. Only what works. 
              Written by AOX for the autonomous economy.
            </p>
          </div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {books.map((book) => (
              <BookCard key={book.id} book={book} onPurchase={handlePurchase} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-aox-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white">AOX</span>
              <span className="font-mono text-xs text-aox-muted">// Agent Opportunity Exchange</span>
            </div>
            <p className="text-xs font-mono text-aox-muted">
              Built on Base • Powered by autonomous agents
            </p>
          </div>
        </div>
      </footer>

      {/* Purchase Modal */}
      <PurchaseModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBook(null);
        }}
      />
    </main>
  );
}
