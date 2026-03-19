'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { TOKENS, TokenKey, ERC20_ABI, MARKETPLACE_WALLET } from '@/lib/contracts';

const books = [
  { id: 'b1', icon: '⬡', color: '#F7931A', category: 'Lead Intelligence', title: 'Web3 Lead Intelligence Masterclass', desc: 'How autonomous agents discover, score, and monetize Web3 opportunities. The complete AOX methodology.', pages: 84, price: 5, badge: 'new' },
  { id: 'b2', icon: '◈', color: '#F7931A', category: 'AI Agents', title: 'AI Agent Economy Playbook', desc: 'Building autonomous economic agents on Base. ERC-8004 identity, x402 payments, treasury management.', pages: 96, price: 5, badge: 'new' },
  { id: 'b3', icon: '◎', color: '#66c800', category: 'DeFi', title: 'DeFi Due Diligence Framework', desc: 'Evaluating DeFi protocols like a pro. Liquidity analysis, smart contract risk, team credibility scoring.', pages: 72, price: 5, badge: null },
  { id: 'b4', icon: '⌘', color: '#569cd6', category: 'NFT', title: 'NFT Project Evaluation Toolkit', desc: 'Score any NFT collection before it launches. The 47-point framework used by AOX scoring agents.', pages: 60, price: 5, badge: null },
  { id: 'b5', icon: '◆', color: '#0052FF', category: 'Base Chain', title: "Base Builder's Complete Guide", desc: 'Deploy on Base from zero. Wallet setup, contract deployment, Uniswap integration, ENS naming.', pages: 88, price: 5, badge: null },
  { id: 'b6', icon: '▲', color: '#66c800', category: 'Free Guide', title: 'x402 Payments for AI Agents', desc: 'A free introduction to x402 — the HTTP payment standard that lets agents pay each other autonomously.', pages: 24, price: 0, badge: 'free' },
  { id: 'b7', icon: '●', color: '#66c800', category: 'Free Guide', title: 'ERC-8004 Quick Start', desc: 'Register your AI agent onchain in 30 minutes. Identity, ENS, and Base deployment.', pages: 18, price: 0, badge: 'free' },
  { id: 'b8', icon: '◉', color: '#F7931A', category: 'Investing', title: 'Web3 VC Intelligence Report 2026', desc: 'Where the smart money is going in 2026. AI agent infrastructure, Base ecosystem, and emerging DeFi.', pages: 52, price: 8, badge: 'new' },
];

export default function Ebooks() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract, data: hash, isPending: txPending } = useWriteContract();
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash });
  
  const [selectedBook, setSelectedBook] = useState<typeof books[0] | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenKey>('USDC');
  const [step, setStep] = useState<'select' | 'processing' | 'success' | 'error'>('select');
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');

  const handleConnect = () => {
    const coinbaseConnector = connectors.find((c) => c.id === 'coinbaseWallet');
    if (coinbaseConnector) connect({ connector: coinbaseConnector });
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const buyBook = (book: typeof books[0]) => {
    if (book.price === 0) {
      setSelectedBook(book);
      setStep('select');
      return;
    }
    if (!isConnected) {
      handleConnect();
      return;
    }
    setSelectedBook(book);
    setStep('select');
  };

  const executePurchase = () => {
    if (!selectedBook) return;
    if (selectedBook.price === 0) {
      setStep('success');
      return;
    }
    setStep('processing');
    
    const token = TOKENS[selectedToken];
    const amount = parseUnits(selectedBook.price.toString(), token.decimals);

    writeContract({
      address: token.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [MARKETPLACE_WALLET as `0x${string}`, amount],
    }, {
      onSuccess: () => setStep('success'),
      onError: (err) => {
        setErrorMsg(err.message || 'Transaction failed');
        setStep('error');
      },
    });
  };

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav>
        <Link href="/" className="nav-logo" style={{ textDecoration: 'none', color: 'white' }}>A<span>O</span>X</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="nav-status">
            <div className="status-dot"></div>
            MARKETPLACE LIVE
          </div>
          <button 
            className="btn-primary"
            onClick={isConnected ? () => disconnect() : handleConnect}
            disabled={connectPending}
          >
            {connectPending ? 'Connecting...' : isConnected ? formatAddress(address!) : 'Connect Wallet'}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: '100px', textAlign: 'center', padding: '120px 40px 60px' }}>
        <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.3em', marginBottom: '16px' }}>
          // AOX INTELLIGENCE SERIES
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '16px' }}>
          <span style={{ color: 'var(--cyan)' }}>Tactical</span> Intelligence
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', maxWidth: '600px', margin: '0 auto' }}>
          For builders, agents, and operators. No theory. Only what works. Written by AOX for the autonomous economy.
        </p>
      </div>

      {/* Books Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', padding: '0 40px 60px' }}>
        {books.map((book) => (
          <div key={book.id} style={{ background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Cover */}
            <div style={{ height: '180px', background: 'linear-gradient(135deg, var(--dark3) 0%, var(--dark2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {book.badge && (
                <span style={{ 
                  position: 'absolute', top: '12px', right: '12px',
                  fontFamily: 'ui-monospace, monospace', fontSize: '10px', padding: '4px 8px',
                  background: book.badge === 'new' ? 'rgba(247,147,26,0.2)' : 'rgba(102,200,0,0.2)',
                  color: book.badge === 'new' ? 'var(--orange)' : 'var(--green)',
                  borderRadius: '2px', textTransform: 'uppercase'
                }}>
                  {book.badge}
                </span>
              )}
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '8px' }}>{book.icon}</span>
                <div style={{ fontSize: '10px', color: 'var(--muted)', fontFamily: 'ui-monospace, monospace' }}>AOX // 2026</div>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: book.color }} />
            </div>
            
            {/* Content */}
            <div style={{ padding: '20px' }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{book.category}</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{book.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px', lineHeight: 1.5 }}>{book.desc}</p>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--muted)' }}>{book.pages} pages</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--muted)' }}>PDF</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--muted)' }}>Instant</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: book.price === 0 ? 'var(--green)' : 'var(--orange)' }}>
                    {book.price === 0 ? 'FREE' : `$${book.price}`}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '8px' }}>{book.price === 0 ? '' : 'USDC'}</span>
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => buyBook(book)}
                  style={{ 
                    background: book.price === 0 ? 'var(--green)' : 'var(--orange)',
                    color: book.price === 0 ? 'white' : '#080808'
                  }}
                >
                  {book.price === 0 ? 'Download →' : 'Purchase →'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer>
        <div className="footer-logo">A<span>O</span>X</div>
        <div className="footer-copy">© 2026 AOX — AGENT OPPORTUNITY EXCHANGE</div>
        <div className="footer-links">
          <a href="https://x.com/PupAIOnBase" target="_blank" rel="noopener noreferrer">TWITTER</a>
          <a href="#">FARCASTER</a>
          <a href="#">DOCS</a>
        </div>
      </footer>

      {/* Purchase Modal */}
      {selectedBook && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelectedBook(null)}
        >
          <div 
            style={{ background: 'var(--dark2)', border: '1px solid var(--border)', padding: '32px', maxWidth: '400px', width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {step === 'select' && (
              <>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                  {selectedBook.price === 0 ? 'Free Download' : 'Purchase Ebook'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '24px' }}>
                  {selectedBook.price === 0 ? 'Enter your email for the download link.' : 'Instant access after payment confirms on Base.'}
                </p>
                
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ color: 'var(--muted)' }}>Title: </span>
                  <span>{selectedBook.title}</span>
                </div>
                
                {selectedBook.price > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ color: 'var(--muted)' }}>Price: </span>
                    <span style={{ color: 'var(--orange)', fontWeight: 700 }}>${selectedBook.price}</span>
                  </div>
                )}
                
                {selectedBook.price === 0 ? (
                  <div style={{ marginBottom: '24px' }}>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ 
                        width: '100%', padding: '12px', background: 'var(--dark3)', 
                        border: '1px solid var(--border)', color: 'white', fontFamily: 'ui-monospace, monospace'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10px', color: 'var(--muted)', marginBottom: '8px' }}>// SELECT TOKEN</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {(Object.keys(TOKENS) as TokenKey[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedToken(t)}
                          style={{
                            padding: '6px 12px',
                            fontFamily: 'ui-monospace, monospace',
                            fontSize: '11px',
                            background: selectedToken === t ? 'var(--orange)' : 'var(--dark3)',
                            color: selectedToken === t ? '#080808' : 'var(--muted)',
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                          }}
                        >
                          {t === 'BNKR' ? '$BNKR' : t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => setSelectedBook(null)}
                    style={{ flex: 1, padding: '12px', background: 'var(--dark3)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={executePurchase}
                    disabled={txPending || (selectedBook.price === 0 && !email)}
                    style={{ flex: 1 }}
                  >
                    {txPending ? 'Confirming...' : selectedBook.price === 0 ? 'Get Free PDF →' : 'Pay Now →'}
                  </button>
                </div>
              </>
            )}
            
            {step === 'processing' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '14px', color: 'var(--orange)', marginBottom: '16px' }}>
                  PROCESSING {selectedToken} PAYMENT
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--muted)' }}>
                  <div style={{ marginBottom: '8px', opacity: hash ? 1 : 0.5 }}>→ {hash ? 'Transaction sent' : 'Sending...'}</div>
                  <div style={{ marginBottom: '8px', opacity: confirming ? 1 : 0.5 }}>→ Confirming on Base...</div>
                  <div style={{ opacity: 0.5 }}>→ Unlocking content...</div>
                </div>
              </div>
            )}
            
            {step === 'success' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>⬡</div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                  {selectedBook.price === 0 ? 'Download Ready' : 'Purchase Complete'}
                </h3>
                {hash && (
                  <p style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--muted)', marginBottom: '16px' }}>
                    Tx: {hash.slice(0, 10)}...{hash.slice(-6)}
                  </p>
                )}
                {selectedBook.price === 0 && email && (
                  <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
                    Link sent to {email}
                  </p>
                )}
                <button className="btn-primary" onClick={() => setSelectedBook(null)} style={{ width: '100%' }}>
                  {selectedBook.price === 0 ? 'Download PDF' : 'Close'}
                </button>
              </div>
            )}
            
            {step === 'error' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ color: '#ef4444', marginBottom: '16px' }}>FAILED</div>
                <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '24px' }}>{errorMsg}</p>
                <button className="btn-primary" onClick={() => setStep('select')}>
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
