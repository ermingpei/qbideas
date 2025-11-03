#!/bin/bash

# qbidea Setup Script
# This script automates the setup of the qbidea development environment

set -e  # Exit on any error

echo "🚀 Setting up qbidea development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop first."
        echo "Visit: https://www.docker.com/products/docker-desktop/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    
    print_success "Docker is installed and running"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 20+ first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_error "Node.js version 20 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Create .env file if it doesn't exist
setup_env() {
    print_status "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "Please edit .env file and add your API keys before continuing"
        print_warning "Required: OPENAI_API_KEY, ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY"
        
        read -p "Press Enter after you've updated the .env file with your API keys..."
    else
        print_success ".env file already exists"
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Root dependencies installed"
    else
        print_success "Root dependencies already installed"
    fi
    
    # Install shared package dependencies
    if [ ! -d "services/shared/node_modules" ]; then
        cd services/shared
        npm install
        cd ../..
        print_success "Shared package dependencies installed"
    else
        print_success "Shared package dependencies already installed"
    fi
    
    # Install API service dependencies
    if [ ! -d "services/api/node_modules" ]; then
        cd services/api
        npm install
        cd ../..
        print_success "API service dependencies installed"
    else
        print_success "API service dependencies already installed"
    fi
}

# Build shared package
build_shared() {
    print_status "Building shared package..."
    
    cd services/shared
    npm run build
    cd ../..
    
    print_success "Shared package built successfully"
}

# Start Docker services
start_services() {
    print_status "Starting Docker services..."
    
    # Stop any existing services
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # Start infrastructure services first (postgres, redis, minio, mailhog)
    print_status "Starting infrastructure services..."
    docker-compose up -d postgres redis minio mailhog
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are healthy
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U qbidea -d qbidea &>/dev/null && \
           docker-compose exec -T redis redis-cli --no-auth-warning -a dev_password ping &>/dev/null; then
            print_success "Infrastructure services are ready"
            break
        fi
        
        if [ $i -eq 30 ]; then
            print_error "Services failed to start within timeout"
            exit 1
        fi
        
        sleep 2
    done
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Generate Prisma client first
    cd services/api
    npx prisma generate
    
    # Run migrations
    npx prisma migrate dev --name init
    cd ../..
    
    print_success "Database migrations completed"
}

# Seed database
seed_database() {
    print_status "Seeding database with sample data..."
    
    cd services/api
    npx tsx src/scripts/seed.ts
    cd ../..
    
    print_success "Database seeded successfully"
}

# Start application services
start_app_services() {
    print_status "Starting application services..."
    
    # Start all services
    docker-compose up -d
    
    print_success "All services started"
}

# Display service URLs
show_urls() {
    print_success "🎉 qbidea development environment is ready!"
    echo ""
    echo "📱 Application URLs:"
    echo "   Frontend:     http://localhost:3002"
    echo "   API:          http://localhost:3000"
    echo "   Auth Service: http://localhost:3001"
    echo "   AI Pipeline:  http://localhost:8000"
    echo ""
    echo "🛠️  Development Tools:"
    echo "   API Docs:     http://localhost:3000/docs"
    echo "   Mailhog:      http://localhost:8025"
    echo "   MinIO:        http://localhost:9001"
    echo ""
    echo "🔑 Test Accounts:"
    echo "   Admin:        admin@qbidea.com / admin123"
    echo "   User 1:       john@example.com / password123"
    echo "   User 2:       sarah@example.com / password123"
    echo ""
    echo "📋 Useful Commands:"
    echo "   View logs:    npm run dev:logs"
    echo "   Stop all:     npm run dev:down"
    echo "   Clean reset:  npm run dev:clean"
    echo ""
}

# Main execution
main() {
    echo "🚀 qbidea Development Environment Setup"
    echo "======================================"
    echo ""
    
    check_docker
    check_node
    setup_env
    install_dependencies
    build_shared
    start_services
    run_migrations
    seed_database
    start_app_services
    
    echo ""
    show_urls
}

# Run main function
main "$@"