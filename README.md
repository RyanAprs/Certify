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

**Satu perintah menjalankan seluruh stack** (install → node → deploy → backend → frontend, Ctrl+C mematikan semua):

```bash
git clone <repository> && cd Certify
npm run dev            # buka http://localhost:5173
```

Lalu di MetaMask: tambah network RPC `http://127.0.0.1:8545`, Chain ID `31337`, dan import Account #0 dari output `[chain]` (admin/issuer default).

**(Opsional) aktifkan verifikasi ZK on-chain** — hanya butuh `circom` v2 (powers-of-tau di-generate otomatis oleh build):

```bash
npm run zk:build            # build 3 circuits → range/equality/membership + verifiers
FORCE_DEPLOY=1 npm run dev  # deploy ulang pakai verifier asli
```

> Tanpa `zk:build`, semua alur jalan; hanya tombol **"Verify on-chain"** yang nonaktif
> (verifier placeholder menolak semua proof, dan UI menampilkan peringatan).

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

**Multi-jenis kredensial** (schema-driven). Bawaan: `diploma.v1` (GPA),
`competency.v1` (score/level/skill), `license.v1` (authority/level/validUntil).
Menambah jenis baru cukup menambah schema di `frontend/src/lib/schemas.ts`.

**3 predikat selective-disclosure** (tiap klaim bisa memilih mana yang boleh dibuktikan):
- **range** — `nilai ≥ threshold` (juga expiry: `validUntil ≥ now`)
- **equality** — `nilai == X` (mendukung string, mis. "authority == BNSP")
- **membership** — `nilai ∈ {A, B, C}` tanpa ungkap yang mana

### Issuer (Penerbit)
- ✅ **Admin**: register / remove issuer dari web (panel admin)
- ✅ Approve/reject permohonan membership holder
- ✅ Pilih jenis kredensial → form dinamis dari schema; issue dengan image IPFS
- ✅ **Revoke / Reactivate** sertifikat langsung dari kartu

### Holder (Penerima)
- ✅ Request membership ke issuer
- ✅ View credentials
- ✅ Share dengan verifier (selective disclosure)

### Verifier (Pemverifikasi)
- ✅ Search credential by ID
- ✅ Presentation request: pilih **klaim + predikat** (threshold / equals / one-of / not-expired)
- ✅ Verify Groth16 proof on-chain (nilai tetap privat)
- ✅ See disclosure history

### Security & Privacy
- ✅ **Wallet Auth** - Connect via RainbowKit; on-chain roles enforce access
- ✅ **3 ZK Predicates** - range/equality/membership; semua constraint dienforce di circuit
- ✅ **Verifier Registry** - `predicateId → verifier`; tiap circuit punya verifier sendiri
- ✅ **Proof Replay Protection** - Setiap proof single-use (`usedProofs` hash tracking)
- ✅ **Merkle Commitment** - `metadataCommitment` = Merkle root dari klaim; proof terikat ke root
- ✅ **Blinding Salt** - Field element acak per klaim

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
RangeVerifier / EqualityVerifier / MembershipVerifier
  └─ verifyProof(a, b, c, uint[3]) → validasi Groth16 per circuit

CertifyRegistry (registry tunggal)
  ├─ Issuer management (AccessControl: DEFAULT_ADMIN_ROLE, ISSUER_ADMIN_ROLE)
  │    · registerIssuer / removeIssuer (admin)
  ├─ Membership approval flow
  ├─ Certificate lifecycle (Active/Pending/Revoked) + schemaId
  ├─ Selective disclosure tracking
  ├─ Verifier registry: mapping(predicateId → verifier), setVerifier (admin)
  └─ verifyRange / verifyEquality / verifyMembership → root binding + replay
```

### Contract Addresses

Setelah deploy, script menulis alamat + ABI otomatis ke
`frontend/src/lib/deployment.json` dan `CertifyRegistry.abi.json` — **tidak perlu
copy-paste manual**. `deployment.json` memuat `registry` + `rangeVerifier` +
`equalityVerifier` + `membershipVerifier` + `deploymentBlock`.

> `VITE_CONTRACT_ADDRESS` hanya diperlukan sebagai override manual.

### Key Contract Functions

**Admin:**
- `registerIssuer(addr)` / `removeIssuer(addr)` - Authorize/revoke an issuer
- `setVerifier(predicateId, addr)` - Register a predicate's Groth16 verifier

**Issuer:**
- `requestMembership(issuer)` / `manageMember(holder, approve)` - Membership flow
- `issueCertificate(holder, metadataCid, commitment, schemaId)` - Issue (commitment = Merkle root)
- `setCertificateStatus(certId, status)` - Revoke/reactivate (0=Pending,1=Active,2=Revoked)

**Holder:**
- `shareCertificate(certId, verifier, queryHash, encPayload)` - Share with verifier

**Verifier (all take `pubSignals = uint[3]`, `pubSignals[0]` must equal the Merkle root):**
- `verifyRangeProof(certId, a, b, c, [root, keyHash, threshold])`
- `verifyEqualityProof(certId, a, b, c, [root, keyHash, value])`
- `verifyMembershipProof(certId, a, b, c, [root, keyHash, setRoot])`

**Getter:**
- `certificates(certId)` - Certificate struct (id, issuer, holder, cid, commitment, status, issuedAt, schemaId)
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
1. Verifier cari credential → fetch dari blockchain (termasuk schemaId)
2. Metadata dari IPFS (via metadataCid) — berisi claims + salts
3. Pilih klaim + PREDIKAT (threshold / equals / one-of / not-expired) → bangun input:
   - value, salt, Merkle path                        (private)
   - keyHash, param (threshold | value | setRoot)    (public)
4. Generate proof dengan <predicate>.wasm + .zkey (snarkjs Groth16)
5. Public signals: [root, keyHash, param]   (root = Merkle root klaim)
6. Submit ke verify{Range|Equality|Membership}Proof(certId, a, b, c, pubSignals)
7. Kontrak pilih verifier via registry, cek root == cert.metadataCommitment,
   cek replay, verifikasi Groth16 → emit ZKVerified(certId, verifier, predicateId, keyHash, param)
```

### IPFS Integration

Metadata & images disimpan di IPFS (Pinata optional):

```
Certificate Lifecycle:
├─ Issuer uploads image → IPFS → imageCid
├─ Issuer creates metadata JSON with imageCid
├─ Uploads metadata (incl. secret) → IPFS → metadataCid
├─ Computes commitment: Merkle root of the claims (Poseidon leaves)
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
- ✅ **3 Predicates** - range (`GreaterEqThan`), equality & membership (Merkle inclusion) — semua constraint dienforce di circuit
- ✅ **Poseidon Commitment** - Hash yang collision-resistant & binding di dalam circuit
- ✅ **Commitment Binding** - `pubSignals[0]` (Merkle root) harus == `cert.metadataCommitment`
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
6. metadataCommitment = Merkle root of the claims → stored on-chain (+ schemaId)
```

### Holder/Verifier Proving GPA
```
1. Fetch certificate from blockchain
2. Fetch metadata from IPFS (berisi gpa + secret)
3. Pilih klaim + threshold (mis. GPA ≥ 3.5, atau score ≥ 80)
4. Generate ZK proof locally:
   - Private: value, salt, Merkle path
   - Public:  keyHash, threshold
5. Send proof to CertifyRegistry.verifyRangeProof
6. Contract verifies: value >= threshold (enforced di circuit) + root match
7. ZKVerified event emitted
```

### Verifier Checking Proof
```
1. Get certificate ID from holder
2. Fetch certificate metadata from IPFS
3. View proof verification status from blockchain
4. Confirms holder proved value >= threshold (nilai tetap privat)
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
- Run `npm run zk:build` to build the 3 circuits into `frontend/public/zk/` (auto-generates powers-of-tau, no download)
- Requires `circom` v2 installed

**Q: On-chain verify always reverts "invalid proof"**
- The deployed verifiers are placeholders. Run `npm run zk:build` (regenerates the 3 verifiers), then `FORCE_DEPLOY=1 npm run dev`.

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

**Version:** 5.0.0 — multi-type credentials (diploma/competency/license), claims + Merkle-root commitment, 3 ZK predicates (range/equality/membership) via a verifier registry, admin issuer panel + revoke, wallet-based roles, one-command dev runner
