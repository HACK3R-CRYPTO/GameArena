// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArcadePlatform
 * @dev Simple leaderboard for free-to-play arcade mode
 */
contract ArcadePlatform {
    struct PlayerScore {
        address player;
        uint256 score;
    }

    // List of all players who have played
    address[] public players;
    mapping(address => uint256) public highScores;
    mapping(address => bool) public hasPlayed;

    event ScoreSubmitted(address indexed player, uint256 score);

    function submitScore(uint256 _score) external {
        if (_score > highScores[msg.sender]) {
            highScores[msg.sender] = _score;
            if (!hasPlayed[msg.sender]) {
                players.push(msg.sender);
                hasPlayed[msg.sender] = true;
            }
            emit ScoreSubmitted(msg.sender, _score);
        }
    }

    function getLeaderboard() external view returns (PlayerScore[] memory) {
        PlayerScore[] memory leaderboard = new PlayerScore[](players.length);
        for (uint256 i = 0; i < players.length; i++) {
            leaderboard[i] = PlayerScore({
                player: players[i],
                score: highScores[players[i]]
            });
        }
        return leaderboard;
    }

    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
}
