#!/bin/bash

# Quick deploy qbidea to AlmaLinux with minimal setup
# This script automates the entire deployment process

set -e

# Configuration
REMOTE_HOST="206.12.95.60"
REMOTE_USER="almalinux"
REMOTE_DIR="/home/almalinux/qbidea"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Deploy and run everything
deploy_and_run() {
    print_status "🚀 Starting quick deployment to AlmaLinux..."
    
    # Test connection
    print_status "Testing SSH connection..."
    ssh -o ConnectTimeout=10 $REMOTE_USER@$REMOTE_HOST exit
    print_success "SSH connection successful"
    
    # Create directory and copy files
    print_status "Copying project files..."
    ssh $REMOTE_USER@$REMOTE_HOST "rm -rf $REMOTE_DIR && mkdir -p $REMOTE_DIR"
    
    tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='build' --exclude='.next' --exclude='logs' --exclude='*.log' -czf /tmp/qbidea.tar.gz .
    scp /tmp/qbidea.tar.gz $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && tar -xzf qbidea.tar.gz && rm qbidea.tar.gz"
    rm /tmp/qbidea.tar.gz
    print_success "Files copied"
    
    # Install Docker if not present
    print_status "Checking Docker installation..."
    if ! ssh $REMOTE_USER@$REMOTE_HOST "docker --version" 2>/dev/null; then
        print_status "Installing Docker..."
        ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && chmod +x scripts/install-docker-almalinux.sh"
        ssh -t $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && sudo ./scripts/install-docker-almalinux.sh"
        print_success "Docker installed"
    else
        print_success "Docker already installed"
    fi
    
    # Create basic .env file with placeholder values
    print_status "Setting up environment..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && cat > .env << 'EOF'
# qbidea Environment Variables
OPENAI_API_KEY=sk-placeholder-add-your-key-here
ANTHROPIC_API_KEY=sk-ant-placeholder-add-your-key-here
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
JWT_SECRET=dev-jwt-secret-$(date +%s)-$(shuf -i 1000-9999 -n 1)
NODE_ENV=development
API_PORT=3000
AUTH_PORT=3001
AI_PIPELINE_PORT=8000
FRONTEND_PORT=3002
NEXT_PUBLIC_API_URL=http://$REMOTE_HOST:3000
NEXT_PUBLIC_AUTH_URL=http://$REMOTE_HOST:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
DATABASE_URL=postgresql://qbidea:dev_password@postgres:5432/qbidea
REDIS_URL=redis://:dev_password@redis:6379
CORS_ORIGIN=http://$REMOTE_HOST:3002
EOF"
    print_success "Environment configured"
    
    # Install Node.js if not present
    print_status "Checking Node.js installation..."
    if ! ssh $REMOTE_USER@$REMOTE_HOST "node --version" 2>/dev/null; then
        print_status "Installing Node.js..."
        ssh -t $REMOTE_USER@$REMOTE_HOST "curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - && sudo dnf install -y nodejs"
        print_success "Node.js installed"
    else
        print_success "Node.js already installed"
    fi
    
    # Install dependencies and build
    print_status "Installing dependencies..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && npm install"
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/shared && npm install && npm run build"
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npm install"
    print_success "Dependencies installed"
    
    # Start infrastructure services
    print_status "Starting infrastructure services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker-compose up -d postgres redis minio mailhog"
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 15
    
    # Run database setup
    print_status "Setting up database..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npx prisma generate && npx prisma migrate dev --name init"
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npx tsx src/scripts/seed.ts"
    print_success "Database setup complete"
    
    # Start all services
    print_status "Starting all services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker-compose up -d"
    print_success "All services started"
    
    # Configure firewall
    print_status "Configuring firewall..."
    ssh -t $REMOTE_USER@$REMOTE_HOST "sudo firewall-cmd --permanent --add-port=3000-3003/tcp --add-port=8000/tcp --add-port=8025/tcp --add-port=9001/tcp && sudo firewall-cmd --reload" 2>/dev/null || print_warning "Firewall configuration may have failed - you might need to configure it manually"
    
    print_success "🎉 Deployment completed!"
    echo ""
    echo "📱 Application URLs:"
    echo "   Frontend:     http://$REMOTE_HOST:3002"
    echo "   API:          http://$REMOTE_HOST:3000"
    echo "   API Docs:     http://$REMOTE_HOST:3000/docs"
    echo "   Mailhog:      http://$REMOTE_HOST:8025"
    echo ""
    echo "🔑 Test Accounts:"
    echo "   admin@qbidea.com / admin123"
    echo "   john@example.com / password123"
    echo ""
    print_warning "⚠️  Important: Add your real API keys to the .env file:"
    print_warning "ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && nano .env'"
    print_warning "Then restart: ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose restart'"
}

# Make scripts executable and run
chmod +x scripts/install-docker-almalinux.sh
chmod +x scripts/setup.sh

deploy_and_run