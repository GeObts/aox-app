# Polymarket Subgraph Queries

## Endpoint
```
https://api.thegraph.com/subgraphs/name/polymarket/matic-markets
```

## Key Entities

### User
```graphql
{
  id: ID!                    # Wallet address
  firstTradeTimestamp: BigInt
  totalVolume: BigDecimal
  markets: [Market!]!
  positions: [Position!]!
}
```

### OrderFill
```graphql
{
  id: ID!
  timestamp: BigInt!
  taker: User!               # Trader wallet
  maker: User!
  market: Market!
  outcomeIndex: Int!
  side: String!              # BUY or SELL
  amount: BigDecimal!
  price: BigDecimal!
  fee: BigDecimal!
}
```

### Market
```graphql
{
  id: ID!
  question: String!
  category: String!          # crypto, politics, sports, etc.
  outcomes: [String!]!
  resolution: String         # resolved, open, closed
  resolutionOutcome: Int     # Winning outcome index
  endDate: BigInt
}
```

## Sample Queries

### Top Traders by Volume (90 days)
```graphql
query TopTraders($since: BigInt!) {
  users(
    where: {firstTradeTimestamp_gt: $since}
    orderBy: totalVolume
    orderDirection: desc
    first: 100
  ) {
    id
    totalVolume
    firstTradeTimestamp
  }
}
```

### Trader Win Rate
```graphql
query TraderPerformance($wallet: String!, $since: BigInt!) {
  orderFills(
    where: {taker: $wallet, timestamp_gt: $since}
    first: 1000
  ) {
    market {
      resolution
      resolutionOutcome
    }
    outcomeIndex
    side
    price
    amount
  }
}
```

### Markets by Category
```graphql
query MarketsByCategory($category: String!) {
  markets(
    where: {category: $category, resolution: "open"}
    first: 100
  ) {
    id
    question
    category
    endDate
  }
}
```
