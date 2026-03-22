#!/usr/bin/env python3
"""
AOX Marketplace Agent
Lists leads, processes payments, delivers data to buyers.
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

# Config
INPUT_DIR = os.getenv('MARKETPLACE_INPUT_DIR', os.path.expanduser('~/.openclaw/agents/marketplace/input'))
OUTPUT_DIR = os.getenv('MARKETPLACE_OUTPUT_DIR', os.path.expanduser('~/.openclaw/agents/marketplace/output'))
LOG_DIR = os.getenv('MARKETPLACE_LOG_DIR', os.path.expanduser('~/.openclaw/agents/marketplace/logs'))
TRANSACTIONS_DIR = os.path.expanduser('~/.openclaw/agents/marketplace/transactions')

# Marketplace data files
LISTINGS_FILE = os.path.join(OUTPUT_DIR, 'listings.json')
SALES_FILE = os.path.join(OUTPUT_DIR, 'sales.json')

# Treasury wallet (from existing config)
TREASURY_WALLET = os.getenv('TREASURY_WALLET', '0x6350B793688221c75cfB438547B9CA47f5b0D4f1')

@dataclass
class Listing:
    id: str
    status: str  # available, sold, expired
    category: str
    title: str
    description: str
    score: int
    tier: str
    price: int
    payment_token: str
    public_metadata: Dict
    private_data_hash: str  # Hash only, actual data stored separately
    listed_at: str
    expires_at: str
    buyer: Optional[str] = None
    buyer_email: Optional[str] = None
    transaction_hash: Optional[str] = None
    sold_at: Optional[str] = None

class MarketplaceAgent:
    def __init__(self):
        for d in [OUTPUT_DIR, LOG_DIR, TRANSACTIONS_DIR]:
            os.makedirs(d, exist_ok=True)
        self.listings = self._load_listings()
        self.sales = self._load_sales()
    
    def log(self, message: str):
        ts = datetime.now().isoformat()
        entry = f"[{ts}] {message}"
        print(entry)
        with open(f"{LOG_DIR}/marketplace.log", 'a') as f:
            f.write(entry + '\n')
    
    def _load_listings(self) -> List[Dict]:
        if os.path.exists(LISTINGS_FILE):
            with open(LISTINGS_FILE) as f:
                data = json.load(f)
                return data.get('listings', [])
        return []
    
    def _save_listings(self):
        with open(LISTINGS_FILE, 'w') as f:
            json.dump({'listings': self.listings, 'updated_at': datetime.now().isoformat()}, f, indent=2)
    
    def _load_sales(self) -> List[Dict]:
        if os.path.exists(SALES_FILE):
            with open(SALES_FILE) as f:
                data = json.load(f)
                return data.get('sales', [])
        return []
    
    def _save_sales(self):
        with open(SALES_FILE, 'w') as f:
            json.dump({'sales': self.sales, 'updated_at': datetime.now().isoformat()}, f, indent=2)
    
    def _generate_payment_address(self, listing_id: str) -> str:
        """Generate unique payment address for a listing."""
        # In production: generate actual wallet address
        # For now: hash-based deterministic address
        seed = f"{listing_id}{TREASURY_WALLET}{datetime.now().strftime('%Y%m%d')}"
        return f"0x{hashlib.sha256(seed.encode()).hexdigest()[:40]}"
    
    def add_leads(self):
        """Add new leads from policy gate to marketplace."""
        self.log("=" * 60)
        self.log("Adding new leads to marketplace...")
        
        added = 0
        
        for filename in os.listdir(INPUT_DIR):
            if not filename.endswith('_public.json'):
                continue
            
            filepath = os.path.join(INPUT_DIR, filename)
            try:
                with open(filepath) as f:
                    lead = json.load(f)
                
                lead_id = lead.get('lead_id')
                
                # Check if already listed
                if any(l['id'] == lead_id for l in self.listings):
                    self.log(f"  Skipping {lead_id}: already listed")
                    continue
                
                # Create listing
                now = datetime.now()
                expires = now + timedelta(days=7)
                
                listing = {
                    'id': lead_id,
                    'status': 'available',
                    'category': lead.get('category', 'Unknown'),
                    'title': lead.get('title', 'Untitled Lead'),
                    'description': lead.get('description', ''),
                    'score': lead.get('score', 0),
                    'tier': lead.get('tier', 'Standard'),
                    'price': lead.get('price', 20),
                    'payment_token': lead.get('payment_token', 'USDC'),
                    'public_metadata': lead.get('public_metadata', {}),
                    'private_data_hash': lead.get('data_hash', ''),
                    'payment_address': self._generate_payment_address(lead_id),
                    'listed_at': now.isoformat(),
                    'expires_at': expires.isoformat(),
                    'buyer': None,
                    'transaction_hash': None
                }
                
                self.listings.append(listing)
                added += 1
                
                # Save private data separately (for delivery after purchase)
                private_file = os.path.join(TRANSACTIONS_DIR, f"{lead_id}_private.json")
                with open(private_file, 'w') as f:
                    json.dump({
                        'lead_id': lead_id,
                        'private_data': lead,  # Full lead data
                        'access_key': hashlib.sha256(f"{lead_id}{TREASURY_WALLET}".encode()).hexdigest()[:16]
                    }, f, indent=2)
                
                self.log(f"  Added: {lead_id} - {listing['tier']} tier, ${listing['price']}")
                
                # Move processed file
                processed_dir = os.path.join(INPUT_DIR, 'processed')
                os.makedirs(processed_dir, exist_ok=True)
                os.rename(filepath, os.path.join(processed_dir, filename))
                
            except Exception as e:
                self.log(f"  ERROR processing {filename}: {e}")
        
        if added > 0:
            self._save_listings()
        
        self.log(f"Added {added} new listings")
        self.log("=" * 60)
        return added
    
    def check_payments(self):
        """Monitor blockchain for payments."""
        self.log("=" * 60)
        self.log("Checking for payments...")
        
        # In production: query Base blockchain for transactions
        # For now: simulate/mock
        
        sold = 0
        
        for listing in self.listings:
            if listing['status'] != 'available':
                continue
            
            # Check if payment received (mock)
            # In production: check blockchain for payment to listing['payment_address']
            payment_received = self._check_blockchain_payment(listing['payment_address'], listing['price'])
            
            if payment_received:
                # Mark as sold
                listing['status'] = 'sold'
                listing['sold_at'] = datetime.now().isoformat()
                listing['buyer'] = payment_received.get('from', 'unknown')
                listing['transaction_hash'] = payment_received.get('tx_hash', 'unknown')
                
                # Record sale
                sale = {
                    'lead_id': listing['id'],
                    'category': listing['category'],
                    'tier': listing['tier'],
                    'price': listing['price'],
                    'payment_token': listing['payment_token'],
                    'buyer': listing['buyer'],
                    'transaction_hash': listing['transaction_hash'],
                    'sold_at': listing['sold_at'],
                    'revenue_usd': listing['price']  # Convert if not USDC
                }
                self.sales.append(sale)
                
                # Generate delivery file for buyer
                delivery_file = os.path.join(TRANSACTIONS_DIR, f"{listing['id']}_delivered.json")
                private_file = os.path.join(TRANSACTIONS_DIR, f"{listing['id']}_private.json")
                
                if os.path.exists(private_file):
                    with open(private_file) as f:
                        private_data = json.load(f)
                    
                    with open(delivery_file, 'w') as f:
                        json.dump({
                            'lead_id': listing['id'],
                            'purchase_confirmed': True,
                            'transaction_hash': listing['transaction_hash'],
                            'access_key': private_data.get('access_key'),
                            'delivered_at': datetime.now().isoformat(),
                            'private_data': private_data.get('private_data', {})
                        }, f, indent=2)
                
                self.log(f"  SOLD: {listing['id']} to {listing['buyer'][:20]}... for ${listing['price']}")
                sold += 1
        
        if sold > 0:
            self._save_listings()
            self._save_sales()
        
        self.log(f"Processed {sold} sales")
        self.log("=" * 60)
        return sold
    
    def _check_blockchain_payment(self, address: str, expected_amount: int) -> Optional[Dict]:
        """Check if payment received on blockchain."""
        # MOCK: In production, query BaseScan or RPC
        # Return None if no payment, or dict with payment details
        
        # For testing: simulate no payments yet
        return None
    
    def generate_report(self) -> Dict:
        """Generate marketplace status report."""
        available = len([l for l in self.listings if l['status'] == 'available'])
        sold = len([l for l in self.listings if l['status'] == 'sold'])
        expired = len([l for l in self.listings if l['status'] == 'expired'])
        
        total_revenue = sum(s['revenue_usd'] for s in self.sales)
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'listings': {
                'available': available,
                'sold': sold,
                'expired': expired,
                'total': len(self.listings)
            },
            'sales': {
                'count': len(self.sales),
                'total_revenue_usd': total_revenue
            },
            'treasury_balance': total_revenue  # Simplified
        }
        
        return report
    
    def print_report(self):
        """Print marketplace report."""
        report = self.generate_report()
        
        self.log("=" * 60)
        self.log("MARKETPLACE REPORT")
        self.log("=" * 60)
        self.log(f"Available Listings: {report['listings']['available']}")
        self.log(f"Sold: {report['listings']['sold']}")
        self.log(f"Expired: {report['listings']['expired']}")
        self.log(f"Total Revenue: ${report['sales']['total_revenue_usd']}")
        self.log(f"Treasury: ${report['treasury_balance']} USDC")
        self.log("=" * 60)
    
    def run(self):
        """Full marketplace cycle."""
        self.add_leads()
        self.check_payments()
        self.print_report()

if __name__ == '__main__':
    import sys
    
    agent = MarketplaceAgent()
    
    if len(sys.argv) < 2:
        agent.run()
    elif sys.argv[1] == '--add-leads':
        agent.add_leads()
    elif sys.argv[1] == '--check-payments':
        agent.check_payments()
    elif sys.argv[1] == '--report':
        agent.print_report()
    else:
        print("Usage: python marketplace_agent.py [--add-leads|--check-payments|--report]")
