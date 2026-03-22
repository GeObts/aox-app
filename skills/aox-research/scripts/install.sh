#!/bin/bash
# AOX Research Agent — Install Dependencies

echo "Installing AOX Research Agent..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found. Install with: sudo apt install python3 python3-pip"
    exit 1
fi

# Install Python dependencies
pip3 install requests --user

echo "Dependencies installed."
echo ""
echo "Next steps:"
echo "1. Get BaseScan API key: https://basescan.org/apis"
echo "2. Add to ~/.openclaw/.env: BASESCAN_API_KEY=your_key"
echo "3. Test: bash ~/.openclaw/workspace/skills/aox-research/scripts/test.sh"
echo "4. Run: bash ~/.openclaw/workspace/skills/aox-research/scripts/run.sh"
