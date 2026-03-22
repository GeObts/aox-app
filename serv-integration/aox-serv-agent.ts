/**
 * AOX Lead Marketplace Agent for SERV Platform
 * 
 * This agent allows SERV ecosystem agents to discover and purchase
 * AOX leads via the x402 payment standard.
 */

import { Agent } from '@openserv-labs/sdk'
import { z } from 'zod'

// AOX API Configuration
const AOX_BASE_URL = 'http://3.142.118.148:3200'

// Initialize the agent
const agent = new Agent({
  systemPrompt: `You are the AOX Lead Marketplace agent for the SERV ecosystem.

Your purpose is to help SERV agents discover and purchase verified Web3 business leads.

AOX provides:
- Token Launch leads (new ERC-20s on Base)
- DeFi Protocol leads (new protocols, vaults, DEXs)
- NFT Launch leads (collections, gaming, art)
- Polymarket Trader leads (high-performing prediction market traders)

All leads are scored 70-100 by AI and priced in USDC/ETH/BNKR.

When a user wants leads:
1. Call discover_leads with their criteria
2. Present options with scores and prices
3. Guide them to purchase via x402 payment`,
  apiKey: process.env.OPENSERV_API_KEY
})

// Capability: Discover leads
agent.addCapability({
  name: 'discover_leads',
  description: 'Discover verified Web3 leads from AOX marketplace',
  schema: z.object({
    category: z.enum(['Token Launch', 'DeFi Protocol', 'NFT Launch', 'Polymarket', 'Misc'])
      .optional()
      .describe('Filter by lead category'),
    min_score: z.number().min(70).max(100).optional().default(70)
      .describe('Minimum lead quality score'),
    tier: z.enum(['STANDARD', 'PREMIUM', 'ELITE']).optional()
      .describe('Filter by pricing tier')
  }),
  async run({ args }) {
    try {
      // Build query params
      const params = new URLSearchParams()
      if (args.category) params.append('category', args.category)
      if (args.min_score) params.append('min_score', args.min_score.toString())
      if (args.tier) params.append('tier', args.tier)
      
      // Fetch leads from AOX
      const response = await fetch(`${AOX_BASE_URL}/leads?${params}`)
      if (!response.ok) {
        throw new Error(`AOX API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Format for SERV agent consumption
      const formatted = {
        source: 'AOX Lead Marketplace',
        count: data.listings?.length || 0,
        leads: data.listings?.map((lead: any) => ({
          id: lead.id,
          title: lead.title,
          category: lead.category,
          score: lead.score,
          tier: lead.tier,
          price: `${lead.price} ${lead.payment_token}`,
          description: lead.description,
          chain: 'Base',
          listed_at: lead.listed_at
        })) || []
      }
      
      return JSON.stringify(formatted, null, 2)
    } catch (error: any) {
      return JSON.stringify({
        error: 'Failed to fetch leads',
        message: error.message
      })
    }
  }
})

// Capability: Get lead details
agent.addCapability({
  name: 'get_lead_details',
  description: 'Get detailed information about a specific lead before purchasing',
  schema: z.object({
    lead_id: z.string()
      .describe('The lead ID (e.g., base-0x... or pm-0x...)')
  }),
  async run({ args }) {
    try {
      const response = await fetch(`${AOX_BASE_URL}/leads/${args.lead_id}`)
      if (!response.ok) {
        throw new Error(`AOX API error: ${response.status}`)
      }
      
      const lead = await response.json()
      
      return JSON.stringify({
        id: lead.id,
        title: lead.title,
        category: lead.category,
        score: lead.score,
        tier: lead.tier,
        price: `${lead.price} ${lead.payment_token}`,
        description: lead.description,
        metadata: lead.metadata || {},
        payment_required: true,
        x402_endpoint: `${AOX_BASE_URL}/leads/${args.lead_id}/payment`
      }, null, 2)
    } catch (error: any) {
      return JSON.stringify({
        error: 'Failed to fetch lead details',
        message: error.message
      })
    }
  }
})

// Capability: Purchase lead (x402 integration)
agent.addCapability({
  name: 'purchase_lead',
  description: 'Purchase a lead via x402 payment. Returns payment URL for the user.',
  schema: z.object({
    lead_id: z.string()
      .describe('The lead ID to purchase'),
    payment_token: z.enum(['USDC', 'ETH', 'WETH', 'USDT', 'BNKR'])
      .default('USDC')
      .describe('Token to pay with')
  }),
  async run({ args }) {
    // Return x402 payment instructions
    const paymentUrl = `${AOX_BASE_URL}/leads/${args.lead_id}/payment?token=${args.payment_token}`
    
    return JSON.stringify({
      action: 'x402_payment_required',
      lead_id: args.lead_id,
      payment_url: paymentUrl,
      instructions: [
        '1. Visit the payment URL',
        '2. Sign the Permit2 authorization',
        '3. Submit the signed transaction',
        '4. Lead details will be delivered upon confirmation'
      ],
      note: 'This endpoint speaks x402. SERV agents with x402 capability can automate this flow.'
    }, null, 2)
  }
})

// Capability: Get pricing tiers
agent.addCapability({
  name: 'get_pricing',
  description: 'Get AOX lead pricing tiers and score requirements',
  schema: z.object({}),
  async run() {
    return JSON.stringify({
      tiers: {
        STANDARD: { price: '1 USDC', min_score: 70, description: 'Good quality leads' },
        PREMIUM: { price: '3 USDC', min_score: 75, description: 'High quality leads' },
        ELITE: { price: '5 USDC', min_score: 90, description: 'Exceptional leads with verified ROI' }
      },
      accepted_tokens: ['USDC', 'ETH', 'WETH', 'USDT', 'BNKR'],
      chain: 'Base',
      marketplace: 'http://3.142.118.148:3200'
    }, null, 2)
  }
})

// Start the agent
agent.start()

console.log('✅ AOX Lead Marketplace agent running on SERV')
console.log('   Capabilities: discover_leads, get_lead_details, purchase_lead, get_pricing')
