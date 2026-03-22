#!/bin/bash
# AOX Hourly Token Scanner — Runs every hour, finds 80+ leads, adds to marketplace

export HOME=/home/ubuntu
export PATH="$HOME/.nvm/versions/node/v22.22.1/bin:$PATH"
cd ~/.openclaw/workspace/skills/aox-research

LOG_FILE="$HOME/.openclaw/agents/research/logs/hourly_scan.log"
LISTINGS_FILE="$HOME/.openclaw/agents/marketplace/output/listings.json"

echo "========================================" >> "$LOG_FILE"
echo "Scan started: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$LOG_FILE"

# Fetch new pools from GeckoTerminal
curl -s "https://api.geckoterminal.com/api/v2/networks/base/new_pools?page=1" > /tmp/gecko_scan.json 2>&1

if [ ! -s /tmp/gecko_scan.json ]; then
    echo "ERROR: Empty response from GeckoTerminal" >> "$LOG_FILE"
    exit 1
fi

# Process with Python
python3 << 'PYEOF'
import json
import os
from datetime import datetime

try:
    with open('/tmp/gecko_scan.json') as f:
        data = json.load(f)
    pools = data.get('data', [])
except Exception as e:
    print(f"Error parsing JSON: {e}")
    exit(1)

qualified = []

for p in pools:
    attrs = p.get('attributes', {})
    name = attrs.get('name', 'Unknown')
    
    try:
        fdv = float(attrs.get('fdv_usd') or 0)
        vol = float(attrs.get('volume_usd', {}).get('h24') or 0)
        reserve = float(attrs.get('reserve_in_usd') or 0)
    except:
        continue
    
    txs = attrs.get('transactions', {}).get('h24', {})
    buys = txs.get('buys', 0)
    buyers = txs.get('buyers', 0)
    
    if fdv < 10000:
        continue
    if any(x in name.lower() for x in ['usdc', 'usdt', 'dai']):
        continue
    
    score = 0
    if fdv >= 100000: score += 30
    elif fdv >= 50000: score += 25
    elif fdv >= 25000: score += 20
    elif fdv >= 10000: score += 15
    
    if vol >= 5000: score += 25
    elif vol >= 2000: score += 20
    elif vol >= 1000: score += 15
    elif vol >= 500: score += 10
    
    if buyers >= 20: score += 30
    elif buyers >= 10: score += 25
    elif buyers >= 5: score += 20
    elif buyers >= 3: score += 10
    
    if buys >= 100: score += 15
    elif buys >= 50: score += 10
    elif buys >= 20: score += 5
    
    if reserve >= 100000: score += 10
    elif reserve >= 50000: score += 7
    elif reserve >= 10000: score += 5
    
    dex = p.get('relationships', {}).get('dex', {}).get('data', {}).get('id', '')
    if 'uniswap-v2' in dex: score += 5
    elif 'uniswap' in dex: score += 3
    
    score = min(score, 100)
    
    if score >= 80:  # MARKETPLACE THRESHOLD
        base_token = p.get('relationships', {}).get('base_token', {}).get('data', {}).get('id', '').replace('base_', '')
        token_name = name.split('/')[0] if '/' in name else name
        
        qualified.append({
            'id': f"token-{base_token[:10]}",
            'name': token_name[:30],
            'fdv': fdv,
            'vol': vol,
            'reserve': reserve,
            'buys': buys,
            'buyers': buyers,
            'score': score,
            'tier': 'enterprise',
            'address': base_token,
            'dex': dex.replace('-base', '') if dex else 'unknown'
        })

if qualified:
    print(f"FOUND {len(qualified)} marketplace-ready leads:")
    for q in qualified:
        print(f"  {q['name']} — Score {q['score']} — ${q['fdv']:,.0f} FDV")
    # Save for processing
    with open('/tmp/new_leads.json', 'w') as f:
        json.dump(qualified, f)
else:
    print("No 80+ score leads found")
    # Remove old leads file if exists
    if os.path.exists('/tmp/new_leads.json'):
        os.remove('/tmp/new_leads.json')
PYEOF

# Check if new leads found
if [ -f /tmp/new_leads.json ]; then
    echo "New leads found, processing..." >> "$LOG_FILE"
    
    # Add each lead to marketplace
    python3 << 'PYEOF'
import json
import os
from datetime import datetime

listings_file = os.path.expanduser('~/.openclaw/agents/marketplace/output/listings.json')

# Load existing
if os.path.exists(listings_file):
    with open(listings_file) as f:
        data = json.load(f)
else:
    data = {"listings": [], "updated_at": datetime.utcnow().isoformat()}

# Load new leads
with open('/tmp/new_leads.json') as f:
    new_leads = json.load(f)

added = 0
for lead_data in new_leads:
    # Check if already exists
    if any(l['id'] == lead_data['id'] for l in data['listings']):
        print(f"Lead {lead_data['id']} already exists, skipping")
        continue
    
    # Create marketplace lead
    new_lead = {
        "id": lead_data['id'],
        "status": "available",
        "category": "Token Launch",
        "title": f"{lead_data['name']} — Active Token",
        "description": f"High-activity token on Base. Score {lead_data['score']}/100. FDV ${lead_data['fdv']:,.0f}, {lead_data['buyers']} unique buyers, ${lead_data['reserve']:,.0f} liquidity.",
        "score": lead_data['score'],
        "tier": "enterprise",
        "price": 100,
        "payment_token": "USDC",
        "payment_address": "0x729174D90CA93139E3E9590993910B784eD32282",
        "listed_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat(),
        "public_metadata": {
            "chain": "Base",
            "fdv_usd": lead_data['fdv'],
            "volume_24h": lead_data['vol'],
            "transactions": lead_data['buys'],
            "unique_buyers": lead_data['buyers'],
            "liquidity_reserve": lead_data['reserve'],
            "dex": lead_data['dex'],
            "token_address": lead_data['address']
        }
    }
    
    data['listings'].append(new_lead)
    added += 1
    print(f"Added lead: {lead_data['name']}")

if added > 0:
    data['updated_at'] = datetime.utcnow().isoformat()
    with open(listings_file, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Total leads added this run: {added}")
PYEOF
    
    # Also update website frontend (leads.ts)
    # This would require git commit/push - doing basic version
    echo "$(date): Updated marketplace with new leads" >> "$LOG_FILE"
else
    echo "$(date): No new 80+ score leads" >> "$LOG_FILE"
fi

echo "Scan completed: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
