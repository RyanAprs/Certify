import { expect } from "chai";
import { ethers } from "hardhat";
import { CertifyRegistry, MockGroth16Verifier } from "../typechain-types";

const DUMMY_A: [bigint, bigint] = [1n, 2n];
const DUMMY_B: [[bigint, bigint], [bigint, bigint]] = [
  [1n, 2n],
  [3n, 4n],
];
const DUMMY_C: [bigint, bigint] = [5n, 6n];
const SCHEMA = ethers.id("diploma.v1"); // keccak256("diploma.v1")
const KEY_HASH = 111n; // stand-in for keyHash("gpa") in these unit tests

describe("CertifyRegistry", () => {
  async function deploy() {
    const [admin, holder, verifier] = await ethers.getSigners();
    const Mock = await ethers.getContractFactory("MockGroth16Verifier");
    const mock = (await Mock.deploy()) as MockGroth16Verifier;
    await mock.waitForDeployment();

    const Registry = await ethers.getContractFactory("CertifyRegistry");
    const registry = (await Registry.deploy(
      admin.address,
      await mock.getAddress()
    )) as CertifyRegistry;
    await registry.waitForDeployment();

    // Register the same mock as the equality + membership verifiers too.
    await registry.setVerifier(await registry.PREDICATE_EQUALITY(), await mock.getAddress());
    await registry.setVerifier(await registry.PREDICATE_MEMBERSHIP(), await mock.getAddress());

    return { admin, holder, verifier, mock, registry };
  }

  async function issueTo(
    registry: CertifyRegistry,
    admin: any,
    holder: any,
    commitment: string
  ) {
    await registry.connect(holder).requestMembership(admin.address);
    await registry.connect(admin).manageMember(holder.address, true);
    const tx = await registry
      .connect(admin)
      .issueCertificate(holder.address, "cid", commitment, SCHEMA);
    await tx.wait();
  }

  it("issues a certificate only after membership approval", async () => {
    const { admin, holder, registry } = await deploy();
    const commitment = ethers.zeroPadValue("0x1234", 32);
    await issueTo(registry, admin, holder, commitment);

    const ids = await registry.getHolderCertificates(holder.address);
    expect(ids.length).to.equal(1);
    const cert = await registry.certificates(ids[0]);
    expect(cert.holder).to.equal(holder.address);
    expect(cert.status).to.equal(1); // Active
    expect(cert.schemaId).to.equal(SCHEMA);
  });

  it("rejects issuance for an unapproved holder", async () => {
    const { admin, holder, registry } = await deploy();
    await registry.connect(holder).requestMembership(admin.address);
    await expect(
      registry
        .connect(admin)
        .issueCertificate(holder.address, "cid", ethers.zeroPadValue("0x01", 32), SCHEMA)
    ).to.be.revertedWith("holder not approved");
  });

  it("requires a non-zero schema id", async () => {
    const { admin, holder, registry } = await deploy();
    await registry.connect(holder).requestMembership(admin.address);
    await registry.connect(admin).manageMember(holder.address, true);
    await expect(
      registry
        .connect(admin)
        .issueCertificate(holder.address, "cid", ethers.zeroPadValue("0x12", 32), ethers.ZeroHash)
    ).to.be.revertedWith("schema required");
  });

  it("only the issuer or admin can change status", async () => {
    const { admin, holder, registry } = await deploy();
    const commitment = ethers.zeroPadValue("0x1234", 32);
    await issueTo(registry, admin, holder, commitment);
    const ids = await registry.getHolderCertificates(holder.address);

    await expect(
      registry.connect(holder).setCertificateStatus(ids[0], 2)
    ).to.be.revertedWith("forbidden");

    await registry.connect(admin).setCertificateStatus(ids[0], 2); // Revoke
    const cert = await registry.certificates(ids[0]);
    expect(cert.status).to.equal(2);
  });

  it("verifies a range proof, binds the root, and blocks replay", async () => {
    const { admin, holder, verifier, mock, registry } = await deploy();
    const commitment = ethers.zeroPadValue("0xabcd", 32);
    await issueTo(registry, admin, holder, commitment);
    const ids = await registry.getHolderCertificates(holder.address);

    // pubSignals = [root, keyHash, threshold]; root must equal the commitment.
    const pub: [bigint, bigint, bigint] = [BigInt(commitment), KEY_HASH, 300n];

    // Root mismatch is rejected before touching the verifier.
    await expect(
      registry
        .connect(verifier)
        .verifyRangeProof(ids[0], DUMMY_A, DUMMY_B, DUMMY_C, [1n, KEY_HASH, 300n])
    ).to.be.revertedWith("commitment mismatch");

    // Happy path (mock returns true) — emits predicateId + keyHash + param.
    await expect(
      registry
        .connect(verifier)
        .verifyRangeProof(ids[0], DUMMY_A, DUMMY_B, DUMMY_C, pub)
    )
      .to.emit(registry, "ZKVerified")
      .withArgs(ids[0], verifier.address, ethers.id("range"), KEY_HASH, 300n);

    // Same proof cannot be replayed.
    await expect(
      registry
        .connect(verifier)
        .verifyRangeProof(ids[0], DUMMY_A, DUMMY_B, DUMMY_C, pub)
    ).to.be.revertedWith("proof already used");

    // A failing verifier is rejected.
    await mock.setResult(false);
    const pub2: [bigint, bigint, bigint] = [BigInt(commitment), KEY_HASH, 350n];
    await expect(
      registry
        .connect(verifier)
        .verifyRangeProof(ids[0], DUMMY_A, DUMMY_B, DUMMY_C, pub2)
    ).to.be.revertedWith("invalid proof");
  });

  it("verifies an equality proof via the registered equality verifier", async () => {
    const { admin, holder, verifier, registry } = await deploy();
    const commitment = ethers.zeroPadValue("0xbeef", 32);
    await issueTo(registry, admin, holder, commitment);
    const ids = await registry.getHolderCertificates(holder.address);

    const pub: [bigint, bigint, bigint] = [BigInt(commitment), KEY_HASH, 42n];
    await expect(
      registry
        .connect(verifier)
        .verifyEqualityProof(ids[0], DUMMY_A, DUMMY_B, DUMMY_C, pub)
    )
      .to.emit(registry, "ZKVerified")
      .withArgs(ids[0], verifier.address, ethers.id("equality"), KEY_HASH, 42n);
  });

  it("verifies a membership proof via the registered membership verifier", async () => {
    const { admin, holder, verifier, registry } = await deploy();
    const commitment = ethers.zeroPadValue("0xcafe", 32);
    await issueTo(registry, admin, holder, commitment);
    const ids = await registry.getHolderCertificates(holder.address);

    const pub: [bigint, bigint, bigint] = [BigInt(commitment), KEY_HASH, 999n]; // [root, keyHash, setRoot]
    await expect(
      registry
        .connect(verifier)
        .verifyMembershipProof(ids[0], DUMMY_A, DUMMY_B, DUMMY_C, pub)
    )
      .to.emit(registry, "ZKVerified")
      .withArgs(ids[0], verifier.address, ethers.id("membership"), KEY_HASH, 999n);
  });

  it("rejects a predicate with no registered verifier", async () => {
    const { admin, holder, verifier, registry } = await deploy();
    const commitment = ethers.zeroPadValue("0x1234", 32);
    await issueTo(registry, admin, holder, commitment);
    const ids = await registry.getHolderCertificates(holder.address);
    // Point the equality slot at the zero address is impossible (setVerifier
    // rejects it); instead deploy a fresh registry where equality is unset.
    const Mock = await ethers.getContractFactory("MockGroth16Verifier");
    const mock = await Mock.deploy();
    const Registry = await ethers.getContractFactory("CertifyRegistry");
    const bare = await Registry.deploy(admin.address, await mock.getAddress());
    await bare.connect(holder).requestMembership(admin.address);
    await bare.connect(admin).manageMember(holder.address, true);
    await bare.connect(admin).issueCertificate(holder.address, "cid", commitment, SCHEMA);
    await expect(
      bare
        .connect(verifier)
        .verifyEqualityProof(ids[0], DUMMY_A, DUMMY_B, DUMMY_C, [BigInt(commitment), KEY_HASH, 1n])
    ).to.be.revertedWith("unknown predicate");
  });

  it("admin can register then remove an issuer", async () => {
    const { admin, verifier, registry } = await deploy();
    const ROLE = await registry.ISSUER_ADMIN_ROLE();

    await registry.connect(admin).registerIssuer(verifier.address);
    expect(await registry.registeredIssuers(verifier.address)).to.equal(true);
    expect(await registry.hasRole(ROLE, verifier.address)).to.equal(true);

    await expect(registry.connect(admin).removeIssuer(verifier.address))
      .to.emit(registry, "IssuerRemoved")
      .withArgs(verifier.address, admin.address);
    expect(await registry.registeredIssuers(verifier.address)).to.equal(false);
    expect(await registry.hasRole(ROLE, verifier.address)).to.equal(false);
  });

  it("only admin can remove an issuer, and only real issuers", async () => {
    const { admin, holder, verifier, registry } = await deploy();
    await registry.connect(admin).registerIssuer(verifier.address);
    await expect(
      registry.connect(holder).removeIssuer(verifier.address)
    ).to.be.reverted; // AccessControlUnauthorizedAccount
    await expect(
      registry.connect(admin).removeIssuer(holder.address)
    ).to.be.revertedWith("not an issuer");
  });

  it("only admin can register a verifier", async () => {
    const { holder, registry } = await deploy();
    await expect(
      registry.connect(holder).setVerifier(ethers.id("range"), holder.address)
    ).to.be.reverted; // AccessControlUnauthorizedAccount
  });

  it("records disclosures for active certificates", async () => {
    const { admin, holder, verifier, registry } = await deploy();
    const commitment = ethers.zeroPadValue("0x1234", 32);
    await issueTo(registry, admin, holder, commitment);
    const ids = await registry.getHolderCertificates(holder.address);

    await registry
      .connect(holder)
      .shareCertificate(ids[0], verifier.address, ethers.id("query"), "encCid");
    const disclosures = await registry.getDisclosures(ids[0]);
    expect(disclosures.length).to.equal(1);
    expect(disclosures[0].verifier).to.equal(verifier.address);
  });
});
