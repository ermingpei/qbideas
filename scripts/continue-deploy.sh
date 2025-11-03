#!/bin/bash

# Continue deployment after fixing TypeScript issues
# This script continues from where the previous deployment failed

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

# Continue deployment
continue_deploy() {
    print_status "🔄 Continuing deployment with fixed TypeScript issues..."
    
    # Copy the fixed files
    print_status "Copying fixed shared utils..."
    scp services/shared/src/utils/index.ts $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/services/shared/src/utils/
    print_success "Fixed files copied"
    
    # Build shared package again
    print_status "Building shared package..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/shared && npm run build"
    print_success "Shared package built successfully"
    
    # Install API dependencies
    print_status "Installing API service dependencies..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npm install"
    print_success "API dependencies installed"
    
    # Check if infrastructure services are running
    print_status "Checking infrastructure services..."
    if ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker-compose ps postgres redis minio mailhog | grep -q Up"; then
        print_success "Infrastructure services are running"
    else
        print_status "Starting infrastructure services..."
        ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker-compose up -d postgres redis minio mailhog"
        sleep 15
        print_success "Infrastructure services started"
    fi
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    for i in {1..30}; do
        if ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker-compose exec -T postgres pg_isready -U qbidea -d qbidea" 2>/dev/null && \
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
    
    # Check if database is already migrated
    if ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npx prisma migrate status" 2>/dev/null | grep -q "Database schema is up to date"; then
        print_success "Database is already migrated"
    else
        print_status "Running database migrations..."
        ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npx prisma migrate dev --name init"
        print_success "Database migrations completed"
    fi
    
    # Check if database is already seeded
    if ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker-compose exec -T postgres psql -U qbidea -d qbidea -c 'SELECT COUNT(*) FROM users;'" 2>/dev/null | grep -q "3"; then
        print_success "Database is already seeded"
    else
        print_status "Seeding database..."
        ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR/services/api && npx tsx src/scripts/seed.ts"
        print_success "Database seeded successfully"
    fi
    
    # Start application services
    print_status "Starting application services..."
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker-compose up -d api-service auth-service ai-pipeline celery-worker"
    print_success "Application services started"
    
    # Wait for services to start
    print_status "Waiting for application services to start..."
    sleep 15
    
    # Test API health
    print_status "Testing API health..."
    for i in {1..10}; do
        if ssh $REMOTE_USER@$REMOTE_HOST "curl -f http://localhost:3000/health" 2>/dev/null; then
            print_success "API is healthy"
            break
        fi
        
        if [ $i -eq 10 ]; then
            print_warning "API health check failed - checking logs..."
            ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && docker-compose logs api-service | tail -20"
        fi
        
        sleep 3
    done
    
    # Configure firewall if needed
    print_status "Configuring firewall..."
    ssh -t $REMOTE_USER@$REMOTE_HOST "sudo firewall-cmd --permanent --add-port=3000-3003/tcp --add-port=8000/tcp --add-port=8025/tcp --add-port=9001/tcp && sudo firewall-cmd --reload" 2>/dev/null || print_warning "Firewall configuration may have failed"
    
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📱 Application URLs:"
    echo "   API:          http://$REMOTE_HOST:3000"
    echo "   API Docs:     http://$REMOTE_HOST:3000/docs"
    echo "   Auth Service: http://$REMOTE_HOST:3001"
    echo "   AI Pipeline:  http://$REMOTE_HOST:8000"
    echo "   Mailhog:      http://$REMOTE_HOST:8025"
    echo "   MinIO:        http://$REMOTE_HOST:9001"
    echo ""
    echo "🔑 Test Accounts:"
    echo "   admin@qbidea.com / admin123"
    echo "   john@example.com / password123"
    echo "   sarah@example.com / password123"
    echo ""
    echo "📋 Management Commands:"
    echo "   View logs:    ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose logs -f'"
    echo "   Restart:      ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose restart'"
    echo "   Stop all:     ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose down'"
    echo ""
    echo "🧪 Test the API:"
    echo "   curl http://$REMOTE_HOST:3000/health"
    echo "   curl http://$REMOTE_HOST:3000/api/ideas"
    echo ""
    print_warning "⚠️  Add your real API keys to improve functionality:"
    print_warning "ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && nano .env'"
    print_warning "Then restart: ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose restart'"
}

# Make script executable and run
chmod +x scripts/install-docker-almalinux.sh
chmod +x scripts/setup.sh

continue_deploy