# AOX Scoring Pipeline Architecture

## Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  RESEARCH AGENT                                                  │
│  • Token scanner (hourly)                                         │
│  • Polymarket scanner (daily 6am UTC)                             │
│  Output: ~/.openclaw/agents/research/output/*.json              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  NORMALIZATION LAYER                                             │
│  normalizer.py                                                   │
│  • Structures raw data                                           │
│  • Validates contact methods                                     │
│  • Detects duplicates                                            │
│  • Calculates field confidence                                   │
│  • Rejects: <2 contacts, fake URLs, stale data                   │
│  Output: ~/.openclaw/agents/normalization/output/*.json        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  SCORING AGENT (Venice AI)                                       │
│  scorer.py                                                       │
│  • Hard rule prefilter                                           │
│  • Private Venice inference (deepseek-v3.2)                      │
│  • 6 sub-scores: intent, reachability, fit, freshness,           │
│    completeness, confidence                                       │
│  • Risk penalty                                                  │
│  • Weighted overall score                                        │
│  Output: ~/.openclaw/agents/scoring/{output,review,rejected}/*.json
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  POLICY GATE                                                     │
│  policy_gate.py                                                  │
│  • Business rules: daily limits, price floors                    │
│  • Freshness check                                               │
│  • Duplicate prevention                                          │
│  • Encrypts private data                                         │
│  • Creates public/private lead versions                          │
│  Output: ~/.openclaw/agents/marketplace/input/*.json             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  MARKETPLACE AGENT                                               │
│  (To be built)                                                   │
│  • Lists public leads                                            │
│  • Handles payments                                              │
│  • Reveals private data post-purchase                            │
└─────────────────────────────────────────────────────────────────┘
```

## Scoring Weights

```
Intent:        25%  (business value)
Reachability:  20%  (contactability)
Fit:           20%  (buyer alignment)
Freshness:     15%  (recency)
Completeness:  10%  (data quality)
Confidence:    10%  (validation)
─────────────────────────────
Risk Penalty:  -50% of risk_score
```

## Routing Thresholds

| Score | Status | Action |
|-------|--------|--------|
| 80-100 | marketplace | List for sale |
| 60-79 | review | Manual review queue |
| 0-59 | reject | Discard with reason |

## Privacy Model

### Pre-Purchase (Public)
- Lead ID
- Category, niche
- Title, description
- Overall score
- Tier, price
- AI confidence
- Risk level
- Contact method count
- Top 3 reasons

### Post-Purchase (Private)
- Full wallet addresses
- Complete contact details
- Social media handles
- Raw activity data
- Trade history
- Source notes

## Reason Codes

### Acceptance
- `ACCEPT_HIGH_SCORE` (80+)
- `ACCEPT_STRONG_CONTACT_DATA`
- `ACCEPT_HIGH_INTENT`

### Review
- `REVIEW_BORDERLINE` (60-79)
- `REVIEW_LOW_CONFIDENCE`

### Rejection
- `REJECT_LOW_SCORE` (<60)
- `REJECT_INSUFFICIENT_CONTACTS`
- `REJECT_DUPLICATE`
- `REJECT_STALE`
- `REJECT_UNVERIFIABLE`
- `REJECT_SPAM_FLAG`
- `REJECT_DAILY_LIMIT`
- `REJECT_PRICE_FLOOR`

## Running the Pipeline

```bash
# Full pipeline
bash ~/.openclaw/workspace/skills/aox-scoring/scripts/run_pipeline.sh

# Individual stages
python3 ~/.openclaw/workspace/skills/aox-scoring/normalizer.py
python3 ~/.openclaw/workspace/skills/aox-scoring/scorer.py
python3 ~/.openclaw/workspace/skills/aox-scoring/policy_gate.py
```

## Cron Schedule

```bash
# Research: Hourly (tokens), Daily 6am (Polymarket)
0 * * * * bash ~/.openclaw/workspace/skills/aox-research/scripts/run.sh
0 6 * * * bash ~/.openclaw/workspace/skills/aox-research/scripts/run_polymarket.sh

# Scoring: Every 30 minutes
*/30 * * * * bash ~/.openclaw/workspace/skills/aox-scoring/scripts/run_pipeline.sh
```

## Files

| File | Purpose |
|------|---------|
| `normalizer.py` | Clean, validate, dedupe, structure |
| `scorer.py` | Venice AI private scoring |
| `policy_gate.py` | Business rules, encryption, routing |
| `scripts/run_pipeline.sh` | Orchestrate full pipeline |
| `SKILL.md` | Documentation |
| `ARCHITECTURE.md` | This file |

## Next Steps

1. **Test pipeline** with sample leads
2. **Build Marketplace Agent** to consume scored leads
3. **Add feedback loop** for buyer quality ratings
4. **Tune weights** based on actual sales data
