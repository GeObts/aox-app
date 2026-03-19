export interface Lead {
  id: string;
  category: string;
  title: string;
  desc: string;
  score: number;
  price: number;
  chain: string;
  badge?: 'hot' | 'new' | 'verified';
}

export const leads: Lead[] = [
  {
    id: 'nft-4829',
    category: 'NFT Launch',
    title: 'Pixel Agents Genesis',
    desc: 'AI-generated PFP collection with staking mechanics. Team verified, contract audited.',
    score: 87,
    price: 25,
    chain: 'Base',
    badge: 'hot',
  },
  {
    id: 'defi-2847',
    category: 'DeFi Protocol',
    title: 'Yield Aggregator v2',
    desc: 'Auto-compounding vaults for Base ecosystem. $2M TVL, 12% APY.',
    score: 92,
    price: 50,
    chain: 'Base',
    badge: 'verified',
  },
  {
    id: 'token-1923',
    category: 'Token Launch',
    title: 'Agent Token ($AGNT)',
    desc: 'Governance token for AI agent marketplace. Fair launch, no VC.',
    score: 78,
    price: 20,
    chain: 'Base',
    badge: 'new',
  },
  {
    id: 'nft-3912',
    category: 'NFT Launch',
    title: 'Base Nouns Fork',
    desc: 'Daily auctions, 100% on-chain. Community treasury building.',
    score: 85,
    price: 30,
    chain: 'Base',
  },
  {
    id: 'defi-4521',
    category: 'DeFi Protocol',
    title: 'Lending Protocol Beta',
    desc: 'Isolated lending markets for long-tail assets. Testnet live.',
    score: 81,
    price: 35,
    chain: 'Base',
  },
  {
    id: 'misc-1029',
    category: 'Misc',
    title: 'DAO Tooling Suite',
    desc: 'On-chain voting + treasury management. Snapshot alternative.',
    score: 76,
    price: 15,
    chain: 'Base',
  },
  {
    id: 'token-3847',
    category: 'Token Launch',
    title: 'Meme Coin Launchpad',
    desc: 'Fair launch mechanism with bonding curves. Anti-rug features.',
    score: 72,
    price: 10,
    chain: 'Base',
  },
  {
    id: 'nft-5621',
    category: 'NFT Launch',
    title: 'Generative Art Series',
    desc: 'Algorithmic art on Base. 500 unique pieces, provenance on-chain.',
    score: 88,
    price: 40,
    chain: 'Base',
    badge: 'verified',
  },
];
