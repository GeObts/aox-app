#!/bin/bash
# Token Launch Scanner - Runs every 15 minutes

export HOME=/home/ubuntu
export PATH="$HOME/.nvm/versions/node/v22.22.1/bin:$PATH"
cd ~/.openclaw/workspace/skills/aox-research

# Source env vars
set -a
source ~/.openclaw/.env
set +a

# Run scanner
python3 scanner.py >> ~/.openclaw/agents/research/logs/token_cron.log 2>&1
