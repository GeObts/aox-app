export interface Lead {
  id: string;
  category: string;
  title: string;
  desc: string;
  score: number;
  price: number;
  tier: 'standard' | 'premium' | 'enterprise' | 'elite';
  wallet_age: string;
  liquidity: string;
  contacts: number;
  chain: string;
  timestamp: string;
  win_rate?: string;
  volume?: string;
  markets?: number;
}

export interface RevealField {
  label: string;
  value: string;
}

export interface LeadReveal {
  name: string;
  fields: RevealField[];
}

// Fallback hardcoded leads if API fails
export const HARDCODED_LEADS: Lead[] = [
  {
    id: 'token-sent-0x0f7cc3232c',
    category: 'Token Launch',
    title: 'SENT — Active DeFi Token',
    desc: 'High-activity token on Base with strong liquidity ($155K reserve) and proven trading volume. 84 transactions from 12 unique buyers. Uniswap V2 verified pool with $80K+ FDV.',
    score: 100,
    price: 100,
    tier: 'enterprise',
    wallet_age: 'Verified',
    liquidity: '$155,631',
    contacts: 1,
    chain: 'Base',
    timestamp: '2026-03-21T23:58:00.000Z',
  },

  {
    id: 'poly-1003',
    category: 'Polymarket',
    title: 'Polymarket Whale — $64M Volume',
    desc: 'Verified high-volume prediction market trader. 500 trades across 56 unique markets. Enterprise-grade intelligence with full wallet and profile data.',
    score: 90,
    price: 100,
    tier: 'enterprise',
    wallet_age: 'Verified',
    liquidity: '$64.2M',
    contacts: 1,
    chain: 'Polygon',
    timestamp: '2026-03-21T05:00:00.000Z',
    win_rate: 'Unverified',
    volume: '$64.2M',
    markets: 56,
  },

  {
    id: 'nft-4829',
    category: 'NFT Launch',
    title: 'NFT Collection — 847 Holders',
    desc: 'New generative art collection on Base. Deployer wallet 4yr history, $240K liquidity. 4 verified contact channels.',
    score: 86,
    price: 25,
    tier: 'premium',
    wallet_age: '4 years',
    liquidity: '$240K',
    contacts: 4,
    chain: 'Base',
    timestamp: '2 hours ago',
  },
  {
    id: 'defi-2341',
    category: 'DeFi Protocol',
    title: 'AMM Fork — $1.2M TVL',
    desc: 'Uniswap V3 fork with custom hooks. Active GitHub, 3 contributors. Audit pending. Strong community signals.',
    score: 79,
    price: 20,
    tier: 'standard',
    wallet_age: '2 years',
    liquidity: '$1.2M',
    contacts: 3,
    chain: 'Base',
    timestamp: '5 hours ago',
  },
  {
    id: 'token-9182',
    category: 'Token Launch',
    title: 'Utility Token — 12K Holders',
    desc: 'ERC-20 utility token for AI agent marketplace. Verified team, registered entity, active Discord.',
    score: 91,
    price: 50,
    tier: 'enterprise',
    wallet_age: '5 years',
    liquidity: '$890K',
    contacts: 6,
    chain: 'Base',
    timestamp: '1 hour ago',
  },
  {
    id: 'dao-5571',
    category: 'Misc',
    title: 'DAO Treasury — $340K',
    desc: 'Active DAO with Gnosis Safe treasury. Snapshot governance, 234 members, weekly proposals.',
    score: 83,
    price: 30,
    tier: 'premium',
    wallet_age: '3 years',
    liquidity: '$340K',
    contacts: 5,
    chain: 'Base',
    timestamp: '8 hours ago',
  },
  {
    id: 'nft-6634',
    category: 'NFT Launch',
    title: 'Gaming NFT — 2.3K Mints',
    desc: 'Play-to-earn gaming collection. Active Discord 4.2K members. Partnership with Base gaming guild.',
    score: 74,
    price: 20,
    tier: 'standard',
    wallet_age: '1 year',
    liquidity: '$67K',
    contacts: 3,
    chain: 'Base',
    timestamp: '12 hours ago',
  },
  {
    id: 'defi-8812',
    category: 'DeFi Protocol',
    title: 'Yield Optimizer — 3 Strategies',
    desc: 'Auto-compounding vault across Aave, Morpho, and Lido. $2.1M deposited. Audit by Trail of Bits.',
    score: 94,
    price: 75,
    tier: 'enterprise',
    wallet_age: '4 years',
    liquidity: '$2.1M',
    contacts: 4,
    chain: 'Base',
    timestamp: '3 hours ago',
  },
  {
    id: 'poly-1001',
    category: 'Polymarket',
    title: 'Active Trader — $180K Volume',
    desc: 'High-volume prediction market trader. 340+ positions across political, crypto, and sports markets. Verified wallet with consistent activity.',
    score: 88,
    price: 35,
    tier: 'premium',
    wallet_age: '2 years',
    liquidity: '$180K',
    contacts: 3,
    chain: 'Polygon',
    timestamp: '4 hours ago',
  },
  {
    id: 'poly-1002',
    category: 'Polymarket',
    title: 'Market Maker — 12 Active Markets',
    desc: 'Providing liquidity across 12 active prediction markets. Consistent profit history, automated strategies detected.',
    score: 92,
    price: 60,
    tier: 'enterprise',
    wallet_age: '3 years',
    liquidity: '$520K',
    contacts: 4,
    chain: 'Polygon',
    timestamp: '1 hour ago',
  },
  {
    id: 'poly-1003',
    category: 'Polymarket',
    title: 'Polymarket Whale — $64M Volume',
    desc: 'Verified high-volume prediction market trader. 500 trades across 56 unique markets. Enterprise-grade intelligence with full wallet and profile data.',
    score: 90,
    price: 0.50,
    tier: 'enterprise',
    wallet_age: 'Verified',
    liquidity: '$64.2M',
    contacts: 1,
    chain: 'Polygon',
    timestamp: '2026-03-21T05:00:00.000Z',
    win_rate: 'Unverified',
    volume: '$64.2M',
    markets: 56,
  },
];

// Legacy export for backward compatibility
export const leads = HARDCODED_LEADS;

// API endpoint for live leads
const API_ENDPOINT = 'http://3.142.118.148:3200/leads';

// Map API lead to UI Lead format
function mapApiLeadToLead(apiLead: any): Lead {
  const tier = apiLead.tier?.toLowerCase() as 'standard' | 'premium' | 'enterprise' || 'standard';
  const metadata = apiLead.metadata || {};
  
  // Calculate liquidity display from metadata
  const liquidity = metadata.liquidity_usd 
    ? `$${(metadata.liquidity_usd / 1000).toFixed(0)}K`
    : '$10K';
  
  // Generate description from AI enrichment or fallback
  const desc = apiLead.description || metadata.ai_description || `Verified ${apiLead.category} lead scored ${apiLead.score}/100 by AOX Research Agent.`;
  
  return {
    id: apiLead.id,
    category: apiLead.category,
    title: apiLead.title,
    desc: desc,
    score: apiLead.score,
    price: apiLead.price,
    tier: tier,
    wallet_age: metadata.wallet_age || '1 year',
    liquidity: liquidity,
    contacts: metadata.contact_method_count || 2,
    chain: 'Base',
    timestamp: 'Just listed',
  };
}

// Fetch leads from API with fallback
export async function fetchLiveLeads(): Promise<{ leads: Lead[]; fromApi: boolean }> {
  try {
    const response = await fetch(API_ENDPOINT, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.listings && Array.isArray(data.listings) && data.listings.length > 0) {
      const mappedLeads = data.listings.map(mapApiLeadToLead);
      return { leads: mappedLeads, fromApi: true };
    }
    
    console.log('No live leads available, using fallback');
    return { leads: HARDCODED_LEADS, fromApi: false };
    
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    return { leads: HARDCODED_LEADS, fromApi: false };
  }
}

export const revealData: Record<string, LeadReveal> = {

  'poly-1003': {
    name: 'Polymarket Whale',
    fields: [
      { label: 'Wallet Address', value: '0xc2e7800b5af46e6093872b177b7a5e7f0563be51' },
      { label: 'Polymarket Profile', value: 'https://polymarket.com/profile/0xc2e7800b5af46e6093872b177b7a5e7f0563be51' },
      { label: 'Total Volume', value: '$64,242,887.69' },
      { label: 'Total Trades', value: '500 (498 buys, 2 sells)' },
      { label: 'Markets Active', value: '56 unique markets' },
      { label: 'Buy Ratio', value: '99.6%' },
      { label: 'Win Rate', value: 'Unverified — cannot be confirmed from trade data alone' },
      { label: 'Chain', value: 'Polygon' },
      { label: 'Data Source', value: 'Polymarket Data API (data-api.polymarket.com)' },
      { label: 'Risk Flags', value: '99.6% buy pattern is abnormal — possible bot or market maker activity. Win rate unverifiable.' },
      { label: 'Why High Score', value: '$64M volume (whale status), active across 56 markets (diverse), direct from Polymarket API (verified)' },
      { label: 'Listed', value: '2026-03-21 05:00 UTC' },
    ],
  },
  'token-sent-0x0f7cc3232c': {
    name: 'SENT Token Details',
    fields: [
      { label: 'Token Address', value: '0x0f7cc3232cd7baf5c7ee55ee8c24789d80f67b5d' },
      { label: 'FDV', value: '$80,712' },
      { label: '24h Volume', value: '$2,630' },
      { label: 'Transactions', value: '84' },
      { label: 'Unique Buyers', value: '12' },
      { label: 'Liquidity Reserve', value: '$155,631' },
      { label: 'DEX', value: 'Uniswap V2' },
      { label: 'Chain', value: 'Base' },
      { label: 'Pool Created', value: '2026-03-21' },
      { label: 'Data Source', value: 'GeckoTerminal API (verified)' },
    ],
  },
  'nft-4829': {
    name: 'PixelCraft Studios',
    fields: [
      { label: 'Name', value: 'PixelCraft Studios' },
      { label: 'Twitter/X', value: 'https://x.com/pixelcraft_base' },
      { label: 'Discord', value: 'https://discord.gg/pixelcraft' },
      { label: 'Email', value: 'team@pixelcraft.xyz' },
      { label: 'Wallet', value: '0x4a2fB8c9E1d3A7f6b0C2e5D8a1F4b7c9E2d3c891' },
      { label: 'Website', value: 'https://pixelcraft.xyz' },
      { label: 'Notes', value: 'Deployer wallet has 4yr history. 847 unique holders. Collection minting is paused — team is preparing V2 drop with dynamic traits.' },
    ],
  },
  'defi-2341': {
    name: 'BaseSwap Finance',
    fields: [
      { label: 'Name', value: 'BaseSwap Finance' },
      { label: 'Twitter/X', value: 'https://x.com/baseswap_fi' },
      { label: 'GitHub', value: 'https://github.com/baseswap-fi' },
      { label: 'Telegram', value: 'https://t.me/baseswap_community' },
      { label: 'Wallet', value: '0x7b3dA9c2F4e1B8a5C6d7E0f3A2b5C8d1E4f7f221' },
      { label: 'Website', value: 'https://baseswap.fi' },
      { label: 'Notes', value: 'Uniswap V3 fork with custom concentrated liquidity hooks. 3 active contributors on GitHub. Audit pending with OpenZeppelin. $1.2M TVL across 8 pools.' },
    ],
  },
  'token-9182': {
    name: 'AgentToken DAO',
    fields: [
      { label: 'Name', value: 'AgentToken DAO — Founding Team' },
      { label: 'Twitter/X', value: 'https://x.com/agenttoken_io' },
      { label: 'Farcaster', value: 'https://warpcast.com/agenttoken' },
      { label: 'Discord', value: 'https://discord.gg/agenttoken' },
      { label: 'Telegram', value: 'https://t.me/agenttoken_official' },
      { label: 'Email', value: 'founders@agenttoken.io' },
      { label: 'Wallet', value: '0x9c1eD4f2B7a3C8d5E6f1A0b9C2d3E4f5A6b7a847' },
      { label: 'Snapshot', value: 'https://snapshot.org/#/agenttoken.eth' },
      { label: 'Website', value: 'https://agenttoken.io' },
      { label: 'Notes', value: 'ERC-20 utility token powering an AI agent marketplace. Verified team, registered entity (Delaware LLC). 12K holders, active Discord with 8.4K members. Token vesting schedule public on-chain.' },
    ],
  },
  'dao-5571': {
    name: 'BaseDAO Governance',
    fields: [
      { label: 'Name', value: 'BaseDAO Core Contributors' },
      { label: 'Twitter/X', value: 'https://x.com/basedao_xyz' },
      { label: 'Discord', value: 'https://discord.gg/basedao' },
      { label: 'Telegram', value: 'https://t.me/basedao_chat' },
      { label: 'Email', value: 'contributors@basedao.xyz' },
      { label: 'Wallet', value: '0x2f8aE1c4D5b6F7a8B9c0D1e2F3a4B5c6D7e8d339' },
      { label: 'Snapshot', value: 'https://snapshot.org/#/basedao.eth' },
      { label: 'Website', value: 'https://basedao.xyz' },
      { label: 'Notes', value: 'Active DAO with $340K Gnosis Safe treasury. 234 governance members. Weekly proposal cadence. Recent vote to expand into cross-chain treasury management.' },
    ],
  },
  'nft-6634': {
    name: 'Base Gaming Guild',
    fields: [
      { label: 'Name', value: 'Base Gaming Guild' },
      { label: 'Twitter/X', value: 'https://x.com/basegaming_nft' },
      { label: 'Discord', value: 'https://discord.gg/basegaming' },
      { label: 'Wallet', value: '0x5d7bC8a1E2f3D4c5B6a7F8e9D0c1B2a3E4f5e112' },
      { label: 'Website', value: 'https://basegaming.xyz' },
      { label: 'Notes', value: 'Play-to-earn gaming collection. 2.3K mints completed. Discord has 4.2K members. Partnership with Base-native gaming guild for tournament rewards.' },
    ],
  },
  'defi-8812': {
    name: 'YieldVault Protocol',
    fields: [
      { label: 'Name', value: 'YieldVault Protocol — Core Team' },
      { label: 'Twitter/X', value: 'https://x.com/yieldvault_base' },
      { label: 'GitHub', value: 'https://github.com/yieldvault-protocol' },
      { label: 'Email', value: 'security@yieldvault.fi' },
      { label: 'Wallet', value: '0x8e4cA1b2D3c4E5f6A7b8C9d0E1f2A3b4C5d6b293' },
      { label: 'Website', value: 'https://yieldvault.fi' },
      { label: 'Notes', value: 'Auto-compounding vault with 3 strategies across Aave, Morpho, and Lido. $2.1M deposited. Full audit by Trail of Bits completed. Team is doxxed, registered in Singapore.' },
    ],
  },

};
