#!/bin/bash

set -e

echo "========================================="
echo "Certify - Docker Setup Script"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo -e "${GREEN}Detected OS: $PRETTY_NAME${NC}"
    if [[ "$ID" == "raspbian" ]] || [[ "$ID" == "debian" ]]; then
        echo -e "${GREEN}✓ Compatible OS detected (Raspbian/Debian)${NC}"
    else
        echo -e "${YELLOW}⚠ This script is optimized for Raspbian/Debian${NC}"
    fi
fi

echo -e "${GREEN}[1/4] Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    usermod -aG docker $USER
    echo -e "${GREEN}Docker installed. Please log out and log back in, then run this script again.${NC}"
    exit 0
else
    echo -e "${GREEN}Docker already installed: $(docker --version)${NC}"
fi

echo -e "${GREEN}[2/4] Checking Docker Compose installation...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose not found. Installing...${NC}"
    apt-get update
    apt-get install -y docker-compose-plugin
    echo -e "${GREEN}Docker Compose installed${NC}"
else
    echo -e "${GREEN}Docker Compose already installed${NC}"
fi

echo -e "${GREEN}[3/4] Creating .env file for docker-compose...${NC}"
if [ ! -f .env ]; then
    cat > .env <<EOFENV
SESSION_SECRET=$(openssl rand -hex 32)
EOFENV
    echo -e "${GREEN}.env file created${NC}"
else
    echo -e "${YELLOW}.env file already exists${NC}"
fi

echo -e "${GREEN}[4/4] Building and starting containers...${NC}"
docker compose up -d --build

echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "- View logs: docker compose logs -f"
echo "- Stop services: docker compose down"
echo "- Restart services: docker compose restart"
echo "- View status: docker compose ps"
echo ""
echo -e "${GREEN}Services will be available at:${NC}"
echo "- Frontend: http://$(hostname -I | awk '{print $1}')"
echo "- Backend API: http://$(hostname -I | awk '{print $1}'):4000"
