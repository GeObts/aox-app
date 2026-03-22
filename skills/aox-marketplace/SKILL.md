# AOX Marketplace Agent

## Purpose

List qualified leads on the AOX marketplace, process payments, and deliver lead data to buyers.

## Architecture

```
Policy Gate Output (marketplace ready leads)
    ↓
Marketplace Agent
    ├── Add to public listings (aox-app)
    ├── Monitor blockchain for payments
    ├── On payment: reveal private data
    ├── Update treasury
    └── Send confirmation
```

## Data Flow

### Input (from Policy Gate)
```json
{
  "lead_id": "base-0xabc...",
  "category": "Token Launch",
  "title": "Premium Lead",
  "description": "...",
  "score": 90,
  "tier": "Premium",
  "price": 50,
  "payment_token": "USDC",
  "public_metadata": {...},
  "private_data_encrypted": "..."
}
```

### Output (to aox-app)
```json
{
  "listings": [
    {
      "id": "base-0xabc...",
      "status": "available", // available | sold | expired
      "category": "Token Launch",
      "title": "Premium Lead",
      "description": "...",
      "score": 90,
      "tier": "Premium",
      "price": 50,
      "payment_token": "USDC",
      "listed_at": "2026-03-20T00:00:00Z",
      "expires_at": "2026-03-27T00:00:00Z",
      "buyer": null, // filled after purchase
      "transaction_hash": null
    }
  ]
}
```

## Payment Flow

1. Buyer clicks "Purchase" on website
2. Website generates unique payment address
3. Buyer sends USDC/ETH to address
4. Marketplace Agent monitors blockchain
5. Upon confirmation:
   - Mark lead as "sold"
   - Reveal private data to buyer
   - Forward payment to treasury
   - Send confirmation email

## Files

| File | Purpose |
|------|---------|
| `marketplace_agent.py` | Main agent code |
| `listings.json` | Public listings (synced to aox-app) |
| `sales.json` | Sales log |
| `SKILL.md` | This documentation |

## Integration with aox-app

The marketplace agent writes to a JSON file that the Next.js app reads:

```javascript
// In aox-app
const listings = await fetch('/api/leads').then(r => r.json());
```

Or static file:
```javascript
import listings from '@/data/listings.json';
```

## Cron Schedule

```bash
# Check for new leads every 10 minutes
*/10 * * * * python3 ~/.openclaw/workspace/skills/aox-marketplace/marketplace_agent.py --add-leads

# Monitor payments every 5 minutes
*/5 * * * * python3 ~/.openclaw/workspace/skills/aox-marketplace/marketplace_agent.py --check-payments
```

## CLI Usage

```bash
# Add new leads to marketplace
python3 marketplace_agent.py --add-leads

# Check for payments
python3 marketplace_agent.py --check-payments

# Generate daily report
python3 marketplace_agent.py --report

# Full cycle (add + check)
python3 marketplace_agent.py --run
```
