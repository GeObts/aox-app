# Polymarket API Reference

## Free Tier APIs (No Key Required)

### 1. Polymarket CLOB API
Base: `https://clob.polymarket.com`

#### Get Order Book
```
GET /book?market={condition_id}
```

#### Get Trade History
```
GET /trades?market={condition_id}
```

#### Get Market Data
```
GET /markets/{condition_id}
```

### 2. Polymarket Gamma API
Base: `https://gamma-api.polymarket.com`

#### Get All Markets
```
GET /markets?active=true&closed=false&limit=100
```

#### Get Market by ID
```
GET /markets/{market_id}
```

#### Get Portfolio (Trader Positions)
```
GET /portfolio/{wallet_address}
```

Response:
```json
{
  "totalValue": 15420.50,
  "positions": [
    {
      "market": {
        "id": "0x...",
        "question": "Will BTC hit $100k by June?",
        "category": "Crypto"
      },
      "outcome": "Yes",
      "quantity": 1000,
      "avgPrice": 0.65,
      "currentPrice": 0.72,
      "value": 720
    }
  ]
}
```

### 3. The Graph Polymarket Subgraph
Endpoint: `https://api.thegraph.com/subgraphs/name/polymarket/matic-markets`

#### Get Active Traders
```graphql
query GetRecentTrades($since: BigInt!) {
  orderFills(
    where: {timestamp_gt: $since}
    first: 1000
    orderBy: timestamp
    orderDirection: desc
  ) {
    taker
    timestamp
    market {
      id
      question
      category
    }
  }
}
```

#### Get Trader History
```graphql
query GetTraderHistory($wallet: String!, $since: BigInt!) {
  user(id: $wallet) {
    id
    firstTradeTimestamp
    totalVolume
    markets {
      id
      question
      category
    }
  }
  orderFills(
    where: {taker: $wallet, timestamp_gt: $since}
    first: 1000
  ) {
    timestamp
    market {
      id
      question
      category
      resolution
      resolutionOutcome
    }
    outcomeIndex
    amount
    price
    side
  }
}
```

## Rate Limits
- CLOB API: ~100 req/min
- Gamma API: ~60 req/min
- Subgraph: 1000 points/minute (The Graph)

## Data Availability
- Trade history: 90 days on subgraph
- Market data: Real-time
- Portfolio data: Real-time
