#!/bin/bash

# Direct Prisma setup with explicit environment variables
# This script runs Prisma commands with direct environment variable setting

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

# Setup Prisma with direct environment variables
setup_prisma() {
    print_status "🔧 Setting up Prisma with direct environment variables..."
    
    # Detect docker compose command
    if ssh $REMOTE_USER@$REMOTE_HOST "docker compose version" 2>/dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    else
        DOCKER_COMPOSE_CMD="docker-compose"
    fi
    print_success "Using: $DOCKER_COMPOSE_CMD"
    
    # Ensure infrastructure services are running
    print_status "Ensuring infrastructure services are running..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD up -d postgres redis minio mailhog"
    sleep 15
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    for i in {1..30}; do
        if ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U qbideas -d qbideas" 2>/dev/null; then
            print_success "PostgreSQL is ready"
            break
        fi
        
        if [ $i -eq 30 ]; then
            print_error "PostgreSQL failed to start"
            exit 1
        fi
        
        sleep 2
    done
    
    # Run Prisma commands with explicit DATABASE_URL
    print_status "Running Prisma generate with explicit DATABASE_URL..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && DATABASE_URL='postgresql://qbideas:dev_password@localhost:5432/qbideas' npx prisma generate"
    print_success "Prisma client generated"
    
    # Run migrations with explicit DATABASE_URL
    print_status "Running database migrations with explicit DATABASE_URL..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && DATABASE_URL='postgresql://qbidea:dev_password@localhost:5432/qbidea' npx prisma migrate dev --name init"
    print_success "Database migrations completed"
    
    # Seed database with explicit DATABASE_URL
    print_status "Seeding database with explicit DATABASE_URL..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && DATABASE_URL='postgresql://qbidea:dev_password@localhost:5432/qbidea' npx tsx src/scripts/seed.ts"
    print_success "Database seeded successfully"
    
    # Create a proper .env file for the application services
    print_status "Creating .env file for application services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && cat > .env << 'EOF'
# qbidea Environment Variables
OPENAI_API_KEY=sk-placeholder-add-your-key-here
ANTHROPIC_API_KEY=sk-ant-placeholder-add-your-key-here
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
JWT_SECRET=dev-jwt-secret-12345-6789
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
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12
SESSION_SECRET=session-secret-12345
LOG_LEVEL=info
ENABLE_SWAGGER=true
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
SMTP_HOST=mailhog
SMTP_PORT=1025
FROM_EMAIL=noreply@qbidea.local
EOF"
    print_success "Environment file created"
    
    # Start application services
    print_status "Starting application services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD up -d api-service auth-service"
    print_success "Application services started"
    
    # Wait for API to be ready
    print_status "Waiting for API to be ready..."
    sleep 20
    
    # Test API health
    print_status "Testing API health..."
    for i in {1..15}; do
        if ssh $REMOTE_USER@$REMOTE_HOST "curl -f http://localhost:3000/health" 2>/dev/null; then
            print_success "API is healthy"
            break
        fi
        
        if [ $i -eq 15 ]; then
            print_warning "API health check failed - showing logs..."
            ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD logs api-service | tail -30"
        fi
        
        sleep 3
    done
    
    # Test API endpoints
    print_status "Testing API endpoints..."
    if ssh $REMOTE_USER@$REMOTE_HOST "curl -f http://localhost:3000/api/ideas" 2>/dev/null; then
        print_success "Ideas endpoint is working"
    else
        print_warning "Ideas endpoint test failed"
    fi
    
    # Configure firewall
    print_status "Configuring firewall..."
    ssh -t $REMOTE_USER@$REMOTE_HOST "sudo firewall-cmd --permanent --add-port=3000-3003/tcp --add-port=8000/tcp --add-port=8025/tcp --add-port=9001/tcp && sudo firewall-cmd --reload" 2>/dev/null || print_warning "Firewall configuration may have failed"
    
    # Show final status
    print_status "Final service status:"
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD ps"
    
    print_success "🎉 qbidea is now running!"
    echo ""
    echo "📱 Application URLs:"
    echo "   API:          http://$REMOTE_HOST:3000"
    echo "   API Health:   http://$REMOTE_HOST:3000/health"
    echo "   API Docs:     http://$REMOTE_HOST:3000/docs"
    echo "   Ideas API:    http://$REMOTE_HOST:3000/api/ideas"
    echo "   Auth Service: http://$REMOTE_HOST:3001"
    echo "   Mailhog:      http://$REMOTE_HOST:8025"
    echo "   MinIO:        http://$REMOTE_HOST:9001"
    echo ""
    echo "🔑 Test Accounts:"
    echo "   admin@qbidea.com / admin123"
    echo "   john@example.com / password123"
    echo "   sarah@example.com / password123"
    echo ""
    echo "🧪 Test Commands:"
    echo "   curl http://$REMOTE_HOST:3000/health"
    echo "   curl http://$REMOTE_HOST:3000/api/ideas"
    echo ""
    echo "📋 Management Commands:"
    echo "   SSH:          ssh $REMOTE_USER@$REMOTE_HOST"
    echo "   View logs:    ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD logs -f'"
    echo "   Restart:      ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD restart'"
    echo "   Stop all:     ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD down'"
    echo ""
    print_warning "⚠️  To enable AI features, add your real API keys:"
    print_warning "ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && nano .env'"
    print_warning "Add: OPENAI_API_KEY and ANTHROPIC_API_KEY"
    print_warning "Then restart: ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD restart'"
}

setup_prisma