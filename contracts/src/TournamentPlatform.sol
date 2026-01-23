// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./WinnerBadge.sol";
import "./GameCurrency.sol";

/**
 * @title TournamentPlatform
 * @dev Decentralized tournament management platform with automatic prize distribution and NFT badges
 */
contract TournamentPlatform is Ownable, ReentrancyGuard {
    
    // Enums
    enum TournamentStatus { Created, Active, Completed, Cancelled }
    
    // Structs
    struct Tournament {
        uint256 id;
        string name;
        string description;
        address creator;
        uint256 entryFee;
        uint256 maxParticipants;
        uint256 startTime;
        uint256 endTime;
        uint256 prizePool;
        TournamentStatus status;
        bool resultsSubmitted;
    }
    
    struct ParticipantScore {
        address participant;
        uint256 score;
        uint256 survivalTime;
        uint256 killCount;
    }
    
    // State variables
    uint256 public tournamentCounter;
    uint256 public platformFeePercent = 5; // 5% platform fee
    address public platformTreasury;
    WinnerBadge public winnerBadge;
    GoldToken public goldToken;
    DiamondToken public diamondToken;
    
    // Reward settings
    uint256 public goldRewardPerWin = 1000 * 10**18;
    uint256 public diamondRewardPerWin = 50 * 10**18;
    
    // Safety limits
    uint256 public constant MIN_PARTICIPANTS = 2;
    uint256 public constant MAX_PARTICIPANTS = 50; // Gas optimization
    uint256 public constant MIN_ENTRY_FEE = 0.001 ether;
    
    // Mappings
    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => address[]) public tournamentParticipants;
    mapping(uint256 => mapping(address => bool)) public hasJoined;
    mapping(uint256 => mapping(address => ParticipantScore)) public participantScores;
    mapping(uint256 => address[]) public tournamentWinners;
    mapping(address => uint256[]) public playerTournaments;
    
    // Events
    event TournamentCreated(
        uint256 indexed tournamentId,
        address indexed creator,
        string name,
        uint256 entryFee,
        uint256 maxParticipants,
        uint256 startTime,
        uint256 endTime
    );
    
    event ParticipantJoined(
        uint256 indexed tournamentId,
        address indexed participant,
        uint256 entryFee
    );
    
    event ScoreSubmitted(
        uint256 indexed tournamentId,
        address indexed participant,
        uint256 score,
        uint256 survivalTime,
        uint256 killCount
    );
    
    event ResultsFinalized(
        uint256 indexed tournamentId,
        uint256 totalParticipants
    );
    
    event PrizesDistributed(
        uint256 indexed tournamentId,
        uint256 totalPrizes,
        uint256 platformFee
    );
    
    event BadgesMinted(
        uint256 indexed tournamentId,
        uint256 winnersCount
    );
    
    event TournamentCancelled(
        uint256 indexed tournamentId,
        uint256 refundedAmount
    );
    
    event PlatformFeeUpdated(uint256 newFeePercent);
    event TreasuryUpdated(address newTreasury);
    event WinnerBadgeUpdated(address newBadgeContract);
    
    // Modifiers
    modifier tournamentExists(uint256 _tournamentId) {
        require(_tournamentId < tournamentCounter, "Tournament does not exist");
        _;
    }
    
    modifier onlyCreator(uint256 _tournamentId) {
        require(
            tournaments[_tournamentId].creator == msg.sender,
            "Only tournament creator can call this"
        );
        _;
    }
    
    modifier tournamentNotStarted(uint256 _tournamentId) {
        require(
            block.timestamp < tournaments[_tournamentId].startTime,
            "Tournament has already started"
        );
        _;
    }
    
    modifier tournamentEnded(uint256 _tournamentId) {
        require(
            block.timestamp >= tournaments[_tournamentId].endTime,
            "Tournament has not ended yet"
        );
        _;
    }
    
    modifier canFinalize(uint256 _tournamentId) {
        require(
            msg.sender == tournaments[_tournamentId].creator || msg.sender == owner(),
            "Not authorized to finalize"
        );
        _;
    }
    
    constructor(
        address _treasury, 
        address _winnerBadge,
        address _goldToken,
        address _diamondToken
    ) Ownable() {
        require(_treasury != address(0), "Invalid treasury address");
        require(_winnerBadge != address(0), "Invalid badge address");
        platformTreasury = _treasury;
        winnerBadge = WinnerBadge(_winnerBadge);
        goldToken = GoldToken(_goldToken);
        diamondToken = DiamondToken(_diamondToken);
    }
    
    /**
     * @dev Create a new tournament
     */
    function createTournament(
        string memory _name,
        string memory _description,
        uint256 _entryFee,
        uint256 _maxParticipants,
        uint256 _startTime,
        uint256 _endTime
    ) external returns (uint256) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_maxParticipants >= MIN_PARTICIPANTS, "Min 2 participants required");
        require(_maxParticipants <= MAX_PARTICIPANTS, "Max 50 participants for gas efficiency");
        require(_entryFee >= MIN_ENTRY_FEE || _entryFee == 0, "Entry fee too low (min 0.001 ETH)");
        require(_startTime > block.timestamp, "Start time must be in the future");
        require(_endTime > _startTime, "End time must be after start time");
        
        uint256 tournamentId = tournamentCounter++;
        
        tournaments[tournamentId] = Tournament({
            id: tournamentId,
            name: _name,
            description: _description,
            creator: msg.sender,
            entryFee: _entryFee,
            maxParticipants: _maxParticipants,
            startTime: _startTime,
            endTime: _endTime,
            prizePool: 0,
            status: TournamentStatus.Created,
            resultsSubmitted: false
        });
        
        emit TournamentCreated(
            tournamentId,
            msg.sender,
            _name,
            _entryFee,
            _maxParticipants,
            _startTime,
            _endTime
        );
        
        return tournamentId;
    }
    
    /**
     * @dev Join a tournament by paying the entry fee
     */
    function joinTournament(uint256 _tournamentId)
        external
        payable
        tournamentExists(_tournamentId)
        tournamentNotStarted(_tournamentId)
        nonReentrant
    {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(
            tournament.status == TournamentStatus.Created,
            "Tournament is not open for registration"
        );
        require(
            !hasJoined[_tournamentId][msg.sender],
            "Already joined this tournament"
        );
        require(
            tournamentParticipants[_tournamentId].length < tournament.maxParticipants,
            "Tournament is full"
        );
        require(
            msg.value == tournament.entryFee,
            "Incorrect entry fee"
        );
        
        tournamentParticipants[_tournamentId].push(msg.sender);
        hasJoined[_tournamentId][msg.sender] = true;
        playerTournaments[msg.sender].push(_tournamentId);
        tournament.prizePool += msg.value;
        
        emit ParticipantJoined(_tournamentId, msg.sender, msg.value);
    }
    
    /**
     * @dev Submit game score for a tournament (allows updates)
     */
    function submitScore(
        uint256 _tournamentId,
        uint256 _survivalTime,
        uint256 _killCount
    ) external tournamentExists(_tournamentId) {
        require(
            hasJoined[_tournamentId][msg.sender],
            "Not a participant in this tournament"
        );
        require(
            block.timestamp >= tournaments[_tournamentId].startTime,
            "Tournament has not started"
        );
        require(
            block.timestamp <= tournaments[_tournamentId].endTime,
            "Tournament has ended"
        );
        
        // Calculate score: survivalTime * 10 + killCount * 100
        uint256 finalScore = (_survivalTime * 10) + (_killCount * 100);
        
        // Allow score updates - keep highest score
        uint256 currentScore = participantScores[_tournamentId][msg.sender].score;
        if (finalScore > currentScore) {
            participantScores[_tournamentId][msg.sender] = ParticipantScore({
                participant: msg.sender,
                score: finalScore,
                survivalTime: _survivalTime,
                killCount: _killCount
            });
            
            emit ScoreSubmitted(_tournamentId, msg.sender, finalScore, _survivalTime, _killCount);
        }
    }
    
    /**
     * @dev Finalize tournament results and distribute prizes
     */
    function finalizeAndDistribute(uint256 _tournamentId)
        external
        tournamentExists(_tournamentId)
        tournamentEnded(_tournamentId)
        canFinalize(_tournamentId)
        nonReentrant
    {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(
            tournament.status != TournamentStatus.Completed,
            "Tournament already completed"
        );
        require(
            tournament.status != TournamentStatus.Cancelled,
            "Tournament was cancelled"
        );
        
        address[] memory participants = tournamentParticipants[_tournamentId];
        require(participants.length >= MIN_PARTICIPANTS, "Not enough participants");
        
        // Sort participants by score (bubble sort for simplicity)
        address[] memory sortedParticipants = _sortParticipantsByScore(_tournamentId, participants);
        
        // Calculate and distribute prizes
        _distributePrizes(_tournamentId, sortedParticipants);
        
        // Mint NFT badges for top 10 winners
        _mintWinnerBadges(_tournamentId, sortedParticipants);
        
        tournament.status = TournamentStatus.Completed;
        tournament.resultsSubmitted = true;
        
        emit ResultsFinalized(_tournamentId, participants.length);
    }
    
    /**
     * @dev Cancel tournament and refund all participants
     */
    function cancelTournament(uint256 _tournamentId)
        external
        tournamentExists(_tournamentId)
        onlyCreator(_tournamentId)
        tournamentNotStarted(_tournamentId)
        nonReentrant
    {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(
            tournament.status == TournamentStatus.Created,
            "Cannot cancel tournament"
        );
        
        address[] memory participants = tournamentParticipants[_tournamentId];
        uint256 refundAmount = tournament.entryFee;
        uint256 totalRefunded = 0;
        
        // Refund all participants
        for (uint256 i = 0; i < participants.length; i++) {
            (bool success, ) = participants[i].call{value: refundAmount}("");
            require(success, "Refund failed");
            totalRefunded += refundAmount;
        }
        
        tournament.status = TournamentStatus.Cancelled;
        tournament.prizePool = 0;
        
        emit TournamentCancelled(_tournamentId, totalRefunded);
    }
    
    /**
     * @dev Internal function to sort participants by score (descending)
     */
    function _sortParticipantsByScore(
        uint256 _tournamentId,
        address[] memory _participants
    ) internal view returns (address[] memory) {
        address[] memory sorted = new address[](_participants.length);
        
        for (uint256 i = 0; i < _participants.length; i++) {
            sorted[i] = _participants[i];
        }
        
        // Bubble sort (descending order)
        for (uint256 i = 0; i < sorted.length; i++) {
            for (uint256 j = i + 1; j < sorted.length; j++) {
                if (
                    participantScores[_tournamentId][sorted[i]].score <
                    participantScores[_tournamentId][sorted[j]].score
                ) {
                    address temp = sorted[i];
                    sorted[i] = sorted[j];
                    sorted[j] = temp;
                }
            }
        }
        
        return sorted;
    }
    
    /**
     * @dev Internal function to distribute prizes
     */
    function _distributePrizes(
        uint256 _tournamentId,
        address[] memory _sortedParticipants
    ) internal {
        Tournament storage tournament = tournaments[_tournamentId];
        uint256 prizePool = tournament.prizePool;
        
        // Calculate platform fee
        uint256 platformFee = (prizePool * platformFeePercent) / 100;
        uint256 remainingPool = prizePool - platformFee;
        
        // Transfer platform fee
        (bool feeSuccess, ) = platformTreasury.call{value: platformFee}("");
        require(feeSuccess, "Platform fee transfer failed");
        
        // Prize distribution percentages
        uint256 firstPrize = (remainingPool * 50) / 100;  // 50%
        uint256 secondPrize = (remainingPool * 30) / 100; // 30%
        uint256 thirdPrize = (remainingPool * 15) / 100;  // 15%
        uint256 othersPrize = remainingPool - firstPrize - secondPrize - thirdPrize; // 5%
        
        // Distribute prizes
        if (_sortedParticipants.length >= 1) {
            (bool success1, ) = _sortedParticipants[0].call{value: firstPrize}("");
            require(success1, "First prize transfer failed");
            tournamentWinners[_tournamentId].push(_sortedParticipants[0]);
            
            // Mint Gold and Diamonds for 1st place
            goldToken.mint(_sortedParticipants[0], goldRewardPerWin);
            diamondToken.mint(_sortedParticipants[0], diamondRewardPerWin);
        }
        
        if (_sortedParticipants.length >= 2) {
            (bool success2, ) = _sortedParticipants[1].call{value: secondPrize}("");
            require(success2, "Second prize transfer failed");
            tournamentWinners[_tournamentId].push(_sortedParticipants[1]);

            // 2nd place gets half rewards
            goldToken.mint(_sortedParticipants[1], goldRewardPerWin / 2);
            diamondToken.mint(_sortedParticipants[1], diamondRewardPerWin / 2);
        }
        
        if (_sortedParticipants.length >= 3) {
            (bool success3, ) = _sortedParticipants[2].call{value: thirdPrize}("");
            require(success3, "Third prize transfer failed");
            tournamentWinners[_tournamentId].push(_sortedParticipants[2]);

            // 3rd place gets quarter rewards
            goldToken.mint(_sortedParticipants[2], goldRewardPerWin / 4);
            diamondToken.mint(_sortedParticipants[2], diamondRewardPerWin / 4);
        }
        
        // Distribute remaining prize among other participants
        if (_sortedParticipants.length > 3 && othersPrize > 0) {
            uint256 perPersonPrize = othersPrize / (_sortedParticipants.length - 3);
            for (uint256 i = 3; i < _sortedParticipants.length; i++) {
                (bool success, ) = _sortedParticipants[i].call{value: perPersonPrize}("");
                require(success, "Other prize transfer failed");
            }
        }
        
        emit PrizesDistributed(_tournamentId, prizePool, platformFee);
    }
    
    /**
     * @dev Internal function to mint NFT badges for top 10 winners
     */
    function _mintWinnerBadges(
        uint256 _tournamentId,
        address[] memory _sortedParticipants
    ) internal {
        Tournament storage tournament = tournaments[_tournamentId];
        
        // Mint badges for top 10 winners (or all if less than 10)
        uint256 winnersToReward = _sortedParticipants.length > 10 ? 10 : _sortedParticipants.length;
        
        for (uint256 i = 0; i < winnersToReward; i++) {
            address winner = _sortedParticipants[i];
            uint256 score = participantScores[_tournamentId][winner].score;
            
            // Mint badge (position is 1-indexed)
            winnerBadge.mintBadge(
                winner,
                _tournamentId,
                i + 1, // position (1-10)
                score,
                tournament.name
            );
        }
        
        emit BadgesMinted(_tournamentId, winnersToReward);
    }
    
    // View functions
    
    function getTournament(uint256 _tournamentId)
        external
        view
        tournamentExists(_tournamentId)
        returns (Tournament memory)
    {
        return tournaments[_tournamentId];
    }
    
    function getTournamentParticipants(uint256 _tournamentId)
        external
        view
        tournamentExists(_tournamentId)
        returns (address[] memory)
    {
        return tournamentParticipants[_tournamentId];
    }
    
    function getTournamentWinners(uint256 _tournamentId)
        external
        view
        tournamentExists(_tournamentId)
        returns (address[] memory)
    {
        return tournamentWinners[_tournamentId];
    }
    
    function getPlayerTournaments(address _player)
        external
        view
        returns (uint256[] memory)
    {
        return playerTournaments[_player];
    }
    
    function getParticipantScore(uint256 _tournamentId, address _participant)
        external
        view
        returns (ParticipantScore memory)
    {
        return participantScores[_tournamentId][_participant];
    }
    
    /**
     * @dev Get current tournament status (auto-updates based on time)
     */
    function getTournamentStatus(uint256 _tournamentId) 
        public 
        view 
        tournamentExists(_tournamentId)
        returns (TournamentStatus) 
    {
        Tournament memory t = tournaments[_tournamentId];
        
        if (t.status == TournamentStatus.Cancelled) return TournamentStatus.Cancelled;
        if (t.status == TournamentStatus.Completed) return TournamentStatus.Completed;
        if (block.timestamp >= t.endTime) return TournamentStatus.Completed;
        if (block.timestamp >= t.startTime) return TournamentStatus.Active;
        return TournamentStatus.Created;
    }
    
    // Admin functions
    
    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 10, "Fee cannot exceed 10%");
        platformFeePercent = _newFeePercent;
        emit PlatformFeeUpdated(_newFeePercent);
    }
    
    function updateTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury address");
        platformTreasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }
    
    function updateWinnerBadge(address _newBadgeContract) external onlyOwner {
        require(_newBadgeContract != address(0), "Invalid badge address");
        winnerBadge = WinnerBadge(_newBadgeContract);
        emit WinnerBadgeUpdated(_newBadgeContract);
    }
}
