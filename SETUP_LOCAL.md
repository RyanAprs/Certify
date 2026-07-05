# Local Development Setup - Certify

Panduan lengkap untuk menjalankan Certify di mesin lokal Anda dengan blockchain, ZKP, IPFS, dan autentikasi SIWE.

## Prerequisites

Pastikan Anda sudah punya:
- **Node.js** v18+ dan npm
- **Git**
- **MetaMask** atau wallet Ethereum lain (untuk frontend)

Verifikasi instalasi:
```bash
node --version  # v18.0.0 atau lebih tinggi
npm --version   # 9.0.0 atau lebih tinggi
```

## 1. Clone Repository

```bash
git clone <repository-url>
cd Certify
```

## 2. Setup Backend (SIWE Authentication)

Backend Express menangani Sign-In with Ethereum (SIWE) untuk autentikasi.

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=4000
SESSION_SECRET=your-random-32-char-secret-key-here-minimum-32-chars-long
NODE_ENV=development
```

Install dependencies dan run:
```bash
npm install
npm run dev
```

Expected output:
```
Server running at http://localhost:4000
```

**Test endpoint:**
```bash
curl http://localhost:4000/api/auth/nonce
# Response: {"nonce":"..."}
```

✅ Backend siap di `http://localhost:4000`

---

## 3. Setup Smart Contracts & Blockchain

Hardhat akan menjalankan blockchain lokal (simulated Ethereum).

### 3.1 Install Dependencies

```bash
cd contracts
npm install --legacy-peer-deps
```

### 3.2 Compile Smart Contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 8 Solidity files successfully
```

Ini akan generate:
- TypeChain type bindings di `typechain-types/`
- Contract ABIs

### 3.3 Start Local Blockchain

**Terminal baru**, jalankan Hardhat node:

```bash
npx hardhat node
```

Expected output:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545

Accounts (10 available):
Account #0: 0x8ba1f109551bd432803012645ac136ddd64dba72
  Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad4d0f5addcf4239bbb3f25
...
```

**Jangan close terminal ini!** Ini adalah blockchain lokal Anda.

Simpan private key Account #0 untuk testing.

### 3.4 Deploy Smart Contracts

**Terminal baru** (jangan close blockchain terminal):

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

Expected output:
```
Deploying contracts with account: 0x8ba1f109551bd432803012645ac136ddd64dba72
Groth16 Verifier deployed to: 0x5FbDB2315678afccb333f8a9c45ead413b7c77bf
ZKPCertify deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
CertifyRegistry deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

=== Deployment Summary ===
Groth16 Verifier: 0x5FbDB2315678afccb333f8a9c45ead413b7c77bf
ZKPCertify: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
CertifyRegistry: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

**Simpan ketiga contract addresses ini!** Anda membutuhkannya untuk `.env` frontend.

✅ Blockchain dan smart contracts ready

---

## 4. Setup Zero-Knowledge Proof (ZKP)

ZK circuit dan proving keys sudah di-compile dan tersedia.

### 4.1 Verify ZK Files

```bash
cd zk/circuits
ls -lh certify.wasm certify.zkey verification_key.json
```

Expected:
```
-rw-r--r--  certify.wasm              30K  (WASM binary for circuit)
-rw-r--r--  certify.zkey             3.2K  (Proving key)
-rw-r--r--  verification_key.json    3.4K  (Verification key)
```

Jika file tidak ada, compile circuit ulang:

```bash
cd /Users/mac/Code/Certify/zk/circuits
./node_modules/.bin/circom certify.circom -o . --r1cs --wasm
snarkjs g16s certify.r1cs powers_final.ptau certify_final.zkey
snarkjs zkev certify_final.zkey verification_key.json
```

### 4.2 Copy ZK Files ke Frontend

```bash
cp certify.wasm certify.zkey verification_key.json \
   /Users/mac/Code/Certify/frontend/public/zk/
```

✅ ZK files ready untuk frontend

---

## 5. Setup Frontend

Frontend React + Vite + Wagmi untuk UI dan blockchain interaction.

### 5.1 Install Dependencies

```bash
cd frontend
npm install
```

### 5.2 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` dengan nilai dari deployment Anda:

```env
# Blockchain RPC dan kontrak (dari deploy.ts output)
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
VITE_VERIFIER_ADDRESS=0x5FbDB2315678afccb333f8a9c45ead413b7c77bf

# Backend API
VITE_API_BASE_URL=http://localhost:4000

# IPFS (Pinata) - optional untuk development
# Jika tidak ada, upload image akan disabled
VITE_PINATA_JWT=your-pinata-jwt-token-optional
VITE_GATEWAY_URL=https://gateway.pinata.cloud

# ZK Files (sudah di public/zk/)
VITE_ZKEY_URL=/zk/certify.zkey
VITE_WASM_URL=/zk/certify.wasm

# WalletConnect (optional)
VITE_WALLETCONNECT_ID=your-walletconnect-project-id-optional
```

### 5.3 Start Frontend Dev Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.0.0  ready in 245 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

✅ Frontend ready di `http://localhost:5173`

---

## 6. Setup MetaMask untuk Local Blockchain

### 6.1 Add Custom Network ke MetaMask

1. Buka MetaMask extension
2. Click jaringan dropdown → **Add Network**
3. Isi form:
   - **Network name**: `Hardhat Local`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency symbol**: `ETH`

4. Click **Save**

### 6.2 Import Account dari Hardhat

1. Click account icon → **Import Account**
2. Pilih **Private Key**
3. Copy private key dari hardhat node output (Account #0):
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb476cad4d0f5addcf4239bbb3f25
   ```
4. Paste dan **Import**

✅ MetaMask siap dengan account lokal yang punya ETH

---

## 7. Test System End-to-End

Buka browser ke `http://localhost:5173`

### Flow Testing:

**7.1 Login dengan SIWE**
- Click **Connect Wallet** → MetaMask
- Sign message untuk SIWE auth
- ✅ Should redirected ke dashboard

**7.2 Test Issuer Flow**
- Navigate ke `/issuer`
- Register issuance institution (one-time)
- Request approval (simulated - auto-approve untuk testing)
- Issue sertifikat dengan metadata
- ✅ Certificate appears on-chain

**7.3 Test Holder Flow**
- Switch to holder account (MetaMask)
- Navigate ke `/holder`
- View issued certificates
- Generate ZKP proof untuk selective disclosure
- ✅ Proof generated dan stored on IPFS

**7.4 Test Verifier Flow**
- Switch to verifier account
- Navigate ke `/verifier`
- Search sertifikat by ID
- Verify ZKP proof
- ✅ Verification result shown

---

## 8. Troubleshooting

### Port Already in Use

Jika port 5173 (frontend), 4000 (backend), atau 8545 (blockchain) sudah terpakai:

```bash
# Kill process pada port
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:4000 | xargs kill -9  # Backend
lsof -ti:8545 | xargs kill -9  # Blockchain
```

### MetaMask Connection Error

- Ensure Hardhat node running (`npx hardhat node`)
- Check RPC URL di MetaMask: `http://127.0.0.1:8545`
- Reset account: MetaMask → Account → Advanced → Reset Account

### ZKP Proof Generation Fails

Check konsol browser (F12) untuk error message:

```
Failed to fetch certify.wasm at /zk/certify.wasm
```

**Fix**: Verify ZK files di `frontend/public/zk/`

```bash
ls -la frontend/public/zk/
# Should show: certify.wasm, certify.zkey, verification_key.json
```

### "Holder not member" Error

Sertifikat hanya bisa di-issue ke holder yang sudah approve membership request.

**Fix** (Issuer):
1. Go to Issuer Dashboard → Member Requests
2. Find holder → **Approve**
3. Issue sertifikat

### IPFS Upload Fails (Optional)

IPFS upload optional untuk development. Tanpa IPFS:
- Gambar sertifikat: not displayed
- Metadata: still stored on-chain
- ZKP: still works

Untuk enable IPFS:
1. Sign up di [Pinata.cloud](https://pinata.cloud)
2. Generate API JWT token
3. Add ke `.env`: `VITE_PINATA_JWT=your-token`

---

## 9. Project Structure

```
Certify/
├── backend/                  # Express SIWE auth server
│   ├── src/
│   │   ├── server.ts        # Main server
│   │   └── types/           # Types
│   ├── .env.example
│   └── package.json
│
├── contracts/               # Hardhat + Solidity
│   ├── contracts/
│   │   ├── CertifyRegistry.sol       # Main on-chain registry
│   │   ├── ZKPCertify.sol            # Certificate + ZKP management
│   │   ├── verifier.sol              # Groth16 verifier (auto-generated)
│   │   └── IZKVerifier.sol           # Verifier interface
│   ├── scripts/
│   │   └── deploy.ts                 # Deployment script
│   ├── typechain-types/              # Auto-generated types
│   ├── hardhat.config.ts
│   └── package.json
│
├── zk/                      # Zero-Knowledge Proofs
│   ├── circuits/
│   │   ├── certify.circom            # Main ZK circuit
│   │   ├── certify.r1cs              # Compiled constraints
│   │   ├── certify.wasm              # WASM binary
│   │   ├── certify.zkey              # Proving key
│   │   ├── verification_key.json     # Verification key
│   │   ├── verifier.sol              # Groth16 verifier
│   │   └── powers_final.ptau         # Trusted setup
│   └── input.json                    # Sample circuit input
│
├── frontend/                # React + Vite + Wagmi
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppLayout.tsx         # Main layout
│   │   │   ├── AuthGuard.tsx         # SIWE protection
│   │   │   ├── IssuerDashboard.tsx   # Issuer UI
│   │   │   ├── HolderDashboard.tsx   # Holder UI
│   │   │   ├── VerifierDashboard.tsx # Verifier UI
│   │   │   └── ZkProofVerifier.tsx   # ZKP UI
│   │   ├── context/
│   │   │   └── AuthContext.tsx       # Auth state
│   │   ├── hooks/
│   │   │   ├── useCertifyContract.ts # Contract interaction
│   │   │   └── useLocalAccount.ts    # Local account management
│   │   ├── lib/
│   │   │   ├── zkp.ts                # ZKP proof generation
│   │   │   ├── contract.ts           # Contract setup
│   │   │   ├── abi.ts                # Contract ABI
│   │   │   ├── ipfs.ts               # IPFS upload
│   │   │   └── viemLocal.ts          # Viem client config
│   │   ├── types/
│   │   │   └── snarkjs.d.ts         # snarkjs types
│   │   └── main.tsx
│   ├── public/
│   │   └── zk/                       # ZK artifacts
│   │       ├── certify.wasm
│   │       ├── certify.zkey
│   │       └── verification_key.json
│   ├── .env.example
│   └── package.json
│
├── README.md                # Dokumentasi umum
├── SETUP_LOCAL.md          # File ini - Setup lokal
└── ARCHITECTURE.md         # (Optional) Technical architecture
```

---

## 10. Development Workflow

Selama development, jalankan 3 terminal:

**Terminal 1: Blockchain**
```bash
cd contracts
npx hardhat node
```

**Terminal 2: Backend**
```bash
cd backend
npm run dev
```

**Terminal 3: Frontend**
```bash
cd frontend
npm run dev
```

Buka `http://localhost:5173` di browser.

---

## 11. Key Features Reference

### Issuer Capabilities
- ✅ Register institution
- ✅ Manage member requests (approve/reject)
- ✅ Issue certificates dengan metadata
- ✅ Upload certificate image ke IPFS
- ✅ View issued certificates

### Holder Capabilities
- ✅ Request membership ke issuer
- ✅ View certificates issued to them
- ✅ Generate ZKP proof untuk selective disclosure
- ✅ Share certificate dengan encrypted payload
- ✅ View proof verification status

### Verifier Capabilities
- ✅ Search certificate by ID
- ✅ View certificate metadata + image
- ✅ Verify ZKP proof on-chain
- ✅ See disclosure history

### Smart Contract Security
- ✅ Immutable Groth16 verifier (cannot be swapped)
- ✅ Proof replay protection (nonce + hash tracking)
- ✅ Access control (only issuer can issue certificates)
- ✅ Certificate revocation
- ✅ SIWE authentication (backend)

### ZKP Security
- ✅ 256-bit cryptographic secret (full entropy)
- ✅ GPA threshold validation (actualGpa >= minGpa)
- ✅ Deterministic metadata hashing (canonical JSON)
- ✅ Groth16 zero-knowledge proofs

---

## 12. Next Steps

### For Production:
- [ ] Deploy ke testnet (Sepolia)
- [ ] Setup Redis untuk session store (backend)
- [ ] Enable HTTPS untuk production
- [ ] Rate limiting di backend
- [ ] Enhanced error handling

### For Features:
- [ ] Push notifications (XMTP / Push Protocol)
- [ ] Encrypted payload storage (Lit Protocol)
- [ ] Multiple verification fields
- [ ] Batch certificate issuance
- [ ] Audit logging

### For Security:
- [ ] Security audit dari third-party
- [ ] Penetration testing
- [ ] Bug bounty program

---

## 13. Support & Resources

- **Hardhat Docs**: https://hardhat.org/docs
- **Wagmi Docs**: https://wagmi.sh/docs
- **snarkjs Docs**: https://github.com/iden3/snarkjs
- **Circom Docs**: https://docs.circom.io
- **viem Docs**: https://viem.sh

---

## Quick Checklist

Sebelum mulai development:

- [ ] Node.js v18+ installed
- [ ] Clone repository
- [ ] Backend `.env` configured
- [ ] Backend running (`npm run dev` di port 4000)
- [ ] Blockchain running (`npx hardhat node` di port 8545)
- [ ] Contracts deployed (3 addresses saved)
- [ ] Frontend `.env` configured dengan contract addresses
- [ ] ZK files present di `frontend/public/zk/`
- [ ] MetaMask connected to Hardhat Local network
- [ ] Frontend running (`npm run dev` di port 5173)
- [ ] SIWE login working
- [ ] Ready to test!

---

**Happy coding! 🚀**

Jika ada pertanyaan atau issues, buat issue di repository.
