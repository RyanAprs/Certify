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

# 2. (sekali) Build ZK circuit — butuh circom v2 + snarkjs
cd zk && ./build.sh          # menghasilkan wasm/zkey + verifier.sol

# 3. Terminal 1: Blockchain
cd contracts && npm install && npx hardhat node

# 4. Terminal 1b: Deploy (menulis alamat+ABI ke frontend otomatis)
cd contracts && npm run deploy:local

# 5. Terminal 2: Backend
cd backend && npm install && npm run dev

# 6. Terminal 3: Frontend
cd frontend && npm install && npm run dev
```

Buka `http://localhost:5173`, connect wallet (Hardhat chain 31337).

> Kalau langkah 2 dilewati, kontrak tetap deploy tapi verifier-nya placeholder
> yang menolak semua proof — verifikasi ZK on-chain baru hidup setelah `build.sh`.

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
- ✅ **Wallet Auth** - Connect via RainbowKit; on-chain roles enforce access
- ✅ **ZKP-based Verification** - Holder proves GPA >= threshold tanpa reveal GPA (range check dienforce di circuit)
- ✅ **Immutable Verifier** - Alamat verifier di-set di constructor, tidak bisa di-swap
- ✅ **Proof Replay Protection** - Setiap proof single-use (`usedProofs` hash tracking)
- ✅ **Poseidon Commitment** - `Poseidon(gpa, secret)` mengikat proof ke sertifikat
- ✅ **Blinding Secret** - Field element acak per sertifikat

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[SETUP_LOCAL.md](./SETUP_LOCAL.md)** | 🔥 **START HERE** - Complete local setup guide |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical design & implementation details |
| **README.md** | Overview (file ini) |

---

## Smart Contracts

### Deployment Architecture

Satu registry (bukan dua — `ZKPCertify` lama sudah dihapus):

```
Groth16Verifier (di-generate snarkjs dari circuit)
  └─ verifyProof(a, b, c, [commitment, minGpa]) → validasi proof

CertifyRegistry (registry tunggal)
  ├─ Issuer management (AccessControl: ISSUER_ADMIN_ROLE)
  ├─ Membership approval flow
  ├─ Certificate lifecycle (Active/Pending/Revoked)
  ├─ Selective disclosure tracking
  └─ verifySelectiveProof() → commitment binding + replay protection
```

### Contract Addresses

Setelah deploy, script menulis alamat + ABI otomatis ke
`frontend/src/lib/deployment.json` dan `CertifyRegistry.abi.json` — **tidak perlu
copy-paste manual**. Di localhost (deployer default Hardhat) alamatnya deterministik:

```
Groth16Verifier:   0x5FbDB2315678afccb333f8a9c45ead413b7c77bf
CertifyRegistry:   0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

> Alamat sudah tersedia untuk frontend lewat `deployment.json`. `VITE_CONTRACT_ADDRESS`
> hanya diperlukan sebagai override manual.

### Key Contract Functions

**Issuer:**
- `requestMembership(issuer)` - Holder requests to join
- `manageMember(holder, approve)` - Issuer approves/rejects
- `issueCertificate(holder, metadataCid, commitment)` - Issue cert

**Holder:**
- `shareCertificate(certId, verifier, queryHash, encPayload)` - Share with verifier

**Verifier:**
- `verifySelectiveProof(certId, a, b, c, pubSignals)` - Verify Groth16 proof on-chain
  (`pubSignals = [commitment, minGpa]`; commitment harus cocok dengan sertifikat)

**Getter:**
- `certificates(certId)` - Certificate struct (id, issuer, holder, cid, commitment, status, issuedAt)
- `getHolderCertificates(holder)` - List holder's certs
- `getIssuerCertificates(issuer)` - List issuer's certs
- `getDisclosures(certId)` - Selective-disclosure history

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

**Environment Variables** (alamat kontrak datang dari `deployment.json`, jadi ini opsional):
```env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CONTRACT_ADDRESS=            # opsional: override deployment.json
VITE_API_BASE_URL=http://localhost:4000
VITE_PINATA_JWT=your-token-optional
VITE_GATEWAY_URL=gateway.pinata.cloud
VITE_WALLETCONNECT_ID=            # opsional (mobile wallets)
```

**Routes (gated by `RoleGuard` + wallet connection):**
- `/` - Landing page (connect wallet)
- `/issuer` - Issuer dashboard (butuh on-chain issuer role)
- `/holder` - Holder dashboard (butuh wallet terhubung)
- `/verifier` - Verifier dashboard (butuh wallet terhubung)

### ZKP Proof Generation Flow

```
1. Verifier/Holder cari sertifikat → fetch dari blockchain
2. Metadata dari IPFS (via metadataCid) — berisi gpa + secret
3. Circuit inputs:
   - gpa    (private, scaled ×100)
   - secret (private, blinding factor)
   - minGpa (public, scaled ×100)
4. Generate proof dengan certify.wasm + certify.zkey (snarkjs Groth16)
5. Public signals: [commitment, minGpa]   (commitment = Poseidon(gpa, secret))
6. Submit ke CertifyRegistry.verifySelectiveProof(certId, a, b, c, pubSignals)
7. Kontrak cek commitment == cert.metadataCommitment, cek replay, verifikasi
   Groth16 → emit ZKVerified
```

### IPFS Integration

Metadata & images disimpan di IPFS (Pinata optional):

```
Certificate Lifecycle:
├─ Issuer uploads image → IPFS → imageCid
├─ Issuer creates metadata JSON with imageCid
├─ Uploads metadata (incl. secret) → IPFS → metadataCid
├─ Computes commitment: Poseidon(gpaScaled, secret)
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
- ✅ **Enforced GPA Range** - `GreaterEqThan` constraint benar-benar meng-enforce `gpa >= minGpa` (bug lama: dulu tidak di-cek sama sekali)
- ✅ **Poseidon Commitment** - Hash yang collision-resistant & binding di dalam circuit
- ✅ **Commitment Binding** - Proof terikat ke `cert.metadataCommitment` on-chain
- ✅ **Replay Protection** - `usedProofs[proofHash]` menolak proof yang sama dua kali

### Authentication
- Wallet-based via **RainbowKit** (koneksi wallet = identitas). Aksi write
  ditandatangani wallet, akses per-role ditentukan state on-chain.
- Backend **SIWE** (Express) tersedia opsional untuk sesi cookie
  (nonce TTL, HTTPOnly + SameSite, validasi domain) — tidak wajib untuk alur inti.

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
6. metadataCommitment = Poseidon(gpaScaled, secret) → stored on-chain
```

### Holder/Verifier Proving GPA
```
1. Fetch certificate from blockchain
2. Fetch metadata from IPFS (berisi gpa + secret)
3. Set minGpa threshold (e.g., 3.5)
4. Generate ZK proof locally:
   - Private: gpa, secret
   - Public:  minGpa
5. Send proof to CertifyRegistry.verifySelectiveProof
6. Contract verifies: gpa >= minGpa (enforced di circuit) + commitment match
7. ZKVerified event emitted
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

**Q: ZKP proof generation fails / Verifier page shows "ZK artifacts missing"**
- Run `cd zk && ./build.sh` to generate `certify.wasm`/`certify.zkey` into `frontend/public/zk/`
- Requires `circom` v2 installed

**Q: On-chain verify always reverts "invalid proof"**
- The deployed verifier is the placeholder. Run `zk/build.sh` (regenerates `verifier.sol`), then redeploy.

**Q: Contract address mismatch**
- Re-run `npm run deploy:local` — it rewrites `frontend/src/lib/deployment.json` automatically

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

**Version:** 3.0.0 — single registry, sound Groth16 GPA circuit (Poseidon commitment + enforced range), wallet-based role access
