#!/bin/bash
# AOX Research Agent — Run Scanner

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# Load env
if [ -f ~/.openclaw/.env ]; then
    export $(grep -v '^#' ~/.openclaw/.env | xargs)
fi

# Set defaults
export RESEARCH_OUTPUT_DIR="${RESEARCH_OUTPUT_DIR:-$HOME/.openclaw/agents/research/output}"
export RESEARCH_LOG_DIR="${RESEARCH_LOG_DIR:-$HOME/.openclaw/agents/research/logs}"

# Create dirs
mkdir -p "$RESEARCH_OUTPUT_DIR" "$RESEARCH_LOG_DIR"

# Run scanner
echo "Starting AOX Research Agent scan..."
python3 "$SKILL_DIR/scanner.py"

echo ""
echo "Scan complete. Check:"
echo "  Output: $RESEARCH_OUTPUT_DIR"
echo "  Logs: $RESEARCH_LOG_DIR/scanner.log"
