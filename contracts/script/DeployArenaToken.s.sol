// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ArenaToken.sol";

contract DeployArenaToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        ArenaToken token = new ArenaToken();
        console.log("ArenaToken (ARENA) deployed at:", address(token));

        vm.stopBroadcast();
    }
}
