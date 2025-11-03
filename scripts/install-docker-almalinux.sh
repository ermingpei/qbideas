#!/bin/bash

# Install Docker on AlmaLinux
# This script installs Docker and Docker Compose on AlmaLinux

set -e

echo "🐳 Installing Docker on AlmaLinux..."

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

# Check if running as root or with sudo
check_privileges() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Update system
update_system() {
    print_status "Updating system packages..."
    dnf update -y
    print_success "System updated"
}

# Install required packages
install_prerequisites() {
    print_status "Installing prerequisites..."
    dnf install -y dnf-plugins-core curl wget
    print_success "Prerequisites installed"
}

# Add Docker repository
add_docker_repo() {
    print_status "Adding Docker repository..."
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    print_success "Docker repository added"
}

# Install Docker
install_docker() {
    print_status "Installing Docker..."
    dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    print_success "Docker installed"
}

# Start and enable Docker
start_docker() {
    print_status "Starting Docker service..."
    systemctl start docker
    systemctl enable docker
    print_success "Docker service started and enabled"
}

# Add user to docker group
setup_docker_user() {
    if [ -n "$SUDO_USER" ]; then
        print_status "Adding user $SUDO_USER to docker group..."
        usermod -aG docker $SUDO_USER
        print_success "User $SUDO_USER added to docker group"
        print_warning "Please log out and log back in for group changes to take effect"
    else
        print_warning "No SUDO_USER found. You may need to add your user to the docker group manually:"
        print_warning "sudo usermod -aG docker \$USER"
    fi
}

# Install Node.js
install_nodejs() {
    print_status "Installing Node.js 20..."
    
    # Install Node.js 20 from NodeSource repository
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    dnf install -y nodejs
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    print_success "Node.js $NODE_VERSION installed"
    print_success "npm $NPM_VERSION installed"
}

# Test Docker installation
test_docker() {
    print_status "Testing Docker installation..."
    
    if docker --version &>/dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker installed: $DOCKER_VERSION"
    else
        print_error "Docker installation failed"
        exit 1
    fi
    
    if docker compose version &>/dev/null; then
        COMPOSE_VERSION=$(docker compose version)
        print_success "Docker Compose installed: $COMPOSE_VERSION"
    else
        print_error "Docker Compose installation failed"
        exit 1
    fi
    
    # Test Docker run
    if docker run --rm hello-world &>/dev/null; then
        print_success "Docker is working correctly"
    else
        print_error "Docker test failed"
        exit 1
    fi
}

# Main installation function
main() {
    echo "🐳 Docker Installation for AlmaLinux"
    echo "===================================="
    echo ""
    
    check_privileges
    update_system
    install_prerequisites
    add_docker_repo
    install_docker
    start_docker
    setup_docker_user
    install_nodejs
    test_docker
    
    echo ""
    print_success "🎉 Docker and Node.js installation completed!"
    echo ""
    print_warning "Important: If you added a user to the docker group, please:"
    print_warning "1. Log out and log back in"
    print_warning "2. Or run: newgrp docker"
    echo ""
    print_status "You can now run the qbidea setup script"
}

main "$@"