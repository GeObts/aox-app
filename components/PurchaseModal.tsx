'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Book } from '@/lib/books';
import { TOKENS, ERC20_ABI, MARKETPLACE_WALLET, TokenKey } from '@/lib/contracts';

interface PurchaseModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PurchaseModal({ book, isOpen, onClose }: PurchaseModalProps) {
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState<TokenKey>('USDC');
  const [step, setStep] = useState<'select' | 'processing' | 'success' | 'error'>('select');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  if (!isOpen || !book) return null;

  const handlePurchase = async () => {
    if (!isConnected) {
      setErrorMsg('Please connect your wallet first');
      setStep('error');
      return;
    }

    if (book.price === 0) {
      setStep('success');
      return;
    }

    setStep('processing');

    try {
      const token = TOKENS[selectedToken];
      const amount = parseUnits(book.price.toString(), token.decimals);

      writeContract(
        {
          address: token.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [MARKETPLACE_WALLET as `0x${string}`, amount],
        },
        {
          onSuccess: (data) => {
            setTxHash(data);
          },
          onError: (error) => {
            setErrorMsg(error.message || 'Transaction failed');
            setStep('error');
          },
        }
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Transaction failed');
      setStep('error');
    }
  };

  if (hash && !isConfirming && step === 'processing') {
    setStep('success');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-aox-dark2 border border-aox-border rounded-lg w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {step === 'select' && (
          <div className="p-6">
            <h2 className="text-lg font-mono font-bold text-white mb-2">
              {book.price === 0 ? 'Free Download' : 'Purchase Ebook'}
            </h2>
            <p className="text-xs font-mono text-aox-muted mb-4">
              {book.price === 0 
                ? 'Enter your email for the download link.' 
                : 'Instant access after payment confirms on Base.'}
            </p>
            
            <div className="flex justify-between items-center py-3 border-b border-aox-border">
              <span className="text-xs font-mono text-aox-muted uppercase">Title</span>
              <span className="text-[10px] font-mono text-white text-right max-w-[200px]">{book.title}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-aox-border">
              <span className="text-xs font-mono text-aox-muted uppercase">Price</span>
              <span className="text-sm font-mono font-bold text-aox-orange">${book.price}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-aox-border mb-4">
              <span className="text-xs font-mono text-aox-muted uppercase">Network</span>
              <span className="text-xs font-mono text-white">Base Mainnet</span>
            </div>

            {book.price > 0 && (
              <>
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
              </>
            )}

            {book.price === 0 && (
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full bg-aox-dark3 border border-aox-border rounded px-4 py-3 text-sm font-mono text-white placeholder:text-aox-muted mb-4 focus:border-aox-cyan outline-none"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-xs font-mono border border-aox-border rounded hover:border-aox-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-xs font-mono font-bold bg-aox-orange text-aox-dark rounded hover:bg-aox-orange/90 disabled:opacity-50 transition-colors"
              >
                {isPending ? 'Confirming...' : book.price === 0 ? 'Get Free PDF →' : 'Pay Now →'}
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-8 text-center">
            <div className="text-sm font-mono text-aox-orange mb-4">
              PROCESSING {selectedToken} PAYMENT
            </div>
            <div className="space-y-2 text-xs font-mono text-aox-muted">
              <div className={hash ? 'text-aox-cyan' : 'animate-pulse'}>
                → {hash ? 'Transaction sent' : 'Sending...'}
              </div>
              <div className={isConfirming ? 'animate-pulse text-aox-cyan' : 'opacity-30'}>
                → Confirming on Base...
              </div>
              <div className="opacity-30">→ Unlocking content...</div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">◈</div>
            <h3 className="text-lg font-mono font-bold text-white mb-2">
              {book.price === 0 ? 'Download Ready' : 'Purchase Complete'}
            </h3>
            {book.price > 0 && txHash && (
              <p className="text-[10px] font-mono text-aox-muted mb-4">
                Tx: {txHash.slice(0, 10)}...{txHash.slice(-6)}
              </p>
            )}
            <a
              href="#"
              className="inline-block px-6 py-3 bg-aox-orange text-aox-dark text-xs font-mono font-bold rounded hover:bg-aox-orange/90 transition-colors"
            >
              ↓ Download PDF
            </a>
            <button
              onClick={onClose}
              className="block w-full mt-4 px-4 py-2 text-xs font-mono text-aox-muted hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="p-8 text-center">
            <div className="text-sm font-mono text-red-400 mb-4">FAILED</div>
            <p className="text-xs font-mono text-aox-muted mb-6">{errorMsg}</p>
            <button
              onClick={() => setStep('select')}
              className="px-6 py-2 bg-aox-orange text-aox-dark text-xs font-mono font-bold rounded hover:bg-aox-orange/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
