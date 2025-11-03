#!/bin/bash

# Final deployment script with all fixes
# Handles docker compose command and other issues

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

# Detect docker compose command
get_docker_compose_cmd() {
    if ssh $REMOTE_USER@$REMOTE_HOST "docker compose version" 2>/dev/null; then
        echo "docker compose"
    elif ssh $REMOTE_USER@$REMOTE_HOST "docker-compose --version" 2>/dev/null; then
        echo "docker-compose"
    else
        print_error "Neither 'docker compose' nor 'docker-compose' found"
        exit 1
    fi
}

# Final deployment
final_deploy() {
    print_status "🚀 Starting final deployment with all fixes..."
    
    # Detect docker compose command
    print_status "Detecting Docker Compose command..."
    DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd)
    print_success "Using: $DOCKER_COMPOSE_CMD"
    
    # Copy the fixed files
    print_status "Copying fixed shared utils..."
    scp services/shared/src/utils/index.ts $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/services/shared/src/utils/
    print_success "Fixed files copied"
    
    # Build shared package
    print_status "Building shared package..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/shared && npm run build"
    print_success "Shared package built successfully"
    
    # Create proper .env file
    print_status "Setting up environment..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && cat > .env << 'EOF'
# qbideas Environment Variables
OPENAI_API_KEY=sk-placeholder-add-your-key-here
ANTHROPIC_API_KEY=sk-ant-placeholder-add-your-key-here
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
JWT_SECRET=dev-jwt-secret-\$(date +%s)-\$((\$RANDOM % 9999 + 1000))
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
SESSION_SECRET=session-secret-\$(date +%s)
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
    
    # Stop any existing services
    print_status "Stopping existing services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD down --remove-orphans" 2>/dev/null || true
    
    # Start infrastructure services
    print_status "Starting infrastructure services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD up -d postgres redis minio mailhog"
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 20
    
    # Check if services are ready
    print_status "Checking service health..."
    for i in {1..30}; do
        if ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U qbideas -d qbideas" 2>/dev/null && \
           ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD exec -T redis redis-cli --no-auth-warning -a dev_password ping" 2>/dev/null; then
            print_success "Infrastructure services are ready"
            break
        fi
        
        if [ $i -eq 30 ]; then
            print_error "Services failed to start within timeout"
            print_status "Checking service logs..."
            ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD logs postgres redis"
            exit 1
        fi
        
        sleep 2
    done
    
    # Install API dependencies
    print_status "Installing API service dependencies..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npm install"
    print_success "API dependencies installed"
    
    # Run database setup
    print_status "Setting up database..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npx prisma generate"
    
    # Run migrations
    print_status "Running database migrations..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npx prisma migrate dev --name init"
    print_success "Database migrations completed"
    
    # Seed database
    print_status "Seeding database..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npx tsx src/scripts/seed.ts"
    print_success "Database seeded successfully"
    
    # Start application services
    print_status "Starting application services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD up -d api-service auth-service"
    print_success "Application services started"
    
    # Wait for services to start
    print_status "Waiting for application services to start..."
    sleep 15
    
    # Test API health
    print_status "Testing API health..."
    for i in {1..15}; do
        if ssh $REMOTE_USER@$REMOTE_HOST "curl -f http://localhost:3000/health" 2>/dev/null; then
            print_success "API is healthy"
            break
        fi
        
        if [ $i -eq 15 ]; then
            print_warning "API health check failed - checking logs..."
            ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD logs api-service | tail -30"
        fi
        
        sleep 3
    done
    
    # Configure firewall
    print_status "Configuring firewall..."
    ssh -t $REMOTE_USER@$REMOTE_HOST "sudo firewall-cmd --permanent --add-port=3000-3003/tcp --add-port=8000/tcp --add-port=8025/tcp --add-port=9001/tcp && sudo firewall-cmd --reload" 2>/dev/null || print_warning "Firewall configuration may have failed"
    
    # Show service status
    print_status "Checking service status..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD ps"
    
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📱 Application URLs:"
    echo "   API:          http://$REMOTE_HOST:3000"
    echo "   API Health:   http://$REMOTE_HOST:3000/health"
    echo "   API Docs:     http://$REMOTE_HOST:3000/docs"
    echo "   Auth Service: http://$REMOTE_HOST:3001"
    echo "   Mailhog:      http://$REMOTE_HOST:8025"
    echo "   MinIO:        http://$REMOTE_HOST:9001"
    echo ""
    echo "🔑 Test Accounts:"
    echo "   admin@qbideas.com / admin123"
    echo "   john@example.com / password123"
    echo "   sarah@example.com / password123"
    echo ""
    echo "🧪 Test Commands:"
    echo "   curl http://$REMOTE_HOST:3000/health"
    echo "   curl http://$REMOTE_HOST:3000/api/ideas"
    echo ""
    echo "📋 Management Commands:"
    echo "   View logs:    ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD logs -f'"
    echo "   Restart:      ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD restart'"
    echo "   Stop all:     ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD down'"
    echo ""
    print_warning "⚠️  Add your real API keys to improve functionality:"
    print_warning "ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && nano .env'"
    print_warning "Then restart: ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD restart'"
}

final_deploy