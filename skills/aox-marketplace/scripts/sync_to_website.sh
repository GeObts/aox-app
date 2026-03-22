#!/bin/bash
# Sync marketplace listings to aox-app website

MARKETPLACE_DIR="$HOME/.openclaw/agents/marketplace/output"
AOX_APP_DIR="$HOME/aox-ebooks"

# Check if aox-app exists
if [ ! -d "$AOX_APP_DIR" ]; then
    AOX_APP_DIR="$HOME/aox-app"
fi

if [ ! -d "$AOX_APP_DIR" ]; then
    echo "ERROR: aox-app directory not found"
    exit 1
fi

# Create data directory
mkdir -p "$AOX_APP_DIR/public/data"

# Copy and filter listings
python3 << 'PYTHON'
import json
import os

src = os.path.expanduser('~/.openclaw/agents/marketplace/output/listings.json')
dst_dir = os.path.expanduser('~/aox-ebooks/public/data')

try:
    with open(src) as f:
        data = json.load(f)
    
    available = [l for l in data.get('listings', []) if l['status'] == 'available']
    
    # Strip sensitive data for public
    public = []
    for lead in available:
        public.append({
            'id': lead['id'],
            'category': lead['category'],
            'title': lead['title'],
            'description': lead['description'],
            'score': lead['score'],
            'tier': lead['tier'],
            'price': lead['price'],
            'payment_token': lead['payment_token'],
            'listed_at': lead['listed_at'],
            'expires_at': lead['expires_at'],
            'metadata': lead.get('public_metadata', {})
        })
    
    # Save available leads
    with open(f"{dst_dir}/available-leads.json", 'w') as f:
        json.dump({'listings': public, 'count': len(public)}, f, indent=2)
    
    # Also save full listings for internal use
    with open(f"{dst_dir}/leads.json", 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Synced {len(public)} available leads to website")
except Exception as e:
    print(f"Error: {e}")
    import sys
    sys.exit(1)
PYTHON

echo "Synced to: $AOX_APP_DIR/public/data/"
