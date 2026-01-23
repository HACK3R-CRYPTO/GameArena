// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/GameCurrency.sol";
import "../src/GameAssets.sol";
import "../src/WinnerBadge.sol";

contract SetPermissionsScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address goldTokenAddr = 0x8cCFc8CA795795CDa94b9319bE3a5ef171E90faC;
        address diamondTokenAddr = 0x3E11b468cd07194606F54195122D1F3FD6D00564;
        address gameAssetsAddr = 0x843A8Ffd83dfD5Da4f945aeC6649044E6cF2F7aE;
        address winnerBadgeAddr = 0x5c46D28B15e46430b083dC67824673A664F8c829;
        address platformAddr = 0x86049C7F682E72d2744A9379e005392a4e2eA35B;
        address lotteryAddr = 0x37e425aEcE1e2Fc89b286cF7a63a74E8c7a791c4;

        GoldToken goldToken = GoldToken(goldTokenAddr);
        DiamondToken diamondToken = DiamondToken(diamondTokenAddr);
        GameAssets gameAssets = GameAssets(gameAssetsAddr);
        WinnerBadge winnerBadge = WinnerBadge(winnerBadgeAddr);

        // Set permissions
        // Try-catch blocks aren't needed if we assume we are owner and it just works or reverts if already set (depending on implementation)
        // Standard AccessControl/Ownable might revert if we are not owner. Deployer is owner.
        
        // WinnerBadge -> TournamentPlatform
        try winnerBadge.authorizeMinter(platformAddr) {
            console.log("WinnerBadge authorized Platform");
        } catch {
            console.log("WinnerBadge authorization failed (maybe already set?)");
        }

        // GoldToken -> TournamentPlatform
        try goldToken.addMinter(platformAddr) {
             console.log("GoldToken authorized Platform");
        } catch {
             console.log("GoldToken authorization failed");
        }

        // DiamondToken -> TournamentPlatform
        try diamondToken.addMinter(platformAddr) {
            console.log("DiamondToken authorized Platform");
        } catch {
            console.log("DiamondToken authorization failed");
        }

        // GoldToken -> GameLottery
        try goldToken.addMinter(lotteryAddr) {
            console.log("GoldToken authorized Lottery");
        } catch {
            console.log("GoldToken authorization failed");
        }

        // DiamondToken -> GameLottery
        try diamondToken.addMinter(lotteryAddr) {
            console.log("DiamondToken authorized Lottery");
        } catch {
            console.log("DiamondToken authorization failed");
        }

        // GameAssets -> GameLottery
        try gameAssets.addMinter(lotteryAddr) {
            console.log("GameAssets authorized Lottery");
        } catch {
            console.log("GameAssets authorization failed");
        }

        vm.stopBroadcast();
    }
}
