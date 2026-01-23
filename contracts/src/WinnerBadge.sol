// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title WinnerBadge
 * @dev NFT badges for tournament winners (Top 10 positions)
 */
contract WinnerBadge is ERC721, Ownable {
    using Strings for uint256;
    
    uint256 private _tokenIdCounter;
    
    // Badge metadata
    struct Badge {
        uint256 tournamentId;
        uint256 position; // 1-10
        address winner;
        uint256 score;
        uint256 timestamp;
        string tournamentName;
    }
    
    // Mappings
    mapping(uint256 => Badge) public badges;
    mapping(address => uint256[]) public playerBadges;
    mapping(uint256 => mapping(uint256 => uint256)) public tournamentPositionBadge; // tournamentId => position => badgeId
    
    // Authorized minters (TournamentPlatform contract)
    mapping(address => bool) public authorizedMinters;
    
    // Events
    event BadgeMinted(
        uint256 indexed badgeId,
        uint256 indexed tournamentId,
        address indexed winner,
        uint256 position,
        uint256 score
    );
    
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    
    constructor() ERC721("TournamentChain Winner Badge", "TCWB") Ownable() {}
    
    /**
     * @dev Mint a winner badge (only authorized contracts can call)
     */
    function mintBadge(
        address _winner,
        uint256 _tournamentId,
        uint256 _position,
        uint256 _score,
        string memory _tournamentName
    ) external returns (uint256) {
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        require(_position >= 1 && _position <= 10, "Position must be 1-10");
        require(_winner != address(0), "Invalid winner address");
        
        uint256 tokenId = _tokenIdCounter++;
        
        _safeMint(_winner, tokenId);
        
        badges[tokenId] = Badge({
            tournamentId: _tournamentId,
            position: _position,
            winner: _winner,
            score: _score,
            timestamp: block.timestamp,
            tournamentName: _tournamentName
        });
        
        playerBadges[_winner].push(tokenId);
        tournamentPositionBadge[_tournamentId][_position] = tokenId;
        
        emit BadgeMinted(tokenId, _tournamentId, _winner, _position, _score);
        
        return tokenId;
    }
    
    /**
     * @dev Get position name (1st Place, 2nd Place, etc.)
     */
    function _getPositionName(uint256 _position) internal pure returns (string memory) {
        if (_position == 1) return "1st Place Champion";
        if (_position == 2) return "2nd Place Runner-Up";
        if (_position == 3) return "3rd Place Bronze";
        if (_position <= 10) return string(abi.encodePacked("Top 10 - Position ", _position.toString()));
        return "Participant";
    }
    
    /**
     * @dev Get rarity based on position
     */
    function _getRarity(uint256 _position) internal pure returns (string memory) {
        if (_position == 1) return "Legendary";
        if (_position == 2) return "Epic";
        if (_position == 3) return "Rare";
        if (_position <= 5) return "Uncommon";
        return "Common";
    }
    
    /**
     * @dev Override tokenURI to generate metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        
        Badge memory badge = badges[tokenId];
        string memory positionName = _getPositionName(badge.position);
        string memory rarity = _getRarity(badge.position);
        
        // Generate JSON metadata
        string memory json = string(
            abi.encodePacked(
                '{"name":"',
                positionName,
                ' - ',
                badge.tournamentName,
                '","description":"Tournament winner badge for position ',
                badge.position.toString(),
                '","attributes":[',
                '{"trait_type":"Position","value":"',
                badge.position.toString(),
                '"},',
                '{"trait_type":"Rarity","value":"',
                rarity,
                '"},',
                '{"trait_type":"Score","value":"',
                badge.score.toString(),
                '"},',
                '{"trait_type":"Tournament ID","value":"',
                badge.tournamentId.toString(),
                '"}',
                ']}'
            )
        );
        
        return string(abi.encodePacked("data:application/json;utf8,", json));
    }
    
    /**
     * @dev Get all badges owned by a player
     */
    function getPlayerBadges(address _player) external view returns (uint256[] memory) {
        return playerBadges[_player];
    }
    
    /**
     * @dev Get badge details
     */
    function getBadge(uint256 _badgeId) external view returns (Badge memory) {
        require(_ownerOf(_badgeId) != address(0), "Badge does not exist");
        return badges[_badgeId];
    }
    
    /**
     * @dev Get badge for specific tournament position
     */
    function getTournamentPositionBadge(uint256 _tournamentId, uint256 _position) 
        external 
        view 
        returns (uint256) 
    {
        return tournamentPositionBadge[_tournamentId][_position];
    }
    
    /**
     * @dev Count player's wins by position
     */
    function getPlayerWinCount(address _player, uint256 _position) 
        external 
        view 
        returns (uint256) 
    {
        uint256 count = 0;
        uint256[] memory badgeIds = playerBadges[_player];
        
        for (uint256 i = 0; i < badgeIds.length; i++) {
            if (badges[badgeIds[i]].position == _position) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * @dev Get total wins for a player (any position)
     */
    function getTotalWins(address _player) external view returns (uint256) {
        return playerBadges[_player].length;
    }
    
    // Admin functions
    
    /**
     * @dev Authorize a contract to mint badges (e.g., TournamentPlatform)
     */
    function authorizeMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter address");
        authorizedMinters[_minter] = true;
        emit MinterAuthorized(_minter);
    }
    
    /**
     * @dev Revoke minting authorization
     */
    function revokeMinter(address _minter) external onlyOwner {
        authorizedMinters[_minter] = false;
        emit MinterRevoked(_minter);
    }
    
    /**
     * @dev Check if address is authorized minter
     */
    function isAuthorizedMinter(address _minter) external view returns (bool) {
        return authorizedMinters[_minter];
    }
}
