// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./GameCurrency.sol";
import "./GameAssets.sol";

/**
 * @title GameLottery
 * @dev Lottery system for winning game assets and currency
 */
contract GameLottery is Ownable, ReentrancyGuard {
    
    DiamondToken public diamondToken;
    GoldToken public goldToken;
    GameAssets public gameAssets;

    uint256 public ticketPrice = 10 * 10**18; // 10 Diamonds
    uint256 public platformFeePercent = 10;
    address public treasury;

    enum PrizeType { Gold, Diamond, Asset }

    struct Prize {
        PrizeType pType;
        uint256 amount; // For Gold/Diamond
        uint256 assetId; // For Asset
        string assetName; // Name of the asset
        uint256 assetType; // Type of asset (1=Weapon, 2=Skin)
    }

    Prize[] public possiblePrizes;

    event LotteryEntered(address indexed player, uint256 ticketCount);
    event PrizeWon(address indexed player, PrizeType pType, uint256 amount, uint256 assetId, string assetName);

    constructor(
        address _diamondToken,
        address _goldToken,
        address _gameAssets,
        address _treasury
    ) Ownable() {
        diamondToken = DiamondToken(_diamondToken);
        goldToken = GoldToken(_goldToken);
        gameAssets = GameAssets(_gameAssets);
        treasury = _treasury;

        // Initialize some prizes
        _addPrize(PrizeType.Gold, 100 * 10**18, 0, "", 0); // 100 Gold
        _addPrize(PrizeType.Gold, 500 * 10**18, 0, "", 0); // 500 Gold
        _addPrize(PrizeType.Diamond, 20 * 10**18, 0, "", 0); // 20 Diamonds
    }

    function _addPrize(PrizeType _pType, uint256 _amount, uint256 _assetId, string memory _assetName, uint256 _assetType) internal {
        possiblePrizes.push(Prize({
            pType: _pType,
            amount: _amount,
            assetId: _assetId,
            assetName: _assetName,
            assetType: _assetType
        }));
    }

    function addPrize(PrizeType _pType, uint256 _amount, uint256 _assetId, string memory _assetName, uint256 _assetType) external onlyOwner {
        _addPrize(_pType, _amount, _assetId, _assetName, _assetType);
    }

    /**
     * @dev Enter the lottery by paying with Diamonds
     */
    function enterLottery(uint256 _ticketCount) external nonReentrant {
        require(_ticketCount > 0, "Must buy at least one ticket");
        uint256 totalCost = ticketPrice * _ticketCount;
        
        // Transfer Diamonds from player
        bool success = diamondToken.transferFrom(msg.sender, address(this), totalCost);
        require(success, "Diamond transfer failed");

        // Transfer fee to treasury
        uint256 fee = (totalCost * platformFeePercent) / 100;
        diamondToken.transfer(treasury, fee);

        emit LotteryEntered(msg.sender, _ticketCount);

        // Roll for each ticket
        for (uint256 i = 0; i < _ticketCount; i++) {
            _rollForPrize(msg.sender, i);
        }
    }

    function _rollForPrize(address _player, uint256 _nonce) internal {
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            _player,
            _nonce
        )));

        uint256 prizeIndex = random % possiblePrizes.length;
        Prize storage prize = possiblePrizes[prizeIndex];

        if (prize.pType == PrizeType.Gold) {
            goldToken.mint(_player, prize.amount);
        } else if (prize.pType == PrizeType.Diamond) {
            diamondToken.mint(_player, prize.amount);
        } else if (prize.pType == PrizeType.Asset) {
            gameAssets.mintAsset(_player, prize.assetId, 1, prize.assetName, prize.assetType, "");
        }

        emit PrizeWon(_player, prize.pType, prize.amount, prize.assetId, prize.assetName);
    }

    function updateTicketPrice(uint256 _newPrice) external onlyOwner {
        ticketPrice = _newPrice;
    }

    function updateTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        treasury = _newTreasury;
    }
}
