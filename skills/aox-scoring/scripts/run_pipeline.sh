#!/bin/bash
# AOX Complete Scoring Pipeline
# Research → Normalization → Scoring → Policy → Marketplace

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment
if [ -f ~/.openclaw/.env ]; then
    export $(grep -v '^#' ~/.openclaw/.env | xargs)
fi

# Set all paths
export RESEARCH_OUTPUT_DIR="${RESEARCH_OUTPUT_DIR:-$HOME/.openclaw/agents/research/output}"
export NORMALIZATION_OUTPUT_DIR="${NORMALIZATION_OUTPUT_DIR:-$HOME/.openclaw/agents/normalization/output}"
export NORMALIZATION_REJECTED_DIR="${NORMALIZATION_REJECTED_DIR:-$HOME/.openclaw/agents/normalization/rejected}"
export SCORING_OUTPUT_DIR="${SCORING_OUTPUT_DIR:-$HOME/.openclaw/agents/scoring/output}"
export SCORING_REJECTED_DIR="${SCORING_REJECTED_DIR:-$HOME/.openclaw/agents/scoring/rejected}"
export SCORING_REVIEW_DIR="${SCORING_REVIEW_DIR:-$HOME/.openclaw/agents/scoring/review}"
export POLICY_OUTPUT_DIR="${POLICY_OUTPUT_DIR:-$HOME/.openclaw/agents/policy/output}"
export MARKETPLACE_INPUT_DIR="${MARKETPLACE_INPUT_DIR:-$HOME/.openclaw/agents/marketplace/input}"

# Create all directories
mkdir -p "$NORMALIZATION_OUTPUT_DIR" "$NORMALIZATION_REJECTED_DIR"
mkdir -p "$SCORING_OUTPUT_DIR" "$SCORING_REJECTED_DIR" "$SCORING_REVIEW_DIR"
mkdir -p "$POLICY_OUTPUT_DIR" "$MARKETPLACE_INPUT_DIR"

echo "========================================"
echo "AOX Complete Pipeline"
echo "========================================"
echo ""

# Step 1: Normalization
echo "[1/4] Running Normalization Layer..."
python3 "$SKILL_DIR/normalizer.py"
echo ""

# Step 2: Scoring (Venice AI)
echo "[2/4] Running Scoring Agent (Venice AI)..."
python3 "$SKILL_DIR/scorer.py"
echo ""

# Step 3: Policy Gate
echo "[3/4] Running Policy Gate..."
python3 "$SKILL_DIR/policy_gate.py"
echo ""

# Step 4: Summary
echo "[4/4] Pipeline Summary"
echo "----------------------------------------"
echo "Research output: $(ls -1 "$RESEARCH_OUTPUT_DIR"/*.json 2>/dev/null | wc -l) leads"
echo "Normalized: $(ls -1 "$NORMALIZATION_OUTPUT_DIR"/*_normalized.json 2>/dev/null | wc -l) leads"
echo "Scored: $(ls -1 "$SCORING_OUTPUT_DIR"/*_scored.json 2>/dev/null | wc -l) leads"
echo "Review queue: $(ls -1 "$SCORING_REVIEW_DIR"/*_review.json 2>/dev/null | wc -l) leads"
echo "Rejected: $(ls -1 "$SCORING_REJECTED_DIR"/*_rejected.json 2>/dev/null | wc -l) leads"
echo "Marketplace ready: $(ls -1 "$MARKETPLACE_INPUT_DIR"/*_public.json 2>/dev/null | wc -l) leads"
echo "========================================"

