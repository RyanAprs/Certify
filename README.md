# Certify

**Decentralized Certificate Verification System with Zero-Knowledge Proofs**

Sistem verifikasi sertifikat akademik berbasis blockchain yang menggabungkan:
- **Solidity + Hardhat** untuk smart contracts
- **React + Vite + Wagmi** untuk frontend
- **IPFS (Pinata)** untuk distributed storage
- **Circom + snarkjs** untuk zero-knowledge proofs
- **Express.js** untuk SIWE authentication

Certify memungkinkan issuers menerbitkan sertifikat, holders menyimpan & membagikan dengan selective disclosure menggunakan ZKP, dan verifiers memverifikasi tanpa melihat data sensitif.

## 🚀 Quick Start

**Untuk setup lokal dengan instruksi lengkap, lihat [SETUP_LOCAL.md](./SETUP_LOCAL.md)**

```bash
# 1. Clone & setup
git clone <repository>
cd Certify

# 2. Terminal 1: Blockchain
cd contracts && npx hardhat node

# 3. Terminal 2: Backend  
cd backend && npm install && npm run dev

# 4. Terminal 3: Frontend
cd frontend && npm install && npm run dev
```

Buka `http://localhost:5173` di browser.

---

## Monorepo Struktur

```
Certify
├─ contracts/        # Hardhat + Solidity smart contracts
├─ frontend/         # React + Vite + Wagmi UI
├─ backend/          # Express.js SIWE auth server
├─ zk/               # Circom circuits + snarkjs
├─ README.md         # File ini
├─ SETUP_LOCAL.md    # 📖 Panduan setup lokal (baca ini dulu!)
└─ ARCHITECTURE.md   # 📖 Dokumentasi teknis
```

## ✨ Fitur Utama

### Issuer (Penerbit Sertifikat)
- ✅ Register institusi penerbit
- ✅ Manage membership requests (approve/reject holders)
- ✅ Issue certificates dengan metadata & IPFS image
- ✅ View issued certificates on-chain
- ✅ Revoke certificates jika diperlukan

### Holder (Penerima Sertifikat)
- ✅ Request membership ke issuer
- ✅ View issued certificates
- ✅ Generate Groth16 ZK proofs untuk selective disclosure
- ✅ Share certificates dengan verifier (encrypted payload)
- ✅ Maintain privacy dengan ZKP

### Verifier (Pihak yang Memverifikasi)
- ✅ Search certificates by ID
- ✅ View certificate metadata & images
- ✅ Verify ZKP proofs on-chain
- ✅ See disclosure history
- ✅ Validate GPA thresholds via ZKP

### Security & Privacy
- ✅ **SIWE Authentication** - Sign-In with Ethereum
- ✅ **ZKP-based Verification** - Holder proves GPA >= threshold tanpa reveal GPA
- ✅ **Immutable Verifier** - Contract verifier tidak bisa di-swap
- ✅ **Proof Replay Protection** - Nonce & hash tracking
- ✅ **Metadata Commitment** - Keccak256 hash untuk integrity
- ✅ **Full Entropy** - 256-bit random secret untuk proofs

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[SETUP_LOCAL.md](./SETUP_LOCAL.md)** | 🔥 **START HERE** - Complete local setup guide |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical design & implementation details |
| **README.md** | Overview (file ini) |

---

## Smart Contracts

### Deployment Architecture

```
Groth16Verifier (auto-generated)
  └─ verifyProof() - Validates ZK proofs

ZKPCertify
  ├─ Certificate management
  ├─ Member approval flow
  ├─ ZKP verification with nonce
  └─ Proof replay protection

CertifyRegistry
  ├─ Issuer management
  ├─ Certificate lifecycle
  ├─ Disclosure tracking
  └─ Public verification
```

### Contract Addresses

Setelah deploy ke localhost, Anda akan dapat 3 addresses:

```
Groth16 Verifier:   0x5FbDB2315678afccb333f8a9c45ead413b7c77bf
ZKPCertify:         0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
CertifyRegistry:    0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

⚠️ **Important**: Simpan addresses ini untuk `.env` frontend!

### Key Contract Functions

**Issuer:**
- `requestMembership(issuer)` - Holder requests to join
- `manageMember(holder, approve)` - Issuer approves/rejects
- `issueCertificate(holder, metadataCid, commitment)` - Issue cert

**Holder:**
- `shareCertificate(certId, verifier, queryHash, encPayload)` - Share with verifier

**Verifier:**
- `verifySelectiveProof(certId, proof, queryHash)` - Verify proof on-chain

**Getter:**
- `getCertificate(certId)` - Get cert details
- `getHolderCertificates(holder)` - List holder's certs
- `getIssuerCertificates(issuer)` - List issuer's certs

## Backend (SIWE Authentication)

Express.js server untuk Sign-In with Ethereum authentication.

**Setup:**
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**Environment Variables:**
```env
PORT=4000                           # Server port
SESSION_SECRET=your-random-32-chars # Min 32 chars
NODE_ENV=development
```

**API Endpoints:**
- `GET /api/auth/nonce` - Get SIWE nonce
- `POST /api/auth/verify` - Verify signed message
- `GET /api/auth/me` - Get current session
- `POST /api/auth/logout` - Logout

---

## Frontend (React + Vite)

React 18 + Vite + Wagmi + RainbowKit untuk user interface.

**Setup:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

**Environment Variables (IMPORTANT - dari deploy.ts output):**
```env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CONTRACT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
VITE_VERIFIER_ADDRESS=0x5FbDB2315678afccb333f8a9c45ead413b7c77bf
VITE_API_BASE_URL=http://localhost:4000
VITE_ZKEY_URL=/zk/certify.zkey
VITE_WASM_URL=/zk/certify.wasm
VITE_PINATA_JWT=your-token-optional
VITE_GATEWAY_URL=https://gateway.pinata.cloud
```

**Routes (Protected by AuthGuard):**
- `/` - Landing page
- `/issuer` - Issuer dashboard
- `/holder` - Holder dashboard  
- `/verifier` - Verifier dashboard

### ZKP Proof Generation Flow

```
1. Holder selects certificate → fetch from blockchain
2. Metadata dari IPFS (via metadataCid)
3. Generate circuit inputs:
   - secret: random 256-bit
   - metadataHash: keccak256(metadata)
   - actualGpa: from metadata
   - minGpa: user input
   - nonce: from certificate on-chain
4. Generate proof menggunakan certify.wasm + certify.zkey
5. Get public signals: [metadataCommitment, minGpa, nonce]
6. Submit proof ke contract verifyGpaProof()
7. Contract verifies on-chain → event emitted
```

### IPFS Integration

Metadata & images disimpan di IPFS (Pinata optional):

```
Certificate Lifecycle:
├─ Issuer uploads image → IPFS → imageCid
├─ Issuer creates metadata JSON with imageCid
├─ Uploads metadata → IPFS → metadataCid
├─ Computes commitment: keccak256(metadata)
├─ Issues certificate on-chain (metadataCid + commitment)
└─ Holder/Verifier dapat retrieve metadata dari IPFS

Selective Disclosure:
├─ Holder selects subset of fields → queryHash
├─ Encrypts subset → IPFS → encryptedPayloadCid
├─ Shares (queryHash + encryptedPayloadCid) on-chain
└─ Verifier retrieves encrypted payload for verification
```

### Development Stack

- **UI Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State**: React Context + Custom hooks
- **Blockchain**: Wagmi + Viem
- **Wallet**: RainbowKit
- **Build**: Vite
- **ZKP**: snarkjs (Groth16)
- **Storage**: IPFS (Pinata)

---

## 🛡️ Security Features

### Smart Contracts
- ✅ **Immutable Verifier** - Cannot be swapped after deployment
- ✅ **Access Control** - OnlyIssuer modifier on sensitive functions  
- ✅ **Replay Protection** - Nonce + proof hash tracking
- ✅ **Revocation** - Issuer dapat revoke certificates
- ✅ **OpenZeppelin** - Audited library untuk AccessControl

### Zero-Knowledge Proofs
- ✅ **Groth16** - Industry-standard, fast verification
- ✅ **256-bit Secrets** - Full cryptographic entropy
- ✅ **GPA Validation** - Proves actualGpa >= minGpa in circuit
- ✅ **Commitment Verification** - Ensures correct metadata
- ✅ **Canonical JSON** - Deterministic hashing

### Authentication
- ✅ **SIWE** - Wallet-based sign-in (no passwords)
- ✅ **HTTPOnly Cookies** - Session management
- ✅ **SameSite Cookies** - CSRF protection
- ✅ **Signature Verification** - Backend validates SIWE messages

### Data Privacy
- ✅ **Selective Disclosure** - Holder reveals only needed fields
- ✅ **IPFS Storage** - Distributed, no central server
- ✅ **Encrypted Payloads** - Shared data encrypted on IPFS
- ✅ **Zero-Knowledge** - Verifier never sees raw GPA

---

## 📈 System Requirements

### Local Development
- **Node.js** v18+
- **npm** v9+
- **4GB RAM** minimum
- **2GB Disk** free
- **Modern browser** (Chrome, Firefox, Safari, Edge)

### Blockchain
- **Hardhat** (local blockchain simulation)
- **Chain ID**: 31337 (Hardhat local)
- **RPC**: http://127.0.0.1:8545

### Optional Services
- **Pinata** (IPFS gateway) - For image/metadata storage
- **WalletConnect** - For mobile wallet connection

---

## 🔄 Workflow Examples

### Issuer Issuing a Certificate
```
1. Register institution (one-time)
2. Approve member request from holder
3. Upload certificate image → IPFS
4. Create metadata (name, GPA, institution, etc.)
5. Issue certificate → stored on-chain
6. metadataCommitment = keccak256(metadata) → stored on-chain
```

### Holder Proving GPA
```
1. Fetch certificate from blockchain
2. Fetch metadata from IPFS
3. Set minGpa threshold (e.g., 3.5)
4. Generate ZK proof locally:
   - Private: secret, metadataHash, actualGpa
   - Public: minGpa, nonce
5. Send proof to blockchain
6. Contract verifies: actualGpa >= minGpa (in ZKP)
7. Proof verified event emitted
```

### Verifier Checking Proof
```
1. Get certificate ID from holder
2. Fetch certificate metadata from IPFS
3. View proof verification status from blockchain
4. Confirms holder proved GPA >= minGpa
5. No actual GPA value revealed ✅
```

---

## 🚀 Deployment Options

### Local Development
```bash
# See SETUP_LOCAL.md for detailed instructions
npx hardhat node              # Blockchain
npm run dev                   # Backend & Frontend
```

### Testnet (Sepolia)
```bash
# Set PRIVATE_KEY and RPC_URL in .env
npx hardhat run scripts/deploy.ts --network sepolia
```

### Production (Future)
- Deploy to mainnet
- Use Infura or Alchemy for RPC
- Redis for session store
- Nginx for reverse proxy
- PM2 for process management

---

## 📞 Troubleshooting

**Q: Blockchain connection failed**
- Ensure `npx hardhat node` running
- Check RPC URL in MetaMask: `http://127.0.0.1:8545`

**Q: ZKP proof generation fails**
- Check `/zk/certify.wasm` exists in `frontend/public/zk/`
- Verify `VITE_WASM_URL` and `VITE_ZKEY_URL` in `.env`

**Q: Contract address mismatch**
- Re-run `npx hardhat run scripts/deploy.ts --network localhost`
- Update `.env` with new addresses

**Q: SIWE login fails**
- Ensure backend running at `VITE_API_BASE_URL`
- Check MetaMask connected to correct network
- Clear browser cookies

**Q: IPFS upload disabled**
- IPFS optional; certificate works without it
- To enable, add `VITE_PINATA_JWT` to `.env`

See [SETUP_LOCAL.md](./SETUP_LOCAL.md) Section 8 untuk troubleshooting lengkap.

---

## 📚 Learn More

- **[SETUP_LOCAL.md](./SETUP_LOCAL.md)** - Complete setup guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical design docs
- [Groth16 Paper](https://eprint.iacr.org/2016/260.pdf)
- [Circom Docs](https://docs.circom.io)
- [Hardhat Docs](https://hardhat.org/docs)

---

## 📄 License

MIT License - See LICENSE file

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch
3. Submit pull request
4. Add tests for new features

---

**Last Updated:** July 5, 2026  
**Version:** 2.0.0 (with Groth16 ZKP)
