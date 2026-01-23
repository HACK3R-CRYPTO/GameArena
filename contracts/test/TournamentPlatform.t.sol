// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TournamentPlatform.sol";

contract TournamentPlatformTest is Test {
    TournamentPlatform public platform;
    address public treasury;
    address public creator;
    address public player1;
    address public player2;
    address public player3;
    address public player4;
    
    uint256 constant ENTRY_FEE = 0.01 ether;
    uint256 constant MAX_PARTICIPANTS = 10;
    
    function setUp() public {
        treasury = makeAddr("treasury");
        creator = makeAddr("creator");
        player1 = makeAddr("player1");
        player2 = makeAddr("player2");
        player3 = makeAddr("player3");
        player4 = makeAddr("player4");
        
        // Deploy WinnerBadge first
        WinnerBadge winnerBadge = new WinnerBadge();
        
        // Deploy TournamentPlatform with both addresses
        platform = new TournamentPlatform(treasury, address(winnerBadge));
        
        // Authorize platform to mint badges
        winnerBadge.authorizeMinter(address(platform));
        
        // Fund test accounts
        vm.deal(creator, 100 ether);
        vm.deal(player1, 100 ether);
        vm.deal(player2, 100 ether);
        vm.deal(player3, 100 ether);
        vm.deal(player4, 100 ether);
    }
    
    function testCreateTournament() public {
        vm.startPrank(creator);
        
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = block.timestamp + 2 hours;
        
        uint256 tournamentId = platform.createTournament(
            "Test Tournament",
            "A test tournament",
            ENTRY_FEE,
            MAX_PARTICIPANTS,
            startTime,
            endTime
        );
        
        assertEq(tournamentId, 0);
        
        TournamentPlatform.Tournament memory tournament = platform.getTournament(0);
        assertEq(tournament.name, "Test Tournament");
        assertEq(tournament.creator, creator);
        assertEq(tournament.entryFee, ENTRY_FEE);
        assertEq(tournament.maxParticipants, MAX_PARTICIPANTS);
        
        vm.stopPrank();
    }
    
    function testJoinTournament() public {
        // Create tournament
        vm.prank(creator);
        uint256 tournamentId = platform.createTournament(
            "Test Tournament",
            "Description",
            ENTRY_FEE,
            MAX_PARTICIPANTS,
            block.timestamp + 1 hours,
            block.timestamp + 2 hours
        );
        
        // Join tournament
        vm.prank(player1);
        platform.joinTournament{value: ENTRY_FEE}(tournamentId);
        
        address[] memory participants = platform.getTournamentParticipants(tournamentId);
        assertEq(participants.length, 1);
        assertEq(participants[0], player1);
        
        TournamentPlatform.Tournament memory tournament = platform.getTournament(tournamentId);
        assertEq(tournament.prizePool, ENTRY_FEE);
    }
    
    function testCannotJoinWithIncorrectFee() public {
        vm.prank(creator);
        uint256 tournamentId = platform.createTournament(
            "Test Tournament",
            "Description",
            ENTRY_FEE,
            MAX_PARTICIPANTS,
            block.timestamp + 1 hours,
            block.timestamp + 2 hours
        );
        
        vm.prank(player1);
        vm.expectRevert("Incorrect entry fee");
        platform.joinTournament{value: ENTRY_FEE - 1}(tournamentId);
    }
    
    function testCannotJoinTwice() public {
        vm.prank(creator);
        uint256 tournamentId = platform.createTournament(
            "Test Tournament",
            "Description",
            ENTRY_FEE,
            MAX_PARTICIPANTS,
            block.timestamp + 1 hours,
            block.timestamp + 2 hours
        );
        
        vm.startPrank(player1);
        platform.joinTournament{value: ENTRY_FEE}(tournamentId);
        
        vm.expectRevert("Already joined this tournament");
        platform.joinTournament{value: ENTRY_FEE}(tournamentId);
        vm.stopPrank();
    }
    
    function testSubmitScore() public {
        // Create and join tournament
        vm.prank(creator);
        uint256 tournamentId = platform.createTournament(
            "Test Tournament",
            "Description",
            ENTRY_FEE,
            MAX_PARTICIPANTS,
            block.timestamp + 1 hours,
            block.timestamp + 2 hours
        );
        
        vm.prank(player1);
        platform.joinTournament{value: ENTRY_FEE}(tournamentId);
        
        // Fast forward to tournament start
        vm.warp(block.timestamp + 1 hours + 1);
        
        // Submit score
        vm.prank(player1);
        platform.submitScore(tournamentId, 120, 50); // 120 seconds, 50 kills
        
        TournamentPlatform.ParticipantScore memory score = platform.getParticipantScore(tournamentId, player1);
        assertEq(score.survivalTime, 120);
        assertEq(score.killCount, 50);
        assertEq(score.score, 120 * 10 + 50 * 100); // 1200 + 5000 = 6200
    }
    
    function testFinalizeAndDistributePrizes() public {
        // Create tournament
        vm.prank(creator);
        uint256 tournamentId = platform.createTournament(
            "Test Tournament",
            "Description",
            ENTRY_FEE,
            MAX_PARTICIPANTS,
            block.timestamp + 1 hours,
            block.timestamp + 2 hours
        );
        
        // Join tournament with 4 players
        vm.prank(player1);
        platform.joinTournament{value: ENTRY_FEE}(tournamentId);
        
        vm.prank(player2);
        platform.joinTournament{value: ENTRY_FEE}(tournamentId);
        
        vm.prank(player3);
        platform.joinTournament{value: ENTRY_FEE}(tournamentId);
        
        vm.prank(player4);
        platform.joinTournament{value: ENTRY_FEE}(tournamentId);
        
        // Fast forward to tournament start
        vm.warp(block.timestamp + 1 hours + 1);
        
        // Submit scores (player1 wins, player2 second, player3 third, player4 fourth)
        vm.prank(player1);
        platform.submitScore(tournamentId, 200, 100); // Score: 12000
        
        vm.prank(player2);
        platform.submitScore(tournamentId, 150, 80); // Score: 9500
        
        vm.prank(player3);
        platform.submitScore(tournamentId, 100, 60); // Score: 7000
        
        vm.prank(player4);
        platform.submitScore(tournamentId, 50, 30); // Score: 3500
        
        // Fast forward to tournament end
        vm.warp(block.timestamp + 1 hours + 1);
        
        uint256 treasuryBalanceBefore = treasury.balance;
        uint256 player1BalanceBefore = player1.balance;
        uint256 player2BalanceBefore = player2.balance;
        uint256 player3BalanceBefore = player3.balance;
        uint256 player4BalanceBefore = player4.balance;
        
        // Finalize and distribute
        platform.finalizeAndDistribute(tournamentId);
        
        // Check prize distribution
        uint256 totalPrizePool = ENTRY_FEE * 4;
        uint256 platformFee = (totalPrizePool * 5) / 100; // 5%
        uint256 remainingPool = totalPrizePool - platformFee;
        
        // Treasury should receive platform fee
        assertEq(treasury.balance - treasuryBalanceBefore, platformFee);
        
        // Player1 (1st) should receive 50%
        assertEq(player1.balance - player1BalanceBefore, (remainingPool * 50) / 100);
        
        // Player2 (2nd) should receive 30%
        assertEq(player2.balance - player2BalanceBefore, (remainingPool * 30) / 100);
        
        // Player3 (3rd) should receive 15%
        assertEq(player3.balance - player3BalanceBefore, (remainingPool * 15) / 100);
        
        // Tournament should be completed
        TournamentPlatform.Tournament memory tournament = platform.getTournament(tournamentId);
        assertEq(uint(tournament.status), uint(TournamentPlatform.TournamentStatus.Completed));
    }
    
    function testCancelTournament() public {
        // Create tournament
        vm.prank(creator);
        uint256 tournamentId = platform.createTournament(
            "Test Tournament",
            "Description",
            ENTRY_FEE,
            MAX_PARTICIPANTS,
            block.timestamp + 1 hours,
            block.timestamp + 2 hours
        );
        
        // Join tournament
        vm.prank(player1);
        platform.joinTournament{value: ENTRY_FEE}(tournamentId);
        
        vm.prank(player2);
        platform.joinTournament{value: ENTRY_FEE}(tournamentId);
        
        uint256 player1BalanceBefore = player1.balance;
        uint256 player2BalanceBefore = player2.balance;
        
        // Cancel tournament
        vm.prank(creator);
        platform.cancelTournament(tournamentId);
        
        // Check refunds
        assertEq(player1.balance, player1BalanceBefore + ENTRY_FEE);
        assertEq(player2.balance, player2BalanceBefore + ENTRY_FEE);
        
        // Tournament should be cancelled
        TournamentPlatform.Tournament memory tournament = platform.getTournament(tournamentId);
        assertEq(uint(tournament.status), uint(TournamentPlatform.TournamentStatus.Cancelled));
        assertEq(tournament.prizePool, 0);
    }
    
    function testOnlyCreatorCanCancel() public {
        vm.prank(creator);
        uint256 tournamentId = platform.createTournament(
            "Test Tournament",
            "Description",
            ENTRY_FEE,
            MAX_PARTICIPANTS,
            block.timestamp + 1 hours,
            block.timestamp + 2 hours
        );
        
        vm.prank(player1);
        vm.expectRevert("Only tournament creator can call this");
        platform.cancelTournament(tournamentId);
    }
    
    function testUpdatePlatformFee() public {
        platform.updatePlatformFee(7);
        assertEq(platform.platformFeePercent(), 7);
    }
    
    function testCannotSetFeeAbove10Percent() public {
        vm.expectRevert("Fee cannot exceed 10%");
        platform.updatePlatformFee(11);
    }
}
