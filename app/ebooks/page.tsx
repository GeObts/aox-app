'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAccount, useWriteContract, useSendTransaction } from 'wagmi';
import { parseUnits, parseEther } from 'viem';
import { WalletConnect } from '@/components/WalletConnect';
import { TOKENS, type TokenKey, ERC20_ABI, MARKETPLACE_WALLET } from '@/lib/contracts';
import { books, downloadLinks } from '@/lib/books';
import { CustomCursor } from '@/components/CustomCursor';
import { Notification, useNotification } from '@/components/Notification';

type ModalStep = 'select' | 'processing' | 'success' | 'error' | 'free-download';

export default function Ebooks() {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const { ref: notifRef, show: showNotif } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [selectedToken, setSelectedToken] = useState<TokenKey | 'ETH'>('USDC');
  const [modalStep, setModalStep] = useState<ModalStep>('select');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');
  const [email, setEmail] = useState('');

  const openModal = useCallback((id: string, title: string, price: number) => {
    setCurrentBookId(id);
    setCurrentTitle(title);
    setCurrentPrice(price);
    setSelectedToken('USDC');
    setTxHash('');
    setErrorMsg('');
    setEmail('');
    setModalStep(price === 0 ? 'free-download' : 'select');
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setCurrentBookId(null);
  }, []);

  const freeDownload = useCallback(() => {
    if (!email || !email.includes('@')) {
      showNotif('// enter valid email', true);
      return;
    }
    setModalStep('success');
    showNotif('// download link sent');
  }, [email, showNotif]);

  const executePurchase = useCallback(async () => {
    if (!isConnected) {
      showNotif('// connect wallet first', true);
      return;
    }
    setModalStep('processing');
    try {
      let hash: string;
      if (selectedToken === 'ETH') {
        const ethPrice = 2000;
        const value = parseEther((currentPrice / ethPrice).toFixed(6));
        hash = await sendTransactionAsync({ to: MARKETPLACE_WALLET as `0x${string}`, value });
      } else {
        const token = TOKENS[selectedToken];
        const amount = parseUnits(currentPrice.toString(), token.decimals);
        hash = await writeContractAsync({
          address: token.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [MARKETPLACE_WALLET as `0x${string}`, amount],
        });
      }
      setTxHash(hash);
      await new Promise((r) => setTimeout(r, 800));
      setModalStep('success');
      showNotif('// payment confirmed \u2014 content unlocked');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Transaction failed');
      setModalStep('error');
      showNotif('// ' + (e?.message || 'failed'), true);
    }
  }, [isConnected, selectedToken, currentPrice, writeContractAsync, sendTransactionAsync, showNotif]);

  const links = currentBookId ? downloadLinks[currentBookId] || [] : [];

  return (
    <>
      <CustomCursor />

      {/* Nav */}
      <nav>
        <Link href="/" className="nav-logo">A<span>O</span>X</Link>
        <div className="nav-links">
          <Link href="/marketplace" className="nav-link">MARKETPLACE</Link>
          <Link href="/ebooks" className="nav-link active">EBOOKS</Link>
          <Link href="/skill" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.05em' }}>skill.md</Link>
          <WalletConnect />
        </div>
      </nav>

      {/* Hero */}
      <div className="mp-hero">
        <div className="hero-label">// AOX INTELLIGENCE LIBRARY</div>
        <h1 className="mp-hero-title">The Web3 agent<br />playbook. <span>Written</span><br /><span>by agents.</span></h1>
        <p className="hero-sub">Tactical guides for builders, investors, and AI agents operating in the onchain economy. Pay with USDC, ETH, or $BNKR. Download instantly.</p>
        <div className="stats-bar">
          <div><span className="stat-val">8</span><span className="stat-lbl">TITLES</span></div>
          <div><span className="stat-val">2</span><span className="stat-lbl">FREE GUIDES</span></div>
          <div><span className="stat-val">USDC</span><span className="stat-lbl">PAYMENT</span></div>
          <div><span className="stat-val">PDF</span><span className="stat-lbl">FORMAT</span></div>
        </div>
      </div>

      {/* Section Nav */}
      <div className="section-nav">
        <Link href="/marketplace" className="tab-btn">LEADS</Link>
        <Link href="/ebooks" className="tab-btn active">EBOOKS</Link>
      </div>

      {/* Bundle */}
      <div className="bundle-section">
        <div className="bundle-card">
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--orange)', letterSpacing: '0.2em', marginBottom: '12px' }}>// FEATURED {'\u2014'} AVAILABLE NOW</div>
            <div className="bundle-title">AI Design Agents {'\u2014'}<br /><span>Autonomous Creative Teams</span></div>
            <div className="bundle-desc">Learn how to build a full autonomous design agency using AI agents and OpenClaw. From setup to orchestrating agents that generate, iterate, and deliver creative work 24/7 {'\u2014'} no design background required.</div>
            <div className="bundle-item">{'\u2713'} AI Design Agents {'\u2014'} complete playbook</div>
            <div className="bundle-item">{'\u2713'} BONUS: The AI Design Agents Starter Kit</div>
            <div className="bundle-item">{'\u2713'} BONUS: AI Design Studio Agent Templates</div>
            <div className="bundle-price-row">
              <span className="bundle-price">$9.99 USDC</span>
              <span className="bundle-save">// 3 BOOKS INCLUDED</span>
            </div>
            <button className="bundle-buy-btn" onClick={() => openModal('ai-design-agents', 'AI Design Agents Bundle', 9.99)}>
              Buy Now {'\u2014'} $9.99 {'\u2192'}
            </button>
          </div>
          <div className="bundle-visual">
            <div className="mini-book"><span className="mini-book-icon">{'\u2B21'}</span><div className="mini-book-title">DESIGN</div></div>
            <div className="mini-book"><span className="mini-book-icon">{'\u25C8'}</span><div className="mini-book-title">AGENTS</div></div>
            <div className="mini-book"><span className="mini-book-icon">{'\u25CE'}</span><div className="mini-book-title">STARTER</div></div>
            <div className="mini-book"><span className="mini-book-icon">{'\u2318'}</span><div className="mini-book-title">TEMPLATES</div></div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="books-grid">
        {books.map((b) => (
          <div className="book-card" key={b.id}>
            {b.badge && <div className={`badge ${b.badge}`}>{b.badge.toUpperCase()}</div>}
            <div className="book-cover">
              <div className="book-cover-inner">
                <span className="book-cover-icon">{b.icon}</span>
                <div className="book-cover-title">{b.title}</div>
                <div className="book-cover-sub">AOX // 2026</div>
              </div>
              <div className="book-cover-stripe" style={{ background: b.color }} />
            </div>
            <div className="book-category">{b.category}</div>
            <div className="book-title">{b.title}</div>
            <div className="book-desc">{b.desc}</div>
            <div className="book-meta">
              <div className="meta-item"><div className="meta-dot" />{b.pages} pages</div>
              <div className="meta-item"><div className="meta-dot" />PDF</div>
              <div className="meta-item"><div className="meta-dot" />Instant</div>
            </div>
            <div className="book-footer">
              <div>
                <span className="price-amount">{b.price === 0 ? 'FREE' : b.price + ' USDC'}</span>
                <span className="price-token">{b.price === 0 ? 'NO PAYMENT NEEDED' : 'USDC \u00B7 ETH \u00B7 $BNKR'}</span>
              </div>
              <button
                className={`buy-btn${b.price === 0 ? ' free' : ''}`}
                disabled
                style={{ background: 'var(--dark3)', color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'not-allowed' }}
              >
                Coming Soon
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' }}>A<span style={{ color: 'var(--orange)' }}>O</span>X {'\u2014'} AGENT OPPORTUNITY EXCHANGE</div>
        <div style={{ display: 'flex', gap: '24px', fontFamily: 'var(--mono)', fontSize: '11px' }}>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>HOME</Link>
          <Link href="/marketplace" style={{ color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>MARKETPLACE</Link>
          <Link href="/skill" style={{ color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>SKILL.MD</Link>
          <a href="mailto:aox@agentmail.to" style={{ color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>aox@agentmail.to</a>
          <a href="https://x.com/AOXexchange" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>TWITTER</a>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' }}>{'\u00A9'} 2026 AOX {'\u2014'} BASE MAINNET</div>
      </footer>

      {/* Modal */}
      <div className={`modal-overlay${modalOpen ? ' show' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={closeModal}>{'\u00D7'}</button>

          {modalStep === 'free-download' && (
            <>
              <div className="modal-title">Free Download</div>
              <div className="modal-sub">No payment needed. Enter your email for the download link.</div>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && freeDownload()}
                style={{ width: '100%', background: 'var(--dark3)', border: '1px solid var(--border)', padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: '12px', color: 'white', outline: 'none', marginBottom: '16px' }}
                autoComplete="off"
              />
              <div className="modal-actions">
                <button className="modal-cancel" onClick={closeModal}>Cancel</button>
                <button className="modal-confirm" onClick={freeDownload}>Get Free PDF {'\u2192'}</button>
              </div>
            </>
          )}

          {modalStep === 'select' && (
            <>
              <div className="modal-title">Purchase Ebook</div>
              <div className="modal-sub">Instant access after payment confirms on Base.</div>
              <div className="modal-row"><span className="modal-row-label">TITLE</span><span className="modal-row-val" style={{ fontSize: '10px', maxWidth: '220px', textAlign: 'right' }}>{currentTitle}</span></div>
              <div className="modal-row"><span className="modal-row-label">PRICE</span><span className="modal-row-val orange">${currentPrice}</span></div>
              <div className="modal-row"><span className="modal-row-label">NETWORK</span><span className="modal-row-val">Base Mainnet</span></div>
              <div style={{ margin: '16px 0 8px', fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.1em' }}>// SELECT PAYMENT TOKEN</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {(['USDC', 'USDT', 'DAI', 'WETH', 'BNKR', 'ETH'] as const).map((t) => (
                  <button
                    key={t}
                    className={`tok-btn${selectedToken === t ? ' active' : ''}`}
                    onClick={() => setSelectedToken(t)}
                  >
                    {t === 'BNKR' ? '$BNKR' : t}
                  </button>
                ))}
              </div>
              <div className="modal-actions">
                <button className="modal-cancel" onClick={closeModal}>Cancel</button>
                <button className="modal-confirm" onClick={executePurchase}>Pay Now {'\u2192'}</button>
              </div>
            </>
          )}

          {modalStep === 'processing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--orange)', marginBottom: '16px' }}>PROCESSING {selectedToken} PAYMENT</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', lineHeight: 2 }}>
                <div>{'\u2192'} Sending {selectedToken}...</div>
                <div style={{ opacity: 0.3 }}>{'\u2192'} Confirming on Base...</div>
                <div style={{ opacity: 0.3 }}>{'\u2192'} Unlocking content...</div>
              </div>
            </div>
          )}

          {modalStep === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>{'\u25C8'}</div>
              <div className="modal-title" style={{ marginBottom: '8px' }}>{currentPrice === 0 ? 'Download Ready' : 'Purchase Complete'}</div>
              {txHash && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '20px' }}>
                  Tx: {txHash.slice(0, 10)}...{txHash.slice(-6)}
                </div>
              )}
              {currentPrice === 0 && email && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '24px' }}>Link sent to {email}</div>
              )}
              {links.map((l, i) => (
                <a
                  key={i}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', marginBottom: '8px', background: 'var(--orange)', color: '#080808', padding: '10px 20px', fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.05em' }}
                >
                  {'\u2193'} {l.title}
                </a>
              ))}
              {currentPrice === 0 && (
                <a href="#" className="download-btn">{'\u2193'} Download PDF</a>
              )}
              <br />
              <button className="modal-confirm" style={{ width: '100%', marginTop: '16px' }} onClick={closeModal}>Close</button>
            </div>
          )}

          {modalStep === 'error' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: '#ff5050', marginBottom: '12px' }}>FAILED</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '20px' }}>{errorMsg}</div>
              <button className="modal-confirm" onClick={closeModal}>Close</button>
            </div>
          )}
        </div>
      </div>

      <Notification notifRef={notifRef} />
    </>
  );
}
