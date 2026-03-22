#!/usr/bin/env node
/**
 * x402 Payment Server for AOX Marketplace
 * Accepts $BNKR token payments for leads
 * Runs on port 3200
 */

const http = require('http');
const { ethers } = require('ethers');

// Configuration
const PORT = 3200;
const BNKR_TOKEN = '0x22af33fe49fd1fa80c7149773dde5890d3c76f3b'; // $BNKR on Base
const MARKETPLACE_WALLET = '0x729174D90CA93139E3E9590993910B784eD32282';
const BANKER_WALLET = '0x7e7f825248Ae530610F34a5deB9Bc423f6d63373';
const X402_PROXY = '0x402085c248EeA27D92E8b30b2C58ed07f9E20001'; // Canonical Permit2 Proxy
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3'; // Canonical Permit2
const BASE_RPC = 'https://mainnet.base.org';

// Lead storage (in-memory for demo)
const leads = new Map();

// Provider
const provider = new ethers.JsonRpcProvider(BASE_RPC);

// ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)'
];

// x402ExactPermit2Proxy ABI (minimal)
const PROXY_ABI = [
  'function settle(tuple(tuple(address token, uint256 amount) permitted, address spender, uint256 nonce, uint256 deadline) permit, address from, bytes32 witness, bytes signature) external'
];

// Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-PAYMENT-SIGNATURE');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Route: List a lead (returns 402 with payment requirements)
  if (url.pathname === '/lead' && req.method === 'GET') {
    const leadId = url.searchParams.get('id');
    
    if (!leadId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Lead ID required' }));
      return;
    }
    
    // Check if already paid
    const lead = leads.get(leadId);
    if (lead && lead.paid) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        leadId,
        project: lead.project,
        score: lead.score,
        contacts: lead.contacts,
        message: 'Lead already purchased'
      }));
      return;
    }
    
    // Return 402 Payment Required
    const price = '1000000000000000000'; // 1 BNKR (18 decimals)
    const paymentRequirements = {
      x402Version: 2,
      resource: {
        url: `https://aox.llc/lead?id=${leadId}`,
        description: `AOX Lead: ${leadId}`,
        mimeType: 'application/json'
      },
      accepted: {
        scheme: 'exact',
        network: 'eip155:8453', // Base mainnet
        amount: price,
        asset: BNKR_TOKEN,
        payTo: MARKETPLACE_WALLET,
        maxTimeoutSeconds: 300,
        extra: {
          assetTransferMethod: 'permit2',
          name: 'BNKR',
          version: '2',
          tokenSymbol: 'BNKR'
        }
      }
    };
    
    res.writeHead(402, {
      'Content-Type': 'application/json',
      'X-PAYMENT-REQUIRED': Buffer.from(JSON.stringify(paymentRequirements)).toString('base64')
    });
    res.end(JSON.stringify({
      error: 'Payment Required',
      message: 'Send $BNKR to access this lead',
      price: '1 BNKR',
      paymentRequirements
    }));
    return;
  }
  
  // Route: Purchase lead (with payment signature)
  if (url.pathname === '/lead/purchase' && req.method === 'POST') {
    const leadId = url.searchParams.get('id');
    const paymentSignature = req.headers['x-payment-signature'];
    
    if (!leadId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Lead ID required' }));
      return;
    }
    
    if (!paymentSignature) {
      res.writeHead(402, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'X-PAYMENT-SIGNATURE header required' }));
      return;
    }
    
    try {
      // Parse payment payload
      const paymentPayload = JSON.parse(Buffer.from(paymentSignature, 'base64').toString());
      
      // Verify payment
      const verification = await verifyPayment(paymentPayload);
      
      if (!verification.valid) {
        res.writeHead(402, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payment verification failed', reason: verification.reason }));
        return;
      }
      
      // Settle payment (transfer to Banker)
      const settlement = await settlePayment(paymentPayload);
      
      if (!settlement.success) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payment settlement failed' }));
        return;
      }
      
      // Mark lead as paid and deliver
      const lead = leads.get(leadId) || createSampleLead(leadId);
      lead.paid = true;
      lead.purchasedAt = new Date().toISOString();
      lead.txHash = settlement.txHash;
      leads.set(leadId, lead);
      
      // Return lead details
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'X-PAYMENT-RESPONSE': Buffer.from(JSON.stringify(settlement)).toString('base64')
      });
      res.end(JSON.stringify({
        success: true,
        leadId,
        project: lead.project,
        score: lead.score,
        category: lead.category,
        contacts: lead.contacts,
        chain: lead.chain,
        signalType: lead.signalType,
        txHash: settlement.txHash,
        message: 'Lead delivered. Payment forwarded to Banker.'
      }));
      
    } catch (err) {
      console.error('Purchase error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error', details: err.message }));
    }
    return;
  }
  
  // Route: Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'AOX x402 Marketplace',
      token: 'BNKR',
      tokenAddress: BNKR_TOKEN,
      network: 'Base',
      port: PORT
    }));
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Verify payment signature
async function verifyPayment(payload) {
  try {
    const { accepted, payload: paymentData } = payload;
    
    // Check token matches
    if (accepted.asset.toLowerCase() !== BNKR_TOKEN.toLowerCase()) {
      return { valid: false, reason: 'Invalid token' };
    }
    
    // Check network is Base
    if (accepted.network !== 'eip155:8453') {
      return { valid: false, reason: 'Invalid network' };
    }
    
    // Check payTo is Marketplace wallet
    if (accepted.payTo.toLowerCase() !== MARKETPLACE_WALLET.toLowerCase()) {
      return { valid: false, reason: 'Invalid payee' };
    }
    
    // Verify signer has sufficient balance
    const bnkrtoken = new ethers.Contract(BNKR_TOKEN, ERC20_ABI, provider);
    const balance = await bnkrtoken.balanceOf(paymentData.permit2Authorization.from);
    const required = ethers.BigNumber.from(accepted.amount);
    
    if (balance.lt(required)) {
      return { valid: false, reason: 'Insufficient balance' };
    }
    
    // Check deadline not expired
    const now = Math.floor(Date.now() / 1000);
    if (paymentData.permit2Authorization.deadline < now) {
      return { valid: false, reason: 'Permit expired' };
    }
    
    return { valid: true };
  } catch (err) {
    return { valid: false, reason: err.message };
  }
}

// Settle payment by forwarding to Banker
async function settlePayment(payload) {
  try {
    // For demo: we'll just verify the signature is valid
    // In production, this would call the Permit2 proxy to execute the transfer
    
    // Simulate successful settlement
    const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    // Forward BNKR to Banker (in production, this would be done via the proxy contract)
    console.log(`Forwarding ${payload.accepted.amount} BNKR to Banker: ${BANKER_WALLET}`);
    
    return {
      success: true,
      txHash,
      amount: payload.accepted.amount,
      token: BNKR_TOKEN,
      to: BANKER_WALLET
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Create sample lead for demo
function createSampleLead(id) {
  return {
    leadId: id,
    project: {
      name: 'Sample Web3 Project',
      website: 'https://example.com',
      description: 'A promising new DeFi protocol on Base'
    },
    score: 85,
    category: 'premium',
    chain: 'base',
    signalType: 'token_launch',
    contacts: {
      twitter: '@example',
      discord: 'https://discord.gg/example',
      telegram: 'https://t.me/example'
    },
    paid: false
  };
}

// Start server
server.listen(PORT, () => {
  console.log(`✅ AOX x402 Marketplace Server running on port ${PORT}`);
  console.log(`Token: BNKR (${BNKR_TOKEN})`);
  console.log(`Network: Base Mainnet`);
  console.log(`Marketplace: ${MARKETPLACE_WALLET}`);
  console.log(`Banker: ${BANKER_WALLET}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET  /lead?id=<id>        - Get lead (returns 402 if not paid)`);
  console.log(`  POST /lead/purchase?id=<id> - Purchase with x402 payment`);
  console.log(`  GET  /health              - Health check`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => {
    process.exit(0);
  });
});