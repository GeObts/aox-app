#!/bin/bash
# Polymarket Trader Scanner - Runs daily at 6am UTC

export HOME=/home/ubuntu
export PATH="$HOME/.nvm/versions/node/v22.22.1/bin:$PATH"
cd ~/.openclaw/workspace/skills/aox-research

# Source env vars
set -a
source ~/.openclaw/.env
set +a

# Run scanner
python3 polymarket_scanner.py >> ~/.openclaw/agents/research/logs/polymarket_cron.log 2>&1
