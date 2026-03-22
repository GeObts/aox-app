"""
BRAID Reasoning Integration for AOX Research Agent

Uses SERV's BRAID (Bounded Reasoning for Autonomous Inference and Decisions)
framework to enhance lead scoring with structured reasoning.

BRAID claims 70x cost reduction vs GPT-4 while improving accuracy.
"""

import os
import json
import requests
from typing import Dict, Optional
from dataclasses import dataclass


@dataclass
class BraidAnalysis:
    """Result from BRAID reasoning analysis"""
    score: int  # 0-100 enhanced score
    confidence: float  # 0.0-1.0
    reasoning: str  # Explanation of the analysis
    risk_factors: list  # Identified risks
    strengths: list  # Identified strengths
    recommendation: str  # BUY, PASS, or REVIEW


class BraidReasoningClient:
    """
    Client for SERV's BRAID reasoning framework.
    
    BRAID applies structured reasoning patterns to improve
    LLM accuracy while reducing cost.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('SERV_API_KEY')
        self.base_url = 'https://api.openserv.ai/v1'
        self.enabled = bool(self.api_key)
        
    def analyze_polymarket_trader(self, trader_data: Dict) -> BraidAnalysis:
        """
        Analyze a Polymarket trader using BRAID reasoning.
        
        Args:
            trader_data: Dict with keys like:
                - win_rate: float (0-100)
                - total_volume: float
                - total_trades: int
                - avg_position_size: float
                - roi: float
                - categories: list of str
                - markets_count: int
                - last_active_days: int
                
        Returns:
            BraidAnalysis with enhanced scoring
        """
        if not self.enabled:
            # Fallback to local calculation
            return self._local_analysis(trader_data)
        
        try:
            response = requests.post(
                f'{self.base_url}/reasoning/analyze',
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                },
                json={
                    'framework': 'braid',
                    'task': 'evaluate_prediction_market_trader',
                    'input': {
                        'trader_profile': trader_data,
                        'context': 'polymarket_prediction_markets',
                        'evaluation_criteria': [
                            'consistency_over_time',
                            'risk_management',
                            'market_selection',
                            'win_rate_quality',
                            'volume_sustainability'
                        ]
                    }
                },
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            return BraidAnalysis(
                score=result.get('score', 0),
                confidence=result.get('confidence', 0.5),
                reasoning=result.get('reasoning', ''),
                risk_factors=result.get('risk_factors', []),
                strengths=result.get('strengths', []),
                recommendation=result.get('recommendation', 'PASS')
            )
            
        except Exception as e:
            print(f"BRAID API error: {e}. Falling back to local analysis.")
            return self._local_analysis(trader_data)
    
    def _local_analysis(self, trader_data: Dict) -> BraidAnalysis:
        """
        Fallback local analysis when BRAID is unavailable.
        Simulates BRAID-style structured reasoning.
        """
        win_rate = trader_data.get('win_rate', 0)
        volume = trader_data.get('total_volume', 0)
        trades = trader_data.get('total_trades', 0)
        roi = trader_data.get('roi', 0)
        markets = trader_data.get('markets_count', 0)
        
        # Structured reasoning (BRAID-style)
        checks = []
        score = 0
        
        # Check 1: Win rate quality
        if win_rate >= 70:
            checks.append("Excellent win rate (>70%)")
            score += 25
        elif win_rate >= 60:
            checks.append("Good win rate (60-70%)")
            score += 20
        elif win_rate >= 50:
            checks.append("Acceptable win rate (50-60%)")
            score += 10
        else:
            checks.append("Low win rate (<50%)")
            score -= 10
        
        # Check 2: Volume sustainability
        if volume >= 50000:
            checks.append("High volume sustainability")
            score += 25
        elif volume >= 10000:
            checks.append("Moderate volume")
            score += 15
        elif volume >= 1000:
            checks.append("Low volume")
            score += 5
        
        # Check 3: Experience depth
        if markets >= 20:
            checks.append("Experienced across many markets")
            score += 15
        elif markets >= 10:
            checks.append("Moderate experience")
            score += 10
        else:
            checks.append("Limited market exposure")
        
        # Check 4: ROI quality
        if roi >= 50:
            checks.append("Exceptional ROI")
            score += 20
        elif roi >= 20:
            checks.append("Good ROI")
            score += 15
        elif roi >= 0:
            checks.append("Positive ROI")
            score += 5
        else:
            checks.append("Negative ROI")
            score -= 10
        
        # Check 5: Trade volume
        if trades >= 50:
            checks.append("High activity")
            score += 15
        elif trades >= 20:
            checks.append("Moderate activity")
            score += 10
        else:
            checks.append("Low activity")
        
        # Normalize to 0-100
        score = max(0, min(100, score))
        
        # Determine recommendation
        if score >= 80:
            recommendation = "BUY"
        elif score >= 70:
            recommendation = "REVIEW"
        else:
            recommendation = "PASS"
        
        return BraidAnalysis(
            score=score,
            confidence=0.7 if score > 50 else 0.5,
            reasoning="; ".join(checks),
            risk_factors=["Limited data" if trades < 20 else None],
            strengths=["Consistent performance" if win_rate > 60 else None],
            recommendation=recommendation
        )


# Convenience function for Polymarket scanner
def enhance_trader_score(trader_data: Dict, current_score: int) -> tuple:
    """
    Enhance trader score with BRAID reasoning.
    
    Args:
        trader_data: Raw trader metrics
        current_score: Existing score from calculate_score()
        
    Returns:
        (enhanced_score, braid_analysis)
    """
    client = BraidReasoningClient()
    analysis = client.analyze_polymarket_trader(trader_data)
    
    # Weighted combination: 60% existing, 40% BRAID
    # This preserves your existing scoring while adding BRAID insight
    enhanced = int(current_score * 0.6 + analysis.score * 0.4)
    
    return enhanced, analysis


# Flag to enable/disable BRAID
USE_BRAID = os.getenv('USE_BRAID_REASONING', 'false').lower() == 'true'
