#!/usr/bin/env python3
"""
AOX Research Agent — Venice AI Enrichment
Uses venice/llama-3.3-70b for token analysis and description generation.
"""

import os
import json
import requests
from typing import Dict, Optional

VENICE_API_KEY = os.getenv('VENICE_API_KEY', '')
VENICE_MODEL = 'llama-3.3-70b'  # Fast, cheap, fully private
VENICE_ENDPOINT = 'https://api.venice.ai/api/v1/chat/completions'

class VeniceEnricher:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {VENICE_API_KEY}',
            'Content-Type': 'application/json'
        })
        self.available = self._test_connection()
    
    def _test_connection(self) -> bool:
        """Test Venice API connectivity."""
        if not VENICE_API_KEY:
            return False
        try:
            resp = self.session.post(
                VENICE_ENDPOINT,
                json={
                    'model': VENICE_MODEL,
                    'messages': [{'role': 'user', 'content': 'Hi'}],
                    'max_tokens': 5
                },
                timeout=10
            )
            return resp.status_code == 200
        except:
            return False
    
    def enrich_token(self, token_data: Dict) -> Dict:
        """Generate AI-powered token description and analysis."""
        if not self.available:
            return self._fallback_enrich(token_data)
        
        prompt = self._build_prompt(token_data)
        
        try:
            resp = self.session.post(
                VENICE_ENDPOINT,
                json={
                    'model': VENICE_MODEL,
                    'messages': [
                        {'role': 'system', 'content': 'You analyze crypto tokens. Output JSON only.'},
                        {'role': 'user', 'content': prompt}
                    ],
                    'temperature': 0.3,
                    'max_tokens': 500
                },
                timeout=30
            )
            
            if resp.status_code == 200:
                content = resp.json()['choices'][0]['message']['content']
                return self._parse_response(content, token_data)
            
        except Exception as e:
            print(f"Venice error: {e}")
        
        return self._fallback_enrich(token_data)
    
    def _build_prompt(self, token: Dict) -> str:
        return f"""Analyze this Base blockchain token and output JSON:

Token: {token.get('name', 'Unknown')} ({token.get('symbol', '???')})
Contract: {token.get('token_address', 'N/A')}
Liquidity: ${token.get('liquidity', {}).get('usd', 0):,.0f}
Holders: {token.get('holders', 'N/A')}
Launch: {token.get('launch_time', 'Unknown')}

Safety Signals:
- Verified: {token.get('safety', {}).get('verified', False)}
- Liquidity Locked: {token.get('safety', {}).get('liquidity_locked', 0)}%
- Ownership Renounced: {token.get('safety', {}).get('ownership_renounced', False)}

Momentum:
- Unique Buyers: {token.get('momentum', {}).get('unique_buyers', 0)}
- Buy/Sell Ratio: {token.get('momentum', {}).get('buy_sell_ratio', 0)}

Output JSON:
{{
  "ai_description": "2-3 sentence summary of what this token appears to be and its potential",
  "red_flags": ["any concerns"],
  "green_flags": ["positive signals"],
  "buyer_value": "who would buy this lead and why",
  "confidence": 1-100
}}"""
    
    def _parse_response(self, content: str, token: Dict) -> Dict:
        try:
            # Extract JSON from response
            content = content.strip()
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0]
            elif '```' in content:
                content = content.split('```')[1].split('```')[0]
            
            result = json.loads(content.strip())
            result['venice_model'] = VENICE_MODEL
            result['enriched'] = True
            return result
            
        except Exception as e:
            print(f"Parse error: {e}")
            return self._fallback_enrich(token_data)
    
    def _fallback_enrich(self, token: Dict) -> Dict:
        """Simple fallback when Venice unavailable."""
        return {
            'ai_description': f"{token.get('name')} token on Base with ${token.get('liquidity', {}).get('usd', 0):,.0f} liquidity.",
            'red_flags': [],
            'green_flags': ['Token discovered on Base'],
            'buyer_value': 'Token launch lead for DeFi buyers',
            'confidence': 50,
            'venice_model': 'fallback',
            'enriched': False
        }

if __name__ == '__main__':
    enricher = VeniceEnricher()
    print(f"Venice Available: {enricher.available}")
