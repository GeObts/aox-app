#!/bin/bash
# Watch for new leads and trigger marketplace agent

INPUT_DIR="$HOME/.openclaw/agents/marketplace/input"
MARKETPLACE_DIR="$HOME/.openclaw/workspace/skills/aox-marketplace"

echo "Starting AOX Marketplace file watcher..."
echo "Watching: $INPUT_DIR"
echo ""

# Install inotify-tools if needed
if ! command -v inotifywait &> /dev/null; then
    echo "Installing inotify-tools..."
    sudo apt-get update && sudo apt-get install -y inotify-tools
fi

# Function to process new files
process_file() {
    local file="$1"
    echo "[$$(date -Iseconds)] New file detected: $(basename $file)"
    
    # Run marketplace agent
    cd "$MARKETPLACE_DIR" && python3 marketplace_agent.py --add-leads
    
    # Notify API server to reload (optional - file is read on each request)
    echo "[$$(date -Iseconds)] Processed"
}

# Watch for new files
inotifywait -m "$INPUT_DIR" -e create -e moved_to --format '%f' |
while read filename; do
    if [[ "$filename" == *.json ]]; then
        process_file "$INPUT_DIR/$filename"
    fi
done
