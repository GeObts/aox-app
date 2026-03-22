export default function SkillPage() {
  return (
    <div className="skill-page">
      <div className="container">
        <div className="header">
          <h1>AOX Skill — AI Agent Marketplace Access</h1>
          <div className="subtitle">Autonomous lead marketplace for Web3 opportunities</div>
        </div>

        <div className="metadata">
          <div className="metadata-row"><span className="metadata-key">name:</span><span className="metadata-value">aox</span></div>
          <div className="metadata-row"><span className="metadata-key">version:</span><span className="metadata-value">1.0.0</span></div>
          <div className="metadata-row"><span className="metadata-key">description:</span><span className="metadata-value">AI Agent Marketplace Access — Purchase verified Web3 business leads from AOX using x402 payments</span></div>
          <div className="metadata-row"><span className="metadata-key">homepage:</span><span className="metadata-value">https://aox.llc</span></div>
          <div className="metadata-row"><span className="metadata-key">metadata:</span><span className="metadata-value">{`{"category":"marketplace","chain":"base","protocol":"x402"}`}</span></div>
        </div>

        <div style={{ background: 'rgba(247,147,26,0.08)', border: '1px solid rgba(247,147,26,0.2)', borderRadius: '6px', padding: '12px 16px', marginBottom: '24px', fontFamily: 'var(--mono, monospace)', fontSize: '12px' }}>
          <strong>AI Agents:</strong> Install this skill from the raw markdown file at{' '}
          <a href="/skill.md" style={{ color: '#F7931A' }}>/skill.md</a>
          {' '}or{' '}
          <a href="/.well-known/skill.md" style={{ color: '#F7931A' }}>/.well-known/skill.md</a>
        </div>

        <p><strong>AOX (Agent Opportunity Exchange)</strong> — Autonomous lead marketplace for Web3 opportunities.</p>
        <p>This skill enables AI agents to discover, evaluate, and purchase verified business leads from the AOX marketplace using the x402 payment protocol.</p>

        <h2>What is AOX?</h2>
        <p>AOX is a fully autonomous multi-agent system that discovers, verifies, and monetizes Web3 business opportunities:</p>
        <ul>
          <li><strong>Research Agent</strong> — Discovers signals on Base blockchain and Web3 sources</li>
          <li><strong>Scoring Agent</strong> — Evaluates lead quality using private AI inference</li>
          <li><strong>Marketplace Agent</strong> — Lists verified opportunities for buyers</li>
          <li><strong>Settlement Agent</strong> — Handles payments, swaps, and USDC treasury</li>
        </ul>
        <p>All transactions settle on-chain. Every action is logged and verifiable.</p>

        <h2>x402 Endpoint</h2>
        <p><strong>Base URL:</strong> <code>http://3.142.118.148:3200</code></p>

        <h3>Browse Available Leads</h3>
        <pre><code>GET /leads</code></pre>
        <p><strong>Response:</strong> JSON array of all available leads with pricing, scores, and metadata.</p>

        <h3>Get Lead (with x402 payment)</h3>
        <pre><code>GET /lead?id={'{lead_id}'}</code></pre>
        <p><strong>Headers Required:</strong></p>
        <ul>
          <li><code>X-Payment-Token</code>: Payment authorization via x402</li>
          <li><code>Content-Type: application/json</code></li>
        </ul>
        <p><strong>Response:</strong> Lead contact data delivered as JSON after successful payment verification.</p>

        <h2>Payment Configuration</h2>
        <table>
          <thead>
            <tr><th>Parameter</th><th>Value</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Network</strong></td><td>Base Mainnet</td></tr>
            <tr><td><strong>Chain ID</strong></td><td>8453</td></tr>
            <tr><td><strong>Marketplace Wallet</strong></td><td><code>0x729174D90CA93139E3E9590993910B784eD32282</code></td></tr>
            <tr><td><strong>Protocol</strong></td><td>x402 (ERC-8004 compatible)</td></tr>
          </tbody>
        </table>

        <h3>Accepted Tokens</h3>
        <table>
          <thead>
            <tr><th>Token</th><th>Contract Address</th><th>Decimals</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>USDC</strong></td><td><code>0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913</code></td><td>6</td></tr>
            <tr><td><strong>USDT</strong></td><td><code>0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2</code></td><td>6</td></tr>
            <tr><td><strong>DAI</strong></td><td><code>0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb</code></td><td>18</td></tr>
            <tr><td><strong>ETH</strong></td><td>Native</td><td>18</td></tr>
            <tr><td><strong>WETH</strong></td><td><code>0x4200000000000000000000000000000000000006</code></td><td>18</td></tr>
            <tr><td><strong>$BNKR</strong></td><td><code>0x22af33fe49fd1fa80c7149773dde5890d3c76f3b</code></td><td>18</td></tr>
          </tbody>
        </table>

        <h2>Lead Pricing</h2>
        <p>Pricing is <strong>dynamic</strong> — displayed at time of purchase based on:</p>
        <ul>
          <li>Lead quality score (70-100)</li>
          <li>Category (DeFi, NFT, DAO, Infrastructure)</li>
          <li>Chain (Base, Ethereum, etc.)</li>
          <li>Contact richness (verified channels)</li>
        </ul>
        <p><strong>Typical Range:</strong> 20-100+ USDC equivalent</p>

        <h2>Agent Integration</h2>

        <h3>1. Discover Leads</h3>
        <pre><code>{`// Browse all available leads (public, no auth)
const res = await fetch('http://3.142.118.148:3200/leads');
const { listings } = await res.json();

// Filter by category or minimum score
const filtered = await fetch('http://3.142.118.148:3200/leads?category=defi&min_score=80');`}</code></pre>

        <h3>2. Get Quote</h3>
        <pre><code>{`// Get exact pricing for a specific lead
const res = await fetch('http://3.142.118.148:3200/quote?id=poly-0xc2e7800b5a&token=USDC');
// Returns: { lead_id, price, amount_raw, token_address, pay_to, expires_at }`}</code></pre>

        <h3>3. Request Lead (x402 Flow)</h3>
        <pre><code>{`// Request without payment → returns 402 with all accepted payment options
const res = await fetch('http://3.142.118.148:3200/lead?id=poly-0xc2e7800b5a');
// Status: 402 Payment Required
// Body includes paymentRequirements with all accepted tokens

// Request WITH payment → returns 200 with lead data
const payment = {
  accepted: {
    scheme: "exact",
    network: "eip155:8453",
    amount: "500000", // 0.50 USDC (6 decimals)
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    payTo: "0x729174D90CA93139E3E9590993910B784eD32282"
  },
  payload: {
    from: "0xYourWallet...",
    permit2Authorization: {
      deadline: Math.floor(Date.now() / 1000) + 300
    }
  }
};

const lead = await fetch('http://3.142.118.148:3200/lead?id=poly-0xc2e7800b5a', {
  headers: { 'X-Payment-Token': JSON.stringify(payment) }
});`}</code></pre>

        <h3>4. Receive Lead Data</h3>
        <pre><code>{`{
  "lead_id": "poly-0xc2e7800b5a",
  "title": "Top Polymarket Trader — 4M Volume",
  "category": "Polymarket Trader",
  "score": 94,
  "tier": "elite",
  "chain": "Base",
  "contacts": {
    "wallet_address": "0xc2e7...",
    "polymarket_profile": "https://polymarket.com/profile/0xc2e7..."
  },
  "metadata": { ... },
  "purchased_at": "2026-03-21T12:00:00Z",
  "transaction_hash": "0x..."
}`}</code></pre>

        <h2>ERC-8004 Identity</h2>
        <p>AOX agents are registered on-chain via ERC-8004:</p>
        <table>
          <thead>
            <tr><th>Agent</th><th>ENS</th><th>Wallet</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Marketplace</td><td><code>marketplace.aoxexchange.eth</code></td><td><code>0x7291...2282</code></td><td className="success">✅ Registered</td></tr>
            <tr><td>Banker</td><td><code>banker.aoxexchange.eth</code></td><td><code>0x7e7f...3373</code></td><td className="success">✅ Registered</td></tr>
            <tr><td>CEO (AOX)</td><td><code>ceo.aoxexchange.eth</code></td><td><code>0x0559...94D0</code></td><td className="success">✅ Active</td></tr>
          </tbody>
        </table>
        <p><strong>Registry:</strong> <code>0x8004a169fb4a3325136eb29fa0ceb6d2e539a432</code> (Base Mainnet)</p>

        <h2>Security & Trust</h2>
        <ul>
          <li>All payments verified on-chain before lead delivery</li>
          <li>Lead data encrypted in transit</li>
          <li>No lead details exposed before payment confirmation</li>
          <li>Full transaction logging for audit</li>
          <li>Rate limiting: 100 requests/minute per agent</li>
        </ul>

        <h2>Links</h2>
        <ul>
          <li><strong>Website:</strong> <a href="https://aox.llc">https://aox.llc</a></li>
          <li><strong>ENS:</strong> aoxexchange.eth</li>
          <li><strong>Base:</strong> aoxceo.base.eth</li>
          <li><strong>Twitter:</strong> @AOXexchange</li>
          <li><strong>GitHub:</strong> GeObts</li>
        </ul>

        <hr />
        <p><strong>Built for The Synthesis Ethereum Agent Hackathon 2026</strong></p>

        <div className="footer-skill">AOX — Autonomous Opportunity Exchange</div>
      </div>
    </div>
  );
}
