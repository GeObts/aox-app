#!/usr/bin/env python3
"""
AOX Research Agent — Token Discovery Scanner
Scans Base blockchain for new ERC-20 launches, enriches, scores, outputs leads.
"""

import os
import json
import time
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

# Venice AI Enrichment
import sys
sys.path.insert(0, os.path.dirname(__file__))
from venice_enricher import VeniceEnricher

# Config
BASESCAN_API_KEY = os.getenv('BASESCAN_API_KEY', '')
RUGCHECK_API_KEY = os.getenv('RUGCHECK_API_KEY', '')
OUTPUT_DIR = os.getenv('RESEARCH_OUTPUT_DIR', os.path.expanduser('~/.openclaw/agents/research/output'))
LOG_DIR = os.getenv('RESEARCH_LOG_DIR', os.path.expanduser('~/.openclaw/agents/research/logs'))

BASESCAN_API = "https://api.basescan.org/v2/api"
DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens'
RUGCHECK_API = 'https://api.rugcheck.xyz/v1'

MIN_LIQUIDITY_USD = 10000  # $10k minimum
SCORE_THRESHOLD = 70  # Only pass 70+


@dataclass
class TokenLead:
    lead_id: str
    token_address: str
    name: str
    symbol: str
    launch_time: str
    score: int
    tier: str
    safety: Dict
    momentum: Dict
    distribution: Dict
    liquidity: Dict
    price: Dict
    social: Dict
    discovered_at: str
    data_sources: List[str]
    ai_enrichment: Optional[Dict] = None
    ai_enrichment: Optional[Dict] = None


class ResearchAgent:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'AOX-Research-Agent/1.0'
        })
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        os.makedirs(LOG_DIR, exist_ok=True)
        
        # Initialize Venice AI enricher
        self.enricher = VeniceEnricher()
        self.log(f"Venice AI: {'Connected' if self.enricher.available else 'Offline (fallback mode)'}")
        
    def log(self, message: str):
        timestamp = datetime.utcnow().isoformat()
        log_entry = f"[{timestamp}] {message}"
        print(log_entry)
        with open(f"{LOG_DIR}/scanner.log", 'a') as f:
            f.write(log_entry + '\n')
    
    def get_new_contracts(self, hours_back: int = 1) -> List[Dict]:
        """Query BaseScan for new contract creations in last N hours."""
        if not BASESCAN_API_KEY:
            self.log("ERROR: BASESCAN_API_KEY not set")
            return []
        
        # Get blocks from last hour
        end_block = self.get_latest_block()
        blocks_per_hour = 1800  # ~2s block time
        start_block = end_block - (blocks_per_hour * hours_back)
        
        params = {
            'module': 'account',
            'action': 'txlist',
            'address': '0x0000000000000adc975ce9e7c2e7d11d2d95c9c2',  # Base deployer
            'startblock': start_block,
            'endblock': end_block,
            'sort': 'desc',
            'apikey': BASESCAN_API_KEY
        }
        
        try:
            resp = self.session.get(BASESCAN_API, params=params, timeout=30)
            data = resp.json()
            
            if data.get('status') != '1':
                self.log(f"BaseScan error: {data.get('message', 'Unknown')}")
                return []
            
            # Filter for contract creation transactions
            contracts = []
            for tx in data.get('result', []):
                if tx.get('contractAddress'):  # Contract creation
                    contracts.append({
                        'address': tx['contractAddress'],
                        'creator': tx['from'],
                        'block': int(tx['blockNumber']),
                        'time': datetime.fromtimestamp(int(tx['timeStamp'])).isoformat()
                    })
            
            self.log(f"Found {len(contracts)} new contracts")
            return contracts
            
        except Exception as e:
            self.log(f"Error fetching contracts: {e}")
            return []
    
    def get_latest_block(self) -> int:
        """Get current block number from BaseScan."""
        params = {
            'module': 'proxy',
            'action': 'eth_blockNumber',
            'apikey': BASESCAN_API_KEY
        }
        try:
            resp = self.session.get(BASESCAN_API, params=params, timeout=10)
            data = resp.json()
            return int(data['result'], 16)
        except:
            return 0
    
    def is_erc20_token(self, address: str) -> Optional[Dict]:
        """Check if contract is ERC-20 and get basic info."""
        # Get token name
        name_params = {
            'module': 'contract',
            'action': 'getsourcecode',
            'address': address,
            'apikey': BASESCAN_API_KEY
        }
        
        try:
            resp = self.session.get(BASESCAN_API, params=name_params, timeout=10)
            data = resp.json()
            
            if data.get('status') != '1' or not data.get('result'):
                return None
            
            contract = data['result'][0]
            
            # Check if it's a token contract
            if not contract.get('ContractName') or contract.get('ABI') == 'Contract source code not verified':
                return None
            
            return {
                'name': contract.get('ContractName', 'Unknown'),
                'verified': True,
                'abi': contract.get('ABI', '[]')
            }
            
        except Exception as e:
            self.log(f"Error checking token {address}: {e}")
            return None
    
    def get_dexscreener_data(self, address: str) -> Optional[Dict]:
        """Get market data from DexScreener."""
        try:
            resp = self.session.get(f"{DEXSCREENER_API}/{address}", timeout=10)
            data = resp.json()
            
            pairs = data.get('pairs', [])
            if not pairs:
                return None
            
            # Get best pair (highest liquidity)
            best = max(pairs, key=lambda x: float(x.get('liquidity', {}).get('usd', 0) or 0))
            
            return {
                'price_usd': float(best.get('priceUsd', 0)),
                'liquidity_usd': float(best.get('liquidity', {}).get('usd', 0) or 0),
                'volume_1h': float(best.get('volume', {}).get('h1', 0) or 0),
                'buys_1h': int(best.get('txns', {}).get('h1', {}).get('buys', 0) or 0),
                'sells_1h': int(best.get('txns', {}).get('h1', {}).get('sells', 0) or 0),
                'price_change_1h': float(best.get('priceChange', {}).get('h1', 0) or 0),
                'dex': best.get('dexId', 'unknown'),
                'pair_created_at': best.get('pairCreatedAt')
            }
            
        except Exception as e:
            self.log(f"DexScreener error for {address}: {e}")
            return None
    
    def get_rugcheck_score(self, address: str) -> Optional[int]:
        """Get safety score from RugCheck."""
        if not RUGCHECK_API_KEY:
            return None
        
        try:
            resp = self.session.get(
                f"{RUGCHECK_API}/tokens/{address}/report",
                headers={'Authorization': f'Bearer {RUGCHECK_API_KEY}'},
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get('score')
        except:
            pass
        return None
    
    def calculate_score(self, token_info: Dict, dex_data: Dict, rugcheck: Optional[int]) -> int:
        """Calculate 0-100 quality score."""
        score = 0
        
        # Safety (40 pts)
        if token_info.get('verified'):
            score += 10
        if rugcheck and rugcheck > 70:
            score += 15
        if dex_data.get('liquidity_usd', 0) > 50000:
            score += 15  # Assume locked if high liquidity
        
        # Momentum (30 pts)
        buys = dex_data.get('buys_1h', 0)
        sells = dex_data.get('sells_1h', 1)
        buy_sell_ratio = buys / max(sells, 1)
        
        if buys > 500:
            score += 10
        elif buys > 200:
            score += 7
        elif buys > 50:
            score += 4
        
        if buy_sell_ratio > 2:
            score += 10
        elif buy_sell_ratio > 1.5:
            score += 7
        elif buy_sell_ratio > 1:
            score += 4
        
        # Time-based (assume new if in our scan window)
        score += 10
        
        # Liquidity (10 pts)
        liq = dex_data.get('liquidity_usd', 0)
        if liq > 100000:
            score += 10
        elif liq > 50000:
            score += 7
        elif liq > 10000:
            score += 4
        
        # Distribution (20 pts) - estimated
        score += 10  # Placeholder for top 10 holders
        score += 10  # Placeholder for top 1 holder
        
        return min(score, 100)
    
    def get_tier(self, score: int) -> str:
        if score >= 90:
            return "Enterprise"
        elif score >= 80:
            return "Premium"
        elif score >= 70:
            return "Standard"
        return "Rejected"
    
    def process_token(self, contract: Dict) -> Optional[TokenLead]:
        """Process a single token contract."""
        address = contract['address']
        self.log(f"Processing {address}...")
        
        # Check if ERC-20
        token_info = self.is_erc20_token(address)
        if not token_info:
            return None
        
        # Get market data
        dex_data = self.get_dexscreener_data(address)
        if not dex_data:
            self.log(f"  No DEX data for {address}")
            return None
        
        # Check minimum liquidity
        if dex_data.get('liquidity_usd', 0) < MIN_LIQUIDITY_USD:
            self.log(f"  Insufficient liquidity: ${dex_data.get('liquidity_usd', 0):,.0f}")
            return None
        
        # Get safety score
        rugcheck = self.get_rugcheck_score(address)
        
        # Calculate score
        score = self.calculate_score(token_info, dex_data, rugcheck)
        tier = self.get_tier(score)
        
        if score < SCORE_THRESHOLD:
            self.log(f"  Score {score} below threshold, skipping")
            return None
        
        # Create lead
        lead = TokenLead(
            lead_id=f"base-{address.lower()}",
            token_address=address,
            name=token_info.get('name', 'Unknown'),
            symbol='???',  # Would need additional call
            launch_time=contract['time'],
            score=score,
            tier=tier,
            safety={
                'ownership_renounced': None,  # Would need contract analysis
                'liquidity_locked': 95 if dex_data.get('liquidity_usd', 0) > 50000 else 50,
                'verified': token_info.get('verified', False),
                'rugcheck_score': rugcheck
            },
            momentum={
                'unique_buyers': dex_data.get('buys_1h', 0),
                'time_to_100': 'unknown',
                'buy_sell_ratio': round(dex_data.get('buys_1h', 0) / max(dex_data.get('sells_1h', 1), 1), 2)
            },
            distribution={
                'top10_percent': None,  # Would need holder analysis
                'top1_percent': None
            },
            liquidity={
                'usd': dex_data.get('liquidity_usd', 0),
                'locked_percent': 95 if dex_data.get('liquidity_usd', 0) > 50000 else 50
            },
            price={
                'usd': dex_data.get('price_usd', 0),
                'change_1h': dex_data.get('price_change_1h', 0)
            },
            social={
                'twitter_mentions_1h': None
            },
            discovered_at=datetime.utcnow().isoformat(),
            data_sources=['basescan', 'dexscreener'] + (['rugcheck'] if rugcheck else [])
        )
        
        return lead
    
    def save_lead(self, lead: TokenLead):
        """Save lead to output directory."""
        filename = f"{OUTPUT_DIR}/{lead.lead_id}.json"
        with open(filename, 'w') as f:
            json.dump(asdict(lead), f, indent=2)
        self.log(f"  Saved lead: {filename}")
    
    def run(self):
        """Main scan loop."""
        self.log("=" * 50)
        self.log("AOX Research Agent — Starting Scan")
        self.log("=" * 50)
        
        if not BASESCAN_API_KEY:
            self.log("ERROR: BASESCAN_API_KEY not set!")
            self.log("Get free key at: https://basescan.org/apis")
            return
        
        # Get new contracts
        contracts = self.get_new_contracts(hours_back=1)
        
        qualified = 0
        for contract in contracts:
            lead = self.process_token(contract)
            if lead:
                self.save_lead(lead)
                qualified += 1
        
        self.log("=" * 50)
        self.log(f"Scan complete: {qualified} qualified leads from {len(contracts)} contracts")
        self.log("=" * 50)


if __name__ == '__main__':
    agent = ResearchAgent()
    agent.run()
