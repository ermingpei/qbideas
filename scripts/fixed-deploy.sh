#!/bin/bash

# Fixed deployment script for qbideas on AlmaLinux
# Handles npm workspace issues and ensures proper setup

set -e

# Configuration
REMOTE_HOST="206.12.95.60"
REMOTE_USER="almalinux"
REMOTE_DIR="/home/almalinux/qbideas"

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
    print_status "🚀 Starting fixed deployment to AlmaLinux..."
    
    # Test connection
    print_status "Testing SSH connection..."
    ssh -o ConnectTimeout=10 $REMOTE_USER@$REMOTE_HOST exit
    print_success "SSH connection successful"
    
    # Create directory and copy files
    print_status "Copying project files..."
    ssh $REMOTE_USER@$REMOTE_HOST "rm -rf $REMOTE_DIR && mkdir -p $REMOTE_DIR"
    
    tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='build' --exclude='.next' --exclude='logs' --exclude='*.log' -czf /tmp/qbideas.tar.gz .
    scp /tmp/qbideas.tar.gz $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && tar -xzf qbideas.tar.gz && rm qbideas.tar.gz"
    rm /tmp/qbideas.tar.gz
    print_success "Files copied"
    
    # Update npm to latest version
    print_status "Updating npm to latest version..."
    ssh $REMOTE_USER@$REMOTE_HOST "sudo npm install -g npm@latest"
    print_success "npm updated"
    
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
# qbideas Environment Variables
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
DATABASE_URL=postgresql://qbideas:dev_password@postgres:5432/qbideas
REDIS_URL=redis://:dev_password@redis:6379
CORS_ORIGIN=http://$REMOTE_HOST:3002
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
SESSION_SECRET=session-secret-$(date +%s)
LOG_LEVEL=info
ENABLE_SWAGGER=true
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
SMTP_HOST=mailhog
SMTP_PORT=1025
FROM_EMAIL=noreply@qbideas.local
EOF"
    print_success "Environment configured"
    
    # Install dependencies in correct order
    print_status "Installing shared package dependencies..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/shared && npm install"
    
    print_status "Building shared package..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/shared && npm run build"
    
    print_status "Installing API service dependencies..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npm install"
    
    print_success "Dependencies installed"
    
    # Start infrastructure services
    print_status "Starting infrastructure services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker-compose up -d postgres redis minio mailhog"
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 20
    
    # Check if services are ready
    print_status "Checking service health..."
    for i in {1..30}; do
        if ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker-compose exec -T postgres pg_isready -U qbideas -d qbideas" 2>/dev/null && \
           ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker-compose exec -T redis redis-cli --no-auth-warning -a dev_password ping" 2>/dev/null; then
            print_success "Infrastructure services are ready"
            break
        fi
        
        if [ $i -eq 30 ]; then
            print_error "Services failed to start within timeout"
            exit 1
        fi
        
        sleep 2
    done
    
    # Run database setup
    print_status "Setting up database..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npx prisma generate"
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npx prisma migrate dev --name init"
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npx tsx src/scripts/seed.ts"
    print_success "Database setup complete"
    
    # Start application services
    print_status "Starting application services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker-compose up -d api-service auth-service ai-pipeline celery-worker"
    print_success "Application services started"
    
    # Configure firewall
    print_status "Configuring firewall..."
    ssh -t $REMOTE_USER@$REMOTE_HOST "sudo firewall-cmd --permanent --add-port=3000-3003/tcp --add-port=8000/tcp --add-port=8025/tcp --add-port=9001/tcp && sudo firewall-cmd --reload" 2>/dev/null || print_warning "Firewall configuration may have failed - you might need to configure it manually"
    
    # Wait a bit for services to fully start
    print_status "Waiting for services to fully initialize..."
    sleep 10
    
    # Test API health
    print_status "Testing API health..."
    if ssh $REMOTE_USER@$REMOTE_HOST "curl -f http://localhost:3000/health" 2>/dev/null; then
        print_success "API is healthy"
    else
        print_warning "API health check failed - services may still be starting"
    fi
    
    print_success "🎉 Deployment completed!"
    echo ""
    echo "📱 Application URLs:"
    echo "   Frontend:     http://$REMOTE_HOST:3002 (will be available when frontend is built)"
    echo "   API:          http://$REMOTE_HOST:3000"
    echo "   API Docs:     http://$REMOTE_HOST:3000/docs"
    echo "   Auth Service: http://$REMOTE_HOST:3001"
    echo "   AI Pipeline:  http://$REMOTE_HOST:8000"
    echo "   Mailhog:      http://$REMOTE_HOST:8025"
    echo "   MinIO:        http://$REMOTE_HOST:9001"
    echo ""
    echo "🔑 Test Accounts:"
    echo "   admin@qbideas.com / admin123"
    echo "   john@example.com / password123"
    echo "   sarah@example.com / password123"
    echo ""
    echo "📋 Management Commands:"
    echo "   View logs:    ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose logs -f'"
    echo "   Restart:      ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose restart'"
    echo "   Stop all:     ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose down'"
    echo ""
    print_warning "⚠️  Important: Add your real API keys to the .env file:"
    print_warning "ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && nano .env'"
    print_warning "Then restart: ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose restart'"
}

# Make scripts executable and run
chmod +x scripts/install-docker-almalinux.sh
chmod +x scripts/setup.sh

deploy_and_run