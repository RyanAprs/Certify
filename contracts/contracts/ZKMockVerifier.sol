// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ZKMockVerifier {
    using ECDSA for bytes32;

    mapping(address => bool) public trustedSigners;

    event SignerUpdated(address indexed signer, bool trusted);

    constructor(address initialSigner) {
        if (initialSigner != address(0)) {
            trustedSigners[initialSigner] = true;
            emit SignerUpdated(initialSigner, true);
        }
    }

    function updateSigner(address signer, bool trusted) external {
        trustedSigners[signer] = trusted;
        emit SignerUpdated(signer, trusted);
    }

    function _toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
    }

    function verifyProof(
        bytes calldata proof,
        bytes32 commitment,
        bytes32 queryHash
    ) external view returns (bool) {
        bytes32 digest = _toEthSignedMessageHash(
            keccak256(abi.encodePacked(commitment, queryHash))
        );

        address recovered = ECDSA.recover(digest, proof);
        return trustedSigners[recovered];
    }
}
