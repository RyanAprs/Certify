import * as snarkjs from "snarkjs";

const wasmUrl = import.meta.env.VITE_WASM_URL;
const zkeyUrl = import.meta.env.VITE_ZKEY_URL;

export interface ProofPayload {
  proof: snarkjs.Groth16Proof;
  publicSignals: string[];
}

export async function generateProof(inputs: Record<string, any>): Promise<ProofPayload> {
  if (!wasmUrl || !zkeyUrl) throw new Error("ZK artifacts missing");
  const response = await fetch(wasmUrl);
  const wasm = await response.arrayBuffer();
  const zkeyResp = await fetch(zkeyUrl);
  const zkey = await zkeyResp.arrayBuffer();
  const proofData = await snarkjs.groth16.fullProve(inputs, wasm, zkey);
  return proofData;
}

export async function exportProofBytes(proof: snarkjs.Groth16Proof): Promise<Uint8Array> {
  return snarkjs.groth16.exportSolidityCallData(proof, []);
}
