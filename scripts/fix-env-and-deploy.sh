#!/bin/bash

# Fix environment variables and complete deployment
# This script ensures .env is properly loaded for Prisma commands

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

# Fix and deploy
fix_and_deploy() {
    print_status "🔧 Fixing environment variables and completing deployment..."
    
    # Detect docker compose command
    print_status "Detecting Docker Compose command..."
    if ssh $REMOTE_USER@$REMOTE_HOST "docker compose version" 2>/dev/null; then
        DOCKER_COMPOSE_CMD="docker compose"
    elif ssh $REMOTE_USER@$REMOTE_HOST "docker-compose --version" 2>/dev/null; then
        DOCKER_COMPOSE_CMD="docker-compose"
    else
        print_error "Neither 'docker compose' nor 'docker-compose' found"
        exit 1
    fi
    print_success "Using: $DOCKER_COMPOSE_CMD"
    
    # Create a proper .env file with actual values (not shell variables)
    print_status "Creating proper .env file..."
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
    
    # Verify .env file
    print_status "Verifying .env file..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && grep DATABASE_URL .env"
    
    # Stop any existing services
    print_status "Stopping existing services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD down --remove-orphans" 2>/dev/null || true
    
    # Start infrastructure services
    print_status "Starting infrastructure services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD up -d postgres redis minio mailhog"
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 25
    
    # Check if services are ready with better error handling
    print_status "Checking service health..."
    for i in {1..30}; do
        postgres_ready=false
        redis_ready=false
        
        if ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U qbidea -d qbidea" 2>/dev/null; then
            postgres_ready=true
        fi
        
        if ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD exec -T redis redis-cli --no-auth-warning -a dev_password ping" 2>/dev/null; then
            redis_ready=true
        fi
        
        if [ "$postgres_ready" = true ] && [ "$redis_ready" = true ]; then
            print_success "Infrastructure services are ready"
            break
        fi
        
        if [ $i -eq 30 ]; then
            print_error "Services failed to start within timeout"
            print_status "Checking service logs..."
            ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD logs postgres redis"
            exit 1
        fi
        
        print_status "Waiting... (attempt $i/30)"
        sleep 3
    done
    
    # Test database connection directly
    print_status "Testing database connection..."
    if ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD exec -T postgres psql -U qbidea -d qbidea -c 'SELECT 1;'" 2>/dev/null; then
        print_success "Database connection successful"
    else
        print_error "Database connection failed"
        exit 1
    fi
    
    # Run database setup with explicit environment loading
    print_status "Setting up database with environment variables..."
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && source ../../.env && npx prisma generate"
    print_success "Prisma client generated"
    
    # Run migrations
    print_status "Running database migrations..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && source ../../.env && npx prisma migrate dev --name init"
    print_success "Database migrations completed"
    
    # Seed database
    print_status "Seeding database..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && source ../../.env && npx tsx src/scripts/seed.ts"
    print_success "Database seeded successfully"
    
    # Start application services
    print_status "Starting application services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD up -d api-service auth-service"
    print_success "Application services started"
    
    # Wait for services to start
    print_status "Waiting for application services to start..."
    sleep 20
    
    # Test API health with retries
    print_status "Testing API health..."
    api_healthy=false
    for i in {1..20}; do
        if ssh $REMOTE_USER@$REMOTE_HOST "curl -f http://localhost:3000/health" 2>/dev/null; then
            print_success "API is healthy"
            api_healthy=true
            break
        fi
        
        print_status "API not ready yet... (attempt $i/20)"
        sleep 3
    done
    
    if [ "$api_healthy" = false ]; then
        print_warning "API health check failed - checking logs..."
        ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD logs api-service | tail -50"
    fi
    
    # Configure firewall
    print_status "Configuring firewall..."
    ssh -t $REMOTE_USER@$REMOTE_HOST "sudo firewall-cmd --permanent --add-port=3000-3003/tcp --add-port=8000/tcp --add-port=8025/tcp --add-port=9001/tcp && sudo firewall-cmd --reload" 2>/dev/null || print_warning "Firewall configuration may have failed"
    
    # Show service status
    print_status "Final service status:"
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD ps"
    
    print_success "🎉 Deployment completed!"
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
    print_warning "⚠️  Add your real API keys to improve functionality:"
    print_warning "ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && nano .env'"
    print_warning "Then restart: ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && $DOCKER_COMPOSE_CMD restart'"
}

fix_and_deploy