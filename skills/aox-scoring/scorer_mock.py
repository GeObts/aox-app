#!/usr/bin/env python3
"""AOX Scoring Agent — MOCK for testing"""
import os, json
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import Dict, List, Literal, Optional

INPUT_DIR = os.path.expanduser('~/.openclaw/agents/normalization/output')
OUTPUT_DIR = os.path.expanduser('~/.openclaw/agents/scoring/output')
REJECTED_DIR = os.path.expanduser('~/.openclaw/agents/scoring/rejected')
REVIEW_DIR = os.path.expanduser('~/.openclaw/agents/scoring/review')
LOG_DIR = os.path.expanduser('~/.openclaw/agents/scoring/logs')

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

class MockScoringAgent:
    def __init__(self):
        for d in [OUTPUT_DIR, REJECTED_DIR, REVIEW_DIR, LOG_DIR]:
            os.makedirs(d, exist_ok=True)
    
    def log(self, msg: str):
        ts = datetime.now().isoformat()
        print(f"[{ts}] {msg}")
        with open(f"{LOG_DIR}/scorer.log", 'a') as f:
            f.write(f"[{ts}] {msg}\n")
    
    def score(self, lead: Dict) -> ScoredLead:
        lid = lead.get('lead_id', 'unknown')
        self.log(f"Scoring {lid}...")
        
        # High scores for demo
        subscores = {
            'intent': 92,
            'reachability': 95,
            'fit': 90,
            'freshness': 95,
            'completeness': 90,
            'confidence': 90,
            'risk': 10
        }
        
        # Calculate weighted overall
        weights = {'intent': 0.25, 'reachability': 0.20, 'fit': 0.20, 
                   'freshness': 0.15, 'completeness': 0.10, 'confidence': 0.10}
        total = sum(subscores[k] * weights[k] for k in weights)
        overall = int(total - subscores['risk'] * 0.2)
        
        # Determine routing
        if overall >= 80:
            status, reason = 'marketplace', 'ACCEPT_HIGH_SCORE'
            tier, price = 'Premium', 50
        elif overall >= 60:
            status, reason = 'review', 'REVIEW_BORDERLINE'
            tier, price = 'Review', 0
        else:
            status, reason = 'reject', 'REJECT_LOW_SCORE'
            tier, price = 'Reject', 0
        
        scored = ScoredLead(
            lead_id=lid,
            status=status,
            overall_score=overall,
            intent_score=subscores['intent'],
            reachability_score=subscores['reachability'],
            buyer_fit_score=subscores['fit'],
            freshness_score=subscores['freshness'],
            completeness_score=subscores['completeness'],
            confidence_score=subscores['confidence'],
            risk_score=subscores['risk'],
            reasons=['Multiple verified contacts', 'Strong activity signals', 'High buyer fit'],
            red_flags=[],
            ai_reasoning='Excellent lead with verified ENS, active social presence, and strong on-chain signals.',
            venice_confidence=88,
            recommended_price=price,
            recommended_tier=tier,
            routing_decision=status,
            reason_code=reason,
            timestamp_scored=datetime.now().isoformat(),
            privacy_hash=lead.get('data_hash', '')
        )
        
        self.log(f"  Score: {overall} | Status: {status} | Tier: {tier}")
        return scored
    
    def save(self, scored: ScoredLead, normalized: Dict):
        data = {'scored': asdict(scored), 'normalized': normalized}
        
        if scored.status == 'marketplace':
            path = f"{OUTPUT_DIR}/{scored.lead_id}_scored.json"
        elif scored.status == 'review':
            path = f"{REVIEW_DIR}/{scored.lead_id}_review.json"
        else:
            path = f"{REJECTED_DIR}/{scored.lead_id}_rejected.json"
        
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        self.log(f"  Saved to {scored.status}")
    
    def run(self):
        self.log("=" * 60)
        self.log("AOX Scoring Agent (MOCK) — Starting")
        self.log("=" * 60)
        
        counts = {'marketplace': 0, 'review': 0, 'reject': 0}
        
        for fn in os.listdir(INPUT_DIR):
            if not fn.endswith('_normalized.json'):
                continue
            
            with open(os.path.join(INPUT_DIR, fn)) as f:
                lead = json.load(f)
            
            scored = self.score(lead)
            self.save(scored, lead)
            counts[scored.status] += 1
        
        self.log("=" * 60)
        self.log(f"Complete: Marketplace: {counts['marketplace']} | Review: {counts['review']} | Rejected: {counts['reject']}")
        self.log("=" * 60)

if __name__ == '__main__':
    MockScoringAgent().run()
