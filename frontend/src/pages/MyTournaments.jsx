import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useReadContract, useReadContracts, useSwitchChain } from 'wagmi';
import { CONTRACT_ADDRESSES, TOURNAMENT_PLATFORM_ABI, WINNER_BADGE_ABI } from '../config/contracts';
import { formatEther } from 'viem';

function MyTournaments() {
  const navigate = useNavigate();
  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [activeTab, setActiveTab] = useState('joined');
  
  const SEPOLIA_CHAIN_ID = 11155111;
  const isWrongNetwork = isConnected && chain?.id !== SEPOLIA_CHAIN_ID;

  // Read tournament counter
  const { data: tournamentCounter, isError: counterError, isLoading: counterLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.TOURNAMENT_PLATFORM,
    abi: TOURNAMENT_PLATFORM_ABI,
    functionName: 'tournamentCounter',
    chainId: SEPOLIA_CHAIN_ID,
  });

  // Read badge balance
  const { data: badgeBalance, isError: badgeError, isLoading: badgeLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.WINNER_BADGE,
    abi: WINNER_BADGE_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
  });

  // Build array of contract calls to fetch all tournaments
  // Note: getPlayerTournaments only returns tournaments where user joined (paid entry fee)
  // To show created tournaments, we need to fetch all and filter by creator
  const tournamentIds = tournamentCounter ? Array.from({ length: Number(tournamentCounter) }, (_, i) => i) : [];
  const tournamentCalls = tournamentIds.map(id => ({
    address: CONTRACT_ADDRESSES.TOURNAMENT_PLATFORM,
    abi: TOURNAMENT_PLATFORM_ABI,
    functionName: 'getTournament',
    args: [BigInt(id)],
    chainId: SEPOLIA_CHAIN_ID,
  }));

  // Also fetch player tournaments to know which ones they joined
  const { data: playerTournamentIds } = useReadContract({
    address: CONTRACT_ADDRESSES.TOURNAMENT_PLATFORM,
    abi: TOURNAMENT_PLATFORM_ABI,
    functionName: 'getPlayerTournaments',
    args: address ? [address] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
  });

  // Fetch user scores for joined tournaments
  const { data: scoresData } = useReadContracts({
    contracts: playerTournamentIds?.map(id => ({
      address: CONTRACT_ADDRESSES.TOURNAMENT_PLATFORM,
      abi: TOURNAMENT_PLATFORM_ABI,
      functionName: 'getParticipantScore',
      args: [id, address],
      chainId: SEPOLIA_CHAIN_ID,
    })) || [],
    query: {
      enabled: !!playerTournamentIds && !!address,
    }
  });

  const { data: tournamentsData } = useReadContracts({
    contracts: tournamentCalls,
    query: {
      enabled: tournamentCalls.length > 0,
    }
  });

  // Process tournament data with useMemo to avoid cascading renders
  const myTournaments = useMemo(() => {
    if (!tournamentsData || !address) return { joined: [], created: [] };

    const joined = [];
    const created = [];
    const playerIdSet = new Set(playerTournamentIds?.map(id => Number(id)) || []);
    
    // Create a map of scores for easier lookup
    const scoresMap = {};
    if (playerTournamentIds && scoresData) {
        playerTournamentIds.forEach((id, index) => {
            const result = scoresData[index];
            if (result && result.status === 'success') {
                scoresMap[Number(id)] = result.result;
            }
        });
    }

    tournamentsData.forEach((item, index) => {
      if (item.status !== 'success' || !item.result) {
        console.log(`Tournament ${index} failed or has no result:`, item);
        return;
      }

      const tournament = item.result;
      const statusMap = ['UPCOMING', 'LIVE', 'ENDED', 'CANCELLED'];
      const tournamentId = Number(tournament.id);
      
      const startTime = Number(tournament.startTime) * 1000;
      const endTime = Number(tournament.endTime) * 1000;
      const now = Date.now();
      
      // Determine actual status based on time
      let actualStatus = statusMap[tournament.status] || 'UPCOMING';
      if (actualStatus !== 'CANCELLED') {
        if (now < startTime) {
          actualStatus = 'UPCOMING';
        } else if (now >= startTime && now < endTime) {
          actualStatus = 'LIVE';
        } else if (now >= endTime) {
          actualStatus = 'ENDED';
        }
      }
      
      const userScoreData = scoresMap[tournamentId];
      const myScore = userScoreData ? Number(userScoreData.score) : 0;
      
      const processedTournament = {
        id: tournamentId,
        name: tournament.name,
        description: tournament.description,
        creator: tournament.creator,
        entryFee: formatEther(tournament.entryFee),
        prizePool: formatEther(tournament.prizePool),
        maxParticipants: Number(tournament.maxParticipants),
        currentParticipants: 0, // TODO: Fetch real participant count if needed
        status: actualStatus,
        startTime: startTime,
        endTime: endTime,
        myScore: myScore,
        myRank: null, // Rank requires fetching all scores, skipping for now
        potentialPrize: '0', // Mock
        claimed: false, // Mock
      };

      const isCreator = tournament.creator.toLowerCase() === address.toLowerCase();
      const hasJoined = playerIdSet.has(tournamentId);
      
      console.log(`Tournament ${tournamentId}:`, {
        name: tournament.name,
        creator: tournament.creator,
        userAddress: address,
        isCreator,
        hasJoined,
        playerIdSet: Array.from(playerIdSet)
      });

      // Add to created if user is creator
      if (isCreator) {
        created.push(processedTournament);
        console.log(`Added tournament ${tournamentId} to created`);
      }
      
      // Add to joined if user joined
      if (hasJoined) {
        joined.push(processedTournament);
        console.log(`Added tournament ${tournamentId} to joined`);
      }
    });

    console.log('Final counts - Joined:', joined.length, 'Created:', created.length);
    return { joined, created };
  }, [tournamentsData, address, playerTournamentIds, scoresData]);

  useEffect(() => {
    console.log('=== Contract Read Status ===');
    console.log('Connected:', isConnected);
    console.log('Chain ID:', chain?.id);
    console.log('Address:', address);
    console.log('Counter Loading:', counterLoading, 'Error:', counterError);
    console.log('Badge Loading:', badgeLoading, 'Error:', badgeError);
    console.log('Tournament Counter:', tournamentCounter?.toString());
    console.log('Badge Balance:', badgeBalance?.toString());
    console.log('Player Tournament IDs:', playerTournamentIds);
    console.log('Tournaments Data:', tournamentsData);
    console.log('Processed Tournaments:', myTournaments);
    console.log('Contract Address:', CONTRACT_ADDRESSES.TOURNAMENT_PLATFORM);
  }, [tournamentCounter, badgeBalance, isConnected, chain, address, counterLoading, counterError, badgeLoading, badgeError, playerTournamentIds, tournamentsData, myTournaments]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
        <div className="max-w-2xl mx-auto my-16 text-center p-12 bg-white/5 rounded-xl border border-white/10">
          <h2 className="mb-4 text-lg sm:text-xl md:text-2xl">🔒 Wallet Connection Required</h2>
          <p className="mb-6 text-white/70">Please connect your wallet to view your tournaments</p>
          <button
            className="mt-6 px-8 py-3.5 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-600/40 transition-all"
            onClick={() => navigate('/tournaments')}
          >
            Back to Tournaments
          </button>
        </div>
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
        <div className="max-w-2xl mx-auto my-16 text-center p-12 bg-white/5 rounded-xl border border-white/10">
          <h2 className="mb-4 text-2xl">⚠️ Wrong Network</h2>
          <p className="mb-2 text-white/90 font-semibold">Current Network: {chain?.name || 'Unknown'}</p>
          <p className="mb-6 text-white/70">Please switch to Sepolia Testnet</p>
          <button
            onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-semibold text-lg hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/40 transition-all"
          >
            🔄 Switch to Sepolia
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'LIVE': return 'bg-green-500/20 text-green-400 border-green-500';
      case 'UPCOMING': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500';
      case 'ENDED': return 'bg-red-500/20 text-red-400 border-red-500';
      default: return 'bg-white/20 text-white/70 border-white/30';
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const handleClaimPrize = (tournamentId) => {
    console.log('Claiming prize for tournament:', tournamentId);
    alert('Prize claimed successfully! (Mock)');
  };

  const handleCancelTournament = (tournamentId) => {
    if (window.confirm('Are you sure you want to cancel this tournament?')) {
      console.log('Canceling tournament:', tournamentId);
      alert('Tournament canceled successfully! (Mock)');
    }
  };

  const tournaments = myTournaments[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 p-8">
        <h1 className="m-0 text-xl sm:text-2xl md:text-3xl font-bold text-gradient">My Tournaments</h1>
        <p className="mt-2 text-white/70">Track your tournament participation and performance</p>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="flex border-b border-white/10">
            <button
              className={`flex-1 px-8 py-4 font-semibold transition-all ${
                activeTab === 'joined'
                  ? 'bg-purple-600 text-white'
                  : 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => setActiveTab('joined')}
            >
              Joined Tournaments ({tournaments.length})
            </button>
            <button
              className={`flex-1 px-8 py-4 font-semibold transition-all ${
                activeTab === 'created'
                  ? 'bg-purple-600 text-white'
                  : 'bg-transparent text-white/70 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => setActiveTab('created')}
            >
              Created Tournaments ({myTournaments.created.length})
            </button>
          </div>

          <div className="p-8">
            {tournaments.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-6">
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🎮</div>
                  <p className="text-xl text-white/80 mb-2">
                    {activeTab === 'joined' 
                      ? "You haven't joined any tournaments yet"
                      : "You haven't created any tournaments yet"}
                  </p>
                  <p className="text-white/50 mb-6">
                    {activeTab === 'joined'
                      ? 'Browse available tournaments and start competing!'
                      : 'Create your first tournament and invite players to compete'}
                  </p>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6 max-w-md mx-auto mb-6">
                  <p className="text-sm text-cyan-300">
                    <strong>🔗 Connected to Sepolia</strong><br/>
                    Total tournaments on-chain: {tournamentCounter?.toString() || '0'}<br/>
                    Your NFT badges: {badgeBalance?.toString() || '0'}
                  </p>
                </div>
                <button
                  className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-600/40 transition-all"
                  onClick={() => navigate(activeTab === 'joined' ? '/tournaments' : '/create-tournament')}
                >
                  {activeTab === 'joined' ? '🎯 Browse Tournaments' : '➕ Create Tournament'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tournaments.map(tournament => (
                  <div
                    key={tournament.id}
                    className="bg-white/5 rounded-xl p-6 border border-white/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-600/20 transition-all cursor-pointer"
                    onClick={() => navigate(`/tournament/${tournament.id}`)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="m-0 mb-2 text-xl font-bold">{tournament.name}</h3>
                        <span className={`inline-block px-3 py-1 border rounded-full text-xs font-semibold ${getStatusColor(tournament.status)}`}>
                          {tournament.status}
                        </span>
                      </div>
                      {activeTab === 'joined' && tournament.myRank && (
                        <div className="text-center">
                          <div className="mb-1 text-2xl sm:text-3xl">{getRankBadge(tournament.myRank)}</div>
                          <div className="text-sm text-white/60">Rank {tournament.myRank}</div>
                        </div>
                      )}
                    </div>

                    <div className="mb-4 pb-4 border-b border-white/10">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-white/60 text-sm mb-1">Prize Pool</p>
                          <p className="text-lg font-bold text-gradient">{tournament.prizePool} ETH</p>
                        </div>
                        <div>
                          <p className="text-white/60 text-sm mb-1">Entry Fee</p>
                          <p className="text-lg font-bold text-gradient">{tournament.entryFee} ETH</p>
                        </div>
                      </div>
                    </div>

                    {activeTab === 'joined' ? (
                      <>
                        <div className="mb-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-white/70">Your Score:</span>
                            <span className="font-semibold text-cyan-400">{tournament.myScore.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Potential Prize:</span>
                            <span className="font-semibold text-gradient">{tournament.potentialPrize} ETH</span>
                          </div>
                        </div>

                        {tournament.status === 'ENDED' && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            {tournament.claimed ? (
                              <div className="text-center py-3 bg-green-500/20 border border-green-500 text-green-400 rounded-lg font-semibold">
                                ✓ Prize Claimed
                              </div>
                            ) : tournament.potentialPrize > 0 ? (
                              <button
                                className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-600/40 transition-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClaimPrize(tournament.id);
                                }}
                              >
                                Claim Prize ({tournament.potentialPrize} ETH)
                              </button>
                            ) : (
                              <div className="text-center py-3 text-white/50">No prize won</div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="mb-4">
                          <div className="flex justify-between mb-2">
                            <span className="text-white/70">Participants:</span>
                            <span className="font-semibold">
                              {tournament.participants}/{tournament.maxParticipants}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">
                              {tournament.status === 'UPCOMING' ? 'Starts:' : tournament.status === 'LIVE' ? 'Ends:' : 'Ended:'}
                            </span>
                            <span className="font-semibold">
                              {new Date(tournament.status === 'UPCOMING' ? tournament.startTime : tournament.endTime).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {tournament.status === 'UPCOMING' && (
                          <button
                            className="w-full mt-4 py-3 bg-red-500/20 border border-red-500 text-red-400 rounded-lg font-semibold hover:bg-red-500/30 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelTournament(tournament.id);
                            }}
                          >
                            Cancel Tournament
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-8 border border-white/10">
          <h2 className="mt-0 mb-6 text-2xl font-semibold">Performance Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/5 p-6 rounded-lg border border-white/10 text-center">
              <p className="text-white/60 mb-2">Total Joined</p>
              <p className="text-4xl font-bold text-gradient">{myTournaments.joined.length}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-lg border border-white/10 text-center">
              <p className="text-white/60 mb-2">Total Created</p>
              <p className="text-4xl font-bold text-gradient">{myTournaments.created.length}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-lg border border-white/10 text-center">
              <p className="text-white/60 mb-2">NFT Badges</p>
              <p className="text-4xl font-bold text-gradient">{badgeBalance?.toString() || '0'}</p>
            </div>
            <div className="bg-white/5 p-6 rounded-lg border border-white/10 text-center">
              <p className="text-white/60 mb-2">On Sepolia</p>
              <p className="text-2xl font-bold text-cyan-400">✓ Connected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyTournaments;
