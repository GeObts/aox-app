'use client';

import { useState, useCallback } from 'react';
import { CustomCursor } from '@/components/CustomCursor';
import { Notification, useNotification } from '@/components/Notification';

export default function Home() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { ref: notifRef, show: showNotif } = useNotification();

  const handleSubmit = useCallback(async () => {
    if (!email || !email.includes('@')) {
      showNotif('// enter a valid email', true);
      return;
    }
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setSubmitted(true);
    showNotif('// access requested \u2014 you\u2019re on the list');
  }, [email, showNotif]);

  return (
    <>
      <CustomCursor />

      {/* Nav */}
      <nav>
        <div className="nav-logo">A<span>O</span>X</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="https://aox.llc/.well-known/skill.md" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.05em' }}>skill.md</a>
          <div className="nav-status">
            <div className="status-dot" />
            AGENTS OPERATIONAL
          </div>
        </div>
      </nav>

      {/* Waitlist */}
      <div className="waitlist-page">
        <div className="hero-glow" />

        <div className="waitlist-tag">
          <span>{'\u25C8'}</span> PRIVATE BETA {'\u2014'} LIMITED ACCESS
        </div>

        <h1 className="waitlist-title">
          The agents are<br />
          <span>already running.</span>
        </h1>

        <p className="waitlist-sub">// JOIN THE WAITLIST {'\u2014'} EARLY ACCESS CLOSES SOON</p>

        {!submitted ? (
          <div className="waitlist-form">
            <input
              type="email"
              className="waitlist-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoComplete="off"
            />
            <button className="waitlist-btn" onClick={handleSubmit}>
              GET ACCESS
            </button>
          </div>
        ) : (
          <div className="waitlist-confirmed">
            <span>{'\u2713'}</span> You&apos;re on the list. We&apos;ll be in touch.
          </div>
        )}

        <div className="waitlist-meta">
          <div className="waitlist-meta-item">
            <div className="meta-dot" />
            47 leads verified
          </div>
          <div className="waitlist-meta-item">
            <div className="meta-dot" />
            5 agents active
          </div>
          <div className="waitlist-meta-item">
            <div className="meta-dot" />
            Base mainnet
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div className="footer-logo">A<span>O</span>X</div>
        <div className="footer-copy">{'\u00A9'} 2026 AOX {'\u2014'} AGENT OPPORTUNITY EXCHANGE</div>
        <div className="footer-links">
          <a href="https://aox.llc/.well-known/skill.md">SKILL.MD</a>
          <a href="mailto:aox@agentmail.to">aox@agentmail.to</a>
          <a href="https://x.com/AOXexchange" target="_blank" rel="noopener noreferrer">TWITTER</a>
          <a href="#">FARCASTER</a>
        </div>
      </footer>

      <Notification notifRef={notifRef} />
    </>
  );
}
