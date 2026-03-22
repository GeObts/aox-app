# AOX Agent System — Complete Status

## Overview

Fully autonomous multi-agent system for discovering, scoring, and selling Web3 leads.

```
Research → Normalize → Score (Venice AI) → Policy → Marketplace → Buyer
```

## Agent Architecture

### 1. Research Agent ✅ COMPLETE

**Location:** `~/.openclaw/workspace/skills/aox-research/`

**Scanners:**
| Scanner | File | Schedule | Output |
|---------|------|----------|--------|
| Token Launch | `scanner.py` | Hourly | `~/.openclaw/agents/research/output/*.json` |
| Polymarket Trader | `polymarket_scanner.py` | Daily 6am UTC | `~/.openclaw/agents/research/output/polymarket/*.json` |

**Run:**
```bash
bash ~/.openclaw/workspace/skills/aox-research/scripts/run.sh
bash ~/.openclaw/workspace/skills/aox-research/scripts/run_polymarket.sh
```

---

### 2. Normalization Layer ✅ COMPLETE

**Location:** `~/.openclaw/workspace/skills/aox-scoring/normalizer.py`

**Functions:**
- Structure raw research data
- Validate contact methods (min 2 required)
- Deduplicate leads
- Calculate field confidence
- Reject: fake URLs, stale data, insufficient contacts

**Input:** `~/.openclaw/agents/research/output/`
**Output:** `~/.openclaw/agents/normalization/output/`

---

### 3. Scoring Agent ✅ COMPLETE (Mock)

**Location:** `~/.openclaw/workspace/skills/aox-scoring/`

**Components:**
| Component | File | Purpose |
|-----------|------|---------|
| Normalizer | `normalizer.py` | Clean/structure/dedupe |
| Scorer | `scorer.py` | Venice AI inference |
| Policy Gate | `policy_gate.py` | Business rules & routing |

**Scoring (6 sub-scores):**
- Intent: 25% (business value)
- Reachability: 20% (contactability)
- Fit: 20% (buyer alignment)
- Freshness: 15% (recency)
- Completeness: 10% (data quality)
- Confidence: 10% (validation)

**Routing:**
- 80+ → Marketplace
- 60-79 → Review
- <60 → Reject

**Input:** `~/.openclaw/agents/normalization/output/`
**Output:** 
- `~/.openclaw/agents/scoring/output/` (marketplace)
- `~/.openclaw/agents/scoring/review/` (manual review)
- `~/.openclaw/agents/scoring/rejected/` (rejected)

**Run:**
```bash
bash ~/.openclaw/workspace/skills/aox-scoring/scripts/run_pipeline.sh
```

---

### 4. Marketplace Agent ✅ COMPLETE

**Location:** `~/.openclaw/workspace/skills/aox-marketplace/`

**Files:**
| File | Purpose |
|------|---------|
| `marketplace_agent.py` | Main agent |
| `api_server.py` | HTTP API for website |
| `scripts/sync_to_website.sh` | Sync to aox-app |

**Functions:**
1. Add approved leads to marketplace
2. Monitor blockchain for payments
3. Reveal private data after purchase
4. Update treasury
5. Sync to website

**Input:** `~/.openclaw/agents/marketplace/input/`
**Output:** 
- `~/.openclaw/agents/marketplace/output/listings.json`
- `~/.openclaw/agents/marketplace/output/sales.json`

**Run:**
```bash
# Add leads
python3 ~/.openclaw/workspace/skills/aox-marketplace/marketplace_agent.py --add-leads

# Check payments
python3 ~/.openclaw/workspace/skills/aox-marketplace/marketplace_agent.py --check-payments

# Sync to website
bash ~/.openclaw/workspace/skills/aox-marketplace/scripts/sync_to_website.sh

# Full report
python3 ~/.openclaw/workspace/skills/aox-marketplace/marketplace_agent.py --report
```

**API:**
```bash
# Start API server
python3 ~/.openclaw/workspace/skills/aox-marketplace/api_server.py

# Endpoints:
# GET  /api/leads          - Available listings
# GET  /api/leads/<id>     - Specific lead
# POST /api/purchase       - Initiate purchase
```

---

### 5. Email System ✅ PARTIAL

**Location:** `~/.openclaw/workspace/skills/aox-email/`

**Working:**
- ✅ Read inbox (IMAP)
- ✅ Monitor for new emails
- ✅ Classify emails (buyer/support/lead)

**Blocked:**
- ⚠️ Send emails (550 sender verification pending)

**Run:**
```bash
# Check inbox once
python3 ~/.openclaw/workspace/skills/aox-email/email_monitor.py

# Monitor continuously
python3 ~/.openclaw/workspace/skills/aox-email/email_monitor.py loop
```

---

## Data Flow

```
Research Agent discovers leads
    ↓
~/.openclaw/agents/research/output/
    ↓
Normalization Layer validates & structures
    ↓
~/.openclaw/agents/normalization/output/
    ↓
Scoring Agent (Venice AI) evaluates
    ↓
~/.openclaw/agents/scoring/output/
    ↓
Policy Gate applies business rules
    ↓
~/.openclaw/agents/marketplace/input/
    ↓
Marketplace Agent lists for sale
    ↓
~/.openclaw/agents/marketplace/output/listings.json
    ↓
Sync to aox-app website
    ↓
Buyer purchases → Payment on blockchain
    ↓
Private data revealed to buyer
```

## Cron Schedule (To Set Up)

```bash
# Research: Hourly (tokens), Daily 6am (Polymarket)
0 * * * * bash ~/.openclaw/workspace/skills/aox-research/scripts/run.sh
0 6 * * * bash ~/.openclaw/workspace/skills/aox-research/scripts/run_polymarket.sh

# Scoring: Every 30 minutes
*/30 * * * * bash ~/.openclaw/workspace/skills/aox-scoring/scripts/run_pipeline.sh

# Marketplace: Every 10 minutes (add leads), every 5 min (check payments)
*/10 * * * * python3 ~/.openclaw/workspace/skills/aox-marketplace/marketplace_agent.py --add-leads
*/5 * * * * python3 ~/.openclaw/workspace/skills/aox-marketplace/marketplace_agent.py --check-payments

# Email: Every 5 minutes
*/5 * * * * python3 ~/.openclaw/workspace/skills/aox-email/email_monitor.py
```

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Research Agent | ✅ Ready | Needs BaseScan API key |
| Normalization | ✅ Ready | Fully operational |
| Scoring Agent | ⚠️ Mock | Venice AI timeout issue |
| Policy Gate | ✅ Ready | Fully operational |
| Marketplace | ✅ Ready | Tested with sample lead |
| Email (Read) | ✅ Ready | IMAP working |
| Email (Send) | ⚠️ Blocked | Needs domain verification |

## Next Steps

1. **Fix Venice AI scorer** - Debug timeout, use real API
2. **Set up cron jobs** - Automate the pipeline
3. **Get BaseScan API key** - For live token scanning
4. **Fix AgentMail sending** - Complete domain verification
5. **Connect to aox-app** - Website reads from marketplace API
6. **Add blockchain monitoring** - Real payment detection

## Test Command

```bash
# Run full pipeline test
bash ~/.openclaw/workspace/skills/aox-research/scripts/run.sh
bash ~/.openclaw/workspace/skills/aox-scoring/scripts/run_pipeline.sh
python3 ~/.openclaw/workspace/skills/aox-marketplace/marketplace_agent.py --add-leads
bash ~/.openclaw/workspace/skills/aox-marketplace/scripts/sync_to_website.sh
```
