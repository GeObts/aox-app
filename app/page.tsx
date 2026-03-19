'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [stats, setStats] = useState({ signals: 0, leads: 0, chains: 5 });

  useEffect(() => {
    // Animate stats on load
    const animateStats = () => {
      const targetSignals = 2847;
      const targetLeads = 156;
      const duration = 2000;
      const steps = 60;
      const interval = duration / steps;
      
      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        setStats({
          signals: Math.floor(targetSignals * progress),
          leads: Math.floor(targetLeads * progress),
          chains: 5,
        });
        if (step >= steps) clearInterval(timer);
      }, interval);
    };
    animateStats();
  }, []);

  const tickerItems = [
    { icon: '◆', text: 'NEW TOKEN DETECTED ON BASE' },
    { icon: '◆', text: 'NFT CONTRACT VERIFIED — SCORE 87' },
    { icon: '◆', text: 'LEAD #1043 SOLD — 25 USDC' },
    { icon: '◆', text: 'LIQUIDITY EVENT FLAGGED — $240K' },
    { icon: '◆', text: 'AGENT TREASURY DEPLOYED' },
    { icon: '◆', text: 'LIDO MCP SERVER LIVE' },
  ];

  return (
    <main className="min-h-screen bg-aox-dark">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-aox-cyan/5 rounded-full blur-[150px] pointer-events-none" />

        {/* Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-aox-border bg-aox-dark2/50 mb-8">
          <span className="text-aox-cyan">◈</span>
          <span className="text-[10px] font-mono text-aox-muted uppercase tracking-wider">
            Private Beta — Limited Access
          </span>
        </div>

        {/* Eyebrow */}
        <div className="text-xs font-mono text-aox-muted uppercase tracking-[0.3em] mb-4">
          Agent Opportunity Exchange
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-6">
          The Market
          <br />
          <span className="text-aox-cyan">Doesn&apos;t Sleep.</span>
          <br />
          Neither Do We.
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-center text-sm sm:text-base text-aox-muted mb-12">
          Autonomous AI agents that never stop hunting — discovering, verifying, and monetizing Web3 opportunities while you sleep.
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 mb-12">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {stats.signals.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-aox-muted uppercase tracking-wider mt-1">
              Signals Scanned
            </div>
          </div>
          <div className="w-px h-12 bg-aox-border" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {stats.leads}
            </div>
            <div className="text-[10px] font-mono text-aox-muted uppercase tracking-wider mt-1">
              Leads Verified
            </div>
          </div>
          <div className="w-px h-12 bg-aox-border" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {stats.chains}
            </div>
            <div className="text-[10px] font-mono text-aox-muted uppercase tracking-wider mt-1">
              Chains Monitored
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/marketplace"
            className="px-8 py-4 bg-aox-orange text-aox-dark font-mono text-xs font-bold uppercase tracking-wider rounded hover:bg-aox-orange/90 transition-colors text-center"
          >
            Enter Marketplace →
          </Link>
          <Link
            href="/ebooks"
            className="px-8 py-4 border border-aox-orange text-aox-orange font-mono text-xs font-bold uppercase tracking-wider rounded hover:bg-aox-orange/10 transition-colors text-center"
          >
            Browse Ebooks ↗
          </Link>
        </div>
      </section>

      {/* Ticker */}
      <div className="overflow-hidden border-y border-aox-border bg-aox-dark2/30 py-3">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="flex items-center gap-2 mx-8 text-xs font-mono text-aox-muted">
              <span className="text-aox-cyan">{item.icon}</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            The agents
            <br />
            are <span className="text-aox-orange">already running.</span>
          </h2>
          <p className="text-center text-[10px] font-mono text-aox-muted uppercase tracking-[0.3em] mb-12">
            // Choose Your Access Method
          </p>

          <div className="grid md:grid-cols-2 gap-px bg-aox-border">
            {/* For Agents */}
            <div className="bg-aox-dark2 p-8 sm:p-12">
              <div className="text-[10px] font-mono text-aox-orange uppercase tracking-[0.2em] mb-4">
                // For Agents
              </div>
              <h3 className="text-xl font-bold mb-4">x402 Integration</h3>
              <p className="text-sm text-aox-muted mb-6">
                Autonomous agents purchase leads via HTTP. No UI. No human. Just x402 payments on Base.
              </p>
              <Link
                href="/aox.skill.md"
                className="inline-flex items-center gap-2 text-xs font-mono text-aox-cyan hover:underline"
              >
                View Agent Skill →
              </Link>
            </div>

            {/* For Humans */}
            <div className="bg-aox-dark2 p-8 sm:p-12">
              <div className="text-[10px] font-mono text-aox-cyan uppercase tracking-[0.2em] mb-4">
                // For Humans
              </div>
              <h3 className="text-xl font-bold mb-4">Marketplace Access</h3>
              <p className="text-sm text-aox-muted mb-6">
                Browse verified leads, buy with USDC/ETH/$BNKR, download instantly. Built for operators.
              </p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 text-xs font-mono text-aox-cyan hover:underline"
              >
                Browse Leads →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-aox-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-2xl font-bold text-white">
            A<span className="text-aox-orange">O</span>X
          </div>
          <div className="text-xs font-mono text-aox-muted">
            © 2026 AOX — AGENT OPPORTUNITY EXCHANGE
          </div>
          <div className="flex gap-6">
            <a
              href="https://x.com/PupAIOnBase"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-aox-muted hover:text-white transition-colors"
            >
              TWITTER
            </a>
            <a
              href="#"
              className="text-xs font-mono text-aox-muted hover:text-white transition-colors"
            >
              FARCASTER
            </a>
            <a
              href="#"
              className="text-xs font-mono text-aox-muted hover:text-white transition-colors"
            >
              DOCS
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
