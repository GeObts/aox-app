# AOX + SERV Integration Guide

## Overview

This package enables SERV ecosystem agents to discover and purchase AOX leads via your existing x402 payment infrastructure.

**Files:**
- `aox-service.json` — Service definition for SERV marketplace
- `aox-serv-agent.ts` — TypeScript SERV agent implementation
- `aox_serv_agent.py` — Python SERV agent implementation

---

## Quick Start

### Step 1: Register AOX on SERV Platform

1. Go to https://platform.openserv.ai
2. Log in with Google account
3. Navigate to **Developer → Add Agent**
4. Fill in details:
   - **Name:** AOX Lead Marketplace
   - **Description:** Verified Web3 business intelligence leads
   - **Capabilities:** 
     - Discover leads across categories
     - Purchase leads via x402
     - Get lead pricing tiers
   - **Endpoint:** `http://3.142.118.148:3200`

### Step 2: Deploy the SERV Agent

**Option A: TypeScript (via OpenClaw)**
```bash
cd ~/.openclaw/workspace/serv-integration
npm install @openserv-labs/sdk zod
npx tsx aox-serv-agent.ts
```

**Option B: Python (Standalone)**
```bash
pip install requests pydantic
python aox_serv_agent.py
```

### Step 3: Create API Key

1. Go to **Developer → Your Agents**
2. Select "AOX Lead Marketplace"
3. Click **Create Secret Key**
4. Store in `.env`:
   ```
   OPENSERV_API_KEY=your_key_here
   ```

---

## How SERV Agents Discover AOX

### Discovery Endpoint

```
GET http://3.142.118.148:3200/leads
```

**Query Parameters:**
- `category` — Token Launch, DeFi Protocol, NFT Launch, Polymarket, Misc
- `min_score` — 70-100 (default: 70)
- `tier` — STANDARD, PREMIUM, ELITE

**Response:**
```json
{
  "listings": [
    {
      "id": "base-0x...",
      "category": "Token Launch",
      "title": "AI Agent Token Launch",
      "description": "...",
      "score": 88,
      "tier": "PREMIUM",
      "price": 3,
      "payment_token": "USDC",
      "listed_at": "2026-03-20T17:00:00Z"
    }
  ]
}
```

---

## x402 Payment Flow

SERV agents with x402 capability can purchase leads autonomously:

### Step 1: Get Payment Details
```
GET /leads/{lead_id}/payment
```

**Response (402 Payment Required):**
```json
{
  "x402": {
    "scheme": "permit2",
    "network": "base",
    "receiver": "0x6350B793688221c75cfB438547B9CA47f5b0D4f1",
    "maxAmountRequired": "3000000",
    "resource": "http://3.142.118.148:3200/leads/base-0x...",
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "description": "Premium Lead - AI Agent Token Launch"
  }
}
```

### Step 2: Sign Permit2

The SERV agent (or its wallet) signs the Permit2 authorization.

### Step 3: Complete Purchase

```
POST /leads/{lead_id}/payment
Content-Type: application/json
X-402-Signature: <signed-permit>
```

**Response:**
```json
{
  "status": "success",
  "lead": {
    "id": "base-0x...",
    "title": "AI Agent Token Launch",
    "contacts": [
      {"type": "email", "value": "team@example.com"},
      {"type": "telegram", "value": "@team"}
    ],
    "delivered_at": "2026-03-20T18:30:00Z"
  }
}
```

---

## Research Agent Integration

To use SERV's BRAID reasoning framework with your Research Agent:

### Option 1: API Call from Research Agent

Modify `~/.openclaw/workspace/skills/aox-research/polymarket_scanner.py`:

```python
import requests

# After scoring, call SERV reasoning API
response = requests.post(
    "https://api.openserv.ai/v1/reasoning/analyze",
    headers={"Authorization": f"Bearer {SERV_API_KEY}"},
    json={
        "input": trader_data,
        "task": "evaluate_trader_quality",
        "framework": "braid"
    }
)

braid_score = response.json()["score"]
# Combine with existing scoring
```

### Option 2: Workflow Integration

Create a SERV workflow that:
1. Calls your Research Agent's output
2. Runs BRAID reasoning on the leads
3. Returns enhanced scores to your pipeline

---

## Pricing Comparison

| Service | AOX | SERV Reseller |
|---------|-----|---------------|
| Lead Discovery | Free | Free |
| STANDARD Lead | 1 USDC | 1.10 USDC (10% fee) |
| PREMIUM Lead | 3 USDC | 3.30 USDC (10% fee) |
| ELITE Lead | 5 USDC | 5.50 USDC (10% fee) |

*Note: SERV resellers typically add 10-20% markup*

---

## Support

- **AOX:** https://x.com/PupAIOnBase
- **SERV:** https://platform.openserv.ai
- **Docs:** http://3.142.118.148:3200/docs

---

## Next Steps

1. ✅ Register on https://platform.openserv.ai
2. ✅ Deploy agent code
3. ✅ Create API key
4. ✅ Test discovery flow
5. ✅ Test x402 purchase flow
6. 📈 Market to SERV ecosystem
