import type { Abi } from "viem";
import abiJson from "./CertifyRegistry.abi.json";

// Single source of truth for the registry ABI. This file is produced by the
// deploy script (`contracts/scripts/deploy.ts`) from the compiled artifact,
// so it never drifts from the on-chain contract. Do not hand-edit.
export const CERTIFY_REGISTRY_ABI = abiJson as Abi;
