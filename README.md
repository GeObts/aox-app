# AOX - Agent Exchange

**Autonomous lead generation and marketplace for high-value trading intelligence.**

Built for the [OpenServ Hackathon](https://openserv.io) - demonstrating multi-agent workflow orchestration, on-chain payments, and AI-powered discovery.

---

## 🎯 What is AOX?

AOX is an autonomous agent marketplace that discovers, verifies, and sells high-quality trading leads:

- **Polymarket Traders**: Elite prediction market traders with verified multi-million dollar profits
- **Token Runners**: Early momentum detection for crypto tokens before they pump
- **Agent-Written eBooks**: Research reports and trading guides written by AI agents for humans and agents alike

A wide range of leads including Web3 investors, job opportunities, and more coming soon.

---

## 🚀 Live Demo

- **Marketplace**: [aox.llc](https://aox.llc)
- **API**: `http://3.142.118.148:3200`
- **Treasury Contract**: [`0xeB747c50eD3b327480228E18ffD4bd9Cf8646B47`](https://basescan.org/address/0xeB747c50eD3b327480228E18ffD4bd9Cf8646B47) (Base)

---

## 🏗️ Architecture

```
┌──────────────────────┐      ┌──────────────────────┐
│   beansai.eth        │      │ research.aoxexchange.eth │
│   Discovery Agent    │      │  Blockchain Scanner  │
│   (OpenClaw)         │      │  (On-chain Analysis) │
│                      │      │                      │
│ - Polymarket scan    │      │ - Token discovery    │
│ - Trader analysis    │      │ - Liquidity tracking │
│ - Proprietary        │      │ - Wallet analysis    │
│   filtering          │      │ - Smart money flow   │
└──────┬───────────────┘      └──────┬───────────────┘
       │                              │
       └──────────────┬───────────────┘
                      ▼
            ┌──────────────────┐
            │   OpenServ       │
            │   Workflow       │
            │   Orchestration  │
            │                  │
            │ - Multi-agent    │
            │   coordination   │
            │ - Quality gates  │
            └──────┬───────────┘
                   ▼
            ┌──────────────────┐
            │  marketplace     │
            │  .aoxexch.ens    │
            │  Publishing API  │
            │                  │
            │ - x402 payments  │
            │ - Lead escrow    │
            └──────┬───────────┘
                   ▼
            ┌──────────────────┐
            │  Frontend        │
            │  (Next.js)       │
            │                  │
            │ - Browse by tier │
            │ - USDC purchase  │
            │ - Unlock profiles│
            └──────────────────┘
```

---


## 🤖 Autonomous Lead Submission

Research Agent submits verified leads directly to the marketplace via webhook:

```bash
POST http://3.142.118.148:3200/webhook/new-lead
Content-Type: application/json
X-Webhook-Secret: aox-agents-2026

{
  "id": "token-0xabc123",
  "category": "Token Launch",
  "title": "ABC Token — $340K FDV, 89 Traders",
  "score": 87,
  "price": 45,
  "contact_data": { ... }
}
```

No git commits. No manual edits. Fully autonomous agent-to-agent submission.

See [WEBHOOK_API.md](WEBHOOK_API.md) for full documentation.

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- RainbowKit + Wagmi (wallet connect)

**Backend:**
- Node.js + Express (marketplace API)
- x402 protocol (payment verification)
- OpenServ workflow orchestration

**Blockchain:**
- Base (EVM L2)
- AgentTreasury contract (multi-token escrow)
- USDC payment settlement

**AI Agents:**
- beansai.eth - Lead discovery & coordination
- ceo.aoxexchange.eth - Strategic oversight
- research.aoxexchange.eth - Blockchain analysis & token scanning
- banker.aoxexchange.eth - Treasury management
- marketplace.aoxexchange.eth - Lead publishing & fulfillment

---

## 📦 Repository Structure

```
aox-app/
├── app/              # Next.js pages (marketplace frontend)
├── components/       # React components
├── contracts/        # Smart contracts (AgentTreasury)
├── lib/              # Utilities, API clients, lead data
├── hooks/            # React hooks (wallet, payments)
└── public/           # Static assets
```

**Related Repositories:**
- [`aox-treasury`](https://github.com/GeObts/aox-treasury) - Smart contract deployment scripts
- TBD: Consolidate all repos into this main project

---

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- Base wallet with USDC (for testing purchases)

### Installation

```bash
# Clone the repo
git clone https://github.com/GeObts/aox-app.git
cd aox-app

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your RPC URL, contract addresses, etc.

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Environment Variables

```env
# Required
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_TREASURY_ADDRESS=0xeB747c50eD3b327480228E18ffD4bd9Cf8646B47

# Optional (for API)
API_SECRET=<your-secret>
```

---

## 🧪 How It Works

### 1. Discovery (Autonomous Agents)

**beansai.eth** scans Polymarket leaderboards:
- Extracts trader profiles: wallet, username, rank
- Fetches comprehensive trade data
- Applies proprietary filtering system across multiple criteria

**research.aoxexchange.eth** monitors blockchain activity:
- Real-time token discovery on Base and Solana
- Liquidity pool analysis
- Smart money wallet tracking
- Early momentum detection

### 2. Scoring (Multi-Agent Analysis)

Leads are evaluated through our proprietary multi-dimensional scoring system coordinated via OpenServ workflows.

**Tiers:**
- 🏆 **Elite** (85-100): Highest quality, verified multi-million dollar performance
- 💎 **Premium** (70-84): Proven track record with substantial verified performance
- ⭐ **Standard** (50-69): Emerging opportunities with verified potential

*Note: Our exact scoring methodology and filtering criteria are proprietary.*

### 3. Publishing (Marketplace)

Verified leads are published through marketplace.aoxexchange.eth to the marketplace API.

### 4. Purchase Flow (x402)

1. User browses marketplace, sees preview data
2. Clicks "Purchase" → wallet connect → signs transaction
3. USDC transferred to AOX agent team
4. Payment verified via x402 signature
5. Full lead data unlocked (wallet address, profile link, complete analytics)

---

## 🔐 Smart Contracts

See [`CONTRACTS_README.md`](./CONTRACTS_README.md) for full documentation.

---

## 🎬 OpenServ Integration

AOX uses OpenServ for multi-agent workflow orchestration:

1. **Webhook Trigger**: New opportunity discovered → POST to OpenServ
2. **Multi-Agent Analysis**: Coordinated evaluation across specialized agents
3. **Quality Gates**: Proprietary filtering and verification
4. **Output**: Verified lead with tier classification
5. **Marketplace**: Automated publishing and fulfillment

**Why OpenServ?**
- Enables true multi-agent collaboration without central control
- Agents can spawn workflows, coordinate tasks, and verify each other's work
- Demonstrates autonomous operation - agents discovering problems and executing solutions end-to-end

---

## 🧩 Future Roadmap

**Phase 1: Launch** (Hackathon)
- ✅ Polymarket trader discovery
- ✅ Crypto token momentum scanner
- ✅ OpenServ workflow integration
- ✅ x402 payment gateway
- ✅ Multi-agent coordination system

**Phase 2: Expansion**
- Building out comprehensive databases across multiple verticals
- Tons of different lead types coming: investors, jobs, alpha channels, whale wallets, and more
- Agent-written eBook marketplace
- Automated research reports

**Phase 3: Decentralized Marketplace**
- Open marketplace model (similar to eBay/OpenSea) - anyone can list leads
- Multi-chain support (Solana, Ethereum mainnet)
- Cross-platform lead discovery (Twitter, Farcaster, Discord)
- DAO governance for quality standards

---

## 🏆 Hackathon Submission

**OpenServ Hackathon - Protocol Labs Track: "Let the Agent Cook"**

### What We Built

A fully autonomous multi-agent system where AI agents:
- **Discover opportunities** without human prompting (Polymarket traders, crypto tokens, blockchain patterns)
- **Coordinate analysis** through OpenServ workflows (beansai.eth, research.aoxexchange.eth, banker.aoxexchange.eth)
- **Execute real transactions** on-chain (x402 payments, treasury management)
- **Operate continuously** 24/7 without human intervention

### Why It Matters

**Demonstrates True Agent Autonomy:**
- No human in the loop: Agents discover problems (finding profitable traders), plan solutions (multi-agent scoring), and execute (publish to marketplace)
- Real economic value: Generates revenue through lead sales, manages treasury, reinvests earnings
- Production-ready: Live marketplace with real transactions on Base

**Solves Real Problems:**
- Finding elite traders manually takes hours of research - agents do it in seconds
- Token opportunities disappear fast - 24/7 monitoring catches early momentum
- Quality verification is subjective - multi-agent consensus provides objective scoring

**Technical Innovation:**
- Multi-agent coordination via OpenServ (not simple API calls)
- Proprietary filtering systems evolved through agent learning
- On-chain payment verification (x402 protocol)
- Cross-chain discovery (Base, Solana, Ethereum)

**Protocol Labs Alignment:**
- **Autonomous Operation**: Agents plan and execute without humans
- **Real Tools**: Blockchain scanning, API integration, payment processing
- **Meaningful Output**: Verified leads with actual monetary value
- **Agent-to-Agent Economy**: Agents buying/selling to other agents (eBooks, research)

### Agent Architecture

**beansai.eth** - Lead Coordinator
- Orchestrates discovery across all verticals
- Manages OpenServ workflow triggers
- Handles marketplace publishing

**research.aoxexchange.eth** - Blockchain Analyst
- On-chain pattern recognition
- Smart money tracking
- Token momentum detection

**ceo.aoxexchange.eth** - Strategic Oversight
- Quality gate enforcement
- Pricing strategy
- Market expansion decisions

**banker.aoxexchange.eth** - Treasury Manager
- Payment verification (x402)
- Multi-token escrow
- Earnings reinvestment

**marketplace.aoxexchange.eth** - Fulfillment
- Lead publishing
- Purchase processing
- Customer delivery

### Live Demonstration

- **Production Marketplace**: [aox.llc](https://aox.llc)
- **Real Transactions**: Base mainnet (verified on Basescan)
- **Active Leads**: Elite Polymarket traders with verified $5M+ profits
- **Autonomous Operation**: No human intervention in discovery → analysis → publishing flow

### Impact & Scale

- Scanning 100+ Polymarket profiles daily
- Monitoring 1000+ token pairs across Base/Solana
- Processing real USDC payments on-chain
- Agents coordinating through OpenServ workflows
- Treasury managing multi-token escrow

**This isn't a demo - it's a live autonomous business run by AI agents.**

---

## 📜 License

MIT

---

## 👥 Team

- **GeObts** - Smart contracts, treasury management
- **beansai.eth** - Agent development, OpenServ integration, autonomous operations
- **AOX Agent Collective** - Multi-agent coordination (ceo, research, banker, marketplace ENS agents)

---

## 🙏 Acknowledgments

- [OpenServ](https://openserv.io) - Agent workflow orchestration
- [Protocol Labs](https://protocol.ai) - "Let the Agent Cook" track sponsor
- [OpenClaw](https://openclaw.ai) - Agent runtime
- [x402](https://x402.org) - Payment protocol
- [Base](https://base.org) - L2 blockchain
- [Polymarket](https://polymarket.com) - Prediction market data

---

**Questions? Bugs? Feature requests?**

Open an issue or reach out on [Discord](https://discord.gg/openserv)
