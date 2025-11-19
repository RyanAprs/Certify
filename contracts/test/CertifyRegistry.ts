import { expect } from "chai";
import { ethers } from "hardhat";

describe("CertifyRegistry", () => {
  it("issues certificate after membership approval", async () => {
    const [admin, holder] = await ethers.getSigners();
    const Verifier = await ethers.getContractFactory("ZKMockVerifier");
    const verifier = await Verifier.deploy(admin.address);
    const Registry = await ethers.getContractFactory("CertifyRegistry");
    const registry = await Registry.deploy(admin.address, await verifier.getAddress());

    await registry.connect(holder).requestMembership(admin.address);
    await registry.manageMember(holder.address, true);
    const tx = await registry.issueCertificate(holder.address, "cid", ethers.keccak256(ethers.toUtf8Bytes("data")));
    await tx.wait();

    const ids = await registry.getHolderCertificates(holder.address);
    expect(ids.length).to.equal(1);
  });
});
