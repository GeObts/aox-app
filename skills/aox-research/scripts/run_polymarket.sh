#!/bin/bash
# AOX Research Agent — Polymarket Scanner Daily Runner
# Run at 6am UTC via cron

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# Load env
if [ -f ~/.openclaw/.env ]; then
    export $(grep -v '^#' ~/.openclaw/.env | xargs)
fi

# Set defaults
export RESEARCH_OUTPUT_DIR="${RESEARCH_OUTPUT_DIR:-$HOME/.openclaw/agents/research/output/polymarket}"
export RESEARCH_LOG_DIR="${RESEARCH_LOG_DIR:-$HOME/.openclaw/agents/research/logs}"

# Create dirs
mkdir -p "$RESEARCH_OUTPUT_DIR" "$RESEARCH_LOG_DIR"

# Log start
echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting Polymarket scan..." >> "$RESEARCH_LOG_DIR/polymarket_cron.log"

# Run scanner
python3 "$SKILL_DIR/polymarket_scanner.py" 2>&1 | tee -a "$RESEARCH_LOG_DIR/polymarket_cron.log"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Scan complete" >> "$RESEARCH_LOG_DIR/polymarket_cron.log"
echo "" >> "$RESEARCH_LOG_DIR/polymarket_cron.log"
