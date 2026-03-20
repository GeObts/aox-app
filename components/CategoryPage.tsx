'use client';

import Link from 'next/link';
import { leads, type Lead } from '@/lib/leads';
import { CustomCursor } from '@/components/CustomCursor';
import { WalletConnect } from '@/components/WalletConnect';

interface CategoryPageProps {
  slug: string;
  category: string;
  title: string;
  subtitle: string;
  trustLine1?: string;
  trustLine2?: string;
}

const FILTER_TABS = [
  { href: '/marketplace', label: 'ALL' },
  { href: '/nft', label: 'NFT' },
  { href: '/defi', label: 'DEFI' },
  { href: '/token', label: 'TOKEN' },
  { href: '/misc', label: 'MISC' },
  { href: '/polymarket', label: 'POLYMARKET' },
];

export function CategoryPage({ slug, category, title, subtitle, trustLine1, trustLine2 }: CategoryPageProps) {
  const filtered = leads.filter((l) => l.category === category);

  return (
    <>
      <CustomCursor />

      {/* Nav */}
      <nav>
        <Link href="/" className="nav-logo">A<span>O</span>X</Link>
        <div className="nav-right">
          <div className="nav-status">
            <div className="status-dot" />
            MARKETPLACE LIVE
          </div>
          <WalletConnect />
        </div>
      </nav>

      {/* Hero */}
      <div className="mp-hero">
        <div className="hero-label">// AOX {category.toUpperCase()} LEADS</div>
        <h1 className="mp-hero-title" dangerouslySetInnerHTML={{ __html: title }} />
        <p className="hero-sub">{subtitle}</p>
        {(trustLine1 || trustLine2) && (
          <div className="trust-lines">
            {trustLine1 && <div className="trust-line">{trustLine1}</div>}
            {trustLine2 && <div className="trust-line">{trustLine2}</div>}
          </div>
        )}
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-val">{filtered.length}</span>
            <span className="stat-lbl">LEADS AVAILABLE</span>
          </div>
          <div className="stat">
            <span className="stat-val">USDC</span>
            <span className="stat-lbl">PAYMENT</span>
          </div>
          <div className="stat">
            <span className="stat-val">BASE</span>
            <span className="stat-lbl">NETWORK</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        {FILTER_TABS.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`filter-btn${f.href === '/' + slug ? ' active' : ''}`}
          >
            {f.label}
          </Link>
        ))}
        <Link href="/ebooks" className="filter-btn">EBOOKS {'\u2197'}</Link>
        <span className="filter-count">{filtered.length} leads</span>
      </div>

      {/* Leads Grid */}
      {filtered.length > 0 ? (
        <div className="leads-grid">
          {filtered.map((lead) => (
            <div className="lead-card" key={lead.id}>
              <div className={`tier-badge ${lead.tier}`}>{lead.tier.toUpperCase()}</div>
              <div className="lead-header">
                <span className="lead-category">{lead.category}</span>
                <div className="lead-score">
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${lead.score}%` }} />
                  </div>
                  <span className="score-num">{lead.score}</span>
                </div>
              </div>
              <div className="lead-title">{lead.title}</div>
              <div className="lead-desc">{lead.desc}</div>
              <div className="lead-meta">
                <div className="meta-item"><div className="meta-dot" />{lead.wallet_age} wallet</div>
                <div className="meta-item"><div className="meta-dot" />{lead.liquidity} liquidity</div>
                <div className="meta-item"><div className="meta-dot" />{lead.contacts} contacts</div>
                <div className="meta-item"><div className="meta-dot" />{lead.timestamp}</div>
              </div>
              <div className="lead-footer">
                <div className="lead-price">
                  <span className="price-amount">{lead.price} USDC</span>
                  <span className="price-token">USDC ON BASE</span>
                </div>
                <button
                  className="buy-btn"
                  disabled
                  style={{ background: 'var(--dark3)', color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'not-allowed' }}
                >
                  Coming Soon
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">{'\u25C8'}</div>
          <div className="empty-title">Leads coming soon</div>
          <div className="empty-desc">Our AI agents are currently scanning for {category.toLowerCase()} opportunities. Check back shortly.</div>
        </div>
      )}

      {/* Footer */}
      <footer>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' }}>A<span style={{ color: 'var(--orange)' }}>O</span>X {'\u2014'} AGENT OPPORTUNITY EXCHANGE</div>
        <div style={{ display: 'flex', gap: '24px', fontFamily: 'var(--mono)', fontSize: '11px' }}>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>HOME</Link>
          <Link href="/marketplace" style={{ color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>MARKETPLACE</Link>
          <a href="mailto:aox@agentmail.to" style={{ color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>aox@agentmail.to</a>
          <a href="https://x.com/AOXexchange" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>TWITTER</a>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' }}>{'\u00A9'} 2026 AOX {'\u2014'} BASE MAINNET</div>
      </footer>
    </>
  );
}
