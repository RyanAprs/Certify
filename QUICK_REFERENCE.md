# Certify - Quick Reference Card

**Fastest way to get Certify running on your machine.**

---

## ⚡ 5-Minute Quick Start

### Prerequisites
```bash
node --version  # v18+
npm --version   # v9+
```

### Step 1: Clone (1 min)
```bash
git clone <repo-url>
cd Certify
```

### Step 2: Start 3 Terminals

**Terminal 1 - Blockchain**
```bash
cd contracts
npm install --legacy-peer-deps
npx hardhat compile  # First time only
npx hardhat node
# Copy Account #0 private key for MetaMask later
```

**Terminal 2 - Backend**
```bash
cd backend
cp .env.example .env
npm install
npm run dev
# ✅ Server running at http://localhost:4000
```

**Terminal 3 - Frontend**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# ✅ App running at http://localhost:5173
```

### Step 3: MetaMask Setup (2 min)

1. **Add Network**
   - Network: Hardhat Local
   - RPC: http://127.0.0.1:8545
   - Chain ID: 31337

2. **Import Account**
   - Private Key: (from Terminal 1 Account #0)

### Step 4: Deploy Contracts (1 min)

**Terminal 1 (where blockchain is running):**
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
```

Copy the 3 contract addresses output.

### Step 5: Update Frontend .env (1 min)

Edit `frontend/.env`:
```env
VITE_CONTRACT_ADDRESS=0x9fE46...    # From deploy output
VITE_VERIFIER_ADDRESS=0x5FbDB...    # From deploy output
```

Refresh frontend at http://localhost:5173

### Step 6: Test (1 min)

1. Click **Connect Wallet**
2. Sign SIWE message in MetaMask
3. ✅ Dashboard loaded!

---

## 📋 Common Tasks

### Run Tests
```bash
cd contracts
npx hardhat test
```

### Recompile Circuit
```bash
cd zk/circuits
circom certify.circom -o . --r1cs --wasm
```

### View Contract ABI
```bash
cat contracts/artifacts/contracts/CertifyRegistry.sol/CertifyRegistry.json | jq '.abi'
```

### Check Blockchain Logs
Look at Terminal 1 (blockchain) for transaction details.

### Clear MetaMask State
MetaMask → Settings → Advanced → Reset Account

### Kill Stuck Ports
```bash
lsof -ti:8545 | xargs kill -9  # Blockchain
lsof -ti:4000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

---

## 🔑 Important Contract Addresses

After deploying, save these:

```
Groth16 Verifier:   0x5FbDB2315678afccb333f8a9c45ead413b7c77bf
ZKPCertify:         0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
CertifyRegistry:    0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

Use in `frontend/.env`:
- `VITE_CONTRACT_ADDRESS` = CertifyRegistry
- `VITE_VERIFIER_ADDRESS` = Groth16 Verifier

---

## 📁 File Structure Reference

```
Certify/
├── contracts/           # Smart contracts
│   ├── contracts/*.sol  # Solidity files
│   └── scripts/deploy.ts
│
├── frontend/            # React app
│   ├── src/lib/         # Utilities (ZKP, IPFS, contract)
│   ├── public/zk/       # ZK artifacts
│   └── .env.example
│
├── backend/             # Express server
│   └── src/server.ts
│
├── zk/                  # Zero-knowledge proofs
│   └── circuits/
│       ├── certify.circom
│       ├── certify.wasm
│       └── certify.zkey
│
├── README.md            # Overview
├── SETUP_LOCAL.md       # 📖 Full setup guide
├── ARCHITECTURE.md      # 📖 Technical details
└── QUICK_REFERENCE.md   # This file
```

---

## 🚨 Troubleshooting Checklist

| Error | Fix |
|-------|-----|
| `port 8545 already in use` | `lsof -ti:8545 \| xargs kill -9` |
| `cannot find module hardhat` | `npm install --legacy-peer-deps` |
| `contract address undefined` | Deploy again: `npx hardhat run scripts/deploy.ts --network localhost` |
| `proof verification fails` | Ensure ZK files in `frontend/public/zk/` |
| `SIWE login fails` | Check backend running; clear cookies |
| `MetaMask connection error` | Check RPC URL; reset account |

---

## 🧪 Testing Flows

### Issuer Flow (5 min)
1. Login with wallet A (issuer)
2. Go to `/issuer` dashboard
3. Register as issuer (one-time)
4. Submit member request from holder (switch wallet)
5. Approve request
6. Issue certificate with metadata
7. ✅ See on-chain

### Holder Flow (5 min)
1. Login with wallet B (holder)
2. Go to `/holder` dashboard
3. Request membership from issuer
4. Wait for approval
5. Receive certificate
6. Generate ZK proof
7. Share certificate
8. ✅ Proof visible

### Verifier Flow (3 min)
1. Login with wallet C (verifier)
2. Go to `/verifier` dashboard
3. Enter certificate ID
4. View details
5. Verify ZK proof
6. ✅ Verified!

---

## 📚 Documentation Map

| File | Purpose | When to Read |
|------|---------|--------------|
| **README.md** | Overview & features | First |
| **SETUP_LOCAL.md** | Step-by-step setup | For full setup |
| **ARCHITECTURE.md** | Technical design | For understanding code |
| **QUICK_REFERENCE.md** | This file | For quick lookup |

---

## 🎯 Next Steps

- [ ] Complete SETUP_LOCAL.md
- [ ] Deploy contracts locally
- [ ] Test all 3 flows (Issuer/Holder/Verifier)
- [ ] Read ARCHITECTURE.md for deeper understanding
- [ ] Modify circuits/contracts for your use case
- [ ] Deploy to testnet (Sepolia)

---

## 🔗 Useful Links

- [Hardhat Docs](https://hardhat.org)
- [snarkjs GitHub](https://github.com/iden3/snarkjs)
- [Circom Docs](https://docs.circom.io)
- [Wagmi Docs](https://wagmi.sh)
- [MetaMask Docs](https://metamask.io/developer-docs/)

---

## 💡 Tips

✅ **Development**: Use 3 terminals (blockchain, backend, frontend)
✅ **Testing**: Switch MetaMask accounts for different roles
✅ **Debugging**: Check browser console (F12) for frontend errors
✅ **Contracts**: Use Hardhat console for direct calls
✅ **ZKP**: Generate proofs client-side; verify on-chain

---

## ⏱️ Timing Estimates

| Task | Time |
|------|------|
| Initial clone & setup | 5 min |
| Install dependencies | 3 min |
| Deploy contracts | 2 min |
| Configure frontend | 1 min |
| Test full flow | 5 min |
| **Total** | **16 min** |

---

**Last Updated:** July 5, 2026

**Need help?** Check [SETUP_LOCAL.md](./SETUP_LOCAL.md) Section 8 or open an issue.
