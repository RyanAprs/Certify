// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

interface IZKVerifier {
    function verifyProof(bytes calldata proof, bytes32 commitment, bytes32 queryHash) external view returns (bool);
}

/**
 * @title CertifyRegistry
 * @notice Main on-chain registry that manages issuers, holders, certificates, and ZK verifications.
 */
contract CertifyRegistry is AccessControl {
    bytes32 public constant ISSUER_ADMIN_ROLE = keccak256("ISSUER_ADMIN_ROLE");

    enum CertificateStatus {
        Pending,
        Active,
        Revoked
    }

    struct MemberRequest {
        address applicant;
        bool approved;
        bool decided;
    }

    struct Certificate {
        uint256 id;
        address issuer;
        address holder;
        string metadataCid; // IPFS CID for encrypted payload
        bytes32 metadataCommitment; // Commitment to the raw certificate data
        CertificateStatus status;
        uint64 issuedAt;
    }

    struct Disclosure {
        uint256 certificateId;
        address verifier;
        bytes32 queryHash;
        string encryptedPayloadCid;
        uint64 timestamp;
    }

    IZKVerifier public immutable zkVerifier;
    uint256 private _certificateIdTracker;

    mapping(address issuer => bool) public registeredIssuers;
    mapping(address issuer => mapping(address holder => MemberRequest)) public memberRequests;
    mapping(uint256 certificateId => Certificate) public certificates;
    mapping(address holder => uint256[]) private _holderCertificates;
    mapping(address issuer => uint256[]) private _issuerCertificates;
    mapping(uint256 certificateId => Disclosure[]) private _disclosures;

    event IssuerRegistered(address indexed issuer, address indexed creator);
    event MemberRequested(address indexed issuer, address indexed holder);
    event MemberDecision(address indexed issuer, address indexed holder, bool approved);
    event CertificateIssued(uint256 indexed certificateId, address indexed issuer, address indexed holder);
    event CertificateStatusChanged(uint256 indexed certificateId, CertificateStatus status);
    event CertificateShared(uint256 indexed certificateId, address indexed holder, address indexed verifier, bytes32 queryHash, string encryptedPayloadCid);
    event ZKVerified(uint256 indexed certificateId, address indexed verifier, bytes32 queryHash);

    modifier onlyIssuer(address issuer) {
        require(registeredIssuers[issuer], "Issuer not registered");
        require(hasRole(ISSUER_ADMIN_ROLE, issuer), "Caller not issuer");
        _;
    }

    constructor(address admin, address verifier) {
        require(admin != address(0), "admin required");
        require(verifier != address(0), "verifier required");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ADMIN_ROLE, admin);
        registeredIssuers[admin] = true;
        emit IssuerRegistered(admin, admin);
        zkVerifier = IZKVerifier(verifier);
    }

    // ===== Issuer Management =====

    function registerIssuer(address issuer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(issuer != address(0), "invalid issuer");
        require(!registeredIssuers[issuer], "already issuer");
        registeredIssuers[issuer] = true;
        _grantRole(ISSUER_ADMIN_ROLE, issuer);
        emit IssuerRegistered(issuer, msg.sender);
    }

    function manageMember(address holder, bool approve) external onlyIssuer(msg.sender) {
        MemberRequest storage request = memberRequests[msg.sender][holder];
        require(request.applicant == holder, "request missing");
        require(!request.decided, "already decided");
        request.decided = true;
        request.approved = approve;
        emit MemberDecision(msg.sender, holder, approve);
    }

    function getIssuerCertificates(address issuer) external view returns (uint256[] memory ids) {
        return _issuerCertificates[issuer];
    }

    // ===== Holder Flows =====

    function requestMembership(address issuer) external {
        require(registeredIssuers[issuer], "issuer unknown");
        MemberRequest storage request = memberRequests[issuer][msg.sender];
        require(request.applicant == address(0) || request.decided, "pending request");
        memberRequests[issuer][msg.sender] = MemberRequest({
            applicant: msg.sender,
            approved: false,
            decided: false
        });
        emit MemberRequested(issuer, msg.sender);
    }

    function shareCertificate(
        uint256 certificateId,
        address verifier,
        bytes32 queryHash,
        string calldata encryptedPayloadCid
    ) external {
        Certificate memory cert = certificates[certificateId];
        require(cert.holder == msg.sender, "not holder");
        Disclosure memory disclosure = Disclosure({
            certificateId: certificateId,
            verifier: verifier,
            queryHash: queryHash,
            encryptedPayloadCid: encryptedPayloadCid,
            timestamp: uint64(block.timestamp)
        });
        _disclosures[certificateId].push(disclosure);
        emit CertificateShared(certificateId, msg.sender, verifier, queryHash, encryptedPayloadCid);
    }

    function getHolderCertificates(address holder) external view returns (uint256[] memory ids) {
        return _holderCertificates[holder];
    }

    function getDisclosures(uint256 certificateId) external view returns (Disclosure[] memory items) {
        return _disclosures[certificateId];
    }

    // ===== Certificate lifecycle =====

    function issueCertificate(
        address holder,
        string calldata metadataCid,
        bytes32 metadataCommitment
    ) external onlyIssuer(msg.sender) returns (uint256 certificateId) {
        MemberRequest memory request = memberRequests[msg.sender][holder];
        require(request.approved && request.decided, "holder not approved");
        certificateId = ++_certificateIdTracker;
        certificates[certificateId] = Certificate({
            id: certificateId,
            issuer: msg.sender,
            holder: holder,
            metadataCid: metadataCid,
            metadataCommitment: metadataCommitment,
            status: CertificateStatus.Active,
            issuedAt: uint64(block.timestamp)
        });
        _holderCertificates[holder].push(certificateId);
        _issuerCertificates[msg.sender].push(certificateId);
        emit CertificateIssued(certificateId, msg.sender, holder);
    }

    function setCertificateStatus(uint256 certificateId, CertificateStatus status) external {
        Certificate storage cert = certificates[certificateId];
        require(cert.issuer == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "forbidden");
        cert.status = status;
        emit CertificateStatusChanged(certificateId, status);
    }

    // ===== Verifier =====

    function verifySelectiveProof(
        uint256 certificateId,
        bytes calldata proof,
        bytes32 queryHash
    ) external returns (bool) {
        Certificate memory cert = certificates[certificateId];
        require(cert.status == CertificateStatus.Active, "inactive cert");
        bool ok = zkVerifier.verifyProof(proof, cert.metadataCommitment, queryHash);
        require(ok, "invalid proof");
        emit ZKVerified(certificateId, msg.sender, queryHash);
        return true;
    }
}
