#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

# Check and create virtual environment if not present
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

# Create default .env if missing
if [ ! -f ".env" ]; then
    echo "Creating .env configuration..."
    cp .env.example .env 2>/dev/null || true
fi

# Install dependencies
pip install -r requirements.txt --quiet

echo "=================================================="
echo " Starting UdhaarAI Production Full-Stack Server"
echo " Access at: http://127.0.0.1:5000"
echo "=================================================="

python backend/app.py

