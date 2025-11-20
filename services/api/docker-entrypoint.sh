#!/bin/bash
set -e

# Install shared package dependencies and build if they don't exist
if [ -d "/shared" ] && [ -f "/shared/package.json" ]; then
    echo "Installing shared package dependencies..."
    cd /shared && npm install --silent
    echo "Building shared package..."
    npm run build
    cd /app
    echo "Installing shared package into API..."
    npm install /shared --silent
fi

# Execute the main command
exec "$@"

