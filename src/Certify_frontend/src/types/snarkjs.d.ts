declare module "snarkjs" {
  export const groth16: {
    fullProve: (
      input: any,
      wasmPath: string,
      zkeyPath: string
    ) => Promise<{ proof: any; publicSignals: string[] }>;
    verify: (
      verificationKey: any,
      publicSignals: string[],
      proof: any
    ) => Promise<boolean>;
  };

  export const plonk: {
    fullProve: (
      input: any,
      wasmPath: string,
      zkeyPath: string
    ) => Promise<{ proof: any; publicSignals: string[] }>;
    verify: (
      verificationKey: any,
      publicSignals: string[],
      proof: any
    ) => Promise<boolean>;
  };

  export const zKey: any;
  export const wtns: any;
}
