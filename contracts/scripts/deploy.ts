import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  // Deploy Verifier
  const Verifier = await ethers.getContractFactory("ZKPCertify");
  const verifier = await Verifier.deploy(deployer.address);
  await verifier.deployed();
  console.log("Verifier Address:", verifier.address);

  // Deploy Registry
  const Registry = await ethers.getContractFactory("CertifyRegistry");
  const registry = await Registry.deploy(deployer.address, verifier.address);
  await registry.deployed();
  console.log("Contract Addres:", registry.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
