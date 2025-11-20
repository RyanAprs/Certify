import { createWalletClient, createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";
import { Account, privateKeyToAccount } from "viem/accounts";

export async function writeContractFresh(
  args: Parameters<typeof walletClient.writeContract>[0] & { account: Account }
) {
  const latestNonce = await publicClient.getTransactionCount({
    address: args.account.address,
    blockTag: "pending",
  });

  const hash = await walletClient.writeContract({
    ...args,
    nonce: latestNonce,
  });

  await publicClient.waitForTransactionReceipt({ hash });

  return hash;
}

export const walletClient = createWalletClient({
  chain: hardhat,
  transport: http("http://127.0.0.1:8545"),
});

export const publicClient = createPublicClient({
  chain: hardhat,
  transport: http("http://127.0.0.1:8545"),
});

export const getLocalAccount = (privateKey: `0x${string}`) => {
  return privateKeyToAccount(privateKey);
};

export const CERTIFY_CONTRACT_ADDRESS = import.meta.env
  .VITE_CONTRACT_ADDRESS as `0x${string}`;
export const CERTIFY_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        internalType: "address",
        name: "verifier",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AccessControlBadConfirmation",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "neededRole",
        type: "bytes32",
      },
    ],
    name: "AccessControlUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "certificateId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "issuer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "holder",
        type: "address",
      },
    ],
    name: "CertificateIssued",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "certificateId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "holder",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "verifier",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "queryHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "string",
        name: "encryptedPayloadCid",
        type: "string",
      },
    ],
    name: "CertificateShared",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "certificateId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum CertifyRegistry.CertificateStatus",
        name: "status",
        type: "uint8",
      },
    ],
    name: "CertificateStatusChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "issuer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "creator",
        type: "address",
      },
    ],
    name: "IssuerRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "issuer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "holder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "MemberDecision",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "issuer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "holder",
        type: "address",
      },
    ],
    name: "MemberRequested",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "previousAdminRole",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "newAdminRole",
        type: "bytes32",
      },
    ],
    name: "RoleAdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleGranted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        indexed: true,
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "RoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "certificateId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "verifier",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "queryHash",
        type: "bytes32",
      },
    ],
    name: "ZKVerified",
    type: "event",
  },
  {
    inputs: [],
    name: "DEFAULT_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ISSUER_ADMIN_ROLE",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "certificateId",
        type: "uint256",
      },
    ],
    name: "certificates",
    outputs: [
      {
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "issuer",
        type: "address",
      },
      {
        internalType: "address",
        name: "holder",
        type: "address",
      },
      {
        internalType: "string",
        name: "metadataCid",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "metadataCommitment",
        type: "bytes32",
      },
      {
        internalType: "enum CertifyRegistry.CertificateStatus",
        name: "status",
        type: "uint8",
      },
      {
        internalType: "uint64",
        name: "issuedAt",
        type: "uint64",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "certificateId",
        type: "uint256",
      },
    ],
    name: "getDisclosures",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "certificateId",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "verifier",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "queryHash",
            type: "bytes32",
          },
          {
            internalType: "string",
            name: "encryptedPayloadCid",
            type: "string",
          },
          {
            internalType: "uint64",
            name: "timestamp",
            type: "uint64",
          },
        ],
        internalType: "struct CertifyRegistry.Disclosure[]",
        name: "items",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "holder",
        type: "address",
      },
    ],
    name: "getHolderCertificates",
    outputs: [
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "issuer",
        type: "address",
      },
    ],
    name: "getIssuerCertificates",
    outputs: [
      {
        internalType: "uint256[]",
        name: "ids",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
    ],
    name: "getRoleAdmin",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "grantRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "hasRole",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "holder",
        type: "address",
      },
      {
        internalType: "string",
        name: "metadataCid",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "metadataCommitment",
        type: "bytes32",
      },
    ],
    name: "issueCertificate",
    outputs: [
      {
        internalType: "uint256",
        name: "certificateId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "holder",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approve",
        type: "bool",
      },
    ],
    name: "manageMember",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "issuer",
        type: "address",
      },
      {
        internalType: "address",
        name: "holder",
        type: "address",
      },
    ],
    name: "memberRequests",
    outputs: [
      {
        internalType: "address",
        name: "applicant",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "decided",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "issuer",
        type: "address",
      },
    ],
    name: "registerIssuer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "issuer",
        type: "address",
      },
    ],
    name: "registeredIssuers",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "callerConfirmation",
        type: "address",
      },
    ],
    name: "renounceRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "issuer",
        type: "address",
      },
    ],
    name: "requestMembership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "role",
        type: "bytes32",
      },
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "revokeRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "certificateId",
        type: "uint256",
      },
      {
        internalType: "enum CertifyRegistry.CertificateStatus",
        name: "status",
        type: "uint8",
      },
    ],
    name: "setCertificateStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "certificateId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "verifier",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "queryHash",
        type: "bytes32",
      },
      {
        internalType: "string",
        name: "encryptedPayloadCid",
        type: "string",
      },
    ],
    name: "shareCertificate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "certificateId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "proof",
        type: "bytes",
      },
      {
        internalType: "bytes32",
        name: "queryHash",
        type: "bytes32",
      },
    ],
    name: "verifySelectiveProof",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "zkVerifier",
    outputs: [
      {
        internalType: "contract IZKVerifier",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
