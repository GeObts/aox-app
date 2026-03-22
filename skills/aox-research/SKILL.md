# AOX Research Agent — Token Discovery Skill

## Purpose

Scan Base blockchain for new ERC-20 token launches, enrich with market data, score for quality, and pass qualified leads to the Scoring Agent.

## When to Use

- When Research Agent needs to discover fresh token launches
- When setting up automated token scanning pipeline
- When evaluating new leads for AOX marketplace

## Requirements

### API Keys (Free Tier)

| Service | Key Name | Get From | Cost |
|---------|----------|----------|------|
| BaseScan | BASESCAN_API_KEY | https://basescan.org/apis | Free (5 calls/sec) |
| RugCheck | RUGCHECK_API_KEY | https://rugcheck.xyz | Free tier available |

### Environment Variables

```bash
BASESCAN_API_KEY=your_basescan_api_key
RUGCHECK_API_KEY=your_rugcheck_key_optional
RESEARCH_OUTPUT_DIR=~/.openclaw/agents/research/output
RESEARCH_LOG_DIR=~/.openclaw/agents/research/logs
```

## Quick Start

```bash
# Install dependencies
bash ~/.openclaw/workspace/skills/aox-research/scripts/install.sh

# Test APIs
bash ~/.openclaw/workspace/skills/aox-research/scripts/test.sh

# Run scanner (once per hour)
bash ~/.openclaw/workspace/skills/aox-research/scripts/run.sh
```

## How It Works

### Scan Flow

1. **Poll** — Query BaseScan for new contract creations (last 1 hour)
2. **Filter** — Keep only ERC-20 with >$10k liquidity
3. **Enrich** — Pull DexScreener + RugCheck data
4. **Score** — Calculate 0-100 quality score
5. **Output** — Save leads scoring 70+ to JSON

### Scoring Algorithm

```
Total Score: 0-100

Safety (40 pts):
  - Ownership renounced: 15 pts
  - Liquidity locked >90%: 15 pts
  - Contract verified: 10 pts

Momentum (30 pts):
  - Unique buyers: 0-10 pts (>500=10, >200=7, >50=4)
  - Time to 100 buyers: 0-10 pts (<30min=10, <2h=7, <6h=4)
  - Buy/sell ratio >2:1: 10 pts

Distribution (20 pts):
  - Top 10 holders <20%: 10 pts
  - Top 1 holder <5%: 10 pts

Liquidity (10 pts):
  - >$100k: 10 pts
  - >$50k: 7 pts
  - >$10k: 4 pts
```

## Output Format

```json
{
  "lead_id": "base-0xabc...",
  "token_address": "0x...",
  "name": "Token Name",
  "symbol": "TKN",
  "launch_time": "2026-03-19T21:00:00Z",
  "score": 78,
  "tier": "Standard",
  "safety": {
    "ownership_renounced": true,
    "liquidity_locked": 95,
    "verified": true,
    "rugcheck_score": 85
  },
  "momentum": {
    "unique_buyers": 247,
    "time_to_100": "45m",
    "buy_sell_ratio": 2.3
  },
  "distribution": {
    "top10_percent": 15,
    "top1_percent": 3
  },
  "liquidity": {
    "usd": 75000,
    "locked_percent": 95
  },
  "price": {
    "usd": 0.00045,
    "change_1h": 15
  },
  "social": {
    "twitter_mentions_1h": 23
  },
  "discovered_at": "2026-03-19T21:15:00Z",
  "data_sources": ["basescan", "dexscreener", "rugcheck"]
}
```

## Cron Setup

```bash
# Run once per hour
0 * * * * bash ~/.openclaw/workspace/skills/aox-research/scripts/run.sh >> ~/.openclaw/agents/research/logs/cron.log 2>&1
```

## References

- `references/basescan-api.md` — BaseScan API endpoints
- `references/dexscreener-api.md` — DexScreener API docs
- `references/example-output.json` — Sample lead output
- `references/rugcheck-api.md` — RugCheck integration

---

## Polymarket Trader Discovery

### Purpose

Find high-performing Polymarket prediction market traders and score them as leads for trading desks and analytics firms.

### Hard Gates (Must Pass Before Scoring)

| Requirement | Threshold |
|-------------|-----------|
| Minimum total trades | 10 trades |
| Activity window | 1+ trade in last 14 days |
| Volume concentration | No single trade >40% of total |

**If any gate fails, lead is rejected immediately.**

### Scoring Rubric (0-100)

#### Core Metrics

| Metric | Points | Tiers |
|--------|--------|-------|
| Win rate | 30 | >70% = 30, >60% = 20, >50% = 10 |
| Volume | 25 | >$50k = 25, >$10k = 15, >$1k = 5 |
| Activity | 15 | Active in last 30 days = 15 |
| Diversification | 10 | 3+ categories = 10 |
| Contactable | 10 | ENS/Farcaster found = 10 |
| Portfolio size | 10 | >$10k positions = 10 |

#### Advanced Metrics

| Metric | Points | Why It Matters |
|--------|--------|----------------|
| Consistency (3+ months) | 15 | Proves skill, not luck |
| Win rate on >$10k markets | 10 | Easy to win tiny markets |
| Avg position size | 10 | >$500 = serious trader |
| Win streak (5+) | 5 | Hot hand signal |
| Trades both sides | 5 | Sophisticated, not perma-bull |
| Market experience (20+) | 10 | Depth of experience |
| ROI % | 15 | Win rate alone is misleading |

#### Negative Signals (Subtract Points)

| Signal | Penalty | Why |
|--------|---------|-----|
| 50%+ trades in last 7 days only | -10 | Sudden surge, suspicious |
| All trades in one category | -5 | Not a generalist |
| Win rate fading (30d vs lifetime) | -10 | Edge is decaying |

**Minimum threshold: 70 points to list**

### Tier Pricing ($BNKR)

| Tier | Criteria | Price |
|------|----------|-------|
| **ELITE** | Score 90+, win rate >70%, ROI >50% | 5 $BNKR |
| **PREMIUM** | Score 75-89, win rate >60% | 3 $BNKR |
| **STANDARD** | Score 70-74 | 1 $BNKR |

### Output Fields

```json
{
  "lead_id": "pm-0x742d...35Cc",
  "category": "Polymarket Trader",
  "title": "Elite Crypto Trader — 78% Win Rate",
  "wallet_address": "0x...",
  "score": 84,
  "tier": "PREMIUM",
  "price": 3,
  "payment_token": "BNKR",
  // Scoring metrics
  "win_rate": 78.5,
  "roi": 45.2,
  "total_volume": 45230,
  "total_trades": 47,
  "active_markets": 23,
  "avg_position_size": 890,
  "last_active": "2026-03-19T14:30:00Z",
  "top_categories": ["crypto", "politics", "sports"],
  // Contact info
  "ens_name": "predictor.eth",
  "farcaster_handle": "@toptrader"
}
```

### Data Sources

| Source | Data | Cost |
|--------|------|------|
| Polymarket Subgraph | Trade history, positions | Free |
| Polymarket Gamma API | Portfolio, market data | Free |
| ENS API | Reverse lookup | Free |
| Farcaster API | Social handles | Free |

### Run Schedule

```bash
# Daily at 6am UTC
crontab -e
# Add: 0 6 * * * bash ~/.openclaw/workspace/skills/aox-research/scripts/run_polymarket.sh
```

### Output Format

```json
{
  "lead_id": "pm-0x742d...35Cc",
  "category": "Polymarket Trader",
  "title": "Elite Crypto Trader — 78% Win Rate",
  "wallet_address": "0x...",
  "score": 84,
  "tier": "Premium",
  "price": 2,
  "payment_token": "BNKR",
  "win_rate": 78.5,
  "volume_90d": 45230,
  "markets_participated": 23,
  "categories": ["crypto", "politics"],
  "ens_name": "predictor.eth",
  "farcaster_handle": "@toptrader"
}
```

### Quick Start

```bash
# Run manually
bash ~/.openclaw/workspace/skills/aox-research/scripts/run_polymarket.sh

# Check output
ls ~/.openclaw/agents/research/output/polymarket/

# View logs
cat ~/.openclaw/agents/research/logs/polymarket_scanner.log
```

### References

- `references/polymarket-api.md` — CLOB + Gamma API docs
- `references/polymarket-subgraph.md` — The Graph queries
- `references/polymarket-example.json` — Sample lead

## Venice AI Enrichment

The Research Agent now uses **venice/llama-3.3-70b** for AI-powered token analysis.

### What Venice Adds

- **AI-generated descriptions** — 2-3 sentence summaries of token potential
- **Red/green flags** — Automated risk and opportunity detection  
- **Buyer value analysis** — Who would buy this lead and why
- **Confidence scoring** — AI certainty level 0-100

### Venice Model: llama-3.3-70b

| Attribute | Value |
|-----------|-------|
| Speed | Fast (~2-5s response) |
| Cost | Cheap (70B params, efficient) |
| Privacy | Fully private (Venice doesn't log) |
| Fallback | Deterministic algorithm if Venice unavailable |

### Enrichment Output

Each lead now includes:

```json
{
  "ai_enrichment": {
    "ai_description": "AI-generated summary of token...",
    "red_flags": ["low liquidity", "recent contract"],
    "green_flags": ["verified contract", "active trading"],
    "buyer_value": "DeFi traders seeking early token exposure",
    "confidence": 78,
    "venice_model": "llama-3.3-70b",
    "enriched": true
  }
}
```

### Environment Variable

```bash
VENICE_API_KEY=your_venice_key  # From https://venice.ai
```

If VENICE_API_KEY is not set, the agent falls back to deterministic descriptions.

## BaseScan API Status

**Current Status:** The BaseScan API V1 is deprecated but still functional. 
**V2 API** requires a Pro plan subscription.

**Workarounds:**
1. Continue using V1 API (shows deprecation warning but works)
2. Subscribe to BaseScan Pro API for V2 access
3. Use Alchemy/QuickNode for contract discovery (alternative)

**Free Alternative:** Use Alchemy with contract creation queries
```python
# Alchemy API for new contracts
url = f"https://base-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}"
```

## Research Agent Test Result

Test completed with existing configuration:
- BaseScan V1 API: Returns NOTOK (deprecation warning)
- Scanner falls back to limited mode
- Recommendation: Use Alchemy or upgrade to BaseScan Pro
