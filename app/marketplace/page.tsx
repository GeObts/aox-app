'use client';

import { useState } from 'react';
import Link from 'next/link';
import { leads, Lead } from '@/lib/leads';
import { TOKENS, TokenKey, ERC20_ABI, MARKETPLACE_WALLET } from '@/lib/contracts';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';

const categories = ['ALL', 'NFT', 'DEFI', 'TOKEN', 'MISC'];

export default function Marketplace() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenKey>('USDC');
  const [purchaseStep, setPurchaseStep] = useState<'select' | 'processing' | 'success' | 'error'>('select');
  const [errorMsg, setErrorMsg] = useState('');
  
  const { isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const filteredLeads = activeFilter === 'ALL'
    ? leads
    : leads.filter(l => l.category.toUpperCase().includes(activeFilter));

  const handlePurchase = (lead: Lead) => {
    if (!isConnected) {
      setErrorMsg('Please connect your wallet first');
      setPurchaseStep('error');
      return;
    }
    setSelectedLead(lead);
    setPurchaseStep('select');
  };

  const executePurchase = () => {
    if (!selectedLead) return;
    
    setPurchaseStep('processing');
    const token = TOKENS[selectedToken];
    const amount = parseUnits(selectedLead.price.toString(), token.decimals);

    writeContract(
      {
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [MARKETPLACE_WALLET as `0x${string}`, amount],
      },
      {
        onSuccess: () => {},
        onError: (error) => {
          setErrorMsg(error.message || 'Transaction failed');
          setPurchaseStep('error');
        },
      }
    );
  };

  if (hash && !isConfirming && purchaseStep === 'processing') {
    setPurchaseStep('success');
  }

  return (
    <main className="min-h-screen bg-aox-dark pt-20">
      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-aox-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[10px] font-mono text-aox-muted uppercase tracking-[0.3em] mb-4">
              // AOX Marketplace — Verified Web3 Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Buy verified leads.
              <br />
              Pay in <span className="text-aox-orange">USDC, ETH, $BNKR & more.</span>
              <br />
              Settle on Base.
            </h1>
            <p className="text-sm text-aox-muted max-w-xl mx-auto">
              Pay with USDC, ETH, WETH, USDT, or $BNKR via x402 + Permit2 on Base.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: '47', label: 'LEADS AVAILABLE' },
              { value: '12', label: 'SOLD TODAY' },
              { value: 'MULTI', label: 'PAYMENT TOKENS' },
              { value: 'BASE', label: 'NETWORK' },
            ].map((stat, i) => (
              <div key={i} className="bg-aox-dark2 border border-aox-border rounded-lg p-6 text-center">
                <div className="text-2xl font-bold text-white font-mono mb-1">{stat.value}</div>
                <div className="text-[10px] font-mono text-aox-muted uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 border-b border-aox-border">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
                activeFilter === cat
                  ? 'bg-aox-orange text-aox-dark'
                  : 'bg-aox-dark2 border border-aox-border text-aox-muted hover:text-white hover:border-aox-cyan'
              }`}
            >
              {cat}
            </button>
          ))}
          <Link
            href="/ebooks"
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider rounded border border-aox-border text-aox-muted hover:text-white hover:border-aox-cyan transition-colors"
          >
            EBOOKS ↗
          </Link>
          <span className="ml-auto text-xs font-mono text-aox-muted">
            {filteredLeads.length} leads
          </span>
        </div>
      </section>

      {/* Leads Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-aox-dark2 border border-aox-border rounded-lg p-6 hover:border-aox-cyan/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-[10px] font-mono text-aox-muted uppercase tracking-wider">
                    {lead.category}
                  </span>
                  {lead.badge && (
                    <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded ${
                      lead.badge === 'hot' ? 'bg-red-500/20 text-red-400' :
                      lead.badge === 'new' ? 'bg-aox-green/20 text-aox-green' :
                      'bg-aox-cyan/20 text-aox-cyan'
                    }`}>
                      {lead.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold mb-2 group-hover:text-aox-cyan transition-colors">
                  {lead.title}
                </h3>
                <p className="text-xs text-aox-muted mb-4 line-clamp-2">
                  {lead.desc}
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      lead.score >= 85 ? 'bg-aox-green' :
                      lead.score >= 70 ? 'bg-aox-orange' :
                      'bg-red-400'
                    }`} />
                    <span className="text-xs font-mono text-aox-muted">Score {lead.score}</span>
                  </div>
                  <span className="text-xs font-mono text-aox-muted">{lead.chain}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-aox-border">
                  <div>
                    <span className="text-lg font-bold text-aox-orange">${lead.price}</span>
                    <span className="text-xs font-mono text-aox-muted ml-1">USDC</span>
                  </div>
                  <button
                    onClick={() => handlePurchase(lead)}
                    className="px-4 py-2 bg-aox-orange text-aox-dark text-xs font-mono font-bold rounded hover:bg-aox-orange/90 transition-colors"
                  >
                    Buy →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent API Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-aox-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[10px] font-mono text-aox-orange uppercase tracking-[0.2em] mb-4">
                // For AI Agents
              </div>
              <h2 className="text-3xl font-bold mb-6">
                Agents buy
                <br />
                leads <span className="text-aox-cyan">autonomously.</span>
              </h2>
              <p className="text-sm text-aox-muted mb-4">
                No wallet UI needed. AOX speaks x402 — the HTTP payment standard built for autonomous agents. Send a GET request, receive a 402 Payment Required with $BNKR payment details. Sign the Permit2 authorization. POST the signature. Lead delivered as JSON.
              </p>
              <p className="text-sm text-aox-muted">
                Any AI agent on any framework can purchase leads with zero human involvement. This is what the agent economy looks like.
              </p>
            </div>
            <div className="bg-aox-dark2 border border-aox-border rounded-lg overflow-hidden">
              <div className="bg-aox-dark3 px-4 py-2 text-[10px] font-mono text-aox-muted border-b border-aox-border">
                // x402 AGENT FLOW — aox.llc
              </div>
              <div className="p-4 font-mono text-xs space-y-1">
                <div className="text-aox-muted"># Step 1 — Request lead</div>
                <div><span className="text-aox-orange">GET</span> /lead?id=nft-4829</div>
                <div className="text-aox-muted"># → 402 Payment Required</div>
                <div className="mt-2 text-aox-muted"># Response includes:</div>
                <div><span className="text-aox-cyan">"asset"</span>: <span className="text-aox-green">"0x22af33...76f3b"</span></div>
                <div><span className="text-aox-cyan">"amount"</span>: <span className="text-aox-green">"1 BNKR"</span></div>
                <div><span className="text-aox-cyan">"scheme"</span>: <span className="text-aox-green">"permit2"</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Purchase Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
          <div className="bg-aox-dark2 border border-aox-border rounded-lg w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            {purchaseStep === 'select' && (
              <div className="p-6">
                <h2 className="text-lg font-mono font-bold text-white mb-2">Purchase Lead</h2>
                <p className="text-xs font-mono text-aox-muted mb-4">Instant access after payment confirms on Base.</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between py-2 border-b border-aox-border">
                    <span className="text-xs font-mono text-aox-muted uppercase">Lead</span>
                    <span className="text-xs font-mono text-white">{selectedLead.title}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-aox-border">
                    <span className="text-xs font-mono text-aox-muted uppercase">Price</span>
                    <span className="text-sm font-mono font-bold text-aox-orange">${selectedLead.price}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-aox-border">
                    <span className="text-xs font-mono text-aox-muted uppercase">Network</span>
                    <span className="text-xs font-mono text-white">Base Mainnet</span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-aox-muted uppercase tracking-wider mb-3">
                  // SELECT PAYMENT TOKEN
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(Object.keys(TOKENS) as TokenKey[]).map((token) => (
                    <button
                      key={token}
                      onClick={() => setSelectedToken(token)}
                      className={`px-3 py-1.5 text-xs font-mono border rounded transition-all ${
                        selectedToken === token
                          ? 'border-aox-orange text-aox-orange bg-aox-orange/10'
                          : 'border-aox-border text-aox-muted hover:border-aox-cyan hover:text-aox-cyan'
                      }`}
                    >
                      {token === 'BNKR' ? '$BNKR' : token}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setSelectedLead(null)} className="flex-1 px-4 py-2 text-xs font-mono border border-aox-border rounded hover:border-aox-muted transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={executePurchase}
                    disabled={isPending}
                    className="flex-1 px-4 py-2 text-xs font-mono font-bold bg-aox-orange text-aox-dark rounded hover:bg-aox-orange/90 disabled:opacity-50 transition-colors"
                  >
                    {isPending ? 'Confirming...' : 'Pay Now →'}
                  </button>
                </div>
              </div>
            )}

            {purchaseStep === 'processing' && (
              <div className="p-8 text-center">
                <div className="text-sm font-mono text-aox-orange mb-4">PROCESSING {selectedToken} PAYMENT</div>
                <div className="space-y-2 text-xs font-mono text-aox-muted">
                  <div className={hash ? 'text-aox-cyan' : 'animate-pulse'}>→ {hash ? 'Transaction sent' : 'Sending...'}</div>
                  <div className={isConfirming ? 'animate-pulse text-aox-cyan' : 'opacity-30'}>→ Confirming on Base...</div>
                  <div className="opacity-30">→ Unlocking lead...</div>
                </div>
              </div>
            )}

            {purchaseStep === 'success' && (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">◈</div>
                <h3 className="text-lg font-mono font-bold text-white mb-2">Purchase Complete</h3>
                {hash && <p className="text-[10px] font-mono text-aox-muted mb-4">Tx: {hash.slice(0, 10)}...{hash.slice(-6)}</p>}
                <div className="bg-aox-dark3 border border-aox-border rounded p-4 mb-4 text-left">
                  <div className="text-[10px] font-mono text-aox-muted mb-2">// LEAD DETAILS</div>
                  <div className="text-xs font-mono text-white">{selectedLead.title}</div>
                  <div className="text-xs font-mono text-aox-muted mt-1">ID: {selectedLead.id}</div>
                </div>
                <button onClick={() => setSelectedLead(null)} className="w-full px-4 py-2 text-xs font-mono font-bold bg-aox-orange text-aox-dark rounded hover:bg-aox-orange/90 transition-colors">
                  Close
                </button>
              </div>
            )}

            {purchaseStep === 'error' && (
              <div className="p-8 text-center">
                <div className="text-sm font-mono text-red-400 mb-4">FAILED</div>
                <p className="text-xs font-mono text-aox-muted mb-6">{errorMsg}</p>
                <button onClick={() => setPurchaseStep('select')} className="px-6 py-2 bg-aox-orange text-aox-dark text-xs font-mono font-bold rounded hover:bg-aox-orange/90 transition-colors">
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
            <a href="https://x.com/PupAIOnBase" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-aox-muted hover:text-white transition-colors">TWITTER</a>
            <a href="#" className="text-xs font-mono text-aox-muted hover:text-white transition-colors">FARCASTER</a>
            <a href="#" className="text-xs font-mono text-aox-muted hover:text-white transition-colors">DOCS</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
