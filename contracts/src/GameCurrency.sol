// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GoldToken
 * @dev Standard ERC20 token for game currency (Gold)
 */
contract GoldToken is ERC20, Ownable {
    mapping(address => bool) public minters;

    constructor() ERC20("TournamentChain Gold", "GOLD") Ownable() {
        _mint(msg.sender, 1000000 * 10**decimals()); // Initial supply for the platform
    }

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
    }

    function mint(address to, uint256 amount) external {
        // ALLOW PUBLIC MINTING FOR HACKATHON TESTING
        // require(owner() == msg.sender || minters[msg.sender], "Not a minter");
        _mint(to, amount);
    }
}

/**
 * @title DiamondToken
 * @dev Standard ERC20 token for premium game currency (Diamonds)
 */
contract DiamondToken is ERC20, Ownable {
    mapping(address => bool) public minters;

    constructor() ERC20("TournamentChain Diamonds", "DIAMOND") Ownable() {
        _mint(msg.sender, 100000 * 10**decimals()); // Initial supply for the platform
    }

    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
    }

    function mint(address to, uint256 amount) external {
        // ALLOW PUBLIC MINTING FOR HACKATHON TESTING
        // require(owner() == msg.sender || minters[msg.sender], "Not a minter");
        _mint(to, amount);
    }
}
