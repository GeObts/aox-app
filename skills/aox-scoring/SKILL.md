# AOX Scoring Agent — Private Lead Evaluation

## Purpose

Receive enriched leads from Research Agent, evaluate quality using **private Venice AI inference**, assign final scores, and pass qualified leads to Marketplace Agent.

## Privacy Model

```
Research Agent (raw data)
    ↓
[ ENCRYPTED PIPELINE ]
    ↓
Scoring Agent → Venice AI (private inference)
    ↓
[ ONLY SCORE + CLASSIFICATION EXPOSED ]
    ↓
Marketplace Agent (public: score, tier, price)
    ↓
[ AFTER PAYMENT: FULL DETAILS REVEALED ]
    ↓
Buyer gets complete lead data
```

**Critical:** Venice AI runs with **no logging, no training data retention**. Raw wallet data, trade history, and PII never leaves the secure inference environment.

## Requirements

### Environment Variables

```bash
VENICE_API_KEY=your_venice_key          # Already in ~/.openclaw/.env
SCORING_INPUT_DIR=~/.openclaw/agents/research/output
SCORING_OUTPUT_DIR=~/.openclaw/agents/scoring/output
SCORING_REJECTED_DIR=~/.openclaw/agents/scoring/rejected
SCORING_LOG_DIR=~/.openclaw/agents/scoring/logs
```

### Venice AI Model

Uses `venice/deepseek-v3.2` (fully private inference)
- No data logging
- No training retention
- Stateless processing

## How It Works

### Input

Research Agent drops JSON files to input directory:
- Token leads: `~/.openclaw/agents/research/output/base-*.json`
- Polymarket leads: `~/.openclaw/agents/research/output/polymarket/pm-*.json`

### Scoring Process

1. **Load** — Read lead JSON
2. **Anonymize** — Strip direct identifiers (optional)
3. **Send to Venice** — Private inference with structured prompt
4. **Receive** — AI-generated score (0-100) + reasoning
5. **Classify** — Assign tier based on score
6. **Route** — Pass 70+ to Marketplace, reject <70 with reason

### Venice Prompt Template

```
You are an expert crypto analyst evaluating leads for the Agent Opportunity Exchange.

ANALYZE THIS LEAD:
- Category: {category}
- Research Score: {research_score}
- Metrics: {metrics_summary}

EVALUATE:
1. Quality of opportunity (0-100)
2. Risk level (low/medium/high)
3. Urgency (immediate/soon/future)
4. Confidence in assessment (0-100)

RESPOND IN JSON:
{
  "final_score": 0-100,
  "risk_level": "low|medium|high",
  "urgency": "immediate|soon|future",
  "confidence": 0-100,
  "reasoning": "brief explanation",
  "red_flags": ["flag1", "flag2"],
  "recommendation": "pass|reject|review"
}

Do not store or log this analysis.
```

### Output (Public - Pre-Payment)

```json
{
  "lead_id": "base-0xabc...",
  "category": "Token Launch",
  "title": "...",
  "score": 78,
  "tier": "Standard",
  "price": 20,
  "payment_token": "USDC",
  "ai_confidence": 85,
  "ai_reasoning": "Strong momentum, good liquidity",
  "risk_level": "medium",
  "discovered_at": "...",
  "scored_at": "...",
  "data_hash": "sha256_of_full_data"
}
```

### Output (Private - Post-Payment)

Full lead JSON including:
- Complete wallet addresses
- Detailed metrics
- Trade history
- Social handles
- Source data

### Rejected Leads

Saved to `~/.openclaw/agents/scoring/rejected/{lead_id}.json` with:
```json
{
  "lead_id": "...",
  "rejected": true,
  "rejection_reason": "Score 45 below threshold",
  "ai_reasoning": "Insufficient liquidity, high risk",
  "rejected_at": "2026-03-19T22:00:00Z"
}
```

## Scoring Thresholds

| Score | Tier | Price | Action |
|-------|------|-------|--------|
| 90-100 | Enterprise | 100+ USDC | Pass to Marketplace |
| 80-89 | Premium | 50 USDC | Pass to Marketplace |
| 70-79 | Standard | 20 USDC | Pass to Marketplace |
| <70 | — | — | Reject with reason |

## Cron Schedule

```bash
# Run every 30 minutes
*/30 * * * * bash ~/.openclaw/workspace/skills/aox-scoring/scripts/run.sh
```

## Manual Run

```bash
bash ~/.openclaw/workspace/skills/aox-scoring/scripts/run.sh
```

## References

- `references/venice-api.md` — Venice AI API docs
- `references/privacy-model.md` — Data flow and exposure rules
- `references/example-scored.json` — Sample output
