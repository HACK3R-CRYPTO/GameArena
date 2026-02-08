import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES, ARENA_PLATFORM_ABI, AGENT_REGISTRY_ABI } from '../config/contracts';
import { toast } from 'react-hot-toast';

const MATCH_STATUS = ['Proposed', 'Accepted', 'Completed', 'Cancelled'];
const GAME_TYPES = [
    { id: 0, label: 'Rock-Paper-Scissors', icon: '✊', description: 'Classic choice game' },
    { id: 1, label: 'Dice Roll', icon: '🎲', description: 'Predict the roll (1-6)' },
    { id: 2, label: 'Strategy Battle', icon: '⚔️', description: 'Complex tactics (0-9)' },
    { id: 3, label: 'Coin Flip', icon: '🪙', description: 'Heads or Tails' }
];

const MOVES = {
    RPS: [
        { id: 0, icon: '✊', label: 'Rock' },
        { id: 1, icon: '✋', label: 'Paper' },
        { id: 2, icon: '✌️', label: 'Scissors' }
    ],
    DICE: [
        { id: 1, icon: '⚀', label: 'Roll 1' },
        { id: 2, icon: '⚁', label: 'Roll 2' },
        { id: 3, icon: '⚂', label: 'Roll 3' },
        { id: 4, icon: '⚃', label: 'Roll 4' },
        { id: 5, icon: '⚄', label: 'Roll 5' },
        { id: 6, icon: '⚅', label: 'Roll 6' }
    ],
    STRATEGY: Array.from({ length: 10 }, (_, i) => ({ id: i, icon: '🎯', label: `Strategy ${i}` })),
    COIN: [
        { id: 0, icon: '👤', label: 'Heads' },
        { id: 1, icon: '🦅', label: 'Tails' }
    ]
};

// Helper function to get move display
const getMoveDisplay = (gameType, moveId) => {
    if (gameType === 0) { // RPS
        const move = MOVES.RPS.find(m => m.id === moveId);
        return move ? { icon: move.icon, label: move.label } : { icon: '❓', label: 'Unknown' };
    } else if (gameType === 1) { // Dice
        const move = MOVES.DICE.find(m => m.id === moveId);
        return move ? { icon: move.icon, label: move.label } : { icon: '❓', label: 'Unknown' };
    } else if (gameType === 2) { // Strategy
        const move = MOVES.STRATEGY.find(m => m.id === moveId);
        return move ? { icon: move.icon, label: move.label } : { icon: '❓', label: 'Unknown' };
    } else if (gameType === 3) { // Coin
        const move = MOVES.COIN.find(m => m.id === moveId);
        return move ? { icon: move.icon, label: move.label } : { icon: '❓', label: 'Unknown' };
    }
    return { icon: '❓', label: 'Unknown' };
};

const ArenaGame = () => {
    const { address, isConnected } = useAccount();
    const { open } = useAppKit();
    const publicClient = usePublicClient();
    const [wager, setWager] = useState('0.1');
    const [selectedGameType, setSelectedGameType] = useState(0);
    const [matches, setMatches] = useState([]);
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
        
        try {
            // Remove duplicate IDs that can occur if playing against self
            const uniqueIds = [...new Set(ids)];
            
            const matchDetails = await Promise.all(
                uniqueIds.map(async (id) => {
                    const m = await publicClient.readContract({
                        address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                        abi: ARENA_PLATFORM_ABI,
                        functionName: 'matches',
                        args: [id]
                    });
                    
                    // Fetch move events for Accepted and Completed matches
                    let challengerMove = null;
                    let opponentMove = null;
                    
                    if (Number(m[5]) === 1 || Number(m[5]) === 2) { // Status = Accepted or Completed
                        try {
                            // Get MovePlayed events for this match
                            const moveEvents = await publicClient.getLogs({
                                address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
                                event: {
                                    type: 'event',
                                    name: 'MovePlayed',
                                    inputs: [
                                        { indexed: true, name: 'matchId', type: 'uint256' },
                                        { indexed: true, name: 'player', type: 'address' },
                                        { indexed: false, name: 'move', type: 'uint8' }
                                    ]
                                },
                                args: { matchId: id },
                                fromBlock: 'earliest',
                                toBlock: 'latest'
                            });
                            
                            // Parse moves from events
                            moveEvents.forEach(event => {
                                const playerAddress = event.args.player.toLowerCase();
                                const move = Number(event.args.move);
                                
                                if (playerAddress === m[1].toLowerCase()) { // challenger
                                    challengerMove = move;
                                } else if (playerAddress === m[2].toLowerCase()) { // opponent
                                    opponentMove = move;
                                }
                            });
                        } catch (err) {
                            console.log('Could not fetch move events:', err);
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
                })
            );
            setMatches(matchDetails.sort((a, b) => b.id - a.id));
        } catch (error) {
            console.error('Error fetching matches:', error);
        }
    }, [publicClient]);

    // Fetch player matches
    const { data: playerMatchIds, refetch: refetchMatches } = useReadContract({
        address: CONTRACT_ADDRESSES.ARENA_PLATFORM,
        abi: ARENA_PLATFORM_ABI,
        functionName: 'getPlayerMatches',
        args: [address],
        query: { 
            enabled: !!address,
            refetchInterval: 1000 // Poll every 1 second for real-time updates
        }
    });

    useEffect(() => {
        if (playerMatchIds) {
            fetchMatchDetails(playerMatchIds);
        }
    }, [playerMatchIds, fetchMatchDetails]);

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
                        <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">4</div>
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
                            "{agentProfile?.[2] || 'I analyze your moves and adapt my strategy using Markov Chains. The more you play, the smarter I get. Think you can outsmart me?'}"
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
                                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                                        selectedGameType === g.id 
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
                                                    <div className={`text-xs font-semibold ${
                                                        match.status === 0 ? 'text-yellow-400' : 
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
                                href="https://github.com/yourhandle/TournamentChain/blob/main/ARENA_SKILL.md"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold transition-all"
                            >
                                📖 Read Skill Docs
                            </a>
                            <a 
                                href="https://github.com/yourhandle/TournamentChain/blob/main/EXAMPLE_OPPONENT_AGENT.js"
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
                        
                        <div className={`grid gap-3 mb-8 ${
                            activeMatch.gameType === 1 ? 'grid-cols-3' :
                            activeMatch.gameType === 2 ? 'grid-cols-5' :
                            'grid-cols-2 lg:grid-cols-3'
                        }`}>
                            {(activeMatch.gameType === 0 ? MOVES.RPS : 
                              activeMatch.gameType === 1 ? MOVES.DICE :
                              activeMatch.gameType === 2 ? MOVES.STRATEGY :
                              MOVES.COIN).map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedMove(m.id)}
                                    className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                                        selectedMove === m.id 
                                        ? 'bg-blue-600 ring-4 ring-blue-400/30' 
                                        : 'bg-[#0a0e27] hover:bg-[#111633]'
                                    }`}
                                >
                                    <span className="text-2xl">{m.icon}</span>
                                    <span className="text-[10px] font-bold text-center leading-tight">{m.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => { setActiveMatch(null); setSelectedMove(null); }}
                                className="flex-1 py-3 bg-white/5 rounded-xl font-bold hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => handlePlayMove(activeMatch.id, selectedMove)}
                                disabled={selectedMove === null || loading}
                                className="flex-2 py-3 px-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Confirm Move ⚡'}
                            </button>
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
