// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArenaToken (ARENA)
 * @dev Governance and Utility token for the Gaming Arena Agent.
 * High-performance AI agents generate revenue for token holders through wagering fees.
 */
contract ArenaToken is ERC20, Ownable {
    
    address public agentActivityRegistry;
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 Billion

    constructor() ERC20("Arena AI Champion", "ARENA") Ownable() {
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    /**
     * @notice Allows the agent to burn or distribute tokens based on game success
     * Simulation of Rev-Share / Governance
     */
    function recordAgentRevShare() external payable {
        // In a real scenario, this would distribute MON to stakers or buy back ARENA
        // For the hackathon demo, we acknowledge the revenue flow
    }
}
