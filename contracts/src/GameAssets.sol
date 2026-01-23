// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title GameAssets
 * @dev ERC1155 contract for game weapons and character skins
 */
contract GameAssets is ERC1155, Ownable {
    using Strings for uint256;

    // Asset Categories
    uint256 public constant WEAPON_TYPE = 1;
    uint256 public constant SKIN_TYPE = 2;

    mapping(address => bool) public minters;
    
    mapping(uint256 => string) public tokenNames;
    mapping(uint256 => uint256) public tokenTypes; // 1 for Weapon, 2 for Skin

    constructor() ERC1155("https://api.tournamentchain.com/metadata/{id}.json") Ownable() {}

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
    }

    /**
     * @dev Mint a new game asset
     */
    function mintAsset(
        address to,
        uint256 id,
        uint256 amount,
        string memory name,
        uint256 assetType,
        bytes memory data
    ) external {
        // ALLOW PUBLIC MINTING FOR HACKATHON TESTING
        // require(owner() == msg.sender || minters[msg.sender], "Not a minter");
        tokenNames[id] = name;
        tokenTypes[id] = assetType;
        _mint(to, id, amount, data);
    }

    /**
     * @dev Batch mint assets
     */
    function mintBatchAssets(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        string[] memory names,
        uint256[] memory types,
        bytes memory data
    ) external onlyOwner {
        require(ids.length == names.length && ids.length == types.length, "Array lengths mismatch");
        for (uint256 i = 0; i < ids.length; i++) {
            tokenNames[ids[i]] = names[i];
            tokenTypes[ids[i]] = types[i];
        }
        _mintBatch(to, ids, amounts, data);
    }

    /**
     * @dev Update the URI for metadata
     */
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    /**
     * @dev Helper to get token type name
     */
    function getAssetTypeName(uint256 id) external view returns (string memory) {
        uint256 t = tokenTypes[id];
        if (t == WEAPON_TYPE) return "Weapon";
        if (t == SKIN_TYPE) return "Skin";
        return "Unknown";
    }
}
