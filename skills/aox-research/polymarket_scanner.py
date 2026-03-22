#!/usr/bin/env python3
"""
AOX Research Agent — Polymarket Trader Discovery Scanner
Finds high-performing Polymarket traders and scores them as leads.
"""

import os
import json
import time
import requests
from datetime import datetime, timedelta

# Optional BRAID reasoning integration
try:
    from braid_reasoning import BraidReasoningClient, USE_BRAID, enhance_trader_score
    BRAID_AVAILABLE = True
except ImportError:
    BRAID_AVAILABLE = False
    USE_BRAID = False

# Venice AI Enrichment
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from venice_enricher import VeniceEnricher
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, asdict
from collections import defaultdict

# Config
OUTPUT_DIR = os.getenv('RESEARCH_OUTPUT_DIR', os.path.expanduser('~/.openclaw/agents/research/output/polymarket'))
LOG_DIR = os.getenv('RESEARCH_LOG_DIR', os.path.expanduser('~/.openclaw/agents/research/logs'))

# APIs
POLYMARKET_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/polymarket/matic-markets'
POLYMARKET_GAMMA = 'https://gamma-api.polymarket.com'
POLYMARKET_CLOB = 'https://clob.polymarket.com'
BASESCAN_API = 'https://api.basescan.org/api'

MIN_SCORE = 70
DAYS_BACK = 90
MIN_TRADES = 10
MIN_DAYS_ACTIVE = 14
MAX_SINGLE_TRADE_PCT = 0.40

# Scoring weights
WEIGHTS = {
    'win_rate_70': 30,
    'win_rate_60': 20,
    'win_rate_50': 10,
    'volume_50k': 25,
    'volume_10k': 15,
    'volume_1k': 5,
    'active_30d': 15,
    'categories_3plus': 10,
    'ens_farcaster': 10,
    'positions_10k': 10,
    'consistent_3mo': 15,
    'win_rate_10k_markets': 10,
    'avg_position_500': 10,
    'win_streak_5': 5,
    'trades_both_sides': 5,
    'markets_20plus': 10,
    'roi': 15,
}

NEGATIVE_SIGNALS = {
    'recent_surge_7d': -10,
    'single_category': -5,
    'win_rate_fading': -10,
}


@dataclass
class PolymarketLead:
    lead_id: str
    category: str
    title: str
    description: str
    wallet_address: str
    score: int
    tier: str
    price: int
    payment_token: str
    # New scoring fields
    win_rate: float
    roi: float
    total_volume: float
    total_trades: int
    active_markets: int
    avg_position_size: float
    last_active: str
    top_categories: List[str]
    # Legacy fields for compatibility
    volume_90d: float
    pnl_estimate: Optional[float]
    markets_participated: int
    categories: List[str]
    ens_name: Optional[str]
    farcaster_handle: Optional[str]
    first_seen: Optional[str]
    discovered_at: str
    data_sources: List[str]
    ai_enrichment: Optional[Dict] = None


class PolymarketResearchAgent:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'AOX-Polymarket-Agent/1.0',
            'Accept': 'application/json'
        })
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        os.makedirs(LOG_DIR, exist_ok=True)
        
        # Cache for wallet data
        self.wallet_cache = {}
        
    def log(self, message: str):
        timestamp = datetime.utcnow().isoformat()
        log_entry = f"[{timestamp}] {message}"
        print(log_entry)
        with open(f"{LOG_DIR}/polymarket_scanner.log", 'a') as f:
            f.write(log_entry + '\n')
    
    def query_subgraph(self, query: str, variables: Dict = None) -> Dict:
        """Query The Graph Polymarket subgraph."""
        try:
            resp = self.session.post(
                POLYMARKET_SUBGRAPH,
                json={'query': query, 'variables': variables or {}},
                timeout=30
            )
            return resp.json()
        except Exception as e:
            self.log(f"Subgraph error: {e}")
            return {}
    
    def get_active_traders(self, days: int = 30) -> Set[str]:
        """Get wallets that traded in last N days."""
        since = int((datetime.utcnow() - timedelta(days=days)).timestamp())
        
        query = """
        query GetRecentTrades($since: BigInt!) {
            orderFills(
                where: {timestamp_gt: $since}
                first: 1000
                orderBy: timestamp
                orderDirection: desc
            ) {
                taker
                timestamp
                market {
                    id
                    question
                    category
                }
            }
        }
        """
        
        result = self.query_subgraph(query, {'since': since})
        trades = result.get('data', {}).get('orderFills', [])
        
        traders = {}
        for trade in trades:
            wallet = trade.get('taker', '').lower()
            if wallet:
                if wallet not in traders:
                    traders[wallet] = {'last_trade': trade.get('timestamp'), 'markets': set()}
                traders[wallet]['markets'].add(trade.get('market', {}).get('category', 'unknown'))
        
        self.log(f"Found {len(traders)} active traders in last {days} days")
        return set(traders.keys()), traders
    
    def get_trader_history(self, wallet: str, days: int = 90) -> Optional[Dict]:
        """Get trader's 90-day performance from subgraph."""
        since = int((datetime.utcnow() - timedelta(days=days)).timestamp())
        
        query = """
        query GetTraderHistory($wallet: String!, $since: BigInt!) {
            user(id: $wallet) {
                id
                firstTradeTimestamp
                totalVolume
                markets {
                    id
                    question
                    category
                    outcomes
                }
                positions {
                    market {
                        id
                        question
                        category
                        outcomes
                    }
                    outcomeIndex
                    netQuantity
                    avgPrice
                }
            }
            orderFills(
                where: {taker: $wallet, timestamp_gt: $since}
                first: 1000
                orderBy: timestamp
                orderDirection: desc
            ) {
                timestamp
                market {
                    id
                    question
                    category
                    outcomes
                    resolution
                    resolutionOutcome
                }
                outcomeIndex
                amount
                price
                side
            }
        }
        """
        
        result = self.query_subgraph(query, {'wallet': wallet, 'since': since})
        data = result.get('data', {})
        
        if not data.get('user'):
            return None
        
        fills = data.get('orderFills', [])
        user_data = data.get('user', {})
        
        # Calculate metrics
        total_trades = len(fills)
        winning_trades = 0
        total_volume = 0.0
        categories = set()
        market_ids = set()
        
        for fill in fills:
            market = fill.get('market', {})
            categories.add(market.get('category', 'unknown'))
            market_ids.add(market.get('id'))
            
            amount = float(fill.get('amount', 0))
            price = float(fill.get('price', 0))
            volume = amount * price
            total_volume += volume
            
            # Check if trade was winning (simplified)
            if market.get('resolution') == 'resolved':
                resolved_idx = market.get('resolutionOutcome')
                trade_idx = fill.get('outcomeIndex')
                side = fill.get('side')  # BUY or SELL
                
                if resolved_idx is not None and trade_idx is not None:
                    if side == 'BUY' and trade_idx == resolved_idx:
                        winning_trades += 1
                    elif side == 'SELL' and trade_idx != resolved_idx:
                        winning_trades += 1
        
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        
        return {
            'wallet': wallet,
            'total_trades': total_trades,
            'winning_trades': winning_trades,
            'win_rate': win_rate,
            'total_volume': total_volume,
            'markets_count': len(market_ids),
            'categories': list(categories),
            'first_trade': datetime.fromtimestamp(
                int(user_data.get('firstTradeTimestamp', 0))
            ).isoformat() if user_data.get('firstTradeTimestamp') else None,
            'last_trade': datetime.fromtimestamp(
                int(fills[0].get('timestamp', 0))
            ).isoformat() if fills else None
        }
    
    def check_ens(self, wallet: str) -> Optional[str]:
        """Check for ENS name via BaseScan or Ethereum."""
        # Try Ethereum mainnet reverse lookup
        try:
            resp = self.session.get(
                f'https://api.ensideas.com/ens/resolve/{wallet}',
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                name = data.get('name')
                if name and name != wallet:
                    return name
        except:
            pass
        
        # Check BaseScan for any labels
        if os.getenv('BASESCAN_API_KEY'):
            try:
                params = {
                    'module': 'contract',
                    'action': 'getsourcecode',
                    'address': wallet,
                    'apikey': os.getenv('BASESCAN_API_KEY')
                }
                resp = self.session.get(BASESCAN_API, params=params, timeout=5)
                # If this returns a contract name, wallet has activity
            except:
                pass
        
        return None
    
    def check_farcaster(self, wallet: str) -> Optional[str]:
        """Check for Farcaster handle via API."""
        try:
            resp = self.session.get(
                f'https://api.warpcast.com/v2/user-by-verification?address={wallet}',
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                user = data.get('result', {}).get('user')
                if user:
                    return f"@{user.get('username')}"
        except:
            pass
        return None
    
    def get_current_positions(self, wallet: str) -> float:
        """Get current active position value."""
        try:
            resp = self.session.get(
                f'{POLYMARKET_GAMMA}/portfolio/{wallet}',
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                return float(data.get('totalValue', 0))
        except:
            pass
        return 0.0
    
    def check_hard_gates(self, history: Dict) -> tuple:
        """Hard gates - must pass before scoring. Returns (passed, reason)."""
        total_trades = history.get('total_trades', 0)
        if total_trades < MIN_TRADES:
            return False, f"Insufficient trades: {total_trades} < {MIN_TRADES}"
        
        last_trade_days = history.get('days_since_last_trade', 999)
        if last_trade_days > MIN_DAYS_ACTIVE:
            return False, f"Inactive: last trade {last_trade_days} days ago"
        
        # Check single trade concentration
        trades = history.get('trades', [])
        if trades:
            max_trade_size = max(t.get('size', 0) for t in trades)
            total_volume = history.get('total_volume', 0)
            if total_volume > 0 and max_trade_size / total_volume > MAX_SINGLE_TRADE_PCT:
                return False, f"Single trade too large: {(max_trade_size/total_volume)*100:.1f}% of volume"
        
        return True, "Passed"
    
    def calculate_score(self, history: Dict, positions_value: float, 
                       has_ens: bool, has_farcaster: bool) -> tuple:
        """Calculate 0-100 score based on comprehensive rubric. Returns (score, details dict)."""
        # Check hard gates first
        passed, reason = self.check_hard_gates(history)
        if not passed:
            return 0, {'rejected': True, 'reason': reason}
        
        score = 0
        details = {}
        
        # === WIN RATE (30 pts max) ===
        win_rate = history.get('win_rate', 0)
        if win_rate >= 70:
            score += 30
            details['win_rate_tier'] = '70+'
        elif win_rate >= 60:
            score += 20
            details['win_rate_tier'] = '60-69'
        elif win_rate >= 50:
            score += 10
            details['win_rate_tier'] = '50-59'
        else:
            details['win_rate_tier'] = '<50'
        
        # === VOLUME (25 pts max) ===
        volume = history.get('total_volume', 0)
        if volume >= 50000:
            score += 25
            details['volume_tier'] = '50k+'
        elif volume >= 10000:
            score += 15
            details['volume_tier'] = '10k-50k'
        elif volume >= 1000:
            score += 5
            details['volume_tier'] = '1k-10k'
        else:
            details['volume_tier'] = '<1k'
        
        # === ACTIVITY (15 pts) ===
        last_active_days = history.get('days_since_last_trade', 999)
        if last_active_days <= 30:
            score += 15
            details['recent_activity'] = True
        else:
            details['recent_activity'] = False
        
        # === DIVERSIFICATION (10 pts) ===
        categories = history.get('categories', [])
        if len(categories) >= 3:
            score += 10
            details['diversified'] = True
        elif len(categories) >= 2:
            score += 5
            details['diversified'] = 'partial'
        else:
            details['diversified'] = False
        
        # === CONTACTABLE (10 pts) ===
        if has_ens or has_farcaster:
            score += 10
            details['contactable'] = True
        else:
            details['contactable'] = False
        
        # === PORTFOLIO SIZE (10 pts) ===
        if positions_value >= 10000:
            score += 10
            details['portfolio_tier'] = '10k+'
        elif positions_value >= 5000:
            score += 5
            details['portfolio_tier'] = '5k-10k'
        else:
            details['portfolio_tier'] = '<5k'
        
        # === CONSISTENCY ACROSS 3+ MONTHS (15 pts) ===
        trading_months = history.get('unique_trading_months', [])
        if len(trading_months) >= 3:
            score += 15
            details['consistent_3mo'] = True
        else:
            details['consistent_3mo'] = False
        
        # === WIN RATE ON >$10K MARKETS (10 pts) ===
        large_market_win_rate = history.get('large_market_win_rate', 0)
        if large_market_win_rate >= 60:
            score += 10
            details['large_market_proficiency'] = True
        else:
            details['large_market_proficiency'] = False
        
        # === AVERAGE POSITION SIZE (10 pts) ===
        avg_position = history.get('avg_position_size', 0)
        if avg_position >= 500:
            score += 10
            details['position_size_tier'] = '500+'
        elif avg_position >= 100:
            score += 5
            details['position_size_tier'] = '100-500'
        else:
            details['position_size_tier'] = '<100'
        
        # === WIN STREAK (5 pts) ===
        max_win_streak = history.get('max_win_streak', 0)
        if max_win_streak >= 5:
            score += 5
            details['hot_streak'] = True
        else:
            details['hot_streak'] = False
        
        # === TRADES BOTH SIDES (5 pts) ===
        trades_yes = history.get('trades_yes_count', 0)
        trades_no = history.get('trades_no_count', 0)
        if trades_yes > 0 and trades_no > 0:
            score += 5
            details['sophisticated'] = True
        else:
            details['sophisticated'] = False
        
        # === MARKET EXPERIENCE (10 pts) ===
        markets_count = history.get('markets_count', 0)
        if markets_count >= 20:
            score += 10
            details['experienced'] = True
        elif markets_count >= 10:
            score += 5
            details['experienced'] = 'developing'
        else:
            details['experienced'] = False
        
        # === ROI % (15 pts) ===
        roi = history.get('roi_percent', 0)
        if roi >= 50:
            score += 15
            details['roi_tier'] = '50%+'
        elif roi >= 20:
            score += 10
            details['roi_tier'] = '20-50%'
        elif roi >= 0:
            score += 5
            details['roi_tier'] = '0-20%'
        else:
            details['roi_tier'] = 'negative'
        
        # === NEGATIVE SIGNALS ===
        # Recent surge (50%+ trades in last 7 days only)
        trades_7d = history.get('trades_last_7d', 0)
        total_trades = history.get('total_trades', 0)
        if total_trades > 0 and (trades_7d / total_trades) >= 0.5:
            score += NEGATIVE_SIGNALS['recent_surge_7d']
            details['recent_surge_penalty'] = True
        
        # Single category only
        if len(categories) == 1:
            score += NEGATIVE_SIGNALS['single_category']
            details['single_category_penalty'] = True
        
        # Win rate fading (last 30d vs lifetime)
        win_rate_30d = history.get('win_rate_30d', win_rate)
        if win_rate_30d < win_rate - 10:  # 10+ point drop
            score += NEGATIVE_SIGNALS['win_rate_fading']
            details['fading_edge_penalty'] = True
        
        # Store calculated metrics
        details['win_rate'] = win_rate
        details['roi'] = roi
        details['total_volume'] = volume
        details['total_trades'] = total_trades
        details['active_markets'] = markets_count
        details['avg_position_size'] = avg_position
        details['last_active'] = history.get('last_trade_timestamp', '')
        details['top_categories'] = categories[:3] if categories else []
        
        return min(max(score, 0), 100), details
    
    def get_tier_and_price(self, score: int, win_rate: float, roi: float) -> tuple:
        """Determine tier and price based on score, win rate, and ROI.
        
        ELITE: Score 90+, win rate >70%, ROI >50% → 5 $BNKR
        PREMIUM: Score 75-89, win rate >60% → 3 $BNKR  
        STANDARD: Score 70-74 → 1 $BNKR
        """
        if score >= 90 and win_rate > 70 and roi > 50:
            return "ELITE", 5, "BNKR"
        elif score >= 75 and win_rate > 60:
            return "PREMIUM", 3, "BNKR"
        elif score >= 70:
            return "STANDARD", 1, "BNKR"
        return "Rejected", 0, "USDC"
    
    def generate_description(self, details: Dict) -> str:
        """Generate human-readable description from score details."""
        cat_str = ', '.join(details.get('top_categories', [])[:3]) if details.get('top_categories') else 'mixed markets'
        win_rate = details.get('win_rate', 0)
        volume = details.get('total_volume', 0)
        markets = details.get('active_markets', 0)
        roi = details.get('roi', 0)
        avg_position = details.get('avg_position_size', 0)
        
        tier_desc = ""
        if details.get('win_rate_tier') == '70+':
            tier_desc = "Elite"
        elif details.get('win_rate_tier') == '60-69':
            tier_desc = "Top"
        else:
            tier_desc = "Active"
        
        desc = f"{tier_desc} Polymarket trader with {win_rate:.1f}% win rate and {roi:.1f}% ROI across {markets} markets. "
        desc += f"Specializes in {cat_str}. "
        desc += f"${volume:,.0f} total volume, ${avg_position:,.0f} avg position. "
        
        if details.get('consistent_3mo'):
            desc += "3+ month track record. "
        if details.get('experienced'):
            desc += "Experienced across diverse markets. "
        if details.get('hot_streak'):
            desc += "Currently on a winning streak. "
        
        desc += "Verified on-chain."
        
        return desc
    
    def generate_title(self, details: Dict) -> str:
        """Generate lead title from score details."""
        win_rate = details.get('win_rate', 0)
        categories = details.get('top_categories', [])
        top_category = categories[0] if categories else 'Mixed'
        
        if details.get('win_rate_tier') == '70+':
            return f"Elite {top_category.title()} Trader — {win_rate:.0f}% Win Rate"
        elif details.get('win_rate_tier') == '60-69':
            return f"Top {top_category.title()} Trader — {win_rate:.0f}% Win Rate"
        else:
            return f"Active {top_category.title()} Trader — {win_rate:.0f}% Win Rate"
    
    def process_wallet(self, wallet: str) -> Optional[PolymarketLead]:
        """Process a single wallet and create lead if qualified."""
        self.log(f"Processing {wallet[:20]}...")
        
        # Get trade history
        history = self.get_trader_history(wallet, days=DAYS_BACK)
        if not history:
            self.log(f"  No trade history found")
            return None
        
        # Get additional data
        positions = self.get_current_positions(wallet)
        ens = self.check_ens(wallet)
        farcaster = self.check_farcaster(wallet)
        
        # Calculate score with new comprehensive rubric
        score, details = self.calculate_score(history, positions, bool(ens), bool(farcaster))
        
        # Check if rejected by hard gates
        if details.get('rejected'):
            self.log(f"  Rejected: {details['reason']}")
            return None
        
        # Optional: Enhance with BRAID reasoning
        if USE_BRAID and BRAID_AVAILABLE:
            try:
                enhanced_score, braid_analysis = enhance_trader_score(details, score)
                self.log(f"  BRAID enhancement: {score} → {enhanced_score}")
                self.log(f"  BRAID confidence: {braid_analysis.confidence}")
                score = enhanced_score
            except Exception as e:
                self.log(f"  BRAID error (continuing without): {e}")
        
        # Get tier and pricing
        win_rate = details.get('win_rate', 0)
        roi = details.get('roi', 0)
        tier, price, payment_token = self.get_tier_and_price(score, win_rate, roi)
        
        if score < MIN_SCORE:
            self.log(f"  Score {score} below threshold {MIN_SCORE}")
            return None
        
        self.log(f"  Score: {score}, Tier: {tier}, Price: {price} {payment_token}")
        
        # Create lead with all new fields
        lead = PolymarketLead(
            lead_id=f"pm-{wallet.lower()[:20]}",
            category="Polymarket Trader",
            title=self.generate_title(details),
            description=self.generate_description(details),
            wallet_address=wallet,
            score=score,
            tier=tier,
            price=price,
            payment_token=payment_token,
            # New scoring fields
            win_rate=details.get('win_rate', 0),
            roi=details.get('roi', 0),
            total_volume=details.get('total_volume', 0),
            total_trades=details.get('total_trades', 0),
            active_markets=details.get('active_markets', 0),
            avg_position_size=details.get('avg_position_size', 0),
            last_active=details.get('last_active', datetime.utcnow().isoformat()),
            top_categories=details.get('top_categories', []),
            # Legacy fields
            volume_90d=details.get('total_volume', 0),
            pnl_estimate=roi * details.get('total_volume', 0) / 100 if roi else None,
            markets_participated=details.get('active_markets', 0),
            categories=details.get('top_categories', []),
            ens_name=ens,
            farcaster_handle=farcaster,
            first_seen=history.get('first_trade'),
            discovered_at=datetime.utcnow().isoformat(),
            data_sources=["polymarket-subgraph", "polymarket-gamma"]
        )
        
        return lead
    
    def save_lead(self, lead: PolymarketLead):
        """Save lead to both research output and marketplace input directories."""
        # Save to research output for records
        filename = f"{OUTPUT_DIR}/{lead.lead_id}.json"
        with open(filename, 'w') as f:
            json.dump(asdict(lead), f, indent=2)
        self.log(f"  Saved: {filename}")
        
        # Also save to marketplace input for file watcher
        MARKETPLACE_INPUT_DIR = os.path.expanduser('~/.openclaw/agents/marketplace/input')
        os.makedirs(MARKETPLACE_INPUT_DIR, exist_ok=True)
        
        # Create public version for marketplace
        public_filename = f"{MARKETPLACE_INPUT_DIR}/{lead.lead_id}_public.json"
        public_data = {
            'lead_id': lead.lead_id,
            'category': lead.category,
            'title': lead.title,
            'description': lead.description,
            'score': lead.score,
            'tier': lead.tier,
            'price': lead.price,
            'payment_token': lead.payment_token,
            'win_rate': lead.win_rate,
            'roi': lead.roi,
            'total_volume': lead.total_volume,
            'total_trades': lead.total_trades,
            'active_markets': lead.active_markets,
            'avg_position_size': lead.avg_position_size,
            'last_active': lead.last_active,
            'top_categories': lead.top_categories,
            'wallet_address': lead.wallet_address,
            'ens_name': lead.ens_name,
            'farcaster_handle': lead.farcaster_handle,
            'listed_at': lead.discovered_at
        }
        
        with open(public_filename, 'w') as f:
            json.dump(public_data, f, indent=2)
        self.log(f"  Marketplace: {public_filename}")
    
    def run(self):
        """Main scan loop."""
        self.log("=" * 60)
        self.log("AOX Polymarket Research Agent — Starting Scan")
        self.log("=" * 60)
        
        # Get active traders
        wallets, trader_data = self.get_active_traders(days=30)
        
        if not wallets:
            self.log("No active traders found")
            return
        
        # Process top traders (limit to 50 for performance)
        qualified = 0
        for wallet in list(wallets)[:50]:
            lead = self.process_wallet(wallet)
            if lead:
                self.save_lead(lead)
                qualified += 1
            time.sleep(0.5)  # Rate limit
        
        self.log("=" * 60)
        self.log(f"Scan complete: {qualified} qualified leads from {len(wallets)} traders")
        self.log("=" * 60)


if __name__ == '__main__':
    agent = PolymarketResearchAgent()
    agent.run()
