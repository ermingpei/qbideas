#!/bin/bash

# Deploy qbidea to AlmaLinux machine
# This script copies the project and runs setup on the remote AlmaLinux server

set -e

# Configuration
REMOTE_HOST="206.12.95.60"
REMOTE_USER="almalinux"
REMOTE_DIR="/home/almalinux/qbidea"
PROJECT_NAME="qbidea"

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

# Test SSH connection
test_ssh() {
    print_status "Testing SSH connection to $REMOTE_USER@$REMOTE_HOST..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes $REMOTE_USER@$REMOTE_HOST exit 2>/dev/null; then
        print_success "SSH connection successful"
    else
        print_error "SSH connection failed. Please ensure:"
        print_error "1. The server is accessible"
        print_error "2. SSH key is properly configured"
        print_error "3. User has proper permissions"
        exit 1
    fi
}

# Create remote directory
create_remote_dir() {
    print_status "Creating remote directory..."
    
    ssh $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_DIR"
    print_success "Remote directory created: $REMOTE_DIR"
}

# Copy project files
copy_project() {
    print_status "Copying project files to remote server..."
    
    # Create a temporary archive excluding unnecessary files
    tar --exclude='node_modules' \
        --exclude='.git' \
        --exclude='dist' \
        --exclude='build' \
        --exclude='.next' \
        --exclude='logs' \
        --exclude='*.log' \
        --exclude='.env' \
        -czf /tmp/qbidea-deploy.tar.gz .
    
    # Copy archive to remote server
    scp /tmp/qbidea-deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/
    
    # Extract on remote server
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && tar -xzf qbidea-deploy.tar.gz && rm qbidea-deploy.tar.gz"
    
    # Clean up local archive
    rm /tmp/qbidea-deploy.tar.gz
    
    print_success "Project files copied successfully"
}

# Install Docker on remote server
install_docker_remote() {
    print_status "Installing Docker on remote server..."
    
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && chmod +x scripts/install-docker-almalinux.sh"
    
    # Run Docker installation with sudo
    ssh -t $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && sudo ./scripts/install-docker-almalinux.sh"
    
    print_success "Docker installation completed"
}

# Setup environment variables
setup_env_remote() {
    print_status "Setting up environment variables..."
    
    # Create .env file on remote server
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && cp .env.example .env"
    
    print_warning "Environment file created. You need to edit it with your API keys:"
    print_warning "ssh $REMOTE_USER@$REMOTE_HOST"
    print_warning "cd $REMOTE_DIR && nano .env"
    print_warning ""
    print_warning "Required variables:"
    print_warning "- OPENAI_API_KEY"
    print_warning "- ANTHROPIC_API_KEY" 
    print_warning "- STRIPE_SECRET_KEY"
    print_warning "- STRIPE_PUBLISHABLE_KEY"
    
    read -p "Press Enter after you've updated the .env file on the remote server..."
}

# Run setup on remote server
run_setup_remote() {
    print_status "Running qbidea setup on remote server..."
    
    # Make setup script executable
    ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && chmod +x scripts/setup.sh"
    
    # Run setup script
    ssh -t $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && ./scripts/setup.sh"
    
    print_success "Setup completed successfully"
}

# Show final information
show_final_info() {
    print_success "🎉 qbidea deployment completed!"
    echo ""
    echo "📱 Application URLs (replace with your server IP):"
    echo "   Frontend:     http://$REMOTE_HOST:3002"
    echo "   API:          http://$REMOTE_HOST:3000"
    echo "   Auth Service: http://$REMOTE_HOST:3001"
    echo "   AI Pipeline:  http://$REMOTE_HOST:8000"
    echo ""
    echo "🛠️  Development Tools:"
    echo "   API Docs:     http://$REMOTE_HOST:3000/docs"
    echo "   Mailhog:      http://$REMOTE_HOST:8025"
    echo "   MinIO:        http://$REMOTE_HOST:9001"
    echo ""
    echo "🔑 Test Accounts:"
    echo "   Admin:        admin@qbidea.com / admin123"
    echo "   User 1:       john@example.com / password123"
    echo "   User 2:       sarah@example.com / password123"
    echo ""
    echo "📋 Remote Management Commands:"
    echo "   SSH to server: ssh $REMOTE_USER@$REMOTE_HOST"
    echo "   View logs:     ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose logs -f'"
    echo "   Stop services: ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose down'"
    echo "   Restart:       ssh $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose restart'"
    echo ""
    print_warning "Note: You may need to configure firewall rules to allow access to the ports"
    print_warning "Run on remote server: sudo firewall-cmd --permanent --add-port=3000-3003/tcp --add-port=8000/tcp --add-port=8025/tcp --add-port=9001/tcp && sudo firewall-cmd --reload"
}

# Main deployment function
main() {
    echo "🚀 qbidea AlmaLinux Deployment"
    echo "=============================="
    echo ""
    echo "Target: $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR"
    echo ""
    
    test_ssh
    create_remote_dir
    copy_project
    install_docker_remote
    setup_env_remote
    run_setup_remote
    show_final_info
}

# Run main function
main "$@"