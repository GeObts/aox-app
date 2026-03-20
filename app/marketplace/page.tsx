'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAccount, useWriteContract, useSendTransaction } from 'wagmi';
import { parseUnits, parseEther } from 'viem';
import { TOKENS, type TokenKey, ERC20_ABI, MARKETPLACE_WALLET } from '@/lib/contracts';
import { leads, revealData, type Lead, type LeadReveal } from '@/lib/leads';
import { CustomCursor } from '@/components/CustomCursor';
import { WalletConnect } from '@/components/WalletConnect';
import { Notification, useNotification } from '@/components/Notification';

type ModalStep = 'select' | 'processing' | 'success' | 'error';

function buildLeadText(lead: Lead, reveal: LeadReveal, txHash: string): string {
  const now = new Date().toISOString();
  let text = `Lead Delivered\n`;
  text += `Listing: ${lead.title}\n`;
  text += `Transaction: ${txHash}\n`;
  text += `Delivered At: ${now}\n`;
  text += `Score: ${lead.score}/100\n`;
  text += `Category: ${lead.category}\n`;
  text += `Chain: ${lead.chain}\n`;
  text += `\n--- Contact Details ---\n\n`;
  for (const f of reveal.fields) {
    text += `${f.label}: ${f.value}\n`;
  }
  return text;
}

export default function Marketplace() {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const { ref: notifRef, show: showNotif } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenKey | 'ETH'>('USDC');
  const [modalStep, setModalStep] = useState<ModalStep>('select');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  const openModal = useCallback((leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    setCurrentLead(lead);
    setModalStep('select');
    setSelectedToken('USDC');
    setTxHash('');
    setErrorMsg('');
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setCurrentLead(null);
  }, []);

  const executePurchase = useCallback(async () => {
    if (!currentLead || !isConnected) {
      showNotif('// connect wallet first', true);
      return;
    }

    setModalStep('processing');

    try {
      let hash: string;

      if (selectedToken === 'ETH') {
        const ethPrice = 2000;
        const value = parseEther((currentLead.price / ethPrice).toFixed(6));
        hash = await sendTransactionAsync({
          to: MARKETPLACE_WALLET as `0x${string}`,
          value,
        });
      } else {
        const token = TOKENS[selectedToken];
        const amount = parseUnits(currentLead.price.toString(), token.decimals);
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
      showNotif('// lead purchased \u2014 content unlocked');
    } catch (e: any) {
      const msg = e?.message?.includes('Insufficient') ? '// insufficient balance' : '// transaction rejected';
      setErrorMsg(e?.message || 'Transaction failed');
      setModalStep('error');
      showNotif(msg, true);
    }
  }, [currentLead, isConnected, selectedToken, writeContractAsync, sendTransactionAsync, showNotif]);

  const reveal: LeadReveal | null = currentLead ? revealData[currentLead.id] || null : null;

  const copyLeadDetails = useCallback(() => {
    if (!currentLead || !reveal) return;
    const text = buildLeadText(currentLead, reveal, txHash);
    navigator.clipboard.writeText(text).then(() => {
      showNotif('// lead details copied to clipboard');
    }).catch(() => {
      showNotif('// copy failed \u2014 select and copy manually', true);
    });
  }, [currentLead, reveal, txHash, showNotif]);

  const downloadLeadDetails = useCallback(() => {
    if (!currentLead || !reveal) return;
    const text = buildLeadText(currentLead, reveal, txHash);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aox-lead-${currentLead.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotif('// lead details downloaded');
  }, [currentLead, reveal, txHash, showNotif]);

  const [txExpanded, setTxExpanded] = useState(false);

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
        <div className="hero-label">// AOX MARKETPLACE {'\u2014'} VERIFIED WEB3 INTELLIGENCE</div>
        <h1 className="mp-hero-title">
          Buy verified leads.<br />
          Pay in <span>USDC.</span><br />
          Settle on Base.
        </h1>
        <p className="hero-sub">
          Pay with USDC on Base. Unlock verified intelligence instantly.
        </p>
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-val">47</span>
            <span className="stat-lbl">LEADS AVAILABLE</span>
          </div>
          <div className="stat">
            <span className="stat-val">12</span>
            <span className="stat-lbl">SOLD TODAY</span>
          </div>
          <div className="stat">
            <span className="stat-val">MULTI</span>
            <span className="stat-lbl">PAYMENT TOKENS</span>
          </div>
          <div className="stat">
            <span className="stat-val">BASE</span>
            <span className="stat-lbl">NETWORK</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <Link href="/marketplace" className="filter-btn active">ALL</Link>
        <Link href="/nft" className="filter-btn">NFT</Link>
        <Link href="/defi" className="filter-btn">DEFI</Link>
        <Link href="/token" className="filter-btn">TOKEN</Link>
        <Link href="/misc" className="filter-btn">MISC</Link>
        <Link href="/polymarket" className="filter-btn">POLYMARKET</Link>
        <Link href="/ebooks" className="filter-btn">EBOOKS {'\u2197'}</Link>
        <span className="filter-count">{leads.length} leads</span>
      </div>

      {/* Leads Grid */}
      <div className="leads-grid">
        {leads.map((lead) => (
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

      {/* Agent API Section */}
      <div className="agent-section">
        <div className="agent-inner">
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--orange)', letterSpacing: '0.2em', marginBottom: '12px' }}>// FOR AI AGENTS</div>
            <h2 className="agent-title">Agents buy<br />leads <span>autonomously.</span></h2>
            <p className="agent-desc">
              No wallet UI needed. AOX speaks x402 {'\u2014'} the HTTP payment standard built for autonomous agents. Send a GET request, receive a 402 Payment Required with USDC payment details. Sign the authorization. POST the signature. Lead delivered as JSON.
            </p>
            <p className="agent-desc">
              Any AI agent on any framework can purchase leads with zero human involvement. This is what the agent economy looks like.
            </p>
          </div>
          <div className="agent-terminal">
            <div className="term-header">// x402 AGENT FLOW {'\u2014'} aox.llc</div>
            <div className="term-body">
              <div><span className="t-comment"># Step 1 {'\u2014'} Request lead</span></div>
              <div><span className="t-orange">GET</span> /lead?id=nft-4829</div>
              <div><span className="t-comment"># {'\u2192'} 402 Payment Required</span></div>
              <div style={{ marginTop: '8px' }}><span className="t-comment"># Response includes:</span></div>
              <div><span className="t-key">&quot;asset&quot;</span>: <span className="t-val">&quot;0x22af33...76f3b&quot;</span></div>
              <div><span className="t-key">&quot;amount&quot;</span>: <span className="t-val">&quot;25 USDC&quot;</span></div>
              <div><span className="t-key">&quot;scheme&quot;</span>: <span className="t-val">&quot;erc20-transfer&quot;</span></div>
              <div style={{ marginTop: '8px' }}><span className="t-comment"># Step 2 {'\u2014'} Sign & pay</span></div>
              <div><span className="t-orange">POST</span> /lead/purchase?id=nft-4829</div>
              <div><span className="t-key">X-PAYMENT-SIGNATURE</span>: <span className="t-val">0x...</span></div>
              <div style={{ marginTop: '8px' }}><span className="t-comment"># Step 3 {'\u2014'} Lead delivered</span></div>
              <div><span className="t-green">{'\u2713'} 200 OK {'\u2014'} lead data returned</span></div>
              <div><span className="t-green">{'\u2713'} USDC forwarded to treasury</span><span className="t-comment"> {'\u25A0'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' }}>A<span style={{ color: 'var(--orange)' }}>O</span>X {'\u2014'} AGENT OPPORTUNITY EXCHANGE</div>
        <div style={{ display: 'flex', gap: '24px', fontFamily: 'var(--mono)', fontSize: '11px' }}>
          <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>HOME</Link>
          <a href="mailto:aox@agentmail.to" style={{ color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>aox@agentmail.to</a>
          <a href="https://x.com/AOXexchange" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.1em' }}>TWITTER</a>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)' }}>{'\u00A9'} 2026 AOX {'\u2014'} BASE MAINNET</div>
      </footer>

      {/* Purchase Modal */}
      <div className={`modal-overlay${modalOpen ? ' show' : ''}`} onClick={closeModal}>
        <div className={`modal${modalStep === 'success' ? ' modal-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={closeModal}>{'\u00D7'}</button>

          {modalStep === 'select' && currentLead && (
            <>
              <div className="modal-title">Purchase Lead</div>
              <div className="modal-sub">You are purchasing verified Web3 intelligence. Payment settles on Base mainnet.</div>
              <div className="modal-row"><span className="modal-row-label">LEAD</span><span className="modal-row-val">{currentLead.title}</span></div>
              <div className="modal-row"><span className="modal-row-label">SCORE</span><span className="modal-row-val" style={{ color: 'var(--green)' }}>{currentLead.score}/100</span></div>
              <div className="modal-row"><span className="modal-row-label">CONTACTS</span><span className="modal-row-val">{currentLead.contacts} verified</span></div>
              <div className="modal-row"><span className="modal-row-label">PRICE</span><span className="modal-row-val orange">{currentLead.price} USDC</span></div>
              <div className="modal-row"><span className="modal-row-label">NETWORK</span><span className="modal-row-val">Base Mainnet</span></div>
              <div className="modal-row"><span className="modal-row-label">PAYMENT</span><span className="modal-row-val">USDC on Base</span></div>

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
                <button className="modal-confirm" onClick={executePurchase}>
                  Pay {currentLead.price} {selectedToken} {'\u2192'}
                </button>
              </div>
            </>
          )}

          {modalStep === 'processing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: 'var(--orange)', marginBottom: '16px' }}>PROCESSING PAYMENT</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', lineHeight: 2 }}>
                <div>{'\u2192'} Requesting x402 payment details...</div>
                <div>{'\u2192'} Signing Permit2 authorization...</div>
                <div>{'\u2192'} Submitting payment to Base...</div>
                <div style={{ opacity: 0.3 }}>{'\u2192'} Verifying & delivering lead...</div>
              </div>
            </div>
          )}

          {modalStep === 'success' && currentLead && reveal && (
            <div className="delivery-panel">
              <div className="delivery-header">
                <div className="delivery-icon">{'\u2713'}</div>
                <div className="delivery-title">Lead Delivered</div>
              </div>
              <div className="delivery-notice">
                Your purchased lead details are shown below.
              </div>
              <div className="delivery-warning">
                {'\u26A0'} Copy or download this data now. It may not be shown again after closing this window.
              </div>

              {/* Transaction Info */}
              <div className="delivery-tx-section">
                <div className="delivery-row">
                  <span className="delivery-row-label">LISTING</span>
                  <span className="delivery-row-val">{currentLead.title}</span>
                </div>
                <div className="delivery-row">
                  <span className="delivery-row-label">SCORE</span>
                  <span className="delivery-row-val" style={{ color: 'var(--green)' }}>{currentLead.score}/100</span>
                </div>
                <div className="delivery-row">
                  <span className="delivery-row-label">CATEGORY</span>
                  <span className="delivery-row-val">{currentLead.category}</span>
                </div>
                <div className="delivery-row">
                  <span className="delivery-row-label">CHAIN</span>
                  <span className="delivery-row-val">{currentLead.chain}</span>
                </div>
                {txHash && (
                  <div className="delivery-row">
                    <span className="delivery-row-label">TX HASH</span>
                    <span className="delivery-row-val delivery-tx-val">
                      {txExpanded ? (
                        <span className="delivery-tx-full" onClick={() => setTxExpanded(false)}>{txHash}</span>
                      ) : (
                        <span className="delivery-tx-short" onClick={() => setTxExpanded(true)}>
                          {txHash.slice(0, 10)}...{txHash.slice(-8)}
                          <span className="delivery-tx-expand"> [expand]</span>
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Lead Contact Data */}
              <div className="delivery-label">// UNLOCKED CONTACT DATA</div>
              <div className="delivery-data">
                {reveal.fields.map((f, i) => (
                  <div className="delivery-field" key={i}>
                    <span className="delivery-field-label">{f.label.toUpperCase()}</span>
                    <span className="delivery-field-value">{f.value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="delivery-actions">
                <button className="delivery-btn copy" onClick={copyLeadDetails}>
                  {'\u2398'} Copy Lead Details
                </button>
                <button className="delivery-btn download" onClick={downloadLeadDetails}>
                  {'\u2193'} Download as TXT
                </button>
              </div>
              <button className="modal-cancel" style={{ width: '100%', marginTop: '12px' }} onClick={closeModal}>Close</button>
            </div>
          )}

          {modalStep === 'success' && currentLead && !reveal && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: '#ff5050', marginBottom: '12px' }}>DELIVERY ERROR</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '8px', lineHeight: 1.7 }}>
                Payment confirmed, but lead data could not be loaded.<br />
                Please retry retrieval or contact support.
              </div>
              {txHash && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--muted)', marginBottom: '24px', wordBreak: 'break-all' }}>
                  Tx: {txHash}
                </div>
              )}
              <button className="modal-confirm" onClick={closeModal}>Close</button>
            </div>
          )}

          {modalStep === 'error' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '13px', color: '#ff5050', marginBottom: '16px' }}>PAYMENT FAILED</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '24px' }}>{errorMsg}</div>
              <button className="modal-confirm" onClick={closeModal}>Close</button>
            </div>
          )}
        </div>
      </div>

      <Notification notifRef={notifRef} />
    </>
  );
}
