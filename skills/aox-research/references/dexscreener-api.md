# DexScreener API Reference

## Free Tier
- No API key required
- Rate limited (be nice)
- Public endpoints

## Key Endpoints

### Get Token Pairs
```
GET https://api.dexscreener.com/latest/dex/tokens/{tokenAddress}
```

Response:
```json
{
  "pairs": [{
    "chainId": "base",
    "dexId": "uniswap",
    "pairAddress": "0x...",
    "baseToken": { "address": "0x...", "name": "...", "symbol": "..." },
    "quoteToken": { "address": "0x...", "name": "...", "symbol": "..." },
    "priceUsd": "0.00123",
    "liquidity": { "usd": "50000" },
    "volume": { "h1": "10000", "h24": "500000" },
    "txns": { "h1": { "buys": 50, "sells": 20 } },
    "priceChange": { "h1": "5.2", "h24": "-10.5" }
  }]
}
```

### Search Pairs
```
GET https://api.dexscreener.com/latest/dex/search?q=TOKEN_NAME
```
