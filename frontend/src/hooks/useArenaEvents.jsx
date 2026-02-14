import { useEffect, useCallback, useRef } from 'react';
import { useWatchContractEvent } from 'wagmi';
import { toast } from 'react-hot-toast';
import { CONTRACT_ADDRESSES, ARENA_PLATFORM_ABI } from '../config/contracts';
import { getMoveDisplay } from '../utils/gameLogic';

/**
 * Hook to watch for Arena Platform events using standard listeners
 */
export function useArenaEvents({ onMatchUpdate, onGlobalUpdate, address, matches }) {
    const matchesRef = useRef(matches);

    useEffect(() => {
        matchesRef.current = matches;
    }, [matches]);

    // Helper to trigger updates
    const triggerUpdates = useCallback(() => {
        if (onMatchUpdate) onMatchUpdate();
        if (onGlobalUpdate) onGlobalUpdate();
    }, [onMatchUpdate, onGlobalUpdate]);

    // 0. Match Proposed (New Challenge)
    useWatchContractEvent({
        address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
        abi: ARENA_PLATFORM_ABI,
        eventName: 'MatchProposed',
        onLogs(logs) {
            console.log('⚡ Match Proposed:', logs);
            triggerUpdates();
        },
    });

    // 1. Match Accepted
    useWatchContractEvent({
        address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
        abi: ARENA_PLATFORM_ABI,
        eventName: 'MatchAccepted',
        onLogs(logs) {
            console.log('⚡ Match Accepted:', logs);
            triggerUpdates();
            // Optional: Toast if it involves me?
            // For now, basic toast
            // toast.success('Match Accepted!');
        },
    });

    // 2. Move Played
    useWatchContractEvent({
        address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
        abi: ARENA_PLATFORM_ABI,
        eventName: 'MovePlayed',
        onLogs: async (logs) => {
            console.log('⚡ Move Played:', logs);
            triggerUpdates();

            const playerAddr = logs[0].args.player;
            const move = Number(logs[0].args.move);
            const matchId = Number(logs[0].args.matchId);

            // Only notify if opponent played against ME
            if (playerAddr && address && playerAddr.toLowerCase() !== address.toLowerCase()) {
                const currentMatches = matchesRef.current;
                let match = currentMatches.find(m => m.id === matchId);

                if (match) {
                    const moveDisplay = getMoveDisplay(match.gameType, move);
                    const isChallenger = match.challenger.toLowerCase() === address.toLowerCase();
                    const playerMoveVal = isChallenger ? match.challengerMove : match.opponentMove;

                    let extraMsg = '';
                    if (playerMoveVal !== null && playerMoveVal !== undefined) {
                        const playerMoveDisplay = getMoveDisplay(match.gameType, playerMoveVal);
                        extraMsg = ` vs Your ${playerMoveDisplay.icon}`;
                    }

                    toast(`Opponent played ${moveDisplay.icon}${extraMsg}`, {
                        icon: '🤖',
                        duration: 4000,
                        style: { border: '1px solid #7c3aed', background: '#1a1f3a', color: '#fff' }
                    });
                }
            }
        },
    });

    // 3. Match Completed
    useWatchContractEvent({
        address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
        abi: ARENA_PLATFORM_ABI,
        eventName: 'MatchCompleted',
        async onLogs(logs) {
            console.log('⚡ Match Completed:', logs);
            triggerUpdates();

            const winner = logs[0].args.winner;
            const matchId = Number(logs[0].args.matchId);
            const winnerAddr = winner ? winner.toLowerCase() : null;

            if (winnerAddr === address?.toLowerCase()) {
                toast.success('🎉 You Won a Match! Check history for details.', { duration: 5000 });
            } else if (address) {
                // Check if we were in the match
                const currentMatches = matchesRef.current;
                const match = currentMatches.find(m => m.id === matchId);
                if (match && (match.challenger.toLowerCase() === address.toLowerCase() || match.opponent.toLowerCase() === address.toLowerCase())) {
                    toast.error('💀 Match Completed - You Lost.', { duration: 5000 });
                }
            }
        },
    });
}
