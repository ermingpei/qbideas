#!/bin/bash
# Transfer Script for qbideas - Run on OLD Mac
# This script prepares the project for migration to a new Mac

set -e

echo "🚀 qbideas Migration Package Creator"
echo "====================================="
echo ""

# Get local IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "unknown")

# Create migration directory
MIGRATION_DIR="qbideas-migration"
rm -rf "$MIGRATION_DIR"
mkdir -p "$MIGRATION_DIR"

echo "📦 Step 1: Exporting database..."
if docker ps | grep -q qbideas-postgres; then
    docker exec qbideas-postgres pg_dump -U qbideas qbideas > "$MIGRATION_DIR/qbideas_backup.sql"
    echo "   ✅ Database exported"
else
    echo "   ⚠️  PostgreSQL container not running - skipping database export"
fi

echo ""
echo "📦 Step 2: Copying environment files..."
if [ -f ".env" ]; then
    cp .env "$MIGRATION_DIR/"
    echo "   ✅ Copied .env"
else
    echo "   ⚠️  No .env file found"
fi

if [ -f "frontend/.env.local" ]; then
    cp frontend/.env.local "$MIGRATION_DIR/env.local.frontend"
    echo "   ✅ Copied frontend/.env.local"
else
    echo "   ⚠️  No frontend/.env.local file found"
fi

echo ""
echo "📦 Step 3: Creating migration archive..."
tar czf qbideas-migration.tar.gz "$MIGRATION_DIR"
SIZE=$(du -h qbideas-migration.tar.gz | cut -f1)
echo "   ✅ Archive created: qbideas-migration.tar.gz ($SIZE)"

echo ""
echo "📦 Step 4: Creating setup script for new Mac..."
cat > "$MIGRATION_DIR/setup-on-new-mac.sh" << 'EOF'
#!/bin/bash
# Run this script on the NEW Mac after downloading the migration package

set -e

echo "🚀 Setting up qbideas on new Mac..."
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed. Install from https://www.docker.com/products/docker-desktop/"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not installed. Install from https://nodejs.org/"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git not installed"; exit 1; }
echo "   ✅ All prerequisites installed"

# Get repository URL
echo ""
read -p "📥 Enter Git repository URL: " REPO_URL

# Clone repository
echo "📥 Cloning repository..."
git clone "$REPO_URL" qbideas
cd qbideas

# Restore environment files
echo "⚙️  Restoring environment files..."
if [ -f "../.env" ]; then
    cp ../.env .
    echo "   ✅ Restored .env"
fi
if [ -f "../env.local.frontend" ]; then
    cp ../env.local.frontend frontend/.env.local
    echo "   ✅ Restored frontend/.env.local"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start services
echo "🐳 Starting Docker services..."
npm run dev

echo "⏳ Waiting 30 seconds for services to initialize..."
sleep 30

# Restore database
if [ -f "../qbideas_backup.sql" ]; then
    echo "💾 Restoring database..."
    docker cp ../qbideas_backup.sql qbideas-postgres:/tmp/
    docker exec qbideas-postgres psql -U qbideas -d qbideas -f /tmp/qbideas_backup.sql
    echo "   ✅ Database restored"
else
    echo "🌱 Running migrations and seeding..."
    npm run migrate
    npm run seed:ideas
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Start frontend: npm run dev:frontend"
echo "   2. Open browser: http://localhost:3002"
echo "   3. API docs: http://localhost:3000/docs"
echo ""
echo "📊 Service URLs:"
echo "   Frontend:  http://localhost:3002"
echo "   API:       http://localhost:3000"
echo "   Mailhog:   http://localhost:8025"
echo "   MinIO:     http://localhost:9001"
EOF

chmod +x "$MIGRATION_DIR/setup-on-new-mac.sh"
echo "   ✅ Setup script created"

echo ""
echo "✅ Migration package ready!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Package: qbideas-migration.tar.gz ($SIZE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Transfer Options:"
echo ""
echo "Option 1: HTTP Server (Same Network)"
echo "   1. On this Mac, run:"
echo "      python3 -m http.server 8080"
echo ""
echo "   2. On new Mac, run:"
echo "      curl -O http://$LOCAL_IP:8080/qbideas-migration.tar.gz"
echo "      tar xzf qbideas-migration.tar.gz"
echo "      cd qbideas-migration"
echo "      ./setup-on-new-mac.sh"
echo ""
echo "Option 2: SCP (if SSH enabled)"
echo "   scp qbideas-migration.tar.gz user@new-mac-ip:~/"
echo ""
echo "Option 3: USB Drive"
echo "   Copy qbideas-migration.tar.gz to USB drive"
echo ""
echo "Option 4: Cloud Storage"
echo "   Upload to Dropbox/Google Drive/etc."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Start HTTP server now? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🌐 Starting HTTP server on port 8080..."
    echo "   Your IP: $LOCAL_IP"
    echo "   Press Ctrl+C to stop"
    echo ""
    python3 -m http.server 8080
fi
