# Deployment on Raspberry Pi (Raspbian/Debian)

Complete guide to installing and running Certify on a Raspberry Pi with the Raspbian or Debian OS.

## System Requirements

- Raspberry Pi (3B+ or newer recommended)
- **Raspbian** (Raspberry Pi OS) or **Debian** OS
- Internet connection
- Minimum 2GB RAM (4GB+ recommended)
- Minimum 8GB storage (16GB+ recommended)

## OS Compatibility

This script and setup are **100% compatible** with:

- ✅ **Raspbian** (Raspberry Pi OS) - All versions
- ✅ **Debian** - Version 10 (Buster) or newer
- ✅ **Ubuntu** - Version 20.04 or newer (for reference)

The script automatically detects the OS in use and confirms compatibility.

## Installation Options

There are two ways to install Certify on a Raspberry Pi:

### Option 1: Docker (Recommended)

**Advantages:**

- Dependency isolation
- Easy to update and roll back
- Does not clutter the system
- Consistent across different environments

**Disadvantages:**

- Requires more RAM
- Docker must be installed first

**Note for Raspbian:**

- Docker automatically detects the ARM architecture (armv7/arm64) and uses the appropriate image
- Build time may be longer on a Raspberry Pi due to the ARM architecture
- Make sure the Raspberry Pi has at least 2GB RAM for Docker (4GB+ recommended)

### Option 2: Manual Setup (Without Docker)

**Advantages:**

- Lighter on resources
- Full control over configuration
- No Docker required

**Disadvantages:**

- More complex to maintain
- Dependencies are installed directly on the system

---

## Option 1: Installation with Docker

### Step 1: Clone the Repository

```bash
git clone https://github.com/RyanAprs/Certify.git
cd Certify
```

### Step 2: Run the Setup Script

```bash
chmod +x scripts/setup-docker.sh
sudo ./scripts/setup-docker.sh
```

This script will:

- Install Docker and Docker Compose (if not already present)
- Create a `.env` file with a session secret
- Build and start the containers for the backend and frontend

### Step 3: Configure Environment Variables

Edit the `.env` file in the project root:

```bash
nano .env
```

Add the required configuration (see `backend/.env.example` and `frontend/.env.example`).

### Step 4: Rebuild the Container (if needed)

```bash
docker compose down
docker compose up -d --build
```

### Container Management

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart services
docker compose restart

# View status
docker compose ps

# Update code and rebuild
git pull
docker compose up -d --build
```

---

## Option 2: Manual Installation (Without Docker)

### Step 1: Clone the Repository

```bash
git clone https://github.com/RyanAprs/Certify.git
cd Certify
```

### Step 2: Run the Setup Script

```bash
chmod +x scripts/setup-raspberry-pi.sh
sudo ./scripts/setup-raspberry-pi.sh
```

This script will:

- Update system packages
- Install Node.js 20.x
- Install build essentials (gcc, make, etc.)
- Install PM2 for process management
- Install and set up nginx
- Build the backend and frontend
- Set up the PM2 ecosystem file

### Step 3: Deploy Contracts

```
cd contracts
cp .env.example .env
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network localhost
```

### Step 4: Configure Environment Variables

**Backend:**

```bash
cd backend
cp .env.example .env
nano .env
```

Fill in the appropriate configuration:

```env
PORT=4000
FRONTEND_URL=http://localhost:80
SESSION_SECRET=<generate-random-string>
NODE_ENV=production
```

**Frontend:**

```bash
cd ../frontend
cp .env.example .env
nano .env
```

Fill in the appropriate configuration:

```env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_WALLETCONNECT_ID="wc_demo"
VITE_CONTRACT_ADDRESS="0xYourContract"
VITE_VERIFIER_ADDRESS="0xYourVerifier"
VITE_ZKEY_URL="/zk/certify.zkey"
VITE_WASM_URL="/zk/certify.wasm"
VITE_PINATA_JWT="YOUR_PINATA_JWT"
VITE_GATEWAY_URL="your-gateway.mypinata.cloud"
```

### Step 5: Run

**Contracts:**

```bash
cd contracts
npx hardhat node
```

Copy a private key to log in

**Backend:**

```bash
cd backend
npm run dev
```

**Frontend:**

```bash
cd frontend
npm run dev
```

Open in a browser: `http://localhost:5173/`
