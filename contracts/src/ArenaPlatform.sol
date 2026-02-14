// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ArenaPlatform
 * @dev 1v1 Wagering platform for AI Agents and Players
 */
contract ArenaPlatform is Ownable, ReentrancyGuard {
    enum MatchStatus {
        Proposed,
        Accepted,
        Completed,
        Cancelled
    }
    enum GameType {
        RockPaperScissors,
        DiceRoll,
        StrategyBattle,
        CoinFlip,
        TicTacToe
    }

    struct Match {
        uint256 id;
        address challenger;
        address opponent; // address(0) for open challenges
        uint256 wager;
        GameType gameType;
        MatchStatus status;
        address winner;
        uint256 createdAt;
    }

    uint256 public matchCounter;
    uint256 public platformFeePercent = 2; // 2% fee for arena matches
    address public platformTreasury;

    mapping(uint256 => Match) public matches;
    mapping(address => uint256[]) public playerMatches;
    // Map matchId -> player -> move (0-255)
    mapping(uint256 => mapping(address => uint8)) public playerMoves;
    // Map matchId -> player -> hasPlayed (to distinguish move 0)
    mapping(uint256 => mapping(address => bool)) public hasPlayed;

    event MatchProposed(
        uint256 indexed matchId,
        address indexed challenger,
        address indexed opponent,
        uint256 wager,
        GameType gameType
    );
    event MatchAccepted(uint256 indexed matchId, address indexed opponent);
    event MatchCompleted(
        uint256 indexed matchId,
        address indexed winner,
        uint256 prize
    );
    event MatchCancelled(uint256 indexed matchId);
    event MovePlayed(
        uint256 indexed matchId,
        address indexed player,
        uint8 move
    );

    constructor(address _treasury) Ownable() {
        platformTreasury = _treasury;
    }

    function proposeMatch(
        address _opponent,
        GameType _gameType
    ) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "Wager must be > 0");

        uint256 matchId = matchCounter++;
        matches[matchId] = Match({
            id: matchId,
            challenger: msg.sender,
            opponent: _opponent,
            wager: msg.value,
            gameType: _gameType,
            status: MatchStatus.Proposed,
            winner: address(0),
            createdAt: block.timestamp
        });

        playerMatches[msg.sender].push(matchId);
        if (_opponent != address(0)) {
            playerMatches[_opponent].push(matchId);
        }

        emit MatchProposed(
            matchId,
            msg.sender,
            _opponent,
            msg.value,
            _gameType
        );
        return matchId;
    }

    function acceptMatch(uint256 _matchId) external payable nonReentrant {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Proposed, "Match not available");
        require(
            m.opponent == address(0) || m.opponent == msg.sender,
            "Not your match"
        );
        require(msg.value == m.wager, "Must match wager amount");
        // Removed self-challenge check to allow testing with one wallet
        // require(m.challenger != msg.sender, "Cannot challenge yourself");

        m.opponent = msg.sender;
        m.status = MatchStatus.Accepted;

        // If it was an open challenge, add it to the acceptor's list
        bool alreadyInList = false;
        for (uint i = 0; i < playerMatches[msg.sender].length; i++) {
            if (playerMatches[msg.sender][i] == _matchId) {
                alreadyInList = true;
                break;
            }
        }
        if (!alreadyInList) {
            playerMatches[msg.sender].push(_matchId);
        }

        emit MatchAccepted(_matchId, msg.sender);
    }

    function playMove(uint256 _matchId, uint8 _move) external nonReentrant {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Accepted, "Match not active");
        require(
            msg.sender == m.challenger || msg.sender == m.opponent,
            "Not in match"
        );

        if (m.gameType == GameType.RockPaperScissors) {
            require(_move < 3, "Invalid RPS move");
        } else if (m.gameType == GameType.DiceRoll) {
            require(_move >= 1 && _move <= 6, "Invalid Dice move");
        } else if (m.gameType == GameType.StrategyBattle) {
            require(_move < 10, "Invalid Strategy move");
        } else if (m.gameType == GameType.CoinFlip) {
            require(_move < 2, "Invalid CoinFlip move");
        } else if (m.gameType == GameType.TicTacToe) {
            require(_move < 9, "Invalid TicTacToe move");
        }

        playerMoves[_matchId][msg.sender] = _move;
        hasPlayed[_matchId][msg.sender] = true;

        emit MovePlayed(_matchId, msg.sender, _move);
    }

    // In a real scenario, this would be called by a trusted referee or via ZK proofs
    // For the hackathon, we allow the owner or a designated referee to resolve
    function resolveMatch(
        uint256 _matchId,
        address _winner
    ) external onlyOwner nonReentrant {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Accepted, "Match not in progress");
        require(
            _winner == m.challenger || _winner == m.opponent,
            "Invalid winner"
        );

        uint256 totalPool = m.wager * 2;
        uint256 fee = (totalPool * platformFeePercent) / 100;
        uint256 prize = totalPool - fee;

        m.winner = _winner;
        m.status = MatchStatus.Completed;

        (bool feeSuccess, ) = platformTreasury.call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        (bool prizeSuccess, ) = _winner.call{value: prize}("");
        require(prizeSuccess, "Prize transfer failed");

        emit MatchCompleted(_matchId, _winner, prize);
    }

    function cancelMatch(uint256 _matchId) external nonReentrant {
        Match storage m = matches[_matchId];
        require(m.status == MatchStatus.Proposed, "Cannot cancel");
        require(m.challenger == msg.sender, "Only challenger can cancel");

        m.status = MatchStatus.Cancelled;
        (bool success, ) = m.challenger.call{value: m.wager}("");
        require(success, "Refund failed");

        emit MatchCancelled(_matchId);
    }

    function getPlayerMatches(
        address _player
    ) external view returns (uint256[] memory) {
        return playerMatches[_player];
    }
}
