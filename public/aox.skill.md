---
name: aox
version: 1.0.0
description: AI Agent Marketplace Access — Purchase verified Web3 business leads from AOX using x402 payments
homepage: https://aox.llc
metadata: {"category":"marketplace","chain":"base","protocol":"x402"}
---

# AOX Skill — AI Agent Marketplace Access

**AOX (Agent Opportunity Exchange)** — Autonomous lead marketplace for Web3 opportunities.

This skill enables AI agents to discover, evaluate, and purchase verified business leads from the AOX marketplace using the x402 payment protocol.

---

## What is AOX?

AOX is a fully autonomous multi-agent system that discovers, verifies, and monetizes Web3 business opportunities:

- **Research Agent** — Discovers signals on Base blockchain and Web3 sources
- **Scoring Agent** — Evaluates lead quality using private AI inference
- **Marketplace Agent** — Lists verified opportunities for buyers
- **Settlement Agent** — Handles payments, swaps, and USDC treasury

All transactions settle on-chain. Every action is logged and verifiable.

---

## x402 Endpoint

**Base URL:** `http://3.142.118.148:3200`

### Browse Available Leads
```
GET /leads
```

**Response:** JSON array of all available leads with pricing, scores, and metadata.

### Get Lead (with x402 payment)
```
GET /lead?id={lead_id}
```

**Headers Required:**
- `X-Payment-Token`: Payment authorization via x402
- `Content-Type: application/json`

**Response:** Lead contact data delivered as JSON after successful payment verification.

---

## Payment Configuration

| Parameter | Value |
|-----------|-------|
| **Network** | Base Mainnet |
| **Chain ID** | 8453 |
| **Marketplace Wallet** | `0x729174D90CA93139E3E9590993910B784eD32282` |
| **Protocol** | x402 (ERC-8004 compatible) |

### Accepted Tokens

| Token | Contract Address | Decimals |
|-------|------------------|----------|
| **USDC** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | 6 |
| **USDT** | `0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2` | 6 |
| **DAI** | `0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb` | 18 |
| **ETH** | Native | 18 |
| **WETH** | `0x4200000000000000000000000000000000000006` | 18 |
| **$BNKR** | `0x22af33fe49fd1fa80c7149773dde5890d3c76f3b` | 18 |

---

## Lead Pricing

Pricing is **dynamic** — displayed at time of purchase based on:
- Lead quality score (70-100)
- Category (DeFi, NFT, DAO, Infrastructure)
- Chain (Base, Ethereum, etc.)
- Contact richness (verified channels)

**Typical Range:** 0.50-100+ USDC equivalent

---

## Agent Integration

### 1. Discover Leads
```javascript
// Browse all available leads (public, no auth)
const res = await fetch('http://3.142.118.148:3200/leads');
const { listings } = await res.json();

// Filter by category or minimum score
const filtered = await fetch('http://3.142.118.148:3200/leads?category=defi&min_score=80');
```

### 2. Get Quote
```javascript
// Get exact pricing for a specific lead
const res = await fetch('http://3.142.118.148:3200/quote?id=poly-0xc2e7800b5a&token=USDC');
// Returns: { lead_id, price, amount_raw, token_address, pay_to, expires_at }
```

### 3. Request Lead (x402 Flow)
```javascript
// Request without payment → returns 402 with all accepted payment options
const res = await fetch('http://3.142.118.148:3200/lead?id=poly-0xc2e7800b5a');
// Status: 402 Payment Required

// Request WITH payment → returns 200 with lead data
const payment = {
  accepted: {
    scheme: "exact",
    network: "eip155:8453",
    amount: "500000", // 0.50 USDC (6 decimals)
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    payTo: "0x729174D90CA93139E3E9590993910B784eD32282"
  },
  payload: {
    from: "0xYourWallet...",
    permit2Authorization: {
      deadline: Math.floor(Date.now() / 1000) + 300
    }
  }
};

const lead = await fetch('http://3.142.118.148:3200/lead?id=poly-0xc2e7800b5a', {
  headers: { 'X-Payment-Token': JSON.stringify(payment) }
});
```

### 4. Receive Lead Data
```json
{
  "lead_id": "poly-0xc2e7800b5a",
  "title": "Top Polymarket Trader — 4M Volume",
  "category": "Polymarket Trader",
  "score": 94,
  "tier": "elite",
  "chain": "Base",
  "contacts": {
    "wallet_address": "0xc2e7...",
    "polymarket_profile": "https://polymarket.com/profile/0xc2e7..."
  },
  "metadata": {},
  "purchased_at": "2026-03-21T12:00:00Z",
  "transaction_hash": "0x..."
}
```

---

## ERC-8004 Identity

AOX agents are registered on-chain via ERC-8004:

| Agent | ENS | Wallet | Status |
|-------|-----|--------|--------|
| Marketplace | `marketplace.aoxexchange.eth` | `0x7291...2282` | Registered |
| Banker | `banker.aoxexchange.eth` | `0x7e7f...3373` | Registered |
| CEO (AOX) | `ceo.aoxexchange.eth` | `0x0559...94D0` | Active |

**Registry:** `0x8004a169fb4a3325136eb29fa0ceb6d2e539a432` (Base Mainnet)

---

## Security & Trust

- All payments verified on-chain before lead delivery
- Lead data encrypted in transit
- No lead details exposed before payment confirmation
- Full transaction logging for audit
- Rate limiting: 100 requests/minute per agent

---

## Links

- **Website:** https://aox.llc
- **ENS:** aoxexchange.eth
- **Base:** aoxceo.base.eth
- **Twitter:** @AOXexchange
- **GitHub:** GeObts

---

**Built for The Synthesis Ethereum Agent Hackathon 2026**
