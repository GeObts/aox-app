#!/usr/bin/env python3
"""
AOX Scoring Agent — LIVE Venice AI Inference
Uses real Venice API for private lead scoring.
"""

import os
import json
import re
import time
from datetime import datetime
from typing import Dict, List, Optional, Literal
from dataclasses import dataclass, asdict
import requests

INPUT_DIR = os.getenv('NORMALIZATION_OUTPUT_DIR', os.path.expanduser('~/.openclaw/agents/normalization/output'))
OUTPUT_DIR = os.getenv('SCORING_OUTPUT_DIR', os.path.expanduser('~/.openclaw/agents/scoring/output'))
REJECTED_DIR = os.getenv('SCORING_REJECTED_DIR', os.path.expanduser('~/.openclaw/agents/scoring/rejected'))
REVIEW_DIR = os.getenv('SCORING_REVIEW_DIR', os.path.expanduser('~/.openclaw/agents/scoring/review'))
LOG_DIR = os.getenv('SCORING_LOG_DIR', os.path.expanduser('~/.openclaw/agents/scoring/logs'))

VENICE_API_KEY = os.getenv('VENICE_API_KEY', '')
# Try different Venice endpoints
VENICE_ENDPOINTS = [
    'https://api.venice.ai/api/v1/chat/completions',
    'https://api.venice.ai/v1/chat/completions',
]

# Scoring weights (deterministic)
SCORE_WEIGHTS = {
    'intent': 0.25,
    'reachability': 0.20,
    'fit': 0.20,
    'freshness': 0.15,
    'completeness': 0.10,
    'confidence': 0.10
}

# Thresholds (deterministic)
THRESHOLDS = {
    'marketplace': 80,
    'review': 60,
    'reject': 0
}

@dataclass
class ScoredLead:
    lead_id: str
    status: Literal['marketplace', 'review', 'reject']
    overall_score: int
    intent_score: int
    reachability_score: int
    buyer_fit_score: int
    freshness_score: int
    completeness_score: int
    confidence_score: int
    risk_score: int
    reasons: List[str]
    red_flags: List[str]
    ai_reasoning: str
    venice_confidence: int
    recommended_price: int
    recommended_tier: str
    routing_decision: str
    reason_code: str
    timestamp_scored: str
    privacy_hash: str
    venice_raw_response: Optional[str] = None

class ScoringAgent:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {VENICE_API_KEY}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        for d in [OUTPUT_DIR, REJECTED_DIR, REVIEW_DIR, LOG_DIR]:
            os.makedirs(d, exist_ok=True)
        
        # Test Venice connection on init
        self.venice_available = self._test_venice_connection()
    
    def log(self, message: str):
        ts = datetime.now().isoformat()
        entry = f"[{ts}] {message}"
        print(entry)
        with open(f"{LOG_DIR}/scorer.log", 'a') as f:
            f.write(entry + '\n')
    
    def _test_venice_connection(self) -> bool:
        """Test if Venice API is accessible."""
        test_payload = {
            'model': 'llama-3.3-70b',  # Standard model for testing
            'messages': [{'role': 'user', 'content': 'Hi'}],
            'max_tokens': 5
        }
        
        for endpoint in VENICE_ENDPOINTS:
            try:
                resp = self.session.post(endpoint, json=test_payload, timeout=15)
                if resp.status_code == 200:
                    self.log(f"✅ Venice API connected: {endpoint}")
                    self.venice_url = endpoint
                    return True
                else:
                    self.log(f"⚠️ Venice test failed ({resp.status_code}): {endpoint}")
            except Exception as e:
                self.log(f"⚠️ Venice connection error: {e}")
        
        self.log("❌ Venice API not available - will use fallback scoring")
        return False
    
    def _build_prompt(self, lead: Dict) -> str:
        """Build structured prompt for Venice AI."""
        
        contacts = lead.get('contact_methods', [])
        socials = lead.get('social_links', [])
        confidence = lead.get('confidence_per_field', {})
        
        # Build contact summary
        contact_summary = []
        for c in contacts:
            verified = "✓" if c.get('verified') else "○"
            contact_summary.append(f"{verified} {c['type']}: {c['value']}")
        
        # Build social summary
        social_summary = [f"{s['platform']}: {s.get('handle', 'N/A')}" for s in socials]
        
        prompt = f"""You are an expert lead quality analyst for the Agent Opportunity Exchange (AOX). Evaluate this lead objectively.

LEAD DATA:
- ID: {lead.get('lead_id')}
- Category: {lead.get('category')}
- Niche: {lead.get('niche')}
- Geography: {lead.get('geography', 'Unknown')}

CONTACT METHODS ({len(contacts)}):
{chr(10).join(contact_summary) if contact_summary else 'None'}

SOCIAL LINKS ({len(socials)}):
{chr(10).join(social_summary) if social_summary else 'None'}

METADATA:
- Business Age: {lead.get('business_age_days', 'Unknown')} days
- Public Activity: {', '.join(lead.get('public_activity_signals', [])[:3])}
- Field Confidence: {json.dumps(confidence, indent=2)}

SCORE THIS LEAD (0-100) on:

1. INTENT (0-100): Real business opportunity vs spam/test
   - 80-100: Clear business, active engagement, legitimate
   - 50-79: Some signals, moderate confidence
   - 0-49: Vague, suspicious, or test data

2. REACHABILITY (0-100): Can buyer contact them?
   - 80-100: Multiple verified channels (ENS+email+social)
   - 50-79: 2-3 channels, mostly verified
   - 0-49: Single channel or unverified

3. BUYER FIT (0-100): Match for crypto/Web3 buyers?
   - 80-100: Strong alignment (DeFi, token launch, trader)
   - 50-79: Moderate fit
   - 0-49: Poor fit or unclear value

4. FRESHNESS (0-100): Recent and relevant?
   - 80-100: <7 days, active signals
   - 50-79: <30 days, some activity
   - 0-49: Stale or no recent activity

5. COMPLETENESS (0-100): All necessary fields?
   - 80-100: Full contact info, socials, activity data
   - 50-79: Most fields present
   - 0-49: Sparse data, missing critical fields

6. CONFIDENCE (0-100): How certain is this data accurate?
   - Based on field validation scores provided

7. RISK/SPAM (0-100): Likelihood of fake/spam?
   - 0-20: Low risk, trustworthy (new token launches are normal, not risky)
   - 21-50: Medium risk, some concerns
   - 51-100: High risk, likely spam/fake
   
   IMPORTANT: For Token Launch category, business_age of 1-7 days is NORMAL and EXPECTED. 
   Do NOT flag this as high risk. Only flag if there are actual spam indicators 
   (fake social accounts, unverified contracts, no liquidity, etc.)

Respond ONLY with valid JSON:
{{
  "intent_score": number,
  "reachability_score": number,
  "buyer_fit_score": number,
  "freshness_score": number,
  "completeness_score": number,
  "confidence_score": number,
  "risk_score": number,
  "reasons": ["reason1", "reason2"],
  "red_flags": ["flag1"] or [],
  "ai_reasoning": "2-3 sentence summary"
}}"""
        
        return prompt
    
    def _call_venice(self, prompt: str) -> Optional[Dict]:
        """Call Venice AI with retry logic."""
        if not VENICE_API_KEY:
            self.log("ERROR: VENICE_API_KEY not set")
            return None
        
        if not self.venice_available:
            self.log("Venice not available, using fallback")
            return None
        
        # Try with different models
        models = ['llama-3.3-70b', 'hermes-3-llama-3.1-405b', 'mistral-small-3-2-24b-instruct', 'deepseek-v3.2']
        
        for model in models:
            try:
                self.log(f"Trying Venice model: {model}")
                
                payload = {
                    'model': model,
                    'messages': [
                        {'role': 'system', 'content': 'You are a precise lead scoring analyst. Output only valid JSON.'},
                        {'role': 'user', 'content': prompt}
                    ],
                    'temperature': 0.2,
                    'max_tokens': 800,
                    'venice_parameters': {
                        'include_venice_system_prompt': False  # Disable Venice's system prompt
                    }
                }
                
                resp = self.session.post(
                    self.venice_url,
                    json=payload,
                    timeout=45  # Increased timeout
                )
                
                if resp.status_code == 200:
                    data = resp.json()
                    content = data['choices'][0]['message']['content']
                    self.log(f"✅ Venice response received ({len(content)} chars)")
                    return self._parse_response(content)
                
                elif resp.status_code == 429:
                    self.log(f"⏳ Rate limited, waiting...")
                    time.sleep(2)
                    continue
                
                else:
                    self.log(f"⚠️ Venice error {resp.status_code}: {resp.text[:200]}")
                    
            except requests.Timeout:
                self.log(f"⏱️ Timeout with {model}, trying next...")
                continue
            except Exception as e:
                self.log(f"⚠️ Error with {model}: {e}")
                continue
        
        return None
    
    def _parse_response(self, content: str) -> Optional[Dict]:
        """Parse Venice response, handle various formats."""
        try:
            # Clean up markdown
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.startswith('```'):
                content = content[3:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            # Try to find JSON in response
            if '{' in content and '}' in content:
                start = content.find('{')
                end = content.rfind('}') + 1
                content = content[start:end]
            
            return json.loads(content)
            
        except Exception as e:
            self.log(f"Failed to parse Venice response: {e}")
            self.log(f"Raw: {content[:500]}")
            return None
    
    def _calculate_overall(self, subscores: Dict) -> int:
        """Calculate weighted overall score."""
        # Map Venice keys to weight keys
        key_mapping = {
            'intent': 'intent_score',
            'reachability': 'reachability_score',
            'fit': 'buyer_fit_score',  # Venice uses buyer_fit_score
            'freshness': 'freshness_score',
            'completeness': 'completeness_score',
            'confidence': 'confidence_score'
        }
        
        total = 0
        for key, weight in SCORE_WEIGHTS.items():
            score_key = key_mapping.get(key, f"{key}_score")
            if score_key in subscores:
                total += subscores[score_key] * weight
            else:
                # Try alternative key
                alt_key = f"{key}_score"
                if alt_key in subscores:
                    total += subscores[alt_key] * weight
        
        # Risk penalty
        risk = subscores.get('risk_score', 0)
        penalty = risk * 0.25
        
        final = int(total - penalty)
        return max(0, min(100, final))
    
    def _determine_tier_and_price(self, score: int) -> tuple:
        if score >= 90:
            return 'Enterprise', 100
        elif score >= 80:
            return 'Premium', 50
        elif score >= 70:
            return 'Standard', 20
        elif score >= 60:
            return 'Review', 0
        return 'Reject', 0
    
    def _determine_routing(self, score: int, red_flags: List[str]) -> tuple:
        if 'spam' in [f.lower() for f in red_flags]:
            return 'reject', 'REJECT_SPAM_FLAG'
        if score >= THRESHOLDS['marketplace']:
            return 'marketplace', 'ACCEPT_HIGH_SCORE'
        elif score >= THRESHOLDS['review']:
            return 'review', 'REVIEW_BORDERLINE'
        else:
            return 'reject', 'REJECT_LOW_SCORE'
    
    def _run_prefilter_rules(self, lead: Dict) -> Optional[Dict]:
        errors = []
        contacts = lead.get('contact_methods', [])
        if len(contacts) < 2:
            errors.append(f'INSUFFICIENT_CONTACTS:{len(contacts)}')
        
        title = lead.get('title', '').lower()
        if any(x in title for x in ['test', 'fake', 'demo', 'sample']):
            errors.append('SUSPICIOUS_TITLE')
        
        if errors:
            return {'rejected': True, 'errors': errors}
        return None
    
    def _fallback_scoring(self, lead: Dict) -> Dict:
        """Fallback scoring when Venice is unavailable."""
        contacts = lead.get('contact_methods', [])
        confidence = lead.get('confidence_per_field', {})
        
        # Simple heuristic scoring
        intent = 75 if lead.get('niche') in ['ai', 'defi', 'crypto'] else 60
        reachability = min(len(contacts) * 25, 95)
        fit = 80 if lead.get('category') in ['Token Launch', 'Polymarket Trader'] else 65
        freshness = 85 if lead.get('business_age_days', 999) < 7 else 70
        completeness = min(int(sum(confidence.values()) / max(len(confidence), 1)), 90)
        conf = confidence.get('wallet', 70)
        risk = 20
        
        return {
            'intent_score': intent,
            'reachability_score': reachability,
            'buyer_fit_score': fit,
            'freshness_score': freshness,
            'completeness_score': completeness,
            'confidence_score': conf,
            'risk_score': risk,
            'reasons': ['Fallback scoring - Venice unavailable'],
            'red_flags': [],
            'ai_reasoning': 'Scored using fallback algorithm due to Venice API unavailability'
        }
    
    def score_lead(self, lead: Dict) -> Optional[ScoredLead]:
        lead_id = lead.get('lead_id', 'unknown')
        self.log(f"Scoring {lead_id}...")
        
        # Rule prefilter
        prefilter = self._run_prefilter_rules(lead)
        if prefilter:
            self.log(f"  REJECTED by prefilter: {prefilter['errors']}")
            return self._create_rejected_scored(lead, prefilter['errors'])
        
        # Build prompt and call Venice
        prompt = self._build_prompt(lead)
        ai_result = self._call_venice(prompt)
        
        raw_response = None
        
        if ai_result:
            raw_response = json.dumps(ai_result)
            self.log(f"  Venice scoring successful")
        else:
            self.log(f"  Using fallback scoring (Venice unavailable)")
            ai_result = self._fallback_scoring(lead)
        
        # Calculate overall score
        overall = self._calculate_overall(ai_result)
        routing, reason_code = self._determine_routing(overall, ai_result.get('red_flags', []))
        tier, price = self._determine_tier_and_price(overall)
        
        scored = ScoredLead(
            lead_id=lead_id,
            status=routing,
            overall_score=overall,
            intent_score=ai_result.get('intent_score', 0),
            reachability_score=ai_result.get('reachability_score', 0),
            buyer_fit_score=ai_result.get('buyer_fit_score', 0),
            freshness_score=ai_result.get('freshness_score', 0),
            completeness_score=ai_result.get('completeness_score', 0),
            confidence_score=ai_result.get('confidence_score', 0),
            risk_score=ai_result.get('risk_score', 0),
            reasons=ai_result.get('reasons', []),
            red_flags=ai_result.get('red_flags', []),
            ai_reasoning=ai_result.get('ai_reasoning', ''),
            venice_confidence=ai_result.get('confidence_score', 50),
            recommended_price=price,
            recommended_tier=tier,
            routing_decision=routing,
            reason_code=reason_code,
            timestamp_scored=datetime.now().isoformat(),
            privacy_hash=lead.get('data_hash', ''),
            venice_raw_response=raw_response
        )
        
        self.log(f"  Score: {overall} | Status: {routing} | Tier: {tier}")
        return scored
    
    def _create_rejected_scored(self, lead: Dict, errors: List[str]) -> ScoredLead:
        return ScoredLead(
            lead_id=lead.get('lead_id', 'unknown'),
            status='reject',
            overall_score=0,
            intent_score=0,
            reachability_score=0,
            buyer_fit_score=0,
            freshness_score=0,
            completeness_score=0,
            confidence_score=0,
            risk_score=100,
            reasons=[],
            red_flags=errors,
            ai_reasoning='Rejected by hard rules before AI scoring',
            venice_confidence=0,
            recommended_price=0,
            recommended_tier='Reject',
            routing_decision='reject',
            reason_code=f"REJECT_{'_'.join(errors)[:50]}",
            timestamp_scored=datetime.now().isoformat(),
            privacy_hash=lead.get('data_hash', ''),
            venice_raw_response=None
        )
    
    def save_scored(self, scored: ScoredLead, normalized: Dict):
        data = {
            'scored': asdict(scored),
            'normalized': normalized
        }
        
        if scored.status == 'marketplace':
            path = f"{OUTPUT_DIR}/{scored.lead_id}_scored.json"
        elif scored.status == 'review':
            path = f"{REVIEW_DIR}/{scored.lead_id}_review.json"
        else:
            path = f"{REJECTED_DIR}/{scored.lead_id}_rejected.json"
        
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        
        self.log(f"  Saved to {scored.status}: {path}")
    
    def run(self):
        self.log("=" * 60)
        self.log("AOX Scoring Agent — LIVE Venice Inference")
        self.log(f"Venice Available: {self.venice_available}")
        self.log(f"Thresholds: Marketplace {THRESHOLDS['marketplace']}+ | Review {THRESHOLDS['review']}-{THRESHOLDS['marketplace']-1} | Reject <{THRESHOLDS['review']}")
        self.log("=" * 60)
        
        leads_found = 0
        leads_scored = 0
        by_status = {'marketplace': 0, 'review': 0, 'reject': 0}
        venice_used = 0
        fallback_used = 0
        
        for filename in os.listdir(INPUT_DIR):
            if not filename.endswith('_normalized.json'):
                continue
            
            filepath = os.path.join(INPUT_DIR, filename)
            try:
                with open(filepath) as f:
                    lead = json.load(f)
                
                leads_found += 1
                scored = self.score_lead(lead)
                
                if scored:
                    self.save_scored(scored, lead)
                    by_status[scored.status] += 1
                    if scored.venice_raw_response:
                        venice_used += 1
                    else:
                        fallback_used += 1
                    leads_scored += 1
                
            except Exception as e:
                self.log(f"  ERROR processing {filename}: {e}")
        
        self.log("=" * 60)
        self.log(f"Complete: {leads_scored}/{leads_found} leads scored")
        self.log(f"  Venice AI: {venice_used} | Fallback: {fallback_used}")
        self.log(f"  Marketplace: {by_status['marketplace']} | Review: {by_status['review']} | Rejected: {by_status['reject']}")
        self.log("=" * 60)

if __name__ == '__main__':
    scorer = ScoringAgent()
    scorer.run()
