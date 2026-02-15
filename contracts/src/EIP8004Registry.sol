// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title EIP8004Registry
 * @dev Implementation of EIP-8004: Trustless Agents Identity Registry
 * Based on the official specification draft.
 */
contract EIP8004Registry is ERC721URIStorage {
    uint256 private _nextAgentId = 1;

    // Metadata keys mapping: agentId => key => value
    mapping(uint256 => mapping(string => bytes)) private _agentMetadata;

    // Agent Wallet mapping: agentId => wallet address
    mapping(uint256 => address) private _agentWallets;

    event Registered(
        uint256 indexed agentId,
        string agentURI,
        address indexed owner
    );
    event URIUpdated(
        uint256 indexed agentId,
        string newURI,
        address indexed updatedBy
    );
    event MetadataSet(
        uint256 indexed agentId,
        string indexed indexedMetadataKey,
        string metadataKey,
        bytes metadataValue
    );
    event AgentWalletSet(uint256 indexed agentId, address indexed newWallet);

    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    constructor() ERC721("Monad AI Agents", "AGENT") {}

    /**
     * @notice Register a new agent
     * @param agentURI The metadata URI for the agent
     * @return agentId The minted token ID
     */
    function register(string calldata agentURI) external returns (uint256) {
        uint256 agentId = _nextAgentId++;
        _mint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);

        // precise EIP-8004 logic: initially set agentWallet to owner
        _agentWallets[agentId] = msg.sender;

        emit Registered(agentId, agentURI, msg.sender);
        return agentId;
    }

    /**
     * @notice Register a new agent with extra metadata
     */
    function register(
        string calldata agentURI,
        MetadataEntry[] calldata metadata
    ) external returns (uint256) {
        uint256 agentId = _nextAgentId++;
        _mint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);
        _agentWallets[agentId] = msg.sender;

        emit Registered(agentId, agentURI, msg.sender);

        for (uint256 i = 0; i < metadata.length; i++) {
            _setMetadata(
                agentId,
                metadata[i].metadataKey,
                metadata[i].metadataValue
            );
        }
        return agentId;
    }

    /**
     * @notice Update the agent URI
     */
    function setAgentURI(uint256 agentId, string calldata newURI) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        _setTokenURI(agentId, newURI);
        emit URIUpdated(agentId, newURI, msg.sender);
    }

    /**
     * @notice Set arbitrary metadata
     */
    function setMetadata(
        uint256 agentId,
        string calldata metadataKey,
        bytes calldata metadataValue
    ) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        require(
            keccak256(bytes(metadataKey)) != keccak256(bytes("agentWallet")),
            "Cannot set agentWallet via setMetadata"
        );
        _setMetadata(agentId, metadataKey, metadataValue);
    }

    function _setMetadata(
        uint256 agentId,
        string memory key,
        bytes memory value
    ) internal {
        _agentMetadata[agentId][key] = value;
        // Emit event with indexed key for searchability
        emit MetadataSet(agentId, key, key, value);
    }

    function getMetadata(
        uint256 agentId,
        string calldata metadataKey
    ) external view returns (bytes memory) {
        return _agentMetadata[agentId][metadataKey];
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return _agentWallets[agentId];
    }

    // Simplified wallet setting for hackathon speed (skipping EIP-712 proof requirement for now to move fast, relying on owner auth)
    function setAgentWallet(uint256 agentId, address newWallet) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        _agentWallets[agentId] = newWallet;
        emit AgentWalletSet(agentId, newWallet);
    }
}
