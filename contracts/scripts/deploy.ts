import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // First deploy the Groth16 Verifier (generated from snarkjs)
  // Note: You need to copy the generated verifier.sol from zk/circuits/verifier.sol
  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Groth16 Verifier deployed to:", verifier.address);

  // Deploy ZKPCertify contract with verifier
  const ZKPCertify = await ethers.getContractFactory("ZKPCertify");
  const zkpCertify = await ZKPCertify.deploy(verifier.address, deployer.address);
  await zkpCertify.deployed();
  console.log("ZKPCertify deployed to:", zkpCertify.address);

  // Deploy CertifyRegistry (main on-chain registry)
  const CertifyRegistry = await ethers.getContractFactory("CertifyRegistry");
  const registry = await CertifyRegistry.deploy(deployer.address, verifier.address);
  await registry.deployed();
  console.log("CertifyRegistry deployed to:", registry.address);

  console.log("\n=== Deployment Summary ===");
  console.log("Groth16 Verifier:", verifier.address);
  console.log("ZKPCertify:", zkpCertify.address);
  console.log("CertifyRegistry:", registry.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
