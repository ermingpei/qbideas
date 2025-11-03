#!/bin/bash
set -e

# Install shared package dependencies if they don't exist
if [ -d "/shared" ] && [ -f "/shared/package.json" ]; then
    echo "Installing shared package dependencies..."
    cd /shared && npm install --silent
    cd /app
fi

# Execute the main command
exec "$@"

