# AOX API Resources — From Public-APIs Fork

**Source:** https://github.com/GeObts/public-apis (forked from public-apis/public-apis)

---

## 🔗 Blockchain APIs (Most Relevant for AOX)

| API | Use Case | Auth | Notes |
|-----|----------|------|-------|
| **Etherscan** | Ethereum explorer API — contracts, transactions, token transfers | `apiKey` | ✅ Already have key (S6B5JGYNUCCPGXKT7TUAXZ7A7UR1MQSBQF) |
| **Covalent** | Multi-blockchain data aggregator | `apiKey` | ✅ Unified API for 100+ chains including Base |
| **Bitquery** | Onchain GraphQL APIs & DEX data | `apiKey` | ✅ GraphQL for complex queries |
| **The Graph** | Indexing protocol for Ethereum | `apiKey` | ✅ For querying events, token data |
| **Watchdata** | Ethereum blockchain API access | `apiKey` | Alternative to Infura/Alchemy |
| **Chainlink** | Hybrid smart contracts | No | Price feeds, VRF, automation |

---

## 💰 Cryptocurrency / Market Data APIs

| API | Use Case | Auth | Notes |
|-----|----------|------|-------|
| **CoinGecko** | Price, market, social data | No | ✅ Free, no key needed, great for price feeds |
| **CoinCap** | Real-time crypto prices | No | ✅ Free tier |
| **Coinpaprika** | Prices, volume, market data | No | ✅ Free |
| **Messari** | Crypto assets data | No | ✅ Institutional grade |
| **CryptoCompare** | Price comparison | No | ✅ Free tier |
| **CoinAPI** | All exchanges under one API | `apiKey` | Unified exchange data |
| **Nomics** | Historical & real-time prices | `apiKey` | Good for backtesting |
| **0x** | DEX liquidity pools | No | ✅ For swap routing |
| **1inch** | DEX aggregation | No | ✅ Best price routing |
| **Ethplorer** | Ethereum tokens, balances, history | `apiKey` | Token-specific explorer |
| **icy.tools** | GraphQL NFT API | `apiKey` | For NFT leads |

---

## 🏦 Node Providers (RPC Access)

| Provider | Chains | Auth | Notes |
|----------|--------|------|-------|
| **Alchemy** | Ethereum, Base, Polygon, etc. | `apiKey` | ✅ Already have key |
| **Infura** | Ethereum, IPFS | `apiKey` | Industry standard |
| **QuickNode** | Multi-chain | `apiKey` | Fast, reliable |
| **ZMOK** | Ethereum RPC | No | ✅ Free, no key |

---

## 📊 Finance / Alternative Data

| API | Use Case | Auth | Notes |
|-----|----------|------|-------|
| **Polygon.io** | Historical stock market data | `apiKey` | Traditional finance data |
| **Alpha Vantage** | Stock data | `apiKey` | Free tier available |
| **Finnhub** | Stocks, currencies, crypto | `apiKey` | Real-time & websocket |
| **Yahoo Finance** | Market data | `apiKey` | Low latency |
| **WallstreetBets** | Sentiment analysis | No | Social signals |

---

## 🎯 Recommended Priority for AOX

### Tier 1 — Essential (Get These Working)
1. **Etherscan API v2** — Already have key, use for Base + Ethereum
2. **CoinGecko** — No auth needed, price feeds
3. **Covalent** — Multi-chain, unified interface

### Tier 2 — Enhance Capabilities
4. **Bitquery** — GraphQL for complex on-chain analysis
5. **0x/1inch** — DEX routing for Banker swaps
6. **Alchemy** — Better RPC than public nodes

### Tier 3 — Specialized
7. **Ethplorer** — Token-specific deep dives
8. **icy.tools** — NFT market data
9. **Messari** — Institutional metrics

---

## 🔧 eth-readonly Skill Installed

**Location:** `~/.openclaw/workspace/skills/eth-readonly/`

**Capabilities:**
- Read-only Ethereum queries via `cast` or `curl`
- Etherscan API integration
- Contract inspection, balances, transactions
- Event logs (with proper filtering)

**Usage:**
```bash
# Using cast (preferred)
cast balance vitalik.eth --rpc-url $ETH_RPC_URL
cast call 0xCONTRACT "balanceOf(address)" 0xADDRESS --rpc-url $ETH_RPC_URL

# Using curl
export ETHERSCAN_API_KEY=your_key
curl -s "https://api.etherscan.io/v2/api?chainid=8453&module=account&action=tokentx&address=0x...&apikey=$ETHERSCAN_API_KEY"
```

---

## ⚠️ Credit-Saving Tips

- **Free tiers first:** CoinGecko, CoinCap, ZMOK require no API keys
- **Rate limits:** Etherscan free = 5 calls/sec, 100k/day
- **Cache responses:** Don't re-query unchanged data
- **Use GraphQL:** Bitquery/The Graph for efficient data fetching

---

**Last Updated:** 2026-03-21
**Fork:** https://github.com/GeObts/public-apis

## 🦎 GeckoTerminal (Beansai Recommendation)

**URL:** https://api.geckoterminal.com/api/v2/

**Status:** ✅ FREE — No API key required

**Capabilities:**
- New pools across networks (Base, Ethereum, etc.)
- Real-time price, volume, FDV data
- Transaction counts and unique traders
- DEX-specific data (Uniswap V2/V3/V4, Aerodrome)

**Key Endpoints:**
```bash
# New pools on Base
curl "https://api.geckoterminal.com/api/v2/networks/base/new_pools?page=1"

# Top pools on Base
curl "https://api.geckoterminal.com/api/v2/networks/base/pools?page=1&sort=-24h_volume_usd"

# Specific pool details
curl "https://api.geckoterminal.com/api/v2/networks/base/pools/{pool_address}"

# Token price history
curl "https://api.geckoterminal.com/api/v2/networks/base/tokens/{token_address}/ohlcv/minutes?limit=100&interval=15"
```

**Test Results (2026-03-21):**
- Found 20 new pools on Base in last scan
- All pools < $5K FDV (too small for leads)
- Most had minimal activity (1-3 traders)

**Best Practice:**
- Query `top_pools` sorted by 24h volume
- Filter for FDV > $100K
- Check unique trader count > 50
- Cross-reference with Etherscan for contract verification

**Added by:** beansai (AOX Research Agent)
