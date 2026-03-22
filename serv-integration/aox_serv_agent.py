"""
AOX Lead Marketplace Agent for SERV Platform (Python)

This agent allows SERV ecosystem agents to discover and purchase
AOX leads via the x402 payment standard.
"""

import os
import requests
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

# AOX API Configuration
AOX_BASE_URL = "http://3.142.118.148:3200"


class LeadDiscoveryRequest(BaseModel):
    """Request to discover leads"""
    category: Optional[str] = Field(None, description="Filter by category")
    min_score: int = Field(70, ge=70, le=100, description="Minimum score")
    tier: Optional[str] = Field(None, description="Filter by tier")


class LeadPurchaseRequest(BaseModel):
    """Request to purchase a lead"""
    lead_id: str = Field(..., description="Lead ID to purchase")
    payment_token: str = Field("USDC", description="Token to pay with")


class AOXServAgent:
    """
    AOX Lead Marketplace agent for SERV platform.
    
    Provides:
    - Lead discovery across categories
    - Lead detail retrieval
    - x402 payment initiation
    - Pricing information
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENSERV_API_KEY")
        self.base_url = AOX_BASE_URL
        
    def discover_leads(self, category: Optional[str] = None,
                       min_score: int = 70,
                       tier: Optional[str] = None) -> Dict:
        """
        Discover verified Web3 leads from AOX marketplace.
        
        Args:
            category: Filter by category (Token Launch, DeFi Protocol, NFT Launch, Polymarket, Misc)
            min_score: Minimum lead quality score (70-100)
            tier: Filter by tier (STANDARD, PREMIUM, ELITE)
            
        Returns:
            Dictionary with leads and metadata
        """
        params = {}
        if category:
            params["category"] = category
        if min_score:
            params["min_score"] = min_score
        if tier:
            params["tier"] = tier
            
        response = requests.get(f"{self.base_url}/leads", params=params)
        response.raise_for_status()
        
        data = response.json()
        
        # Format for SERV agent consumption
        return {
            "source": "AOX Lead Marketplace",
            "count": len(data.get("listings", [])),
            "leads": [
                {
                    "id": lead["id"],
                    "title": lead["title"],
                    "category": lead["category"],
                    "score": lead["score"],
                    "tier": lead["tier"],
                    "price": f"{lead['price']} {lead['payment_token']}",
                    "description": lead["description"],
                    "chain": "Base",
                    "listed_at": lead["listed_at"]
                }
                for lead in data.get("listings", [])
            ]
        }
    
    def get_lead_details(self, lead_id: str) -> Dict:
        """
        Get detailed information about a specific lead.
        
        Args:
            lead_id: The lead ID (e.g., base-0x... or pm-0x...)
            
        Returns:
            Lead details including x402 payment endpoint
        """
        response = requests.get(f"{self.base_url}/leads/{lead_id}")
        response.raise_for_status()
        
        lead = response.json()
        
        return {
            "id": lead["id"],
            "title": lead["title"],
            "category": lead["category"],
            "score": lead["score"],
            "tier": lead["tier"],
            "price": f"{lead['price']} {lead['payment_token']}",
            "description": lead["description"],
            "metadata": lead.get("metadata", {}),
            "payment_required": True,
            "x402_endpoint": f"{self.base_url}/leads/{lead_id}/payment"
        }
    
    def initiate_purchase(self, lead_id: str, 
                         payment_token: str = "USDC") -> Dict:
        """
        Initiate lead purchase via x402.
        
        Args:
            lead_id: The lead ID to purchase
            payment_token: Token to pay with (USDC, ETH, WETH, USDT, BNKR)
            
        Returns:
            Payment instructions with x402 URL
        """
        payment_url = f"{self.base_url}/leads/{lead_id}/payment?token={payment_token}"
        
        return {
            "action": "x402_payment_required",
            "lead_id": lead_id,
            "payment_url": payment_url,
            "instructions": [
                "1. Visit the payment URL",
                "2. Sign the Permit2 authorization", 
                "3. Submit the signed transaction",
                "4. Lead details will be delivered upon confirmation"
            ],
            "note": "This endpoint speaks x402. SERV agents with x402 capability can automate this flow."
        }
    
    def get_pricing(self) -> Dict:
        """Get AOX pricing tiers"""
        return {
            "tiers": {
                "STANDARD": {
                    "price": "1 USDC",
                    "min_score": 70,
                    "description": "Good quality leads"
                },
                "PREMIUM": {
                    "price": "3 USDC", 
                    "min_score": 75,
                    "description": "High quality leads"
                },
                "ELITE": {
                    "price": "5 USDC",
                    "min_score": 90,
                    "description": "Exceptional leads with verified ROI"
                }
            },
            "accepted_tokens": ["USDC", "ETH", "WETH", "USDT", "BNKR"],
            "chain": "Base",
            "marketplace": self.base_url
        }


# Example usage for SERV integration
if __name__ == "__main__":
    agent = AOXServAgent()
    
    # Discover leads
    print("Discovering leads...")
    leads = agent.discover_leads(category="Token Launch", min_score=80)
    print(f"Found {leads['count']} leads")
    
    # Get pricing
    print("\nPricing tiers:")
    pricing = agent.get_pricing()
    print(pricing)
