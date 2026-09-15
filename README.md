# Certify

**Decentralized Certificate Verification System with Zero-Knowledge Proofs**

A blockchain-based academic certificate verification system that combines:
- **Solidity + Hardhat** for smart contracts
- **React + Vite + Wagmi** for the frontend
- **IPFS (Pinata)** for distributed storage
- **Circom + snarkjs** for zero-knowledge proofs
- **Express.js** for SIWE authentication

Certify enables issuers to issue certificates, holders to store & share them with selective disclosure using ZKP, and verifiers to verify without seeing sensitive data.

## 🚀 Quick Start

**For local setup with complete instructions, see [SETUP_LOCAL.md](./SETUP_LOCAL.md)**

**A single command runs the entire stack** (install → node → deploy → backend → frontend, Ctrl+C shuts everything down):

```bash
git clone <repository> && cd Certify
npm run dev            # open http://localhost:5173
```

Then in MetaMask: add the RPC network `http://127.0.0.1:8545`, Chain ID `31337`, and import Account #0 from the `[chain]` output (the default admin/issuer).

**(Optional) enable on-chain ZK verification** — only requires `circom` v2 (powers-of-tau is generated automatically by the build):

```bash
npm run zk:build            # build 3 circuits → range/equality/membership + verifiers
FORCE_DEPLOY=1 npm run dev  # redeploy using the real verifiers
```

> Without `zk:build`, all flows work; only the **"Verify on-chain"** button is disabled
> (the placeholder verifiers reject all proofs, and the UI shows a warning).

---

## Monorepo Structure

```
Certify
├─ contracts/        # Hardhat + Solidity smart contracts
├─ frontend/         # React + Vite + Wagmi UI
├─ backend/          # Express.js SIWE auth server
├─ zk/               # Circom circuits + snarkjs
├─ README.md         # This file
├─ SETUP_LOCAL.md    # 📖 Local setup guide (read this first!)
└─ ARCHITECTURE.md   # 📖 Technical documentation
```

## ✨ Key Features

**Multi-type credentials** (schema-driven). Built-in: `diploma.v1` (GPA),
`competency.v1` (score/level/skill), `license.v1` (authority/level/validUntil).
Adding a new type only requires adding a schema in `frontend/src/lib/schemas.ts`.

**3 selective-disclosure predicates** (each claim can choose which ones may be proven):
- **range** — `value ≥ threshold` (also expiry: `validUntil ≥ now`)
- **equality** — `value == X` (supports strings, e.g. "authority == BNSP")
- **membership** — `value ∈ {A, B, C}` without revealing which one

### Issuer
- ✅ **Admin**: register / remove issuer from the web (admin panel)
- ✅ Approve/reject holder membership requests
- ✅ Select credential type → dynamic form from the schema; issue with an IPFS image
- ✅ **Revoke / Reactivate** certificates directly from the card

### Holder
- ✅ Request membership from an issuer
- ✅ View credentials
- ✅ Share with a verifier (selective disclosure)

### Verifier
- ✅ Search credential by ID
- ✅ Presentation request: select **claim + predicate** (threshold / equals / one-of / not-expired)
- ✅ Verify Groth16 proof on-chain (values stay private)
- ✅ See disclosure history

### Security & Privacy
- ✅ **Wallet Auth** - Connect via RainbowKit; on-chain roles enforce access
- ✅ **3 ZK Predicates** - range/equality/membership; all constraints enforced in the circuit
- ✅ **Verifier Registry** - `predicateId → verifier`; tiap circuit punya verifier sendiri
- ✅ **Proof Replay Protection** - Setiap proof single-use (`usedProofs` hash tracking)
- ✅ **Merkle Commitment** - `metadataCommitment` = Merkle root of the claims; proof bound to the root
- ✅ **Blinding Salt** - Random field element per claim

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[SETUP_LOCAL.md](./SETUP_LOCAL.md)** | 🔥 **START HERE** - Complete local setup guide |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical design & implementation details |
| **README.md** | Overview (this file) |

---

## Smart Contracts

### Deployment Architecture

A single registry (not two — the old `ZKPCertify` has been removed):

```
RangeVerifier / EqualityVerifier / MembershipVerifier
  └─ verifyProof(a, b, c, uint[3]) → Groth16 validation per circuit

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

After deployment, the script automatically writes the addresses + ABI to
`frontend/src/lib/deployment.json` and `CertifyRegistry.abi.json` — **no manual
copy-paste needed**. `deployment.json` contains `registry` + `rangeVerifier` +
`equalityVerifier` + `membershipVerifier` + `deploymentBlock`.

> `VITE_CONTRACT_ADDRESS` is only needed as a manual override.

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

Express.js server for Sign-In with Ethereum authentication.

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

React 18 + Vite + Wagmi + RainbowKit for the user interface.

**Setup:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

**Environment Variables** (the contract address comes from `deployment.json`, so this is optional):
```env
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CONTRACT_ADDRESS=            # optional: override deployment.json
VITE_API_BASE_URL=http://localhost:4000
VITE_PINATA_JWT=your-token-optional
VITE_GATEWAY_URL=gateway.pinata.cloud
VITE_WALLETCONNECT_ID=            # optional (mobile wallets)
```

**Routes (gated by `RoleGuard` + wallet connection):**
- `/` - Landing page (connect wallet)
- `/issuer` - Issuer dashboard (requires on-chain issuer role)
- `/holder` - Holder dashboard (requires a connected wallet)
- `/verifier` - Verifier dashboard (requires a connected wallet)

### ZKP Proof Generation Flow

```
1. Verifier searches for a credential → fetch from blockchain (including schemaId)
2. Metadata from IPFS (via metadataCid) — contains claims + salts
3. Select claim + PREDICATE (threshold / equals / one-of / not-expired) → build inputs:
   - value, salt, Merkle path                        (private)
   - keyHash, param (threshold | value | setRoot)    (public)
4. Generate proof with <predicate>.wasm + .zkey (snarkjs Groth16)
5. Public signals: [root, keyHash, param]   (root = Merkle root of the claims)
6. Submit to verify{Range|Equality|Membership}Proof(certId, a, b, c, pubSignals)
7. Contract selects the verifier via registry, checks root == cert.metadataCommitment,
   checks replay, verifies Groth16 → emit ZKVerified(certId, verifier, predicateId, keyHash, param)
```

### IPFS Integration

Metadata & images are stored on IPFS (Pinata optional):

```
Certificate Lifecycle:
├─ Issuer uploads image → IPFS → imageCid
├─ Issuer creates metadata JSON with imageCid
├─ Uploads metadata (incl. secret) → IPFS → metadataCid
├─ Computes commitment: Merkle root of the claims (Poseidon leaves)
├─ Issues certificate on-chain (metadataCid + commitment)
└─ Holder/Verifier can retrieve metadata from IPFS

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
- ✅ **Revocation** - Issuer can revoke certificates
- ✅ **OpenZeppelin** - Audited library for AccessControl

### Zero-Knowledge Proofs
- ✅ **Groth16** - Industry-standard, fast verification
- ✅ **3 Predicates** - range (`GreaterEqThan`), equality & membership (Merkle inclusion) — all constraints enforced in the circuit
- ✅ **Poseidon Commitment** - A collision-resistant & binding hash inside the circuit
- ✅ **Commitment Binding** - `pubSignals[0]` (Merkle root) must == `cert.metadataCommitment`
- ✅ **Replay Protection** - `usedProofs[proofHash]` rejects the same proof twice

### Authentication
- Wallet-based via **RainbowKit** (wallet connection = identity). Write actions
  are signed by the wallet, and per-role access is determined by on-chain state.
- The **SIWE** backend (Express) is available optionally for cookie sessions
  (nonce TTL, HTTPOnly + SameSite, domain validation) — not required for the core flow.

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
2. Fetch metadata from IPFS (contains gpa + secret)
3. Select claim + threshold (e.g. GPA ≥ 3.5, or score ≥ 80)
4. Generate ZK proof locally:
   - Private: value, salt, Merkle path
   - Public:  keyHash, threshold
5. Send proof to CertifyRegistry.verifyRangeProof
6. Contract verifies: value >= threshold (enforced in the circuit) + root match
7. ZKVerified event emitted
```

### Verifier Checking Proof
```
1. Get certificate ID from holder
2. Fetch certificate metadata from IPFS
3. View proof verification status from blockchain
4. Confirms holder proved value >= threshold (values stay private)
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

See [SETUP_LOCAL.md](./SETUP_LOCAL.md) Section 8 for complete troubleshooting.

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
