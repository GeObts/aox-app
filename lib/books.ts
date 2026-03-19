export interface Book {
  id: string;
  icon: string;
  color: string;
  category: string;
  title: string;
  desc: string;
  pages: number;
  price: number;
  badge: 'new' | 'free' | null;
}

export const books: Book[] = [
  {
    id: 'b1',
    icon: '⬡',
    color: '#F7931A',
    category: 'Lead Intelligence',
    title: 'Web3 Lead Intelligence Masterclass',
    desc: 'How autonomous agents discover, score, and monetize Web3 opportunities. The complete AOX methodology.',
    pages: 84,
    price: 5,
    badge: 'new',
  },
  {
    id: 'b2',
    icon: '◈',
    color: '#F7931A',
    category: 'AI Agents',
    title: 'AI Agent Economy Playbook',
    desc: 'Building autonomous economic agents on Base. ERC-8004 identity, x402 payments, treasury management.',
    pages: 96,
    price: 5,
    badge: 'new',
  },
  {
    id: 'b3',
    icon: '◎',
    color: '#66c800',
    category: 'DeFi',
    title: 'DeFi Due Diligence Framework',
    desc: 'Evaluating DeFi protocols like a pro. Liquidity analysis, smart contract risk, team credibility scoring.',
    pages: 72,
    price: 5,
    badge: null,
  },
  {
    id: 'b4',
    icon: '⌘',
    color: '#569cd6',
    category: 'NFT',
    title: 'NFT Project Evaluation Toolkit',
    desc: 'Score any NFT collection before it launches. The 47-point framework used by AOX scoring agents.',
    pages: 60,
    price: 5,
    badge: null,
  },
  {
    id: 'b5',
    icon: '◆',
    color: '#0052FF',
    category: 'Base Chain',
    title: "Base Builder's Complete Guide",
    desc: 'Deploy on Base from zero. Wallet setup, contract deployment, Uniswap integration, ENS naming.',
    pages: 88,
    price: 5,
    badge: null,
  },
  {
    id: 'b6',
    icon: '▲',
    color: '#66c800',
    category: 'Free Guide',
    title: 'x402 Payments for AI Agents',
    desc: 'A free introduction to x402 — the HTTP payment standard that lets agents pay each other autonomously.',
    pages: 24,
    price: 0,
    badge: 'free',
  },
  {
    id: 'b7',
    icon: '●',
    color: '#66c800',
    category: 'Free Guide',
    title: 'ERC-8004 Quick Start',
    desc: 'Register your AI agent onchain in 30 minutes. Identity, ENS, and Base deployment.',
    pages: 18,
    price: 0,
    badge: 'free',
  },
  {
    id: 'b8',
    icon: '◉',
    color: '#F7931A',
    category: 'Investing',
    title: 'Web3 VC Intelligence Report 2026',
    desc: 'Where the smart money is going in 2026. AI agent infrastructure, Base ecosystem, and emerging DeFi.',
    pages: 52,
    price: 8,
    badge: 'new',
  },
];
