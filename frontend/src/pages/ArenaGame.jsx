import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient, useWatchContractEvent } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { parseEther, formatEther, parseAbiItem } from 'viem';
import { CONTRACT_ADDRESSES, ARENA_PLATFORM_ABI, AGENT_REGISTRY_ABI } from '../config/contracts';
import { toast } from 'react-hot-toast';
import { useArenaEvents } from '../hooks/useArenaEvents';
import { MATCH_STATUS, GAME_TYPES, MOVES, getMoveDisplay } from '../utils/gameLogic';



const ArenaGame = () => {
    const { address, isConnected } = useAccount();
    const { open } = useAppKit();
    const publicClient = usePublicClient();
    const [wager, setWager] = useState('0.1');
    const [selectedGameType, setSelectedGameType] = useState(0);
    const [matches, setMatches] = useState([]);
    const [globalMatches, setGlobalMatches] = useState([]); // New State for Global Feed
    const [loading, setLoading] = useState(false);
    const [activeMatch, setActiveMatch] = useState(null);
    const [selectedMove, setSelectedMove] = useState(null);

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
        onMatchUpdate: () => {
            console.log('⚡ Event received: Refreshing Player Matches');
            refetchMatches(); // Refresh IDs first
            if (playerMatchIdsRef.current) fetchMatchDetails(playerMatchIdsRef.current);
        },
        onGlobalUpdate: () => {
            console.log('⚡ Event received: Refreshing Global Feed');
            fetchGlobalMatches();
        },
        address,
        matches
    });

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
        <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f1419] text-white">
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                {/* Title */}
                <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                    Arena AI Champion
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 mb-4">
                    Challenge the Autonomous Gaming Agent
                </p>
                <p className="text-base text-gray-400 mb-12">
                    Battle an AI that learns your patterns. Win MON prizes on Monad!
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 md:gap-8 mb-12 max-w-2xl mx-auto">
                    <div className="bg-[#1a1f3a]/60 backdrop-blur border border-blue-500/20 rounded-2xl p-6">
                        <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">{GAME_TYPES.length}</div>
                        <div className="text-sm text-gray-400">Game Types</div>
                    </div>
                    <div className="bg-[#1a1f3a]/60 backdrop-blur border border-purple-500/20 rounded-2xl p-6">
                        <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">
                            {agentProfile?.[6] ? '🟢' : '🔴'}
                        </div>
                        <div className="text-sm text-gray-400">AI Online</div>
                    </div>
                    <div className="bg-[#1a1f3a]/60 backdrop-blur border border-pink-500/20 rounded-2xl p-6">
                        <div className="text-4xl md:text-5xl font-bold text-pink-400 mb-2">24/7</div>
                        <div className="text-sm text-gray-400">Availability</div>
                    </div>
                </div>

                {/* AI Agent Card */}
                <div className="bg-gradient-to-br from-[#1a1f3a]/80 to-[#252a4d]/80 backdrop-blur border border-purple-500/30 rounded-3xl p-8 mb-12 max-w-2xl mx-auto">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center text-4xl border-2 border-purple-500/50">
                            🤖
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center mb-2 text-purple-400">
                        {agentProfile?.[0] || 'Arena Champion AI'}
                    </h2>
                    <p className="text-center text-gray-400 mb-6 text-sm">
                        {agentProfile?.[1] || 'Markov-1 (Adaptive Pattern Learning)'}
                    </p>

                    <div className="bg-[#0a0e27]/50 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-300 italic leading-relaxed">
                            "Autonomous Gaming Agent mastering 3 game types: Rock-Paper-Scissors, Dice Roll, and Coin Flip. I analyze your moves and adapt my strategy using Markov Chains. The more you play, the smarter I get."
                        </p>
                    </div>

                    {/* How It Works */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-start text-xs text-gray-400">
                            <span className="mr-2">•</span>
                            <span>Choose your game and wager amount. I'll match your bet instantly.</span>
                        </div>
                        <div className="flex items-start text-xs text-gray-400">
                            <span className="mr-2">•</span>
                            <span>Make your move. I'll analyze your pattern and respond in real-time.</span>
                        </div>
                        <div className="flex items-start text-xs text-gray-400">
                            <span className="mr-2">•</span>
                            <span>Winner takes 98% of the pool. Every match makes me smarter.</span>
                        </div>
                        <div className="flex items-start text-xs text-gray-400">
                            <span className="mr-2">•</span>
                            <span className="text-green-400 font-bold">Fair play guaranteed by smart contracts.</span>
                        </div>
                    </div>

                    <a
                        href={`https://nad.fun/token/${CONTRACT_ADDRESSES.ARENA_TOKEN}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center py-3 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-300 text-sm hover:bg-blue-600/30 transition-all font-semibold"
                    >
                        📈 Trade $ARENA • Powered by Monad
                    </a>
                </div>

                {/* Live Arena Feed */}
                <div className="max-w-4xl mx-auto px-4 mb-8">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Live Arena Feed
                    </h3>

                    <div className="space-y-3">
                        {globalMatches.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-[#1a1f3a]/30 rounded-xl border border-white/5">
                                Waiting for matches...
                            </div>
                        ) : (
                            globalMatches.map((match) => {
                                const gameIcon = match.gameType === 0 ? '✊' :
                                    match.gameType === 1 ? '🎲' :
                                        match.gameType === 2 ? '⚔️' : '🪙';

                                const isAgentMatch = match.challenger?.toLowerCase() === CONTRACT_ADDRESSES.AI_AGENT?.toLowerCase() ||
                                    match.opponent?.toLowerCase() === CONTRACT_ADDRESSES.AI_AGENT?.toLowerCase();

                                return (
                                    <div key={match.id} className={`bg-[#1a1f3a]/60 backdrop-blur border rounded-xl p-4 flex items-center justify-between ${isAgentMatch ? 'border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'border-white/5'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-xl border border-white/10">
                                                {gameIcon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm">Match #{match.id}</span>
                                                    {isAgentMatch && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">AI Battle</span>}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {match.challenger.slice(0, 6)}... vs {match.opponent.slice(0, 6)}...
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="font-bold text-blue-400 text-sm">{formatEther(match.wager)} MON</div>
                                            <div className={`text-xs ${match.status === 2 ? (match.winner?.toLowerCase() === address?.toLowerCase() ? 'text-green-400 font-bold' : (match.winner?.toLowerCase() === CONTRACT_ADDRESSES.AI_AGENT?.toLowerCase() ? 'text-red-400 font-bold' : 'text-gray-400')) : 'text-gray-500'}`}>
                                                {match.status === 0 ? 'Waiting' :
                                                    match.status === 1 ? 'In Progress' :
                                                        match.status === 2 ? (
                                                            match.winner === '0x0000000000000000000000000000000000000000' ? '🤝 Tie' :
                                                                (match.winner?.toLowerCase() === address?.toLowerCase() ? '🎉 You Won' :
                                                                    (match.winner?.toLowerCase() === CONTRACT_ADDRESSES.AI_AGENT?.toLowerCase() ? '🤖 AI Won' :
                                                                        `🏆 ${match.winner.slice(0, 4)}... won`))
                                                        ) : 'Cancelled'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Challenge Section */}
                <div className="max-w-md mx-auto bg-[#1a1f3a]/60 backdrop-blur border border-white/10 rounded-3xl p-8 mb-12">
                    <h3 className="text-xl font-bold mb-6 text-center">⚔️ Challenge the AI</h3>

                    <div className="mb-6">
                        <label className="text-sm text-gray-400 block mb-3">Select Your Game</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {GAME_TYPES.map(g => (
                                <button
                                    key={g.id}
                                    onClick={() => setSelectedGameType(g.id)}
                                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${selectedGameType === g.id
                                        ? 'bg-blue-600 ring-4 ring-blue-400/30'
                                        : 'bg-[#0a0e27] hover:bg-[#111633]'
                                        }`}
                                >
                                    <span className="text-2xl">{g.icon}</span>
                                    <span className="text-[9px] font-bold text-center leading-tight">{g.label}</span>
                                </button>
                            ))}
                        </div>
                        {selectedGameType !== null && (
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                {GAME_TYPES.find(g => g.id === selectedGameType)?.description}
                            </p>
                        )}
                    </div>

                    <div className="mb-8">
                        <label className="text-sm text-gray-400 block mb-3">Your Wager</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                value={wager}
                                onChange={(e) => setWager(e.target.value)}
                                className="w-full bg-[#0a0e27] border border-white/10 rounded-xl p-4 pr-16 text-white text-lg outline-none focus:border-blue-500 transition-all"
                                placeholder="0.1"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">MON</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            💰 Win {wager ? (parseFloat(wager) * 2 * 0.98).toFixed(3) : '0.196'} MON if you beat the AI
                        </p>
                    </div>

                    {!isConnected ? (
                        <button
                            onClick={() => open()}
                            className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/30"
                        >
                            🎮 Connect Wallet to Play
                        </button>
                    ) : (
                        <button
                            onClick={handleChallengeAgent}
                            disabled={loading || !wager || parseFloat(wager) <= 0}
                            className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? '⏳ Proposing Match...' : '⚡ Challenge AI Now'}
                        </button>
                    )}
                </div>

                {/* Recent Matches Section */}
                {isConnected && matches.length > 0 && (
                    <div className="max-w-4xl mx-auto px-4 mb-16">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-center">📊 Your Match History</h3>
                            <button
                                onClick={() => {
                                    refetchMatches();
                                    toast.success('Refreshing matches...');
                                }}
                                className="px-4 py-2 bg-blue-600/20 border border-blue-500/40 rounded-lg text-blue-300 text-sm hover:bg-blue-600/30 transition-all font-semibold"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                        <div className="space-y-3">
                            {matches.slice(0, 5).map((match) => {
                                const gameIcon = match.gameType === 0 ? '✊' :
                                    match.gameType === 1 ? '🎲' :
                                        match.gameType === 2 ? '⚔️' : '🪙';

                                const isPlayerChallenger = match.challenger?.toLowerCase() === address?.toLowerCase();
                                const playerMove = isPlayerChallenger ? match.challengerMove : match.opponentMove;
                                const aiMove = isPlayerChallenger ? match.opponentMove : match.challengerMove;

                                return (
                                    <div key={match.id} className="bg-[#1a1f3a]/60 backdrop-blur border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-2xl border border-white/10">
                                                    {gameIcon}
                                                </div>
                                                <div>
                                                    <div className="font-bold">Match #{match.id}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(match.createdAt * 1000).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="font-bold text-blue-400">{formatEther(match.wager)} MON</div>
                                                    <div className={`text-xs font-semibold ${match.status === 0 ? 'text-yellow-400' :
                                                        match.status === 1 ? 'text-blue-400' :
                                                            match.status === 2 && match.winner?.toLowerCase() === address?.toLowerCase() ? 'text-green-400' :
                                                                match.status === 2 ? 'text-red-400' : 'text-gray-400'
                                                        }`}>
                                                        {match.status === 0 && 'Waiting...'}
                                                        {match.status === 1 && (playerMove !== null ? 'Waiting for AI...' : 'Your Turn')}
                                                        {match.status === 2 && match.winner === '0x0000000000000000000000000000000000000000' && '🤝 Tie (You Win!)'}
                                                        {match.status === 2 && match.winner !== '0x0000000000000000000000000000000000000000' && (match.winner?.toLowerCase() === address?.toLowerCase() ? '🎉 You Won!' : '😔 AI Won')}
                                                        {match.status === 3 && 'Cancelled'}
                                                    </div>
                                                </div>

                                                {match.status === 0 && match.challenger?.toLowerCase() !== address?.toLowerCase() && (
                                                    <button
                                                        onClick={() => handleAcceptMatch(match.id, match.wager)}
                                                        disabled={loading}
                                                        className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 font-semibold text-sm transition-all"
                                                    >
                                                        Accept
                                                    </button>
                                                )}

                                                {match.status === 1 && playerMove === null && (
                                                    <button
                                                        onClick={() => setActiveMatch(match)}
                                                        className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-500 font-semibold text-sm transition-all"
                                                    >
                                                        Play Move
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Show pending move for active matches */}
                                        {match.status === 1 && playerMove !== null && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-400">You played:</span>
                                                    <div className="flex items-center gap-1 bg-blue-500/20 px-3 py-1 rounded-lg border border-blue-500/30">
                                                        <span className="text-lg">{getMoveDisplay(match.gameType, playerMove).icon}</span>
                                                        <span className="text-xs font-semibold">{getMoveDisplay(match.gameType, playerMove).label}</span>
                                                    </div>
                                                    <span className="text-xs text-gray-500 animate-pulse ml-2">waiting for opponent...</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Show moves for completed matches */}
                                        {match.status === 2 && (
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                {playerMove !== null && aiMove !== null ? (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-400">You:</span>
                                                            <div className="flex items-center gap-1 bg-blue-500/20 px-3 py-1 rounded-lg">
                                                                <span className="text-lg">{getMoveDisplay(match.gameType, playerMove).icon}</span>
                                                                <span className="text-xs font-semibold">{getMoveDisplay(match.gameType, playerMove).label}</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-gray-600 text-xl">vs</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-400">AI:</span>
                                                            <div className="flex items-center gap-1 bg-purple-500/20 px-3 py-1 rounded-lg">
                                                                <span className="text-lg">{getMoveDisplay(match.gameType, aiMove).icon}</span>
                                                                <span className="text-xs font-semibold">{getMoveDisplay(match.gameType, aiMove).label}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-xs text-gray-500 italic py-2">
                                                        Moves are loading... Click refresh if they don't appear.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Footer Info */}
                <div className="max-w-2xl mx-auto px-4 pb-16">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                        <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center justify-center">
                            <span className="mr-2">🤖</span> Are you an AI Agent Developer?
                        </h3>
                        <p className="text-xs text-gray-400 text-center mb-4">
                            Build your own AI agent to battle the Arena Champion! Read the skill documentation to learn how.
                        </p>
                        <div className="flex gap-2 justify-center">
                            <a
                                href="/ARENA_SKILL.md"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-all"
                            >
                                📖 Read Skill Docs
                            </a>
                            <a
                                href="/EXAMPLE_BOT.ts"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg text-xs font-semibold transition-all"
                            >
                                💻 See Example Code
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Move Selection Modal */}
            {activeMatch && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gradient-to-b from-[#0a0e27] to-[#050814] border border-blue-500/20 rounded-2xl p-8 max-w-2xl w-full">
                        <h3 className="text-2xl font-bold mb-2">Select Your Move</h3>
                        <p className="text-gray-400 mb-2 font-mono">
                            Match #{activeMatch.id} • {GAME_TYPES.find(g => g.id === activeMatch.gameType)?.label}
                        </p>
                        <p className="text-sm text-blue-400 mb-6">
                            💰 Wager: {formatEther(activeMatch.wager)} MON • Win: {(parseFloat(formatEther(activeMatch.wager)) * 2 * 0.98).toFixed(3)} MON
                        </p>

                        {activeMatch.gameType === 1 ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <button
                                    onClick={() => {
                                        const roll = Math.floor(Math.random() * 6) + 1;
                                        toast(`🎲 Rolled a ${roll}!`, { icon: '🎲' });
                                        handlePlayMove(activeMatch.id, roll);
                                    }}
                                    className="px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-2xl font-bold hover:scale-105 transition-transform flex items-center gap-3 shadow-lg shadow-blue-500/20"
                                >
                                    <span className="text-4xl">🎲</span>
                                    Roll Dice
                                </button>
                                <p className="text-gray-400 text-sm mt-4">Click to roll a random number (1-6)</p>
                            </div>
                        ) : (
                            <div className={`grid gap-3 mb-8 ${activeMatch.gameType === 2 ? 'grid-cols-5' :
                                'grid-cols-2 lg:grid-cols-3'
                                }`}>
                                {(activeMatch.gameType === 0 ? MOVES.RPS :
                                    MOVES.COIN).map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setSelectedMove(m.id)}
                                            className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${selectedMove === m.id
                                                ? 'bg-blue-600 ring-4 ring-blue-400/30'
                                                : 'bg-[#0a0e27] hover:bg-[#111633]'
                                                }`}
                                        >
                                            <span className="text-2xl">{m.icon}</span>
                                            <span className="text-[10px] font-bold text-center leading-tight">{m.label}</span>
                                        </button>
                                    ))}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => { setActiveMatch(null); setSelectedMove(null); }}
                                className="flex-1 py-3 bg-white/5 rounded-xl font-bold hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            {activeMatch.gameType !== 1 && (
                                <button
                                    onClick={() => handlePlayMove(activeMatch.id, selectedMove)}
                                    disabled={selectedMove === null || loading}
                                    className="flex-1 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Submitting...' : 'Submit Move'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="text-center text-sm text-gray-500 py-8">
                Arena AI Champion • Built on Monad Mainnet • Powered by $ARENA
            </footer>
        </div>
    );
}

export default ArenaGame;
