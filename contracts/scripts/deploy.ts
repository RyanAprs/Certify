import { ethers, network, artifacts } from "hardhat";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Network:", network.name);

  // 1. Groth16 verifier (regenerate the real one via `cd zk && ./build.sh`).
  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("Groth16Verifier:", verifierAddress);

  // 2. CertifyRegistry (single registry) wired to the verifier.
  const Registry = await ethers.getContractFactory("CertifyRegistry");
  const registry = await Registry.deploy(deployer.address, verifierAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("CertifyRegistry:", registryAddress);

  const deployTx = registry.deploymentTransaction();
  const deploymentBlock = deployTx
    ? (await deployTx.wait())?.blockNumber ?? 0
    : 0;

  // 3. Publish addresses + ABI to the frontend so there is a single source
  //    of truth (no more hand-maintained, divergent ABI copies).
  const deployment = {
    chainId: Number(network.config.chainId ?? 31337),
    network: network.name,
    registry: registryAddress,
    verifier: verifierAddress,
    deploymentBlock,
  };

  const frontendLib = join(__dirname, "../../frontend/src/lib");
  if (existsSync(frontendLib)) {
    const registryArtifact = await artifacts.readArtifact("CertifyRegistry");
    writeFileSync(
      join(frontendLib, "deployment.json"),
      JSON.stringify(deployment, null, 2)
    );
    writeFileSync(
      join(frontendLib, "CertifyRegistry.abi.json"),
      JSON.stringify(registryArtifact.abi, null, 2)
    );
    console.log("Wrote frontend/src/lib/deployment.json + CertifyRegistry.abi.json");
  }

  // Also drop a copy under contracts/deployments for the record.
  const deployDir = join(__dirname, "../deployments");
  mkdirSync(deployDir, { recursive: true });
  writeFileSync(
    join(deployDir, `${network.name}.json`),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deployment, null, 2));
  console.log(
    "\n⚠️  If you have not run `cd zk && ./build.sh`, the deployed verifier is a" +
      "\n    placeholder that rejects all proofs. On-chain ZK verification will" +
      "\n    only work after you build the circuit and redeploy."
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
