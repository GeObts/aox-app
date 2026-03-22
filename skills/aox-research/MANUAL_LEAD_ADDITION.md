# Manual Lead Addition — AOX

**Purpose:** Emergency/manual process for adding verified leads when Research Agent finds
a lead through non-automated means (e.g., operator provides wallet, external discovery).

**This is NOT the normal pipeline.** Normal flow: Research → Normalize → Score → Marketplace.
This manual process bypasses the pipeline for verified leads that need immediate listing.

---

## Prerequisites

- Wallet address with confirmed activity
- Source of verification (Polymarket API, BaseScan, etc.)
- Ability to verify metrics via API calls

---

## Step 1: Verify Wallet Data

### For Polymarket Leads:

```bash
# Fetch trades for wallet
WALLET="0x..."
curl -s "https://data-api.polymarket.com/trades?user=$WALLET&limit=500" > /tmp/wallet_trades.json

# Calculate metrics
python3 << 'PYEOF'
import json
with open('/tmp/wallet_trades.json') as f: 
    t = json.load(f)

if not t:
    print("ERROR: No trades found — wallet invalid or inactive")
    exit(1)

vol = sum(float(x.get('size',0)) * float(x.get('price',0)) for x in t)
mkts = len(set(x.get('slug','') for x in t))
buys = sum(1 for x in t if x.get('side') == 'BUY')
sells = sum(1 for x in t if x.get('side') == 'SELL')
profile_name = t[0].get('name', 'Unknown') if t else 'Unknown'

print(f"Trades: {len(t)}")
print(f"Volume: ${vol:,.2f}")
print(f"Markets: {mkts}")
print(f"Buys: {buys} | Sells: {sells}")
print(f"Profile Name: {profile_name}")
print(f"Verified: TRUE")
PYEOF
```

**Stop if:** No trades returned, volume < $1,000, or fewer than 10 unique markets.

---

## Step 2: Score the Lead

Use verified numbers only. No estimates.

| Factor | Calculation | Max Score |
|--------|-------------|-----------|
| Intent | Volume-based: <$1K=40, $1-10K=60, $10-100K=75, $100K-1M=85, $1M+=95 | 100 |
| Reachability | Public profile = 75, + direct contact = +15 | 100 |
| Buyer Fit | Whale = 90, Active = 75, Dabbler = 50 | 100 |
| Freshness | Live API data = 95, <24hrs = 85, <1wk = 70 | 100 |
| Completeness | Full history = 90, partial = 70, minimal = 50 | 100 |
| Confidence | Direct from source API = 95 | 100 |
| **Risk** | Abnormal pattern = -30, suspicious = -50, confirmed fake = reject | — |

**Formula:**
```
intent × 0.25 + reachability × 0.20 + buyer_fit × 0.20 + 
freshness × 0.15 + completeness × 0.10 + confidence × 0.10 - risk_penalty
```

**Thresholds:**
- 80+ = Marketplace (Standard/Premium/Enterprise)
- 60-79 = Review queue
- <60 = Reject

---

## Step 3: Create Lead JSON

```json
{
  "id": "poly-{wallet_short}",
  "category": "Polymarket Trader",
  "title": "Descriptive Title — Volume Tier",
  "desc": "Verified description using ONLY verified metrics.",
  "score": <calculated>,
  "tier": "standard|premium|enterprise",
  "price": <20|50|100>,
  "payment_token": "USDC",
  "wallet_address": "0x...",
  "polymarket_profile": "https://polymarket.com/profile/0x...",
  "total_trades": <verified>,
  "total_volume": <verified>,
  "unique_markets": <verified>,
  "buys": <verified>,
  "sells": <verified>,
  "win_rate": "unverified",
  "source_verified": true,
  "source_url": "https://data-api.polymarket.com/trades?user=0x...",
  "verified_at": "ISO8601",
  "status": "available",
  "listed_at": "ISO8601",
  "risk_flags": ["flag1", "flag2"],
  "scoring_breakdown": {
    "intent": <n>,
    "reachability": <n>,
    "buyer_fit": <n>,
    "freshness": <n>,
    "completeness": <n>,
    "confidence": <n>,
    "risk_penalty": <n>
  }
}
```

**Rules:**
- ONLY use verified numbers from API calls
- NEVER estimate volume, win rate, or performance
- ALWAYS flag what cannot be verified
- ALWAYS include source_url for traceability

---

## Step 4: Add to Listings

### Option A: Via API Server (x402)

```bash
# Read current listings
cat ~/.openclaw/agents/marketplace/output/listings.json

# Append new lead to listings array, increment count

# Restart API server
pkill -f 'node.*3200' 2>/dev/null
sleep 1
nohup node ~/.openclaw/agents/marketplace/x402-server.js > /tmp/api.log 2>&1 &
sleep 3

# Verify
curl http://3.142.118.148:3200/leads
```

### Option B: Direct File Edit

```bash
# Edit ~/.openclaw/agents/marketplace/output/listings.json
# Add lead object to "listings" array
# Increment "count" field
# Save and restart server
```

---

## Step 5: Log the Manual Addition

Append to manual lead log:
```bash
echo "[$(date -Iseconds)] MANUAL_ADD | ID: {id} | Score: {score} | Operator: Goya | Source: {source}" \
  >> ~/.openclaw/agents/marketplace/logs/manual_additions.log
```

---

## Verification Checklist

Before marking complete:
- [ ] API data fetched and saved to /tmp
- [ ] All metrics calculated from API response
- [ ] Score calculated using formula above
- [ ] Score >= 80 (if below, reject and document)
- [ ] JSON created with ONLY verified fields
- [ ] Unverified fields marked "unverified"
- [ ] Risk flags included if applicable
- [ ] Added to listings.json
- [ ] API server restarted and serving
- [ ] curl http://3.142.118.148:3200/leads shows new lead
- [ ] Log entry created

---

## Example: Complete Session

```bash
# Step 1: Verify
WALLET="0xc2e7800b5af46e6093872b177b7a5e7f0563be51"
curl -s "https://data-api.polymarket.com/trades?user=$WALLET&limit=500" > /tmp/verify.json

# Step 2: Calculate
# (Python script from Step 2 above)
# Result: 500 trades, $64,242,887.69 volume, 56 markets

# Step 3: Score = 90 (Enterprise)

# Step 4: Create JSON
# (Template from Step 3 above)

# Step 5: Add to listings and restart API
# (Commands from Step 4 above)

# Step 6: Verify
# curl http://3.142.118.148:3200/leads | grep "0xc2e78"

# Step 7: Log
echo "[$(date -Iseconds)] MANUAL_ADD | ID: poly-0xc2e7800b5a | Score: 90 | Operator: Goya | Source: polymarket_api" \
  >> ~/.openclaw/agents/marketplace/logs/manual_additions.log
```

---

## Emergency Contacts

If API fails:
- Check Polymarket Gamma API status
- Verify wallet on https://polymarket.com/profile/{wallet}
- Check PolygonScan for on-chain activity

If server won't restart:
- Check port 3200: `lsof -i :3200`
- Kill existing: `pkill -f x402-server`
- Review logs: `cat /tmp/api.log`

---

**Created:** 2026-03-21
**Version:** 1.0
**Owner:** AOX CEO
