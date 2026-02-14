import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient, useWatchContractEvent, useBalance } from 'wagmi';
import { BookOpen } from 'lucide-react';
import { useAppKit } from '@reown/appkit/react';
import { parseEther, formatEther, parseAbiItem } from 'viem';
import { CONTRACT_ADDRESSES, ARENA_PLATFORM_ABI, AGENT_REGISTRY_ABI } from '../config/contracts';
import { toast } from 'react-hot-toast';
import { useArenaEvents } from '../hooks/useArenaEvents';
import { MATCH_STATUS, GAME_TYPES, MOVES, getMoveDisplay } from '../utils/gameLogic';
import DocsModal from '../components/DocsModal';



const ArenaGame = () => {
    const { address, isConnected, chainId } = useAccount();
    const { data: balance, isError, isLoading } = useBalance({ address });
    const { open } = useAppKit();
    const publicClient = usePublicClient();
    const [wager, setWager] = useState('0.1');
    const [selectedGameType, setSelectedGameType] = useState(0);
    const [matches, setMatches] = useState([]);
    const [globalMatches, setGlobalMatches] = useState([]); // New State for Global Feed
    const [loading, setLoading] = useState(false);
    const [activeMatch, setActiveMatch] = useState(null);
    const [selectedMove, setSelectedMove] = useState(null);
    const [showDocs, setShowDocs] = useState(false);

    // Fetch Agent Identity (EIP-8004)
    const { data: agentProfile } = useReadContract({
        address: CONTRACT_ADDRESSES.AGENT_REGISTRY,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'agents',
        args: [CONTRACT_ADDRESSES.AI_AGENT]
    });

    const { writeContractAsync: writeArena } = useWriteContract();


    const fetchMatchDetails = useCallback(async (ids) => {
        if (!ids || !publicClient) return;
        console.log("🚀 VERSION: ULTRA_OPTIMIZED_V2 - Batching Requests");

        try {
            // Remove duplicate IDs that can occur if playing against self
            const uniqueIds = [...new Set(ids)];

            // Batch 1: Fetch all Match Structs
            const matchContracts = ids.map(id => ({
                address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                abi: ARENA_PLATFORM_ABI,
                functionName: 'matches',
                args: [id]
            }));

            const matchResults = await publicClient.multicall({ contracts: matchContracts });

            // Prepare Batch 2: Fetch Moves for Active/Completed Matches
            const moveChecks = [];
            const moveContractCalls = [];

            matchResults.forEach((res, index) => {
                if (res.status === 'success') {
                    const m = res.result;
                    const id = ids[index];
                    const status = Number(m[5]);

                    if (status === 1 || status === 2) { // Accepted or Completed
                        // Check if players moved
                        moveChecks.push({ index, type: 'hasPlayed', player: m[1], isChallenger: true }); // Challenger
                        moveChecks.push({ index, type: 'hasPlayed', player: m[2], isChallenger: false }); // Opponent

                        moveContractCalls.push({
                            address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                            abi: ARENA_PLATFORM_ABI,
                            functionName: 'hasPlayed',
                            args: [id, m[1]]
                        });
                        moveContractCalls.push({
                            address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                            abi: ARENA_PLATFORM_ABI,
                            functionName: 'hasPlayed',
                            args: [id, m[2]]
                        });
                    }
                }
            });

            // Execute Batch 2 (if any needed)
            let moveResults = [];
            if (moveContractCalls.length > 0) {
                moveResults = await publicClient.multicall({ contracts: moveContractCalls });
            }

            // Prepare Batch 3: Fetch Actual Moves (only if hasPlayed is true)
            const actualMoveCalls = [];
            const actualMoveIndices = []; // To map back result to match

            let moveResultIndex = 0;
            const matchesWithMoves = new Map(); // Store temporary move status

            matchResults.forEach((res, index) => {
                if (res.status !== 'success') return;
                const m = res.result;
                const id = ids[index];
                const status = Number(m[5]);

                if (status === 1 || status === 2) {
                    const challengerPlayedRes = moveResults[moveResultIndex++];
                    const opponentPlayedRes = moveResults[moveResultIndex++];

                    const challengerPlayed = challengerPlayedRes?.status === 'success' && challengerPlayedRes.result;
                    const opponentPlayed = opponentPlayedRes?.status === 'success' && opponentPlayedRes.result;

                    matchesWithMoves.set(index, { challengerPlayed, opponentPlayed });

                    if (challengerPlayed) {
                        actualMoveIndices.push({ index, isChallenger: true });
                        actualMoveCalls.push({
                            address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                            abi: ARENA_PLATFORM_ABI,
                            functionName: 'playerMoves',
                            args: [id, m[1]]
                        });
                    }
                    if (opponentPlayed) {
                        actualMoveIndices.push({ index, isChallenger: false });
                        actualMoveCalls.push({
                            address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                            abi: ARENA_PLATFORM_ABI,
                            functionName: 'playerMoves',
                            args: [id, m[2]]
                        });
                    }
                }
            });

            // Execute Batch 3 (Get actual moves)
            let actualMovesResults = [];
            if (actualMoveCalls.length > 0) {
                actualMovesResults = await publicClient.multicall({ contracts: actualMoveCalls });
            }

            // Assemble Final Data
            const matchDetails = matchResults.map((res, index) => {
                if (res.status !== 'success') return null;
                const m = res.result;
                const id = ids[index];

                let challengerMove = null;
                let opponentMove = null;

                // Map fetched moves back to match
                if (matchesWithMoves.has(index)) {
                    // Find if we fetched a move for this match
                    const cMoveIdx = actualMoveIndices.findIndex(x => x.index === index && x.isChallenger);
                    if (cMoveIdx !== -1 && actualMovesResults[cMoveIdx].status === 'success') {
                        challengerMove = Number(actualMovesResults[cMoveIdx].result);
                    }

                    const oMoveIdx = actualMoveIndices.findIndex(x => x.index === index && !x.isChallenger);
                    if (oMoveIdx !== -1 && actualMovesResults[oMoveIdx].status === 'success') {
                        opponentMove = Number(actualMovesResults[oMoveIdx].result);
                    }
                }

                return {
                    id: Number(id),
                    challenger: m[1],
                    opponent: m[2],
                    wager: m[3],
                    gameType: Number(m[4]),
                    status: Number(m[5]),
                    winner: m[6],
                    createdAt: Number(m[7]),
                    challengerMove,
                    opponentMove
                };
            }).filter(m => m !== null);

            setMatches(matchDetails.sort((a, b) => b.id - a.id));
        } catch (error) {
            console.error('Error fetching matches:', error);
        }
    }, [publicClient]);

    // New: Fetch Global Matches (Last 10)
    const fetchGlobalMatches = useCallback(async () => {
        if (!publicClient) return;
        try {
            const count = await publicClient.readContract({
                address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                abi: ARENA_PLATFORM_ABI,
                functionName: 'matchCounter'
            });
            console.log('📊 Global Match Count:', Number(count));

            const total = Number(count);
            const start = Math.max(0, total - 10);
            const ids = Array.from({ length: total - start }, (_, i) => BigInt(total - 1 - i)); // Reverse order
            console.log('🆔 Fetching IDs:', ids.map(id => id.toString()));

            if (ids.length === 0) return;

            // Use Multicall to fetch all matches in ONE request
            const matchContracts = ids.map(id => ({
                address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                abi: ARENA_PLATFORM_ABI,
                functionName: 'matches',
                args: [id]
            }));

            const results = await publicClient.multicall({
                contracts: matchContracts
            });

            const matchDetails = results.map((res, index) => {
                if (res.status === 'failure' || !res.result) {
                    console.error(`Failed to fetch match ${ids[index]}`, res.error);
                    return null;
                }
                const m = res.result;
                return {
                    id: Number(ids[index]),
                    challenger: m[1],
                    opponent: m[2],
                    wager: m[3],
                    gameType: Number(m[4]),
                    status: Number(m[5]),
                    winner: m[6],
                    createdAt: Number(m[7])
                };
            }).filter(m => m !== null);

            console.log('✅ Global Matches Loaded (Batch):', matchDetails.length);
            setGlobalMatches(matchDetails);
        } catch (e) {
            console.error("Error fetching global matches:", e);
        }
    }, [publicClient]);

    // Initial Fetch (One-time)
    useEffect(() => {
        fetchGlobalMatches();
    }, [fetchGlobalMatches]);

    // Fetch player matches
    const { data: playerMatchIds, refetch: refetchMatches } = useReadContract({
        address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
        abi: ARENA_PLATFORM_ABI,
        functionName: 'getPlayerMatches',
        args: [address],
        query: {
            enabled: !!address,
            refetchInterval: false // DISABLE POLLING
        }
    });

    // Track latest match IDs and Matches state in refs to avoid closure staleness and interval resets
    const playerMatchIdsRef = useRef(playerMatchIds);
    const matchesRef = useRef(matches);

    useEffect(() => {
        // Only fetch if IDs have changed length or content (basic check)
        const prevIds = playerMatchIdsRef.current;
        const currentIds = playerMatchIds;

        const hasChanged = !prevIds || !currentIds ||
            prevIds.length !== currentIds.length ||
            !prevIds.every((val, index) => val === currentIds[index]);

        playerMatchIdsRef.current = playerMatchIds;
        matchesRef.current = matches;

        // Initial fetch or update
        if (playerMatchIds && (matches.length === 0 || hasChanged)) {
            fetchMatchDetails(playerMatchIds);
        }
    }, [playerMatchIds, matches.length, fetchMatchDetails]);

    // --- Event Listeners for Real-Time Updates ---
    useArenaEvents({
        onMatchUpdate: async () => {
            console.log('⚡ Event received: Refreshing Player Matches');
            const { data: freshIds } = await refetchMatches();
            if (freshIds) {
                console.log('🔄 Re-fetching details for IDs:', freshIds.map(id => id.toString()));
                fetchMatchDetails(freshIds);
            }
        },
        onGlobalUpdate: () => {
            console.log('⚡ Event received: Refreshing Global Feed');
            fetchGlobalMatches();
        },
        address,
        matches
    });

    // Safety Sync Pulse (every 15s)
    useEffect(() => {
        if (!isConnected || !address) return;

        const interval = setInterval(() => {
            console.log('⏱️ Safety sync pulse...');
            refetchMatches().then(({ data: freshIds }) => {
                if (freshIds) fetchMatchDetails(freshIds);
            });
            fetchGlobalMatches();
        }, 15000);

        return () => clearInterval(interval);
    }, [address, isConnected, refetchMatches, fetchMatchDetails, fetchGlobalMatches]);

    // Auto-refresh when user returns to the page
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isConnected) {
                refetchMatches();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [refetchMatches, isConnected]);

    const handlePlayMove = async (matchId, move) => {
        setLoading(true);
        const toastId = toast.loading('Submitting move...');
        try {
            const hash = await writeArena({
                address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                abi: ARENA_PLATFORM_ABI,
                functionName: 'playMove',
                args: [BigInt(matchId), move]
            });

            toast.loading('Confirming transaction...', { id: toastId });
            await publicClient.waitForTransactionReceipt({ hash });

            // Get move label based on game type
            let moveLabel = '';
            if (activeMatch.gameType === 0) { // RPS
                moveLabel = ['Rock', 'Paper', 'Scissors'][move];
            } else if (activeMatch.gameType === 1) { // Dice
                moveLabel = `Dice ${move}`;
            } else if (activeMatch.gameType === 2) { // Strategy
                moveLabel = `Strategy ${move}`;
            } else if (activeMatch.gameType === 3) { // Coin
                moveLabel = ['Heads', 'Tails'][move];
            } else if (activeMatch.gameType === 4) { // TicTacToe
                const positions = ['Top-Left', 'Top-Center', 'Top-Right', 'Mid-Left', 'Center', 'Mid-Right', 'Bot-Left', 'Bot-Center', 'Bot-Right'];
                moveLabel = positions[move];
            }

            toast.success(`Selected ${moveLabel}! Move confirmed on chain.`, { id: toastId });
            setActiveMatch(null);
            setSelectedMove(null);

            // Immediate refetch to update UI with user's move
            await refetchMatches();

            const isAgentMatch = activeMatch.opponent?.toLowerCase() === CONTRACT_ADDRESSES.AI_AGENT?.toLowerCase() ||
                activeMatch.challenger?.toLowerCase() === CONTRACT_ADDRESSES.AI_AGENT?.toLowerCase();
            if (isAgentMatch) {
                toast.loading("🤖 AI is analyzing your move...", { duration: 4000 });
                // We rely on the SWR polling (1s interval) to pick up the AI's move
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to play move', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleChallengeAgent = async () => {
        if (!isConnected) {
            toast.error('Please connect your wallet');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('Initiating challenge...');
        try {
            const hash = await writeArena({
                address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                abi: ARENA_PLATFORM_ABI,
                functionName: 'proposeMatch',
                args: [CONTRACT_ADDRESSES.AI_AGENT, selectedGameType],
                value: parseEther(wager)
            });

            toast.loading('Waiting for confirmation...', { id: toastId });
            await publicClient.waitForTransactionReceipt({ hash });

            toast.success('Duel initiated! Waiting for AI to accept...', { id: toastId });

            // Refetch matches after confirmation
            await refetchMatches();
        } catch (error) {
            console.error(error);
            toast.error('Failed to challenge AI', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMatch = async () => {
        if (!isConnected) {
            toast.error('Please connect your wallet');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('Proposing match...');
        try {
            const hash = await writeArena({
                address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                abi: ARENA_PLATFORM_ABI,
                functionName: 'proposeMatch',
                args: ['0x0000000000000000000000000000000000000000', selectedGameType],
                value: parseEther(wager)
            });

            toast.loading('Waiting for confirmation...', { id: toastId });
            await publicClient.waitForTransactionReceipt({ hash });

            toast.success('Open Match proposed! Waiting for opponent...', { id: toastId });
            await refetchMatches();
        } catch (error) {
            console.error(error);
            toast.error('Failed to propose match', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptMatch = async (matchId, wagerAmount) => {
        setLoading(true);
        const toastId = toast.loading('Accepting match...');
        try {
            const hash = await writeArena({
                address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                abi: ARENA_PLATFORM_ABI,
                functionName: 'acceptMatch',
                args: [BigInt(matchId)],
                value: wagerAmount
            });

            toast.loading('Waiting for confirmation...', { id: toastId });
            await publicClient.waitForTransactionReceipt({ hash });

            toast.success('Match accepted! Game starting...', { id: toastId });

            // Refetch matches after confirmation
            await refetchMatches();
        } catch (error) {
            console.error(error);
            toast.error('Failed to accept match', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="font-mono text-gray-300">
            <DocsModal isOpen={showDocs} onClose={() => setShowDocs(false)} />
            {/* Header / Stats Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tighter">ARENA_1v1</h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-gray-500">PROTOCOL_ID: {CONTRACT_ADDRESSES.ARENA_PLATFORM.slice(0, 8)}...</p>
                        <button
                            onClick={() => setShowDocs(true)}
                            className="flex items-center gap-1.5 text-[10px] text-purple-400 hover:text-purple-300 transition-colors uppercase font-bold border border-purple-500/30 px-2 py-0.5 rounded bg-purple-900/10 hover:bg-purple-900/30"
                        >
                            <BookOpen size={12} />
                            [ SYSTEM_DOCS ]
                        </button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-[#0a0a0a] border border-white/10 px-4 py-2 rounded min-w-[140px]">
                        <span className="text-[10px] text-gray-500 block uppercase">Balance</span>
                        <div className="text-white font-bold text-sm font-mono">
                            {balance ? Number(formatEther(balance.value)).toFixed(4) : '--'} <span className="text-purple-500">MON</span>
                        </div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/10 px-4 py-2 rounded flex flex-col items-end">
                        <span className="text-[10px] text-gray-500 block uppercase flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${agentProfile?.[6] ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            Agent_Status
                        </span>
                        <span className="text-purple-400 font-bold text-sm">{agentProfile?.[6] ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: Game Interaction */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Game Card */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-20"></div>

                        <div className="mb-8 text-center">
                            <div className="w-16 h-16 mx-auto bg-purple-900/20 rounded-full border border-purple-500/20 flex items-center justify-center text-3xl mb-4">
                                🤖
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">CHALLENGE_THE_AI</h2>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                                {agentProfile?.[2] || "Autonomous agent initialized. Select game type to begin."}
                            </p>
                        </div>

                        {/* Game Selection */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {GAME_TYPES.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => setSelectedGameType(g.id)}
                                    className={`p-4 rounded border transition-all ${selectedGameType === g.id
                                        ? 'bg-purple-900/20 border-purple-500 text-white'
                                        : 'bg-black border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{g.icon}</div>
                                    <div className="text-[10px] uppercase tracking-wider font-bold">{g.label}</div>
                                </button>
                            ))}
                        </div>

                        {/* Wager Input */}
                        <div className="bg-black/50 border border-white/5 rounded p-4 mb-6">
                            <div className="flex justify-between text-[10px] text-gray-500 uppercase mb-2">
                                <span>Wager Amount</span>
                                <span>Potential Win: <span className="text-green-400">{(parseFloat(wager || '0') * 2 * 0.98).toFixed(3)} MON</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-purple-500 font-bold">MON</span>
                                <input
                                    type="number"
                                    value={wager}
                                    onChange={(e) => setWager(e.target.value)}
                                    className="bg-transparent border-none text-white text-xl font-bold w-full focus:ring-0 placeholder-gray-700"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Action Buitton */}
                        {!isConnected ? (
                            <button onClick={() => open()} className="w-full py-4 bg-white/5 border border-white/10 rounded text-sm font-bold hover:bg-white/10 transition-all uppercase">
                                Connect Wallet
                            </button>
                        ) : (
                            <button
                                onClick={handleChallengeAgent}
                                disabled={loading || !wager}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm font-bold transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                            >
                                {loading ? 'PROCESSING...' : 'INITIATE_CHALLENGE'}
                            </button>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Live Data */}
                <div className="space-y-4">
                    {/* Active Games Panel */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 h-[200px] overflow-y-auto">
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center justify-between">
                            <span>Your_Matches</span>
                            {matches.length > 0 && <span className="text-green-500 text-[10px]">{matches.length} ACTIVE</span>}
                        </h3>

                        {matches.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-[10px] text-gray-600 italic">
                                NO_ACTIVE_MATCHES
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {matches.map(m => {
                                    const isWinner = m.status === 2 && m.winner?.toLowerCase() === address?.toLowerCase();
                                    const isLoser = m.status === 2 && m.winner?.toLowerCase() !== address?.toLowerCase() && m.winner !== '0x0000000000000000000000000000000000000000';
                                    const isTie = m.status === 2 && m.winner === '0x0000000000000000000000000000000000000000';

                                    // Determine moves
                                    const isChallenger = m.challenger?.toLowerCase() === address?.toLowerCase();
                                    const myMoveId = isChallenger ? m.challengerMove : m.opponentMove;
                                    const oppMoveId = isChallenger ? m.opponentMove : m.challengerMove;

                                    const myMove = getMoveDisplay(m.gameType, myMoveId);
                                    const oppMove = getMoveDisplay(m.gameType, oppMoveId);

                                    return (
                                        <div key={m.id} className="bg-white/5 border border-white/5 rounded p-2 text-xs flex justify-between items-center group hover:border-white/20 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col items-center gap-1 min-w-[20px]">
                                                    <span className="text-base">{GAME_TYPES.find(g => g.id === m.gameType)?.icon || '❓'}</span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-300 flex items-center gap-2">
                                                        <span>#{m.id}</span>
                                                        {m.status === 2 && (
                                                            <span className="text-gray-500 font-mono text-[10px] bg-black/30 px-1 rounded border border-white/5">
                                                                {myMove.icon} vs {oppMove.icon}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500">{MATCH_STATUS[m.status]}</div>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <div className="text-purple-400 font-bold">{formatEther(m.wager)}</div>

                                                {m.status === 1 && (
                                                    <button
                                                        onClick={() => setActiveMatch(m)}
                                                        className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded mt-0.5 hover:bg-purple-500/40 border border-purple-500/30 font-bold"
                                                    >
                                                        PLAY_MOVE
                                                    </button>
                                                )}

                                                {m.status === 2 && (
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded mt-0.5 font-bold border ${isWinner ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                        isLoser ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                                            'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                                        }`}>
                                                        {isWinner ? 'YOU WON' : isLoser ? 'YOU LOST' : 'TIE GAME'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Global Feed Panel */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-lg p-4 h-[300px] overflow-hidden flex flex-col">
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Live_Feed
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {globalMatches.map(m => {
                                const isMeChallenger = m.challenger?.toLowerCase() === address?.toLowerCase();
                                const isMeOpponent = m.opponent?.toLowerCase() === address?.toLowerCase();

                                const challengerDisplay = isMeChallenger ? 'YOU' : `${m.challenger.slice(0, 4)}...${m.challenger.slice(-4)}`;
                                const opponentDisplay = isMeOpponent ? 'YOU' : `${m.opponent.slice(0, 4)}...${m.opponent.slice(-4)}`;

                                const isAiWinner = m.winner?.toLowerCase() === CONTRACT_ADDRESSES.AI_AGENT.toLowerCase();

                                return (
                                    <div key={m.id} className="text-[10px] font-mono border-l-2 border-white/10 pl-2 py-1 hover:border-purple-500 transition-colors">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">#{m.id}</span>
                                            <span className="text-gray-600">{new Date(m.createdAt * 1000).toLocaleTimeString()}</span>
                                        </div>
                                        <div className="text-gray-300 truncate font-bold text-xs my-0.5">
                                            <span className={isMeChallenger ? "text-purple-400" : ""}>{challengerDisplay}</span>
                                            <span className="text-gray-600 mx-1">vs</span>
                                            <span className={isMeOpponent ? "text-purple-400" : ""}>{opponentDisplay}</span>
                                        </div>
                                        <div className="flex justify-between mt-0.5">
                                            <span className="text-gray-500">{GAME_TYPES.find(g => g.id === m.gameType)?.label}</span>
                                            <span className={`font-bold ${isAiWinner ? 'text-red-400' : 'text-green-400'}`}>
                                                {m.status === 2 ? (isAiWinner ? 'AI WIN' : 'PLR WIN') : '...'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal - Terminal Style */}
            {activeMatch && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#0a0a0a] border border-purple-500/50 rounded w-full max-w-lg shadow-[0_0_50px_rgba(139,92,246,0.1)]">
                        <div className="bg-purple-900/10 border-b border-purple-500/20 p-4 flex justify-between items-center">
                            <h3 className="text-purple-400 font-bold tracking-wider">{">> "} EXECUTE_MOVE</h3>
                            <button onClick={() => setActiveMatch(null)} className="text-gray-500 hover:text-white">✕</button>
                        </div>

                        <div className="p-8">
                            <div className="text-center mb-8">
                                <div className="text-sm text-gray-500 mb-1">MATCH_ID: #{activeMatch.id}</div>
                                <div className="text-2xl font-bold text-white mb-2">{GAME_TYPES.find(g => g.id === activeMatch.gameType)?.label}</div>
                                <div className="inline-block bg-purple-500/10 text-purple-300 px-3 py-1 rounded text-xs border border-purple-500/20">
                                    STAKE: {formatEther(activeMatch.wager)} MON
                                </div>
                            </div>

                            {activeMatch.gameType === 1 ? (
                                <button
                                    onClick={() => {
                                        const roll = Math.floor(Math.random() * 6) + 1;
                                        handlePlayMove(activeMatch.id, roll);
                                    }}
                                    className="w-full py-6 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 rounded flex flex-col items-center gap-2 group transition-all"
                                >
                                    <span className="text-4xl group-hover:scale-110 transition-transform">🎲</span>
                                    <span className="text-sm font-bold uppercase">ROLL_DICE_RNG</span>
                                </button>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {(activeMatch.gameType === 0 ? MOVES.RPS : MOVES.COIN).map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => handlePlayMove(activeMatch.id, m.id)}
                                            className="p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 rounded flex flex-col items-center gap-2 transition-all"
                                        >
                                            <span className="text-2xl">{m.icon}</span>
                                            <span className="text-[10px] font-bold uppercase">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ArenaGame;
