import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // 1. Deploy Groth16Verifier
  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("Groth16 Verifier deployed to:", verifierAddress);

  // 2. Deploy CertifyRegistry
  const CertifyRegistry = await ethers.getContractFactory("CertifyRegistry");
  const registry = await CertifyRegistry.deploy(deployer.address, verifierAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("CertifyRegistry deployed to:", registryAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("Groth16 Verifier :", verifierAddress);
  console.log("CertifyRegistry  :", registryAddress);
  console.log("Admin / Issuer   :", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
