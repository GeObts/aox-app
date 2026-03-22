#!/usr/bin/env python3
"""
AOX Policy Gate — Final Routing and Marketplace Preparation
Applies final business rules and prepares leads for marketplace listing.
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Literal
from dataclasses import dataclass, asdict

INPUT_DIR = os.getenv('SCORING_OUTPUT_DIR', os.path.expanduser('~/.openclaw/agents/scoring/output'))
REVIEW_DIR = os.getenv('SCORING_REVIEW_DIR', os.path.expanduser('~/.openclaw/agents/scoring/review'))
OUTPUT_DIR = os.getenv('POLICY_OUTPUT_DIR', os.path.expanduser('~/.openclaw/agents/policy/output'))
WEBHOOK_URL = os.getenv('POLICY_WEBHOOK_URL', 'http://3.142.118.148:3200/webhook/new-lead')
WEBHOOK_TIMEOUT = 5  # seconds

MARKETPLACE_DIR = os.getenv('MARKETPLACE_INPUT_DIR', os.path.expanduser('~/.openclaw/agents/marketplace/input'))
LOG_DIR = os.getenv('POLICY_LOG_DIR', os.path.expanduser('~/.openclaw/agents/policy/logs'))

# Business rules
MAX_DAILY_LISTINGS = 20  # Prevent spam
MIN_PRICE_USD = 10  # Floor price
SUPPORTED_TOKENS = ['USDC', 'USDT', 'DAI', 'WETH', 'BNKR']

@dataclass
class MarketplaceLead:
    lead_id: str
    category: str
    title: str
    description: str
    score: int
    tier: str
    price: int
    payment_token: str
    ai_confidence: int
    ai_reasoning: str
    risk_level: str
    data_hash: str  # For verification post-purchase
    public_metadata: Dict  # What buyers see pre-purchase
    private_data_encrypted: str  # What buyers get post-purchase
    listed_at: str
    expires_at: str

class PolicyGate:
    def __init__(self):
        for d in [OUTPUT_DIR, MARKETPLACE_DIR, LOG_DIR]:
            os.makedirs(d, exist_ok=True)
        self.daily_count = self._count_today_listings()
    
    def log(self, message: str):
        ts = datetime.utcnow().isoformat()
        entry = f"[{ts}] {message}"
        print(entry)
        with open(f"{LOG_DIR}/policy.log", 'a') as f:
            f.write(entry + '\n')
    
    def _count_today_listings(self) -> int:
        """Count listings created today."""
        today = datetime.utcnow().strftime('%Y-%m-%d')
        count = 0
        for filename in os.listdir(MARKETPLACE_DIR):
            if today in filename:
                count += 1
        return count
    
    def _encrypt_private_data(self, normalized: Dict) -> str:
        """
        Encrypt sensitive lead data for post-purchase reveal.
        In production, use proper encryption (e.g., AES-256).
        For now, use hash-based obfuscation.
        """
        sensitive = {
            'wallet_address': normalized.get('wallet_address'),
            'contact_methods': normalized.get('contact_methods'),
            'social_links': normalized.get('social_links'),
            'raw_notes': normalized.get('raw_notes'),
            'wallet_activity_signals': normalized.get('wallet_activity_signals')
        }
        # In production: encrypt with buyer's public key
        return hashlib.sha256(json.dumps(sensitive).encode()).hexdigest()
    
    def _create_public_metadata(self, scored: Dict, normalized: Dict) -> Dict:
        """Create public-facing metadata (pre-purchase view)."""
        return {
            'lead_id': scored['lead_id'],
            'category': normalized.get('category'),
            'niche': normalized.get('niche'),
            'title': scored.get('recommended_tier', 'Unknown') + ' Lead',
            'description': self._generate_public_description(scored),
            'score': scored['overall_score'],
            'tier': scored['recommended_tier'],
            'price': scored['recommended_price'],
            'ai_confidence': scored['venice_confidence'],
            'risk_level': 'low' if scored['risk_score'] < 30 else 'medium' if scored['risk_score'] < 60 else 'high',
            'contact_method_count': len(normalized.get('contact_methods', [])),
            'has_social_presence': len(normalized.get('social_links', [])) > 0,
            'freshness_days': self._calculate_freshness(normalized),
            'reasons': scored.get('reasons', [])[:3]  # Top 3 reasons only
        }
    
    def _generate_public_description(self, scored: Dict) -> str:
        """Generate buyer-facing description."""
        tier = scored.get('recommended_tier', 'Standard')
        score = scored.get('overall_score', 0)
        
        desc = f"{tier}-tier opportunity scored {score}/100 by AI. "
        desc += f"{scored.get('ai_reasoning', 'Quality lead validated by AOX scoring system.')[:100]}"
        return desc
    
    def _calculate_freshness(self, normalized: Dict) -> int:
        """Calculate days since collection."""
        try:
            collected = datetime.fromisoformat(normalized.get('timestamp_collected', '').replace('Z', '+00:00'))
            return (datetime.utcnow() - collected.replace(tzinfo=None)).days
        except:
            return 0
    
    def _apply_business_rules(self, scored: Dict, normalized: Dict) -> Optional[Dict]:
        """Apply final business rules."""
        
        # Daily limit
        if self.daily_count >= MAX_DAILY_LISTINGS:
            return {'rejected': True, 'reason': 'DAILY_LIMIT_REACHED'}
        
        # Minimum price
        if scored.get('recommended_price', 0) < MIN_PRICE_USD:
            return {'rejected': True, 'reason': 'PRICE_BELOW_FLOOR'}
        
        # Freshness check
        freshness = self._calculate_freshness(normalized)
        if freshness > 30:
            return {'rejected': True, 'reason': 'DATA_TOO_STALE'}
        
        # Duplicate check in marketplace
        lead_id = scored.get('lead_id')
        for filename in os.listdir(MARKETPLACE_DIR):
            if lead_id in filename:
                return {'rejected': True, 'reason': 'ALREADY_LISTED'}
        
        return {'rejected': False}
    
    def process_lead(self, data: Dict) -> Optional[MarketplaceLead]:
        """Process a scored lead through policy gate."""
        scored = data.get('scored', {})
        normalized = data.get('normalized', {})
        
        lead_id = scored.get('lead_id', 'unknown')
        self.log(f"Processing {lead_id} through policy gate...")
        
        # Only process marketplace-bound leads
        if scored.get('status') != 'marketplace':
            self.log(f"  Skipped: status is {scored.get('status')}")
            return None
        
        # Apply business rules
        rules_result = self._apply_business_rules(scored, normalized)
        if rules_result['rejected']:
            self.log(f"  REJECTED by policy: {rules_result['reason']}")
            return None
        
        # Create marketplace lead
        public_meta = self._create_public_metadata(scored, normalized)
        encrypted_private = self._encrypt_private_data(normalized)
        
        lead = MarketplaceLead(
            lead_id=lead_id,
            category=normalized.get('category', 'Unknown'),
            title=public_meta['title'],
            description=public_meta['description'],
            score=scored['overall_score'],
            tier=scored['recommended_tier'],
            price=scored['recommended_price'],
            payment_token='USDC',  # Default, can be configurable
            ai_confidence=scored['venice_confidence'],
            ai_reasoning=scored['ai_reasoning'],
            risk_level=public_meta['risk_level'],
            data_hash=scored['privacy_hash'],
            public_metadata=public_meta,
            private_data_encrypted=encrypted_private,
            listed_at=datetime.utcnow().isoformat(),
            expires_at=(datetime.utcnow() + timedelta(days=7)).isoformat()
        )
        
        self.daily_count += 1
        self.log(f"  APPROVED for marketplace: {lead.tier} tier, ${lead.price}")
        return lead
    
    def _call_webhook(self, lead: MarketplaceLead) -> bool:
        """Call webhook to notify Marketplace Agent of new lead. Non-blocking."""
        try:
            import requests
            payload = {
                'lead_id': lead.lead_id,
                'category': lead.category,
                'title': lead.title,
                'description': lead.description,
                'score': lead.score,
                'tier': lead.tier,
                'price': lead.price,
                'payment_token': lead.payment_token,
                'data_hash': lead.data_hash,
                'listed_at': lead.listed_at
            }
            
            resp = requests.post(
                WEBHOOK_URL,
                json=payload,
                timeout=WEBHOOK_TIMEOUT,
                headers={'Content-Type': 'application/json'}
            )
            
            if resp.status_code == 200:
                self.log(f"  Webhook OK: {resp.status_code}")
                return True
            else:
                self.log(f"  Webhook warning: HTTP {resp.status_code}")
                return False
                
        except Exception as e:
            self.log(f"  Webhook failed (non-critical): {e}")
            return False

    def save_to_marketplace(self, lead: MarketplaceLead):
        """Save lead to marketplace input directory."""
        # Public version (what buyers see)
        public_path = f"{MARKETPLACE_DIR}/{lead.lead_id}_public.json"
        with open(public_path, 'w') as f:
            json.dump({
                'lead_id': lead.lead_id,
                'category': lead.category,
                'title': lead.title,
                'description': lead.description,
                'score': lead.score,
                'tier': lead.tier,
                'price': lead.price,
                'payment_token': lead.payment_token,
                'ai_confidence': lead.ai_confidence,
                'ai_reasoning': lead.ai_reasoning,
                'risk_level': lead.risk_level,
                'data_hash': lead.data_hash,
                'public_metadata': lead.public_metadata,
                'listed_at': lead.listed_at,
                'expires_at': lead.expires_at
            }, f, indent=2)
        
        # Full version with encrypted data (for post-purchase reveal)
        full_path = f"{OUTPUT_DIR}/{lead.lead_id}_full.json"
        with open(full_path, 'w') as f:
            json.dump(asdict(lead), f, indent=2)
        
        self.log(f"  Saved: {public_path}")
        
        # Notify Marketplace Agent via webhook (non-blocking)
        webhook_ok = self._call_webhook(lead)
        if not webhook_ok:
            self.log("  Webhook notification failed - file watcher will pick up the lead")
    
    def run(self):
        """Process all scored leads."""
        from datetime import timedelta
        
        self.log("=" * 60)
        self.log("AOX Policy Gate — Starting")
        self.log(f"Daily listings: {self.daily_count}/{MAX_DAILY_LISTINGS}")
        self.log("=" * 60)
        
        approved = 0
        rejected = 0
        
        for filename in os.listdir(INPUT_DIR):
            if not filename.endswith('_scored.json'):
                continue
            
            filepath = os.path.join(INPUT_DIR, filename)
            try:
                with open(filepath) as f:
                    data = json.load(f)
                
                lead = self.process_lead(data)
                if lead:
                    self.save_to_marketplace(lead)
                    approved += 1
                else:
                    rejected += 1
                
            except Exception as e:
                self.log(f"  ERROR processing {filename}: {e}")
        
        self.log("=" * 60)
        self.log(f"Complete: {approved} approved, {rejected} rejected")
        self.log(f"Daily listings now: {self.daily_count}/{MAX_DAILY_LISTINGS}")
        self.log("=" * 60)

if __name__ == '__main__':
    gate = PolicyGate()
    gate.run()
