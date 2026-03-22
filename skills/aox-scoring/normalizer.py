#!/usr/bin/env python3
"""
AOX Normalization Layer
Cleans, validates, deduplicates, and structures raw leads from Research Agent.
"""

import os
import json
import hashlib
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, asdict
from urllib.parse import urlparse
import requests

INPUT_DIR = os.getenv('RESEARCH_OUTPUT_DIR', os.path.expanduser('~/.openclaw/agents/research/output'))
OUTPUT_DIR = os.getenv('NORMALIZATION_OUTPUT_DIR', os.path.expanduser('~/.openclaw/agents/normalization/output'))
REJECTED_DIR = os.getenv('NORMALIZATION_REJECTED_DIR', os.path.expanduser('~/.openclaw/agents/normalization/rejected'))
LOG_DIR = os.getenv('NORMALIZATION_LOG_DIR', os.path.expanduser('~/.openclaw/agents/normalization/logs'))
DEDUPE_DB = os.path.expanduser('~/.openclaw/agents/normalization/dedupe_db.json')

REQUIRED_FIELDS = ['lead_id', 'category', 'title', 'description', 'wallet_address']
VALID_CATEGORIES = ['Token Launch', 'Polymarket Trader', 'NFT Launch', 'DeFi Protocol', 'DAO']
SUPPORTED_NICHES = ['crypto', 'politics', 'sports', 'gaming', 'defi', 'nft', 'ai']

@dataclass
class NormalizedLead:
    lead_id: str
    source_url: str
    category: str
    niche: str
    geography: Optional[str]
    contact_methods: List[Dict]  # [{type: 'email', value: 'x@y.com', verified: bool}]
    business_age_days: Optional[int]
    site_age_days: Optional[int]
    public_activity_signals: List[str]
    wallet_activity_signals: List[str]
    social_links: List[Dict]  # [{platform: 'twitter', url: '...', handle: '...'}]
    confidence_per_field: Dict[str, int]  # {field: 0-100}
    raw_notes: str
    timestamp_collected: str
    timestamp_normalized: str
    data_hash: str  # For deduplication
    validation_status: Dict  # {passed: bool, errors: [], warnings: []}

class NormalizationLayer:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'AOX-Normalizer/1.0'})
        self.dupe_db = self._load_dedupe_db()
        for d in [OUTPUT_DIR, REJECTED_DIR, LOG_DIR]:
            os.makedirs(d, exist_ok=True)
    
    def log(self, message: str):
        ts = datetime.utcnow().isoformat()
        entry = f"[{ts}] {message}"
        print(entry)
        with open(f"{LOG_DIR}/normalizer.log", 'a') as f:
            f.write(entry + '\n')
    
    def _load_dedupe_db(self) -> Set[str]:
        if os.path.exists(DEDUPE_DB):
            with open(DEDUPE_DB) as f:
                return set(json.load(f))
        return set()
    
    def _save_dedupe_db(self):
        with open(DEDUPE_DB, 'w') as f:
            json.dump(list(self.dupe_db), f)
    
    def _compute_hash(self, data: Dict) -> str:
        """Compute hash for deduplication based on key fields."""
        key_fields = [
            data.get('wallet_address', ''),
            data.get('name', ''),
            data.get('title', '')
        ]
        normalized = '|'.join(str(f).lower().strip() for f in key_fields)
        return hashlib.sha256(normalized.encode()).hexdigest()[:16]
    
    def _validate_url(self, url: str) -> Tuple[bool, str]:
        """Check if URL is valid and reachable."""
        if not url or not url.startswith('http'):
            return False, 'invalid_format'
        try:
            parsed = urlparse(url)
            if not parsed.netloc:
                return False, 'no_domain'
            # Don't actually fetch - just validate format
            return True, 'format_ok'
        except:
            return False, 'parse_error'
    
    def _extract_niche(self, categories: List[str], title: str, desc: str) -> str:
        """Determine niche from category and text."""
        text = f"{' '.join(categories)} {title} {desc}".lower()
        for niche in SUPPORTED_NICHES:
            if niche in text:
                return niche
        return 'general'
    
    def _detect_geography(self, data: Dict) -> Optional[str]:
        """Extract geography from data if available."""
        # Could use IP geolocation, social profiles, etc.
        return data.get('geography') or data.get('region')
    
    def _validate_contact_methods(self, data: Dict) -> List[Dict]:
        """Extract and validate contact methods."""
        contacts = []
        
        # Email
        email = data.get('email')
        if email and re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            contacts.append({'type': 'email', 'value': email, 'verified': False})
        
        # ENS
        ens = data.get('ens_name')
        if ens:
            contacts.append({'type': 'ens', 'value': ens, 'verified': True})
        
        # Farcaster
        fc = data.get('farcaster_handle')
        if fc:
            contacts.append({'type': 'farcaster', 'value': fc, 'verified': False})
        
        # Twitter/X
        twitter = data.get('twitter')
        if twitter:
            contacts.append({'type': 'twitter', 'value': twitter, 'verified': False})
        
        # Website
        website = data.get('website')
        if website:
            valid, reason = self._validate_url(website)
            if valid:
                contacts.append({'type': 'website', 'value': website, 'verified': False})
        
        return contacts
    
    def _extract_social_links(self, data: Dict) -> List[Dict]:
        """Extract social media links."""
        socials = []
        
        platforms = [
            ('twitter', 'https://twitter.com/', 'twitter.com'),
            ('farcaster', 'https://warpcast.com/', 'warpcast.com'),
            ('github', 'https://github.com/', 'github.com'),
            ('discord', None, 'discord'),
            ('telegram', 'https://t.me/', 't.me')
        ]
        
        for platform, prefix, keyword in platforms:
            val = data.get(platform) or data.get(f'{platform}_url')
            if val:
                if not val.startswith('http') and prefix:
                    val = prefix + val.lstrip('@')
                socials.append({
                    'platform': platform,
                    'url': val,
                    'handle': val.split('/')[-1] if '/' in val else val
                })
        
        return socials
    
    def _calculate_confidence(self, data: Dict, contacts: List[Dict]) -> Dict[str, int]:
        """Calculate confidence score for each field."""
        confidence = {}
        
        # Basic fields
        confidence['lead_id'] = 100
        confidence['category'] = 90 if data.get('category') in VALID_CATEGORIES else 50
        confidence['title'] = 90 if len(data.get('title', '')) > 10 else 60
        confidence['description'] = 90 if len(data.get('description', '')) > 50 else 60
        confidence['wallet'] = 95 if data.get('wallet_address') else 0
        
        # Contact methods
        confidence['contact_methods'] = min(len(contacts) * 30, 100)
        confidence['has_ens'] = 100 if any(c['type'] == 'ens' for c in contacts) else 0
        
        # Activity signals
        confidence['activity'] = 90 if data.get('last_active') else 50
        
        return confidence
    
    def _prefilter_checks(self, data: Dict, data_hash: str) -> Dict:
        """Run rule-based prefilter checks."""
        errors = []
        warnings = []
        
        # Check required fields
        for field in REQUIRED_FIELDS:
            if not data.get(field):
                errors.append(f'MISSING_REQUIRED_FIELD:{field}')
        
        # Check for duplicates
        if data_hash in self.dupe_db:
            errors.append(f'DUPLICATE:{data_hash}')
        
        # Check category validity
        if data.get('category') not in VALID_CATEGORIES:
            warnings.append(f'UNKNOWN_CATEGORY:{data.get("category")}')
        
        # Check contact methods
        contacts = self._validate_contact_methods(data)
        if len(contacts) < 2:
            errors.append(f'INSUFFICIENT_CONTACTS:{len(contacts)}')
        
        # Check for fake URLs
        website = data.get('website')
        if website:
            valid, reason = self._validate_url(website)
            if not valid:
                errors.append(f'INVALID_URL:{reason}')
        
        # Check freshness
        if data.get('discovered_at'):
            try:
                discovered = datetime.fromisoformat(data['discovered_at'].replace('Z', '+00:00'))
                if datetime.utcnow() - discovered > timedelta(days=30):
                    warnings.append('STALE_DATA')
            except:
                warnings.append('INVALID_TIMESTAMP')
        
        return {
            'passed': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    def normalize(self, raw_data: Dict) -> Optional[NormalizedLead]:
        """Normalize a single raw lead."""
        lead_id = raw_data.get('lead_id', 'unknown')
        self.log(f"Normalizing {lead_id}...")
        
        # Compute hash for deduplication
        data_hash = self._compute_hash(raw_data)
        
        # Run prefilter checks
        validation = self._prefilter_checks(raw_data, data_hash)
        
        if not validation['passed']:
            self.log(f"  REJECTED: {validation['errors']}")
            self._save_rejected(raw_data, validation['errors'], 'prefilter')
            return None
        
        # Extract and validate
        contacts = self._validate_contact_methods(raw_data)
        socials = self._extract_social_links(raw_data)
        niche = self._extract_niche(
            raw_data.get('categories', [raw_data.get('category', '')]),
            raw_data.get('title', ''),
            raw_data.get('description', '')
        )
        
        confidence = self._calculate_confidence(raw_data, contacts)
        
        # Create normalized lead
        normalized = NormalizedLead(
            lead_id=lead_id,
            source_url=raw_data.get('source_url', raw_data.get('explorer_url', '')),
            category=raw_data.get('category', 'Unknown'),
            niche=niche,
            geography=self._detect_geography(raw_data),
            contact_methods=contacts,
            business_age_days=raw_data.get('business_age_days'),
            site_age_days=raw_data.get('site_age_days'),
            public_activity_signals=raw_data.get('public_activity_signals', []),
            wallet_activity_signals=raw_data.get('wallet_activity_signals', []),
            social_links=socials,
            confidence_per_field=confidence,
            raw_notes=raw_data.get('raw_notes', json.dumps(raw_data)),
            timestamp_collected=raw_data.get('discovered_at', datetime.utcnow().isoformat()),
            timestamp_normalized=datetime.utcnow().isoformat(),
            data_hash=data_hash,
            validation_status=validation
        )
        
        # Add to dedupe DB
        self.dupe_db.add(data_hash)
        self._save_dedupe_db()
        
        self.log(f"  Normalized: {len(contacts)} contacts, {len(socials)} socials")
        return normalized
    
    def _save_rejected(self, data: Dict, errors: List[str], stage: str):
        """Save rejected lead with reason."""
        lead_id = data.get('lead_id', 'unknown')
        rejected = {
            'lead_id': lead_id,
            'stage': stage,
            'rejected_at': datetime.utcnow().isoformat(),
            'errors': errors,
            'raw_data': data
        }
        path = f"{REJECTED_DIR}/{lead_id}_rejected.json"
        with open(path, 'w') as f:
            json.dump(rejected, f, indent=2)
    
    def save_normalized(self, lead: NormalizedLead):
        """Save normalized lead."""
        path = f"{OUTPUT_DIR}/{lead.lead_id}_normalized.json"
        with open(path, 'w') as f:
            json.dump(asdict(lead), f, indent=2, default=str)
        self.log(f"  Saved: {path}")
    
    def run(self):
        """Process all pending leads."""
        self.log("=" * 60)
        self.log("AOX Normalization Layer — Starting")
        self.log("=" * 60)
        
        # Find all raw leads
        leads_found = 0
        leads_normalized = 0
        
        for root, dirs, files in os.walk(INPUT_DIR):
            for filename in files:
                if not filename.endswith('.json'):
                    continue
                
                filepath = os.path.join(root, filename)
                try:
                    with open(filepath) as f:
                        raw_data = json.load(f)
                    
                    leads_found += 1
                    normalized = self.normalize(raw_data)
                    
                    if normalized:
                        self.save_normalized(normalized)
                        leads_normalized += 1
                    
                except Exception as e:
                    self.log(f"  ERROR processing {filename}: {e}")
        
        self.log("=" * 60)
        self.log(f"Complete: {leads_normalized}/{leads_found} leads normalized")
        self.log("=" * 60)

if __name__ == '__main__':
    layer = NormalizationLayer()
    layer.run()
