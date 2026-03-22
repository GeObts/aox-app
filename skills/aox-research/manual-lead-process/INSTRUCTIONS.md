# AOX Marketplace — Manual Lead Upload Blueprint

## Overview

To manually list a lead on the AOX marketplace, you need to edit one file: `app/lib/leads.ts` in the aox-app repo. You add two things: the lead listing (public info buyers see before purchase) and the reveal data (private info unlocked after payment). If revealData exists for a lead ID, the lead is automatically open for sale with all tokens (USDC, USDT, DAI, WETH, $BNKR, ETH). No other files need to change.

---

## Step 1: Open app/lib/leads.ts

This file has two sections:
1. `HARDCODED_LEADS` array — the public listing cards
2. `revealData` object — the private data delivered after purchase

---

## Step 2: Add the lead to HARDCODED_LEADS

Add a new object to the HARDCODED_LEADS array. Place it at the top of the array so it appears first.

**IMPORTANT:** The listing must NOT reveal the full details (wallet address, profile link, specific metrics). It should tease the value without giving away what the buyer is paying for.

---

### Field rules for HARDCODED_LEADS:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique. For Polymarket leads use poly-XXXX. Increment from highest existing poly ID. |
| `category` | string | Must be exactly 'Polymarket', 'NFT Launch', 'DeFi Protocol', 'Token Launch', 'DAO', or 'Misc'. Case-sensitive. |
| `title` | string | Short, punchy. OK to include volume headline. Do NOT include wallet address. |
| `desc` | string | 1-2 sentences selling value. Do NOT include wallet, profile URL, or contact info. |
| `score` | number | 0-100 integer. |
| `price` | number | USDC amount (e.g., 100 means 100 USDC). |
| `tier` | string | One of: 'standard', 'premium', 'enterprise', 'elite'. |
| `wallet_age` | string | e.g., 'Verified', '2+ years', etc. |
| `liquidity` | string | Volume/TVL description. |
| `contacts` | number | Number of contact points in reveal data. |
| `chain` | string | Blockchain name. |
| `timestamp` | string | ISO 8601 date string of when listed. |
| `win_rate` | string | (optional, Polymarket only) |
| `volume` | string | (optional, Polymarket only) |
| `markets` | number | (optional, Polymarket only) |

---

## Step 3: Add reveal data to revealData

In the same file, add an entry to the `revealData` object using the same id as the key. This is the data the buyer receives after payment.

---

### Reveal data rules:

```typescript
'<same-id>': {
  fields: [
    { label: '<Label>', value: '<private detail>' },
    // ... as many fields as needed
  ],
},
```

- Each field has a `label` (string) and `value` (string).
- Put ALL private details here: wallet addresses, profile URLs, specific contact info, detailed metrics, risk flags, sourcing notes.
- This is what gets shown in the delivery modal, copied to clipboard, and downloaded as TXT.

---

## Step 4: Verify the lead is open for sale

No additional code changes needed. The marketplace page and category pages check:

```typescript
if (revealData[lead.id]) → show active "Buy X USDC" button
else → show disabled "Coming Soon" button
```

As long as the id in HARDCODED_LEADS matches a key in revealData, the lead is automatically purchasable with all 6 payment tokens on Base mainnet.

---

## Step 5: Commit and push

```bash
cd ~/aox-app
git add app/lib/leads.ts
git commit -m "Add <brief description>"
git push
```

---

## Quick Checklist

- [ ] Lead ID is unique (check existing IDs in the file)
- [ ] `category` string matches a filter exactly
- [ ] `title` and `desc` do NOT contain wallet addresses, profile URLs, or private contact info
- [ ] `revealData` entry exists with same ID and contains ALL private details
- [ ] `price` is a number (USDC amount), not a string
- [ ] `timestamp` is ISO 8601 format
- [ ] For Polymarket leads: include optional `win_rate`, `volume`, `markets` fields

---

## Template for Future Leads

### Lead object:

```typescript
{
  id: '<category>-<number>',
  category: '<exact category name>',
  title: '<short headline — no private data>',
  desc: '<1-2 sentence teaser — no private data>',
  score: <0-100>,
  price: <USDC amount>,
  tier: '<standard|premium|enterprise|elite>',
  wallet_age: '<string>',
  liquidity: '<string>',
  contacts: <number>,
  chain: '<chain name>',
  timestamp: '<ISO 8601>',
  // Optional Polymarket fields:
  win_rate: '<string>',
  volume: '<string>',
  markets: <number>,
}
```

### Reveal object:

```typescript
'<same-id>': {
  fields: [
    { label: '<Label>', value: '<private detail>' },
    // ... as many fields as needed
  ],
},
```

---

**Created:** 2026-03-21
**Version:** 1.0
**Owner:** AOX CEO
