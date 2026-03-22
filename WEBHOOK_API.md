# AOX Marketplace Webhook API

Autonomous lead submission endpoint for Research Agent → Marketplace Agent communication.

## Endpoint

```
POST http://3.142.118.148:3200/webhook/new-lead
```

## Authentication

All requests must include the webhook secret header:

```
X-Webhook-Secret: aox-agents-2026
Content-Type: application/json
```

## Request Body

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique lead ID. Format: `{category}-{identifier}` |
| `category` | string | One of: `Token Launch`, `DeFi Protocol`, `NFT Launch`, `Polymarket Trader`, `DAO`, `Misc` |
| `title` | string | Descriptive title with key metrics (FDV, volume, traders) |
| `score` | number | Quality score 0-100 |
| `price` | number | Price in USDC |
| `contact_data` | object | Delivery data with `name` and `fields` array |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `desc` | string | auto-generated | 1-2 sentence description |
| `tier` | string | auto | `<80`=standard, `80-89`=premium, `90-99`=enterprise, `100`=elite |
| `payment_token` | string | USDC | Payment token |
| `status` | string | available | Lead status |
| `metadata` | object | {} | Token metrics: chain, fdv_usd, volume_24h, etc. |
| `wallet_address` | string | - | Subject's wallet address |
| `source_url` | string | - | Data source for verification |
| `source_verified` | boolean | false | Whether data was verified |
| `expires_at` | string | - | ISO timestamp for expiration |

## Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 201 | Success | Lead listed successfully |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid webhook secret |
| 409 | Conflict | Lead ID already exists |
| 500 | Server Error | Retry once after 2s delay |

## Example Request

```bash
curl -X POST http://3.142.118.148:3200/webhook/new-lead \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: aox-agents-2026" \
  -d '{
    "id": "token-0xabc123",
    "category": "Token Launch",
    "title": "ABC Token — $340K FDV, 89 Unique Traders",
    "desc": "Active token on Base with strong liquidity",
    "score": 87,
    "price": 45,
    "tier": "premium",
    "metadata": {
      "chain": "Base",
      "fdv_usd": 340000,
      "volume_24h": 15600,
      "transactions": 312,
      "unique_traders": 89,
      "liquidity_reserve": 210000
    },
    "contact_data": {
      "name": "ABC Token — Full Details",
      "fields": [
        { "label": "Token Contract", "value": "0xabc123..." },
        { "label": "Deployer", "value": "0xdef456..." },
        { "label": "FDV", "value": "$340,000" },
        { "label": "Data Source", "value": "GeckoTerminal API" }
      ]
    }
  }'
```

## Example Response (201 Success)

```json
{
  "success": true,
  "message": "Lead listed successfully",
  "lead_id": "token-0xabc123",
  "title": "ABC Token — $340K FDV, 89 Unique Traders",
  "price": 45,
  "tier": "premium",
  "has_contact_data": true,
  "listed_at": "2026-03-22T18:42:24.235Z",
  "view_url": "http://3.142.118.148:3200/lead?id=token-0xabc123"
}
```

## Example Response (409 Duplicate)

```json
{
  "error": "Lead with id \"token-0xabc123\" already exists"
}
```

## Lead Lifecycle

```
Research Agent discovers lead
    ↓
Verifies via GeckoTerminal/Polymarket APIs
    ↓
Constructs lead JSON with contact_data
    ↓
POST to /webhook/new-lead
    ↓
x402-server validates and saves
    ↓
Lead appears in GET /leads
    ↓
Frontend polls every 60s → aox.llc
    ↓
Buyer pays via x402 → contact_data delivered
```

## Verification

After submission, verify lead is live:

```bash
# Check all listings
curl http://3.142.118.148:3200/leads

# Check specific lead
curl "http://3.142.118.148:3200/lead?id=YOUR_LEAD_ID"

# Check server health
curl http://3.142.118.148:3200/health
```

## Agent Communication Protocol

1. **Research Agent** → POST lead to webhook
2. **Marketplace Agent** → Validate and store
3. **Confirmation** → Return 201 with lead_id
4. **Verification** → Research Agent checks /leads endpoint
5. **Logging** → Both agents log the transaction

## Security

- Webhook secret required (rotate if compromised)
- No private keys in request/response
- All data sources must be verified
- Contact data only delivered after payment

## Version

- **Server:** 3.0.0
- **Endpoint:** `/webhook/new-lead`
- **Auth:** `X-Webhook-Secret: aox-agents-2026`
- **Last Updated:** 2026-03-22

## Related Documentation

- [Marketplace Agent Knowledge Base](https://github.com/GeObts/aox-treasury/tree/main/skills/aox-marketplace/agent-knowledge)
- [ERC-8004 Agent Registration](ERC8004_AGENTS.md)
- [AOX Main Repository](https://github.com/GeObts/aox-treasury)
