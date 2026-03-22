import { parseAbi } from 'viem';

export const MARKETPLACE_WALLET = '0x729174D90CA93139E3E9590993910B784eD32282';

export const TOKENS = {
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    symbol: 'USDC',
  },
  USDT: {
    address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    decimals: 6,
    symbol: 'USDT',
  },
  DAI: {
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    decimals: 18,
    symbol: 'DAI',
  },
  WETH: {
    address: '0x4200000000000000000000000000000000000006',
    decimals: 18,
    symbol: 'WETH',
  },
  BNKR: {
    address: '0x22af33fe49fd1fa80c7149773dde5890d3c76f3b',
    decimals: 18,
    symbol: '$BNKR',
  },
} as const;

export const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]);

export type TokenKey = keyof typeof TOKENS;
