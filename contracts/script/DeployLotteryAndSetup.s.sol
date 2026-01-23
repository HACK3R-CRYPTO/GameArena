// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/GameLottery.sol";
import "../src/GameCurrency.sol";
import "../src/GameAssets.sol";

contract DeployLotteryAndSetup is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        // Existing Token Addresses
        address goldTokenAddr = 0x8cCFc8CA795795CDa94b9319bE3a5ef171E90faC;
        address diamondTokenAddr = 0x3E11b468cd07194606F54195122D1F3FD6D00564;
        address gameAssetsAddr = 0x843A8Ffd83dfD5Da4f945aeC6649044E6cF2F7aE;
        
        // Deploy new GameLottery
        GameLottery lottery = new GameLottery(
            diamondTokenAddr,
            goldTokenAddr,
            gameAssetsAddr,
            deployer // treasury
        );
        console.log("New GameLottery deployed at:", address(lottery));

        // Setup Permissions
        GoldToken(goldTokenAddr).addMinter(address(lottery));
        DiamondToken(diamondTokenAddr).addMinter(address(lottery));
        GameAssets(gameAssetsAddr).addMinter(address(lottery));
        console.log("Minter permissions set for new Lottery");

        // Add Asset Prizes
        // PrizeType.Asset is 2
        // addPrize(PrizeType _pType, uint256 _amount, uint256 _assetId, string _assetName, uint256 _assetType)
        
        // 1. Plasma Rifle (Weapon)
        lottery.addPrize(
            GameLottery.PrizeType.Asset,
            0,
            1,
            "Plasma Rifle",
            1
        );
        console.log("Added Prize: Plasma Rifle");

        // 2. Cyber Sword (Weapon)
        lottery.addPrize(
            GameLottery.PrizeType.Asset,
            0,
            2,
            "Cyber Sword",
            1
        );
        console.log("Added Prize: Cyber Sword");

        // 3. Neon Skin (Skin)
        lottery.addPrize(
            GameLottery.PrizeType.Asset,
            0,
            3,
            "Neon Skin",
            2
        );
        console.log("Added Prize: Neon Skin");

        vm.stopBroadcast();
    }
}
