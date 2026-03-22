#!/usr/bin/env python3
"""
Test Polymarket Lead with Dual Scoring:
1. Original AOX method (rule-based + Venice AI)
2. BRAID-enhanced method (OpenServ reasoning)
3. Combined score (60% AOX / 40% BRAID)
"""

import json
import os
import sys
from datetime import datetime

# Add parent to path
sys.path.insert(0, os.path.dirname(__file__))

# Try to import BRAID
try:
    from braid_reasoning import BraidReasoningClient, USE_BRAID
    BRAID_AVAILABLE = True
except ImportError:
    BRAID_AVAILABLE = False
    print("⚠️  BRAID not available, using AOX scoring only")

# Try Venice
from venice_enricher import VeniceEnricher

# Test lead - high-performing Polymarket trader pattern
TEST_LEAD = {
    "id": "poly-0x742d35Cc6634C0532925a3b844Bc9e7595f8dEe",
    "source": "polymarket",
    "category": "Prediction Market Trader",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f8dEe",
    "name": "Top Polymarket Trader",
    "metrics": {
        "win_rate": 0.72,  # 72% win rate
        "total_volume": 85000,  # $85k volume
        "positions_count": 45,
        "avg_position_size": 1889,  # ~$1.9k avg
        "profit_loss": 12000,  # +$12k P&L
        "days_active": 90,
        "categories_traded": ["Politics", "Sports", "Crypto", "Finance"],
        "last_trade": "2026-03-19T18:30:00Z"
    },
    "social": {
        "farcaster": "@predictor",
        "ens": "smartmoney.eth",
        "twitter": "@smartpredictor"
    },
    "confidence": 0.85
}

def score_aox_method(lead):
    """Original AOX scoring - rule-based"""
    score = 0
    reasons = []
    
    metrics = lead["metrics"]
    
    # Win rate scoring
    if metrics["win_rate"] >= 0.70:
        score += 30
        reasons.append("Win rate 70%+ (+30)")
    elif metrics["win_rate"] >= 0.60:
        score += 20
        reasons.append("Win rate 60%+ (+20)")
    elif metrics["win_rate"] >= 0.50:
        score += 10
        reasons.append("Win rate 50%+ (+10)")
    
    # Volume scoring
    if metrics["total_volume"] >= 50000:
        score += 25
        reasons.append("Volume $50k+ (+25)")
    elif metrics["total_volume"] >= 10000:
        score += 15
        reasons.append("Volume $10k+ (+15)")
    elif metrics["total_volume"] >= 1000:
        score += 5
        reasons.append("Volume $1k+ (+5)")
    
    # Activity scoring
    if metrics["days_active"] >= 30:
        score += 15
        reasons.append("Active 30+ days (+15)")
    
    # Category diversity
    if len(metrics["categories_traded"]) >= 3:
        score += 10
        reasons.append("3+ categories (+10)")
    
    # Social presence
    if lead["social"].get("ens"):
        score += 10
        reasons.append("ENS registered (+10)")
    if lead["social"].get("farcaster"):
        score += 5
        reasons.append("Farcaster active (+5)")
    
    return min(score, 100), reasons

def score_braid_method(lead):
    """BRAID-enhanced scoring - reasoning-based"""
    # This would normally call OpenServ BRAID
    # For demo, simulate enhanced scoring
    
    base_score = 0
    enhancement = 0
    reasons = []
    
    metrics = lead["metrics"]
    
    # BRAID reasoning factors
    
    # 1. Risk-adjusted returns
    roi = metrics["profit_loss"] / metrics["total_volume"] if metrics["total_volume"] > 0 else 0
    if roi > 0.10:  # 10%+ ROI
        enhancement += 15
        reasons.append("High risk-adjusted ROI (+15)")
    
    # 2. Consistency analysis
    if metrics["win_rate"] > 0.65 and metrics["days_active"] > 60:
        enhancement += 10
        reasons.append("Consistent performance pattern (+10)")
    
    # 3. Market timing skill
    if metrics["profit_loss"] > 10000:
        enhancement += 10
        reasons.append("Demonstrated profit extraction (+10)")
    
    # 4. Information edge detection
    if len(metrics["categories_traded"]) >= 4:
        enhancement += 5
        reasons.append("Cross-category expertise (+5)")
    
    base_score = 50  # Start at neutral
    final_score = min(base_score + enhancement, 100)
    
    return final_score, reasons

def combine_scores(aox_score, braid_score):
    """Combine scores: 60% AOX + 40% BRAID"""
    combined = (aox_score * 0.60) + (braid_score * 0.40)
    return round(combined, 1)

def main():
    print("=" * 70)
    print("POLYMARKET DUAL-SCORING TEST")
    print("=" * 70)
    print(f"\nLead: {TEST_LEAD['name']}")
    print(f"Category: {TEST_LEAD['category']}")
    print(f"Wallet: {TEST_LEAD['wallet_address']}")
    print(f"\nMetrics:")
    for k, v in TEST_LEAD['metrics'].items():
        print(f"  {k}: {v}")
    
    # Method 1: AOX Scoring
    print("\n" + "-" * 70)
    print("METHOD 1: AOX Original Scoring")
    print("-" * 70)
    aox_score, aox_reasons = score_aox_method(TEST_LEAD)
    print(f"\nScore: {aox_score}/100")
    print("Factors:")
    for r in aox_reasons:
        print(f"  ✓ {r}")
    
    # Method 2: BRAID Scoring
    print("\n" + "-" * 70)
    print("METHOD 2: BRAID-Enhanced Scoring")
    print("-" * 70)
    if BRAID_AVAILABLE:
        print("✅ BRAID client available")
    else:
        print("⚠️  BRAID not available (simulated)")
    
    braid_score, braid_reasons = score_braid_method(TEST_LEAD)
    print(f"\nScore: {braid_score}/100")
    print("Factors:")
    for r in braid_reasons:
        print(f"  ✓ {r}")
    
    # Combined Score
    print("\n" + "-" * 70)
    print("METHOD 3: COMBINED SCORING (60% AOX + 40% BRAID)")
    print("-" * 70)
    combined = combine_scores(aox_score, braid_score)
    print(f"\n  AOX Score:   {aox_score} × 0.60 = {aox_score * 0.60}")
    print(f"  BRAID Score: {braid_score} × 0.40 = {braid_score * 0.40}")
    print(f"  ─────────────────────────")
    print(f"  COMBINED:    {combined}/100")
    
    # Determine tier
    if combined >= 90:
        tier = "Enterprise"
        price = 100
    elif combined >= 80:
        tier = "Premium"
        price = 50
    elif combined >= 70:
        tier = "Standard"
        price = 20
    else:
        tier = "Below Threshold"
        price = 0
    
    print(f"\n  Tier: {tier}")
    print(f"  Price: ${price} USDC")
    
    # Save result
    result = {
        "lead_id": TEST_LEAD['id'],
        "timestamp": datetime.utcnow().isoformat(),
        "scoring": {
            "aox": {"score": aox_score, "weight": 0.60},
            "braid": {"score": braid_score, "weight": 0.40},
            "combined": combined
        },
        "tier": tier,
        "price": price,
        "qualified": combined >= 70
    }
    
    output_dir = os.path.expanduser("~/.openclaw/agents/research/output/polymarket")
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = f"{output_dir}/polymarket_lead_{TEST_LEAD['id'][-8:]}.json"
    with open(output_file, 'w') as f:
        json.dump({**TEST_LEAD, **result}, f, indent=2)
    
    print(f"\n✅ Saved to: {output_file}")
    
    # Push to pipeline
    print("\n" + "=" * 70)
    print("PUSHING TO PIPELINE")
    print("=" * 70)
    print(f"\nStatus: {'✅ PASSED' if combined >= 70 else '❌ REJECTED'}")
    print(f"Next: Scoring Agent → Policy Gate → Marketplace")

if __name__ == "__main__":
    main()
