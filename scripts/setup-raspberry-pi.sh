#!/bin/bash

set -e

echo "========================================="
echo "Certify - Raspberry Pi Setup Script"
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
        echo -e "${GREEN}✓ Compatible OS detected${NC}"
    else
        echo -e "${YELLOW}⚠ This script is optimized for Raspbian/Debian${NC}"
    fi
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}[1/8] Updating system packages...${NC}"
apt-get update -y
apt-get upgrade -y

echo -e "${GREEN}[2/8] Installing Node.js 20.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo -e "${YELLOW}Node.js already installed: $(node --version)${NC}"
fi

echo -e "${GREEN}[3/8] Installing build essentials...${NC}"
apt-get install -y build-essential python3 git curl

echo -e "${GREEN}[4/8] Installing PM2 for process management...${NC}"
npm install -g pm2

echo -e "${GREEN}[5/8] Setting up backend...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    npm run build
fi

echo -e "${GREEN}[6/8] Setting up frontend...${NC}"
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
    npm run build
fi
FRONTEND_DIST=$(pwd)/dist
cd ..

echo -e "${GREEN}[7/8] Installing nginx for frontend serving...${NC}"
apt-get install -y nginx

# Create nginx config
cat > /etc/nginx/sites-available/certify <<EOFNGINX
server {
    listen 80;
    server_name _;
    root ${FRONTEND_DIST};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOFNGINX

ln -sf /etc/nginx/sites-available/certify /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

echo -e "${GREEN}[8/8] Creating PM2 ecosystem file...${NC}"
cd ..
cat > ecosystem.config.js <<EOFPM2
module.exports = {
  apps: [
    {
      name: 'certify-backend',
      cwd: './backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        FRONTEND_URL: 'http://localhost:80',
        SESSION_SECRET: 'CHANGE_THIS_IN_PRODUCTION'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOFPM2

mkdir -p logs

echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit backend/.env with your configuration"
echo "2. Edit frontend/.env with your configuration"
echo "3. Start services: pm2 start ecosystem.config.js"
echo "4. Save PM2: pm2 save"
echo "5. Enable PM2 on boot: pm2 startup"
echo ""
echo -e "${GREEN}Services will be available at:${NC}"
echo "- Frontend: http://$(hostname -I | awk '{print $1}')"
echo "- Backend API: http://$(hostname -I | awk '{print $1}'):4000"
