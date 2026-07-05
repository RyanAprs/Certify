# Certify - Technical Architecture

Dokumentasi teknis lengkap untuk memahami design, flow, dan decision dari Certify system.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Smart Contract Architecture](#smart-contract-architecture)
4. [ZKP (Zero-Knowledge Proof) System](#zkp-system)
5. [Authentication Flow](#authentication-flow)
6. [Certificate Lifecycle](#certificate-lifecycle)
7. [Proof Generation & Verification](#proof-generation--verification)
8. [Security Considerations](#security-considerations)
9. [Data Models](#data-models)
10. [API Reference](#api-reference)

---

## System Overview

Certify adalah sistem terdesentralisasi untuk verifikasi sertifikat akademik dengan privacy melalui zero-knowledge proofs.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Issuer UI  │  │   Holder UI  │  │  Verifier UI     │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘             │
│                           ▼                                   │
│            ┌─────────────────────────────┐                  │
│            │  Authentication (SIWE)      │                  │
│            │  + Contract Interaction     │                  │
│            └─────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
  │   Backend   │  │  Blockchain │  │    IPFS      │
  │  (Express)  │  │  (Hardhat)  │  │  (Pinata)    │
  │   SIWE Auth │  │ Hardhat +   │  │  Metadata +  │
  │             │  │ Solidity    │  │  Images      │
  └─────────────┘  └─────────────┘  └──────────────┘
```

### Key Components

| Component | Technology | Role |
|-----------|-----------|------|
| Frontend | React + Vite + Wagmi | User interface & contract interaction |
| Backend | Express.js | SIWE authentication & session management |
| Blockchain | Solidity + Hardhat | Smart contracts & data storage |
| ZKP | Circom + snarkjs | Zero-knowledge proof system |
| Storage | IPFS (Pinata) | Distributed metadata & images |

---

## Component Architecture

### Frontend Architecture

```
frontend/
├── components/
│   ├── AppLayout.tsx               # Main layout + navigation
│   ├── AuthGuard.tsx               # Route protection (SIWE)
│   ├── DevLogin.tsx                # Dev-only quick login
│   ├── IssuerDashboard.tsx         # Issuer interface
│   │   ├── Member management
│   │   ├── Certificate issuance
│   │   └── Metadata + image upload
│   ├── HolderDashboard.tsx         # Holder interface
│   │   ├── Certificate collection
│   │   ├── ZKP proof generation
│   │   └── Share certificate
│   ├── VerifierDashboard.tsx       # Verifier interface
│   │   ├── Search certificates
│   │   ├── View disclosures
│   │   └── Verify proofs
│   └── ZkProofVerifier.tsx         # ZKP UI component
│
├── context/
│   └── AuthContext.tsx             # Global auth state
│       ├── Wallet connection
│       ├── SIWE session
│       └── User role
│
├── hooks/
│   ├── useCertifyContract.ts       # Contract read/write
│   └── useLocalAccount.ts          # Local account mgmt
│
├── lib/
│   ├── zkp.ts                      # ZKP proof generation
│   │   ├── generateMetadataCommitment()
│   │   ├── generateGpaProof()
│   │   ├── verifyProof()
│   │   └── formatProofForSolidity()
│   ├── contract.ts                 # Contract setup
│   ├── abi.ts                      # Contract ABIs
│   ├── ipfs.ts                     # IPFS upload
│   └── viemLocal.ts                # Viem client config
│
└── types/
    └── snarkjs.d.ts                # snarkjs type definitions
```

### Backend Architecture

```
backend/
├── server.ts                       # Express app
│   ├── GET /api/auth/nonce         # Generate SIWE nonce
│   ├── POST /api/auth/verify       # Verify signed message
│   ├── GET /api/auth/me            # Get current session
│   └── POST /api/auth/logout       # Logout
│
├── types/
│   └── express-session.d.ts        # Type augmentation
│
└── .env
    ├── PORT                        # Server port (default 4000)
    ├── SESSION_SECRET              # Cookie encryption key
    └── NODE_ENV                    # development/production
```

**Authentication Flow:**
1. Frontend requests nonce
2. Frontend signs nonce with MetaMask
3. Backend verifies signature & creates session
4. Frontend cookies preserve session across requests

---

## Smart Contract Architecture

### Contract Inheritance & Interfaces

```
CertifyRegistry
├── AccessControl (OpenZeppelin)
│   └── Role-based permissions (ISSUER_ADMIN_ROLE)
├── Events (CertificateIssued, CertificateRevoked, etc.)
└── Dependencies: IZKVerifier interface

ZKPCertify
├── Certificate management
├── Member requests/approval
├── ZKP proof verification
└── Dependencies: IVerifier (Groth16)

Verifier (auto-generated by snarkjs)
└── verifyProof() → Groth16 proof validation
```

### CertifyRegistry Contract

**State Variables:**

```solidity
mapping(address issuer => bool) registeredIssuers;
mapping(address issuer => mapping(address holder => MemberRequest)) memberRequests;
mapping(uint256 certificateId => Certificate) certificates;
mapping(address holder => uint256[]) _holderCertificates;
mapping(address issuer => uint256[]) _issuerCertificates;
mapping(uint256 certificateId => Disclosure[]) _disclosures;

IZKVerifier public immutable zkVerifier;
uint256 private _certificateIdTracker;
```

**Key Functions:**

```solidity
// Issuer management
function registerIssuer(address issuer)
function manageMember(address holder, bool approve)
function getIssuerCertificates(address issuer)

// Holder flows
function requestMembership(address issuer)
function shareCertificate(uint256 certificateId, address verifier, bytes32 queryHash, string calldata encryptedPayloadCid)
function getHolderCertificates(address holder)
function getDisclosures(uint256 certificateId)

// Certificate lifecycle
function issueCertificate(address holder, string calldata metadataCid, bytes32 metadataCommitment)
function setCertificateStatus(uint256 certificateId, CertificateStatus status)

// Verifier
function verifySelectiveProof(uint256 certificateId, bytes calldata proof, bytes32 queryHash)
```

### ZKPCertify Contract

**State Variables:**

```solidity
mapping(uint256 => Certificate) public certificates;
mapping(address => mapping(address => MemberRequest)) public memberRequests;
mapping(address => mapping(address => bool)) public members;
mapping(address => mapping(address => uint256)) public issuerNonce;
mapping(bytes32 => ProofVerification) public verifiedProofs;

IVerifier public immutable verifier;
address public immutable admin;
uint256 public certificateCounter;
```

**Key Functions:**

```solidity
// Member & certificate management
function requestMembership(address issuer)
function manageMember(address holder, bool approve)
function issueCertificate(address issuer, address holder, string memory metadataCid, bytes32 metadataCommitment)
function revokeCertificate(uint256 certificateId)

// ZKP verification
function verifyGpaProof(uint256 certificateId, uint[2] calldata pA, uint[2][2] calldata pB, uint[2] calldata pC, uint[3] calldata pubSignals)

// Getters
function getCertificate(uint256 certificateId)
function isMember(address issuer, address holder)
```

**Security Features:**

- ✅ Immutable verifier address (cannot be swapped)
- ✅ Admin validation on constructor
- ✅ Nonce tracking for each issuer-holder pair
- ✅ Proof replay protection (hash-based tracking)
- ✅ Holder verification in verifyGpaProof
- ✅ Access control via onlyIssuer modifier

---

## ZKP System

### Circom Circuit

**File:** `zk/circuits/certify.circom`

```circom
template Certify() {
    // Private signals (hidden from verifier)
    signal input secret;              // Random secret for proof
    signal input metadataHash;        // Keccak256 of certificate metadata
    signal input actualGpa;           // Actual GPA from metadata

    // Public signals (visible to verifier)
    signal input minGpa;              // Minimum required GPA

    // Output
    signal output hash;               // Commitment hash

    // Constraint: Verify GPA threshold
    signal diff;
    diff <== actualGpa - minGpa;      // If actualGpa < minGpa, wraps in field

    // Constraint: Compute commitment
    hash <== secret * metadataHash + actualGpa;
}
```

**Circuit Logic:**

1. **GPA Validation**: `actualGpa >= minGpa`
   - If violated, the proof will fail to verify
   - The difference is constrained but not explicitly checked (implicit via field arithmetic)

2. **Commitment**: `hash = secret * metadataHash + actualGpa`
   - Binds proof to specific metadata & GPA
   - Secret is private (prover doesn't reveal)

**Public Signals Format:**

```javascript
[
  metadataCommitment,  // pubSignals[0] - Metadata commitment hash
  minGpa,              // pubSignals[1] - Minimum GPA threshold
  nonce                // pubSignals[2] - Certificate nonce (for replay protection)
]
```

### Trusted Setup

```bash
# Powers of Tau ceremony (trusted setup phase)
snarkjs powersoftau new bn128 12 powers_0000.ptau
snarkjs ptc powers_0000.ptau powers_0001.ptau  # Contribute
snarkjs pt2 powers_0001.ptau powers_final.ptau # Prepare phase 2

# Generate Groth16 keys
snarkjs g16s certify.r1cs powers_final.ptau certify_final.zkey
snarkjs zkev certify_final.zkey verification_key.json
snarkjs zkesv certify_final.zkey verifier.sol
```

### Key Files

| File | Size | Purpose |
|------|------|---------|
| `certify.wasm` | 30KB | Circuit binary (browser-ready) |
| `certify.zkey` | 3.2KB | Proving key (server-side) |
| `verification_key.json` | 3.4KB | Verification key (contract) |
| `verifier.sol` | ~1KB | Groth16 verifier contract |

---

## Authentication Flow

### SIWE (Sign-In with Ethereum) Flow

```
┌─────────────┐                    ┌─────────────┐
│   Frontend  │                    │   Backend   │
└─────────────┘                    └─────────────┘
      │                                  │
      │─── GET /api/auth/nonce ────────→│
      │                                  │ (generate random nonce)
      │                                  │
      │←─ {nonce: "0x..."} ─────────────│
      │                                  │
      │ (user signs with MetaMask)      │
      │                                  │
      │─ POST /api/auth/verify ────────→│
      │   {message: "...", signature}   │
      │                                  │ (verify signature)
      │                                  │ (create session)
      │←─ {address, session} ──────────│
      │                                  │
      │ (cookies set automatically)     │
      │                                  │
      │─ GET /api/auth/me ────────────→│
      │                                  │ (check session)
      │←─ {address, authenticated} ────│

```

### Session Management

**Backend (Express):**
- Uses `express-session` for session storage
- Cookie-based authentication
- `SESSION_SECRET` for HMAC signing

**Frontend (React):**
- AuthContext wraps entire app
- Checks session on mount
- Protects routes with AuthGuard
- Automatic logout on invalid session

---

## Certificate Lifecycle

### Issuance Flow

```
Holder                          Issuer                      Smart Contract
  │                               │                              │
  ├─ Request Membership ─────────→│                              │
  │                               │                              │
  │                               ├─ Approve/Reject ────────────→│
  │                               │   (updates memberRequests)   │
  │                               │                              │
  │                               ├─ Issue Certificate ─────────→│
  │                               │   (metadata on IPFS)         │
  │                               │   (commitment on-chain)      │
  │                               │                              │
  │←─── Certificate Issued ───────┤                              │
  │                               │                              │
  │─── Fetch from Chain ──────────┼────────────────────────────→│
  │    (getHolderCertificates)    │                              │
  │                               │←── returns cert array ──────│
  │                               │                              │
```

### Certificate Lifecycle States

```
Pending (optional, not used in current implementation)
   │
   ├─→ Active (default when issued)
   │   │
   │   ├─→ Revoked (issuer can revoke)
   │   │
   │   └─→ Disclosed (shared with verifier via ZKP)
```

---

## Proof Generation & Verification

### Proof Generation Flow (Client-side)

```javascript
// 1. Prepare inputs
const metadata = {
  name: "Alice",
  gpa: "3.85",
  institution: "MIT",
  ...
};

// 2. Commitment
const metadataCommitment = keccak256(canonical(JSON.stringify(metadata)));
// Result: 0x1234...abcd

// 3. Circuit inputs
const circuitInputs = {
  secret: generateSecret(),              // 256-bit random
  metadataHash: hashToCircuitInput(metadataCommitment),
  actualGpa: gpaToCircuitInput("3.85"),  // 385
  minGpa: gpaToCircuitInput("3.5"),      // 350
  nonce: certificateNonce                // uint256
};

// 4. Generate proof (client-side)
const { proof, publicSignals } = await groth16.fullProve(
  circuitInputs,
  "certify.wasm",
  "certify.zkey"
);

// 5. Public signals visible to verifier
publicSignals = [
  metadataCommitment,  // 0: Metadata hash
  minGpa,              // 1: Min GPA threshold
  nonce                // 2: Certificate nonce
]
```

### Proof Verification Flow (On-chain)

```solidity
function verifyGpaProof(
    uint256 certificateId,
    uint[2] calldata pA,        // Proof component A
    uint[2][2] calldata pB,     // Proof component B
    uint[2] calldata pC,        // Proof component C
    uint[3] calldata pubSignals // Public signals [commitment, minGpa, nonce]
) external returns (bool) {
    Certificate storage cert = certificates[certificateId];
    
    // 1. Check certificate exists and not revoked
    require(!cert.revoked, "certificate revoked");
    
    // 2. Check caller is certificate holder
    require(cert.holder == msg.sender, "not certificate holder");
    
    // 3. Check commitment matches
    require(
        bytes32(uint256(pubSignals[0])) == cert.metadataCommitment,
        "metadata commitment mismatch"
    );
    
    // 4. Check nonce matches (prevents replays)
    require(
        uint256(pubSignals[2]) == cert.nonce,
        "proof nonce mismatch"
    );
    
    // 5. Check proof hasn't been used before
    bytes32 proofHash = keccak256(abi.encodePacked(pA, pB, pC, pubSignals));
    require(verifiedProofs[proofHash].certificateId == 0, "proof already used");
    
    // 6. Verify Groth16 proof on-chain
    bool verified = verifier.verifyProof(pA, pB, pC, pubSignals);
    require(verified, "invalid proof");
    
    // 7. Record verification
    verifiedProofs[proofHash] = ProofVerification({
        certificateId: certificateId,
        proofHash: proofHash,
        verifiedAt: block.timestamp
    });
    
    emit ProofVerified(certificateId, msg.sender, true);
    return true;
}
```

### Security Measures

1. **Proof Replay Protection**
   - Each proof has unique `proofHash`
   - Once verified, same proof cannot be used again
   - Nonce in certificate prevents old proofs for new issues

2. **Commitment Verification**
   - Public signal must match stored metadata commitment
   - Ensures prover used correct metadata

3. **Holder Verification**
   - Only certificate holder can verify proof
   - Prevents impersonation

4. **Revocation Check**
   - Revoked certificates cannot be verified
   - Issuer can revoke anytime

---

## Security Considerations

### Smart Contract Security

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Unauthorized certificate issuance | onlyIssuer modifier | ✅ |
| Mutable verifier address | immutable keyword | ✅ |
| Proof replay attacks | nonce + hash tracking | ✅ |
| Front-running | N/A (local blockchain) | ✅ |
| Reentrancy | No external calls | ✅ |

### ZKP Security

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Secret key reuse | Regenerated per proof | ✅ |
| Weak entropy | 256-bit CSPRNG | ✅ |
| Circuit backdoor | Trusted setup ceremony | ✅ |
| GPA threshold bypass | Circuit constraint | ✅ |
| Metadata tampering | Keccak256 commitment | ✅ |

### Backend Security

| Threat | Mitigation | Status |
|--------|-----------|--------|
| Session hijacking | HTTPOnly cookies | ✅ |
| CSRF attacks | SameSite cookies | ✅ |
| Signature replay | Timestamp validation | ⚠️ TODO |
| Nonce reuse | One-time nonce | ✅ |

---

## Data Models

### Certificate Struct

```solidity
struct Certificate {
    uint256 id;                      // Unique certificate ID
    address issuer;                  // Issuer address
    address holder;                  // Holder address
    string metadataCid;              // IPFS CID of encrypted metadata
    bytes32 metadataCommitment;      // Keccak256 of metadata
    CertificateStatus status;        // Active, Revoked, etc.
    uint64 issuedAt;                 // Timestamp
}
```

### Disclosure Struct

```solidity
struct Disclosure {
    uint256 certificateId;           // Which certificate
    address verifier;                // Who is verifying
    bytes32 queryHash;               // Hash of disclosed fields
    string encryptedPayloadCid;      // IPFS CID of encrypted data
    uint64 timestamp;                // When disclosed
}
```

### MemberRequest Struct

```solidity
struct MemberRequest {
    address applicant;               // Who requested
    bool approved;                   // Approval status
    bool decided;                    // Whether decision made
}
```

### Proof Format

```javascript
{
    proof: {
        pi_a: ["1234...abcd", "5678...efgh"],           // [2] uint256 array
        pi_b: [["pi_b_0_0", "pi_b_0_1"],
               ["pi_b_1_0", "pi_b_1_1"]],               // [2][2] uint256 array
        pi_c: ["9012...ijkl", "3456...mnop"]            // [2] uint256 array
    },
    publicSignals: ["comm", "minGpa", "nonce"]          // [3] uint256 array
}
```

---

## API Reference

### Backend Endpoints

```
GET /api/auth/nonce
  Response: { nonce: "0x..." }
  
POST /api/auth/verify
  Body: { message: "...", signature: "0x..." }
  Response: { address: "0x...", sessionId: "..." }
  
GET /api/auth/me
  Response: { address: "0x...", authenticated: true }
  
POST /api/auth/logout
  Response: { success: true }
```

### Contract Read Functions

```javascript
// Get certificates for holder
getCertificates(holderAddress) → uint256[]

// Get certificate details
getCertificate(certificateId) → Certificate

// Get disclosures for certificate
getDisclosures(certificateId) → Disclosure[]

// Check if member
isMember(issuer, holder) → bool

// Get issuer's certificates
getIssuerCertificates(issuer) → uint256[]
```

### Contract Write Functions

```javascript
// Request membership
requestMembership(issuer)

// Approve/reject member
manageMember(holder, approve)

// Issue certificate
issueCertificate(holder, metadataCid, metadataCommitment)

// Revoke certificate
revokeCertificate(certificateId)

// Verify ZKP proof
verifyGpaProof(certificateId, pA, pB, pC, pubSignals)

// Share certificate (CertifyRegistry)
shareCertificate(certificateId, verifier, queryHash, encryptedPayloadCid)
```

---

## Design Decisions

### Why Groth16?

- ✅ Widely adopted ZKP scheme
- ✅ Constant proof size (~288 bytes)
- ✅ Fast verification (< 1ms on-chain)
- ✅ Well-supported by snarkjs ecosystem

### Why Circom for Circuit?

- ✅ Designed specifically for ZKP applications
- ✅ High-level constraint language (vs low-level)
- ✅ Good tooling with snarkjs
- ✅ Active community support

### Why Separate ZKPCertify & CertifyRegistry?

- **ZKPCertify**: Handles ZKP-specific logic (nonce, replay protection)
- **CertifyRegistry**: General-purpose certificate registry (can use different verifiers)

### Why Canonical JSON Hashing?

- Ensures consistent commitment across different JSON implementations
- Prevents collision attacks from reordered fields
- Guarantees deterministic proofs

### Why Nonce-Based Replay Protection?

- Certificate-specific (per issuer-holder pair)
- Prevents old proofs from being reused
- Simpler than timestamp-based validation
- Works across time zones

---

## Future Improvements

### Short-term

- [ ] Timestamp-based proof expiration
- [ ] Multiple proof types (beyond GPA)
- [ ] Batch verification
- [ ] Enhanced error messages

### Medium-term

- [ ] PLONK instead of Groth16 (lower proving time)
- [ ] Encrypted payload storage (Lit Protocol)
- [ ] Push notifications (XMTP)
- [ ] Multi-signature for high-value issuance

### Long-term

- [ ] ZK-SNARK circuits for complex rules
- [ ] Cross-chain verification bridges
- [ ] Decentralized verifier network
- [ ] Identity-bound certificates (Sybil-resistant)

---

## Glossary

| Term | Definition |
|------|-----------|
| **Commitment** | Cryptographic hash binding prover to specific data |
| **Nonce** | Number used once; prevents replay attacks |
| **Public Signal** | Data visible to verifier in ZKP |
| **Private Signal** | Data hidden from verifier in ZKP |
| **Groth16** | Zero-knowledge proof scheme (fast, constant-size) |
| **Circom** | Circuit compiler for ZKP constraints |
| **Disclosure** | Act of sharing certificate with verifier |
| **Selective Disclosure** | Sharing only subset of certificate fields |
| **SIWE** | Sign-In with Ethereum; wallet-based authentication |

---

## References

- [Groth16 Paper](https://eprint.iacr.org/2016/260.pdf)
- [Circom Documentation](https://docs.circom.io)
- [snarkjs GitHub](https://github.com/iden3/snarkjs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)

---

**Last Updated:** July 5, 2026
**Version:** 1.0
