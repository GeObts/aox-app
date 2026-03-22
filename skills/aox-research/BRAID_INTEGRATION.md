# BRAID Reasoning Integration

## What is BRAID?

BRAID = **B**ounded **R**easoning for **A**utonomous **I**nference and **D**ecisions

SERV's proprietary reasoning framework that claims:
- **70x cost reduction** vs standard LLMs
- **Improved accuracy** through structured reasoning
- **Better explainability** via step-by-step analysis

Research paper: https://arxiv.org/abs/2512.15959

---

## How It Helps AOX

Your current Polymarket scoring uses rule-based heuristics. BRAID adds:

| Current | With BRAID |
|---------|------------|
| Rule-based scoring | Structured reasoning |
| Fixed weights | Dynamic evaluation |
| Score only | Score + explanation |
| Static thresholds | Context-aware judgments |

---

## Setup Instructions

### Step 1: Get SERV API Key

1. Go to https://platform.openserv.ai
2. Log in with Google
3. Go to **Developer → Your Agents**
4. Click **Create Secret Key**
5. Copy the key

### Step 2: Add to Environment

```bash
# Add to ~/.openclaw/.env
SERV_API_KEY=your_serv_key_here
USE_BRAID_REASONING=true
```

### Step 3: Restart Polymarket Scanner

```bash
# Kill existing scanner
pkill -f polymarket_scanner.py

# Run with BRAID enabled
export USE_BRAID_REASONING=true
python3 ~/.openclaw/workspace/skills/aox-research/polymarket_scanner.py
```

---

## How Scoring Changes

**Without BRAID:**
```
Score = (win_rate_pts + volume_pts + activity_pts + ...)
       = 70-100 range
```

**With BRAID:**
```
Score = (existing_score * 0.6) + (braid_score * 0.4)
```

BRAID evaluates:
- **Consistency over time** — skill vs luck
- **Risk management** — position sizing discipline
- **Market selection** — does trader pick good markets?
- **Win rate quality** — sustainable vs fluke
- **Volume sustainability** — real activity vs wash trading

---

## Cost Comparison

| Service | Cost per Analysis | Accuracy |
|---------|------------------|----------|
| Venice (current) | ~$0.002 per call | Good |
| GPT-4 | ~$0.02 per call | Excellent |
| **BRAID** | ~$0.0003 per call | Excellent |

**Savings:** ~7x cheaper than Venice, ~70x cheaper than GPT-4

---

## Testing

Test BRAID integration:

```python
from braid_reasoning import BraidReasoningClient, USE_BRAID

client = BraidReasoningClient()
trader = {
    'win_rate': 75,
    'total_volume': 50000,
    'total_trades': 45,
    'roi': 35,
    'markets_count': 22
}

analysis = client.analyze_polymarket_trader(trader)
print(f"Score: {analysis.score}")
print(f"Confidence: {analysis.confidence}")
print(f"Reasoning: {analysis.reasoning}")
```

---

## Fallback Behavior

If BRAID API fails (no key, rate limit, etc.), the system:
1. Falls back to local analysis
2. Logs the error
3. Continues with existing scoring

**No disruption to your pipeline.**

---

## Future Enhancements

Once integrated, you could:
- Fine-tune BRAID weights for your use case
- Add custom reasoning patterns
- Compare BRAID vs human expert scores
- Publish results on the 70x claim

---

## Support

- **SERV docs:** https://docs.openserv.ai/docs/serv-reasoning
- **Research paper:** https://arxiv.org/abs/2512.15959
- **AOX:** Check ~/.openclag/logs for BRAID logs
