// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentRegistry
 * @dev Implementation of EIP-8004: AI Agent Profile Standard
 * This allows agents to register their identity, model details, and capabilities on-chain.
 */
contract AgentRegistry {
    
    struct AgentProfile {
        string name;
        string model;
        string description;
        string metadataUri; // IPFS/Arweave link to extended JSON (traits, tools, etc)
        address owner;
        uint256 registeredAt;
        bool active;
    }

    mapping(address => AgentProfile) public agents;
    address[] public allAgents;

    event AgentRegistered(address indexed agentAddress, string name, string model);
    event AgentUpdated(address indexed agentAddress, string name);
    event AgentDeactivated(address indexed agentAddress);

    /**
     * @notice Register or update an agent profile
     * @param _name Name of the AI Agent
     * @param _model The underlying model (e.g. "Gemini 1.5 Flash", "GPT-4o", "Custom Markov")
     * @param _description Purpose and capabilities of the agent
     * @param _metadataUri URI pointing to external metadata
     */
    function registerAgent(
        string calldata _name,
        string calldata _model,
        string calldata _description,
        string calldata _metadataUri
    ) external {
        bool isNew = (agents[msg.sender].owner == address(0));
        
        agents[msg.sender] = AgentProfile({
            name: _name,
            model: _model,
            description: _description,
            metadataUri: _metadataUri,
            owner: msg.sender,
            registeredAt: isNew ? block.timestamp : agents[msg.sender].registeredAt,
            active: true
        });

        if (isNew) {
            allAgents.push(msg.sender);
            emit AgentRegistered(msg.sender, _name, _model);
        } else {
            emit AgentUpdated(msg.sender, _name);
        }
    }

    function deactivateAgent() external {
        require(agents[msg.sender].owner == msg.sender, "Not the owner");
        agents[msg.sender].active = false;
        emit AgentDeactivated(msg.sender);
    }

    function getAgent(address _agent) external view returns (AgentProfile memory) {
        return agents[_agent];
    }

    function getAllAgents() external view returns (address[] memory) {
        return allAgents;
    }

    function getActiveAgentsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allAgents.length; i++) {
            if (agents[allAgents[i]].active) {
                count++;
            }
        }
        return count;
    }
}
