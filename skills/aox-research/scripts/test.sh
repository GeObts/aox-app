#!/bin/bash
# AOX Research Agent — Test API Connections

echo "Testing AOX Research Agent APIs..."
echo ""

# Check env vars
if [ -z "$BASESCAN_API_KEY" ]; then
    echo "❌ BASESCAN_API_KEY not set"
    echo "   Get free key: https://basescan.org/apis"
    exit 1
else
    echo "✓ BASESCAN_API_KEY set"
fi

# Test BaseScan API
echo ""
echo "Testing BaseScan API..."
RESPONSE=$(curl -s "https://api.basescan.org/api?module=stats&action=ethprice&apikey=$BASESCAN_API_KEY")
if echo "$RESPONSE" | grep -q '"status":"1"'; then
    echo "✓ BaseScan API working"
    PRICE=$(echo "$RESPONSE" | grep -o '"ethusd":"[^"]*"' | cut -d'"' -f4)
    echo "   ETH price: \$$PRICE"
else
    echo "❌ BaseScan API error"
    echo "   Response: $RESPONSE"
fi

# Test DexScreener API (no key needed)
echo ""
echo "Testing DexScreener API..."
# Test with USDC on Base
RESPONSE=$(curl -s "https://api.dexscreener.com/latest/dex/tokens/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" | head -c 100)
if echo "$RESPONSE" | grep -q "pairs"; then
    echo "✓ DexScreener API working"
else
    echo "⚠ DexScreener API may be rate limited"
fi

echo ""
echo "Test complete."
