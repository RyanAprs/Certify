import { expect } from "chai";
import { ethers } from "hardhat";
import { ZKMockVerifier } from "../typechain-types";

describe("ZKMockVerifier", () => {
  let verifier: ZKMockVerifier;
  let owner: any, signer: any, attacker: any;

  beforeEach(async () => {
    [owner, signer, attacker] = await ethers.getSigners();

    const Verifier = await ethers.getContractFactory("ZKMockVerifier");
    verifier = (await Verifier.deploy(signer.address)) as ZKMockVerifier;
    await verifier.waitForDeployment();
  });

  it("should have initial signer trusted", async () => {
    expect(await verifier.trustedSigners(signer.address)).to.equal(true);
  });

  it("should allow owner to update signer", async () => {
    await verifier.updateSigner(attacker.address, true);
    expect(await verifier.trustedSigners(attacker.address)).to.equal(true);

    await verifier.updateSigner(attacker.address, false);
    expect(await verifier.trustedSigners(attacker.address)).to.equal(false);
  });

  it("should verify a correct proof signed by trusted signer", async () => {
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("test-commit"));
    const queryHash = ethers.keccak256(ethers.toUtf8Bytes("query"));

    const digest = ethers.solidityPackedKeccak256(
      ["bytes32", "bytes32"],
      [commitment, queryHash]
    );

    const proof = await signer.signMessage(ethers.getBytes(digest));

    const result = await verifier.verifyProof(proof, commitment, queryHash);
    expect(result).to.equal(true);
  });

  it("should fail verification for untrusted signer", async () => {
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("test-commit"));
    const queryHash = ethers.keccak256(ethers.toUtf8Bytes("query"));

    const digest = ethers.solidityPackedKeccak256(
      ["bytes32", "bytes32"],
      [commitment, queryHash]
    );

    const attackerProof = await attacker.signMessage(ethers.getBytes(digest));

    const result = await verifier.verifyProof(
      attackerProof,
      commitment,
      queryHash
    );
    expect(result).to.equal(false);
  });

  it("should fail verification if signature is modified", async () => {
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("a"));
    const queryHash = ethers.keccak256(ethers.toUtf8Bytes("b"));

    const digest = ethers.solidityPackedKeccak256(
      ["bytes32", "bytes32"],
      [commitment, queryHash]
    );

    let proof = await signer.signMessage(ethers.getBytes(digest));

    // Modify 1 byte → invalid signature
    const corrupted = proof.slice(0, proof.length - 2) + "00";

    const result = await verifier.verifyProof(corrupted, commitment, queryHash);
    expect(result).to.equal(false);
  });
});
