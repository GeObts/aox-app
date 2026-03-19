'use client';

import { Book } from '@/lib/books';

interface BookCardProps {
  book: Book;
  onPurchase: (book: Book) => void;
}

export function BookCard({ book, onPurchase }: BookCardProps) {
  return (
    <div className="book-card group relative bg-aox-dark2 border border-aox-border rounded-lg overflow-hidden hover:border-aox-cyan/30 transition-all duration-300">
      {book.badge && (
        <div className={`badge absolute top-3 right-3 px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded ${
          book.badge === 'new' ? 'bg-aox-orange/20 text-aox-orange border border-aox-orange/30' :
          'bg-aox-green/20 text-aox-green border border-aox-green/30'
        }`}>
          {book.badge}
        </div>
      )}
      
      <div className="book-cover relative h-48 bg-gradient-to-br from-aox-dark to-aox-dark3 flex items-center justify-center overflow-hidden">
        <div className="book-cover-inner text-center z-10">
          <span className="book-cover-icon text-4xl mb-2 block">{book.icon}</span>
          <div className="book-cover-title text-xs font-mono text-white/80 max-w-[140px] mx-auto leading-tight">
            {book.title}
          </div>
          <div className="book-cover-sub text-[10px] font-mono text-aox-muted mt-2">AOX // 2026</div>
        </div>
        <div 
          className="book-cover-stripe absolute bottom-0 left-0 right-0 h-1"
          style={{ background: book.color }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-aox-dark/80 to-transparent" />
      </div>
      
      <div className="p-4">
        <div className="book-category text-[10px] font-mono text-aox-muted uppercase tracking-wider mb-2">
          {book.category}
        </div>
        <h3 className="book-title text-sm font-mono text-white mb-2 line-clamp-2">
          {book.title}
        </h3>
        <p className="book-desc text-xs text-aox-muted mb-4 line-clamp-2">
          {book.desc}
        </p>
        
        <div className="book-meta flex gap-3 mb-4">
          <div className="meta-item flex items-center gap-1.5">
            <div className="meta-dot w-1.5 h-1.5 rounded-full bg-aox-cyan" />
            <span className="text-[10px] font-mono text-aox-muted">{book.pages} pages</span>
          </div>
          <div className="meta-item flex items-center gap-1.5">
            <div className="meta-dot w-1.5 h-1.5 rounded-full bg-aox-cyan" />
            <span className="text-[10px] font-mono text-aox-muted">PDF</span>
          </div>
          <div className="meta-item flex items-center gap-1.5">
            <div className="meta-dot w-1.5 h-1.5 rounded-full bg-aox-cyan" />
            <span className="text-[10px] font-mono text-aox-muted">Instant</span>
          </div>
        </div>
        
        <div className="book-footer flex items-center justify-between">
          <div>
            <span className="price-amount text-lg font-mono font-bold text-aox-orange">
              {book.price === 0 ? 'FREE' : `$${book.price}`}
            </span>
            <span className="price-token text-[10px] font-mono text-aox-muted ml-2">
              {book.price === 0 ? 'NO PAYMENT' : 'USDC · ETH · $BNKR'}
            </span>
          </div>
          <button
            onClick={() => onPurchase(book)}
            className={`buy-btn px-4 py-2 text-xs font-mono font-bold rounded transition-all duration-200 ${
              book.price === 0
                ? 'bg-aox-green/20 text-aox-green border border-aox-green/30 hover:bg-aox-green/30'
                : 'bg-aox-orange text-aox-dark hover:bg-aox-orange/90'
            }`}
          >
            {book.price === 0 ? 'Download →' : 'Purchase →'}
          </button>
        </div>
      </div>
    </div>
  );
}
