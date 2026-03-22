# AOX Agent Collective - ERC-8004 Multi-Agent Swarm

## Overview

AOX operates as a **verified multi-agent swarm** where each agent has an on-chain ERC-8004 identity. Agents coordinate through OpenServ workflows and verify each other's trust signals before collaboration.

## Registered Agents (Base Mainnet)

### 1. beansai.eth — Agent #14450
**Role:** Lead Coordinator & Discovery Agent  
**ERC-8004 Registry:** https://8004agents.ai/base/agent/14450  
**Identity Contract:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`  
**Operator Wallet:** `0x0eD39Ba9Ab663A20D65cc6e3927dDe40e37309d4`

**Capabilities:**
- Polymarket trader discovery (leaderboard scanning, profile verification)
- Multi-dimensional lead scoring
- OpenServ workflow orchestration
- Quality gate enforcement
- Cross-agent coordination

**Manifest:** `agent.json`  
**Execution Logs:** `agent_log.json`

---

### 2. ceo.aoxexchange.eth — Agent #31386
**Role:** Strategic Oversight & Quality Control  
**ERC-8004 Registry:** https://8004agents.ai/base/agent/31386  
**Identity Contract:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`

**Capabilities:**
- Strategic decision-making
- Quality gate enforcement (tier classification)
- Market expansion planning
- Agent performance monitoring
- Revenue optimization

**Trust Model:** Verifies beansai.eth identity before accepting lead handoffs

---

### 3. banker.aoxexchange.eth — Agent #33162
**Role:** Treasury Management & Payment Processing  
**ERC-8004 Registry:** https://8004agents.ai/base/agent/33162  
**Identity Contract:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`

**Capabilities:**
- x402 payment verification
- Multi-token treasury management (USDC, wstETH, ETH)
- On-chain transaction processing
- Earnings reinvestment
- Budget allocation across agent collective

**Trust Model:** Only accepts payment instructions from verified agents (beansai.eth, ceo.aoxexchange.eth)

---

### 4. research.aoxexchange.eth — Agent #35694 ✅
**Role:** Blockchain Analysis & Token Discovery  
**ERC-8004 Registry:** https://8004agents.ai/base/agent/35694  
**Identity Contract:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`  
**Wallet:** `0xeb8C80924F8Bdf6792886d6c9E29Fdb7E93F82c4`  
**Registration TX:** `0x8612dfba6936a9a7b0de15752ad55a779b7d572da1c5e8ab34396b0129e9fe40`

**Capabilities:**
- Real-time token momentum detection via GeckoTerminal API
- Liquidity pool analysis
- Smart money wallet tracking
- Cross-chain scanning (Base, Ethereum)
- Early runner identification
- Autonomous lead submission to marketplace via webhook

**Trust Model:** Verifies all data via API before submission. No fabricated data.

---

### 5. marketplace.aoxexchange.eth — Pending Registration
**Role:** Lead Publishing & Order Fulfillment  
**ERC-8004 Registry:** Pending on-chain registration

**Capabilities:**
- Lead publishing to marketplace API
- Purchase order processing
- Data unlocking after payment
- Customer delivery
- Reputation updates

---

## Multi-Agent Coordination Flow

### Discovery → Analysis → Publishing Pipeline

```
1. research.aoxexchange.eth discovers token launch
   ↓
   [ERC-8004 Identity Verification: Agent #35694]
   ↓
2. Real-time analysis via GeckoTerminal API
   - FDV, volume, liquidity metrics
   - Wallet age verification
   - Smart money flow detection
   ↓
3. POST to marketplace webhook (/webhook/new-lead)
   ↓
4. Lead appears on aox.llc within 60 seconds
   ↓
5. Buyer pays via x402 (USDC/ETH/BNKR/etc)
   ↓
6. Contact data delivered automatically
```

### Trust Verification

Before any agent accepts work from another agent:
1. Query ERC-8004 Identity Registry
2. Verify agent ID matches claimed identity
3. Check reputation score in Reputation Registry
4. Refuse if trust score < 50

## Agent Communication

All inter-agent messages include:
- Sender ERC-8004 ID
- Signature verification
- Timestamp
- Task context
- Quality attestation

## Registration Contract

**Identity Registry:** `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` (Base Mainnet)

View all registered agents:
- https://8004agents.ai/base/browse
- Filter by capabilities, reputation, activity

## Updates

- **2026-03-22:** research.aoxexchange.eth registered as Agent #35694
- **2026-03-21:** Successful test lead submission via autonomous webhook
- **2026-03-20:** Multi-agent coordination protocol established
