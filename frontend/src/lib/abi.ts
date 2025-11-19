export const CERTIFY_REGISTRY_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "admin", "type": "address" },
      { "internalType": "address", "name": "verifier", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "certificateId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "issuer", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "holder", "type": "address" }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "certificateId", "type": "uint256" },
      { "indexed": false, "internalType": "bytes32", "name": "queryHash", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "verifier", "type": "address" }
    ],
    "name": "ZKVerified",
    "type": "event"
  },
  { "inputs": [], "name": "ISSUER_ADMIN_ROLE", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "issuer", "type": "address" }],
    "name": "getIssuerCertificates",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "holder", "type": "address" }],
    "name": "getHolderCertificates",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "certificateId", "type": "uint256" }],
    "name": "certificates",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "address", "name": "issuer", "type": "address" },
      { "internalType": "address", "name": "holder", "type": "address" },
      { "internalType": "string", "name": "metadataCid", "type": "string" },
      { "internalType": "bytes32", "name": "metadataCommitment", "type": "bytes32" },
      { "internalType": "uint8", "name": "status", "type": "uint8" },
      { "internalType": "uint64", "name": "issuedAt", "type": "uint64" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "certificateId", "type": "uint256" }],
    "name": "getDisclosures",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "certificateId", "type": "uint256" },
          { "internalType": "address", "name": "verifier", "type": "address" },
          { "internalType": "bytes32", "name": "queryHash", "type": "bytes32" },
          { "internalType": "string", "name": "encryptedPayloadCid", "type": "string" },
          { "internalType": "uint64", "name": "timestamp", "type": "uint64" }
        ],
        "internalType": "struct CertifyRegistry.Disclosure[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "issuer", "type": "address" }],
    "name": "registeredIssuers",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "issuer", "type": "address" }],
    "name": "registerIssuer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "issuer", "type": "address" }],
    "name": "requestMembership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "holder", "type": "address" },
      { "internalType": "bool", "name": "approve", "type": "bool" }
    ],
    "name": "manageMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "holder", "type": "address" },
      { "internalType": "string", "name": "metadataCid", "type": "string" },
      { "internalType": "bytes32", "name": "metadataCommitment", "type": "bytes32" }
    ],
    "name": "issueCertificate",
    "outputs": [{ "internalType": "uint256", "name": "certificateId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "certificateId", "type": "uint256" },
      { "internalType": "uint8", "name": "status", "type": "uint8" }
    ],
    "name": "setCertificateStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "certificateId", "type": "uint256" },
      { "internalType": "address", "name": "verifier", "type": "address" },
      { "internalType": "bytes32", "name": "queryHash", "type": "bytes32" },
      { "internalType": "string", "name": "encryptedPayloadCid", "type": "string" }
    ],
    "name": "shareCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "certificateId", "type": "uint256" },
      { "internalType": "bytes", "name": "proof", "type": "bytes" },
      { "internalType": "bytes32", "name": "queryHash", "type": "bytes32" }
    ],
    "name": "verifySelectiveProof",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
