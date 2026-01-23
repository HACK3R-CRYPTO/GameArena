// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/TournamentPlatform.sol";

contract CreateTournament is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address platformAddr = 0x86049C7F682E72d2744A9379e005392a4e2eA35B;
        TournamentPlatform platform = TournamentPlatform(platformAddr);

        // Create a tournament that starts in 5 minutes and ends in 7 days
        // Entry Fee: 0.001 ETH (minimum)
        // NOTE: You can only JOIN before startTime. You can only SUBMIT SCORE after startTime.
        uint256 startTime = block.timestamp + 5 minutes; 
        uint256 endTime = block.timestamp + 7 days;
        
        uint256 tournamentId = platform.createTournament(
            "Wave Defense Live Test",
            "Join now! Game starts in 5 minutes. Survival of the fittest!",
            0.001 ether, // Entry Fee
            20,          // Max Participants
            startTime,   // Start Time
            endTime      // End Time
        );

        console.log("Created Tournament ID:", tournamentId);
        console.log("Start Time:", startTime);
        
        vm.stopBroadcast();
    }
}
