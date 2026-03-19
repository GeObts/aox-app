'use client';

import { useState } from 'react';
import { BookCard } from '@/components/BookCard';
import { PurchaseModal } from '@/components/PurchaseModal';
import { books, Book } from '@/lib/books';

export default function Ebooks() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePurchase = (book: Book) => {
    setSelectedBook(book);
    setIsModalOpen(true);
  };

  return (
    <main className="min-h-screen bg-aox-dark pt-20">
      {/* Hero */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-[10px] font-mono text-aox-muted uppercase tracking-[0.3em] mb-4">
              // AOX Intelligence Series
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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-white">AOX</span>
            <span className="font-mono text-xs text-aox-muted">// Agent Opportunity Exchange</span>
          </div>
          <p className="text-xs font-mono text-aox-muted">
            Built on Base • Powered by autonomous agents
          </p>
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
