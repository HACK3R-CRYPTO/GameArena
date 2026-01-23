import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { CONTRACT_ADDRESSES, TOURNAMENT_PLATFORM_ABI } from '../config/contracts';
import { formatEther } from 'viem';

function TournamentBrowser() {
  const navigate = useNavigate();
  const { address, isConnected, chain } = useAccount();
  const [tournaments, setTournaments] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    minEntryFee: '',
    maxEntryFee: '',
    searchTerm: ''
  });

  const TOURNAMENT_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.TOURNAMENT_PLATFORM;
  const SEPOLIA_CHAIN_ID = 11155111;

  // Read tournament counter from contract
  const { data: tournamentCounter, isLoading: counterLoading, isError: counterError } = useReadContract({
    address: TOURNAMENT_CONTRACT_ADDRESS,
    abi: TOURNAMENT_PLATFORM_ABI,
    functionName: 'tournamentCounter',
    chainId: SEPOLIA_CHAIN_ID,
  });

  useEffect(() => {
    console.log('Tournament Counter:', tournamentCounter?.toString());
    console.log('Counter Loading:', counterLoading);
    console.log('Counter Error:', counterError);
  }, [tournamentCounter, counterLoading, counterError]);

  // Build array of contract calls to fetch all tournaments
  const tournamentIds = tournamentCounter ? Array.from({ length: Number(tournamentCounter) }, (_, i) => i) : [];
  const tournamentCalls = tournamentIds.map(id => ({
    address: TOURNAMENT_CONTRACT_ADDRESS,
    abi: TOURNAMENT_PLATFORM_ABI,
    functionName: 'getTournament',
    args: [BigInt(id)],
    chainId: SEPOLIA_CHAIN_ID,
  }));

  // Fetch all tournament data
  const { data: tournamentsData, isLoading: tournamentsLoading, isError: tournamentsError } = useReadContracts({
    contracts: tournamentCalls,
    query: {
      enabled: tournamentCalls.length > 0,
    }
  });

  // Process tournament data
  useEffect(() => {
    if (!tournamentsData) return;
    
    console.log('Raw tournament data:', tournamentsData);
    console.log('Tournament data length:', tournamentsData.length);
    
    const processedTournaments = tournamentsData
      .map((item, index) => {
        console.log(`Processing item ${index + 1}:`, item);
        
        if (item.status !== 'success') {
          console.log(`Tournament ${index + 1} failed - status:`, item.status, 'error:', item.error);
          return null;
        }
        
        if (!item.result) {
          console.log(`Tournament ${index + 1} has no result`);
          return null;
        }
        
        const tournament = item.result;
        console.log(`Tournament ${index + 1} data:`, tournament);
        
        const statusMap = ['UPCOMING', 'LIVE', 'ENDED', 'CANCELLED'];
        const startTime = Number(tournament.startTime) * 1000;
        const endTime = Number(tournament.endTime) * 1000;
        const now = Date.now();
        
        // Determine actual status based on time and contract status
        let actualStatus = statusMap[tournament.status] || 'UPCOMING';
        
        // Override status based on current time if not cancelled
        if (actualStatus !== 'CANCELLED') {
          if (now < startTime) {
            actualStatus = 'UPCOMING';
          } else if (now >= startTime && now < endTime) {
            actualStatus = 'LIVE';
          } else if (now >= endTime) {
            actualStatus = 'ENDED';
          }
        }
        
        return {
          id: Number(tournament.id),
          name: tournament.name,
          description: tournament.description,
          creator: tournament.creator,
          entryFee: formatEther(tournament.entryFee),
          prizePool: formatEther(tournament.prizePool),
          maxParticipants: Number(tournament.maxParticipants),
          currentParticipants: 0, // TODO: Fetch participants count
          startTime: startTime,
          endTime: endTime,
          status: actualStatus,
        };
      })
      .filter(Boolean);
    
    console.log('Processed tournaments:', processedTournaments);
    setTournaments(processedTournaments);
  }, [tournamentsData]);

  const filteredTournaments = tournaments.filter(tournament => {
    if (filters.status !== 'all' && tournament.status !== filters.status) return false;
    const entryFee = parseFloat(tournament.entryFee);
    if (filters.minEntryFee && entryFee < parseFloat(filters.minEntryFee)) return false;
    if (filters.maxEntryFee && entryFee > parseFloat(filters.maxEntryFee)) return false;
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return tournament.name.toLowerCase().includes(searchLower) || tournament.description.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const formatTimeRemaining = (startTime, endTime, status) => {
    const now = Date.now();
    
    // If tournament has ended or is cancelled
    if (status === 'ENDED' || status === 'CANCELLED') {
        return 'Ended';
    }

    // If upcoming (not started yet)
    if (now < startTime) {
        const diff = startTime - now;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        
        if (days > 0) return `Starts in ${days}d ${hours}h`;
        if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
        return `Starts in ${minutes}m`;
    }

    // If live (started but not ended)
    if (now >= startTime && now < endTime) {
        const diff = endTime - now;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        
        if (days > 0) return `${days}d ${hours}h left`;
        if (hours > 0) return `${hours}h ${minutes}m left`;
        return `${minutes}m left`;
    }

    return 'Ended';
  };

  const getStatusBadge = (status) => {
    const badges = {
      LIVE: 'bg-green-500/20 text-green-400 border-green-500',
      UPCOMING: 'bg-blue-500/20 text-blue-400 border-blue-500',
      ENDED: 'bg-gray-500/20 text-gray-400 border-gray-500',
      CANCELLED: 'bg-red-500/20 text-red-400 border-red-500'
    };
    return (
      <span className={`px-3 py-1 rounded-xl text-xs font-bold tracking-wider border ${badges[status] || badges.UPCOMING}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f1419] text-white particle-bg">
      {!isConnected && (
        <div className="glass bg-orange-500/10 border border-orange-500/30 p-4 sm:p-6 text-center text-orange-400 mx-4 sm:mx-6 md:mx-8 mt-4 sm:mt-6 rounded-xl animate-slide-up">
          <p className="text-sm sm:text-base lg:text-lg font-semibold">⚠️ Connect your wallet to create or join tournaments</p>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 md:p-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gradient m-0">🏆 Tournaments</h1>
          <button
            className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-2.5 sm:px-6 md:px-7 sm:py-3 md:py-3.5 rounded-xl font-bold text-sm sm:text-base hover:scale-105 hover:shadow-2xl hover:shadow-purple-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => navigate('/create-tournament')}
            disabled={!isConnected}
          >
            ✨ Create Tournament
          </button>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-4 sm:gap-6 md:gap-8">
          <aside className="glass rounded-xl p-4 sm:p-5 md:p-6 h-fit lg:sticky lg:top-28 animate-slide-up">
            <h3 className="mt-0 mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl font-semibold">Filters</h3>

            <div className="mb-6">
              <label className="block text-sm mb-2 text-white/70 font-medium">Search</label>
              <input
                type="text"
                placeholder="Search tournaments..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="w-full px-2.5 py-2.5 bg-white/10 border border-white/20 rounded-md text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm mb-2 text-white/70 font-medium">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-2.5 py-2.5 bg-white/10 border border-white/20 rounded-md text-white text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
              >
                <option value="all">All Tournaments</option>
                <option value="LIVE">Live</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ENDED">Ended</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>


            <div className="mb-6">
              <label className="block text-sm mb-2 text-white/70 font-medium">Entry Fee Range</label>
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  placeholder="Min (ETH)"
                  step="0.001"
                  min="0"
                  value={filters.minEntryFee}
                  onChange={(e) => setFilters({ ...filters, minEntryFee: e.target.value })}
                  className="w-full px-2.5 py-2.5 bg-white/10 border border-white/20 rounded-md text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
                <input
                  type="number"
                  placeholder="Max (ETH)"
                  step="0.001"
                  min="0"
                  value={filters.maxEntryFee}
                  onChange={(e) => setFilters({ ...filters, maxEntryFee: e.target.value })}
                  className="w-full px-2.5 py-2.5 bg-white/10 border border-white/20 rounded-md text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>
            </div>

            <button
              className="w-full px-2.5 py-2.5 bg-white/10 border border-white/20 rounded-md text-white hover:bg-white/15 transition-all"
              onClick={() => setFilters({ status: 'all', minEntryFee: '', maxEntryFee: '', searchTerm: '' })}
            >
              Clear Filters
            </button>
          </aside>

          <main className="min-h-[500px]">
            <div className="mb-6">
              <p className="text-white/70 text-sm">{filteredTournaments.length} tournaments found</p>
            </div>

            {filteredTournaments.length === 0 ? (
              <div className="text-center py-16 px-8 text-white/50">
                <p>No tournaments match your filters</p>
                <button
                  className="mt-4 px-6 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15 transition-all"
                  onClick={() => setFilters({ status: 'all', minEntryFee: '', maxEntryFee: '', searchTerm: '' })}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4 sm:gap-5 md:gap-6">
                {filteredTournaments.map((tournament, index) => (
                  <div
                    key={tournament.id}
                    className="glass rounded-2xl p-4 sm:p-5 md:p-6 transition-all hover:-translate-y-2 hover:glass-strong hover:shadow-2xl hover:shadow-purple-600/30 hover:border-purple-500/50 cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2 sm:gap-4">
                      <h3 className="m-0 text-base sm:text-lg md:text-xl font-semibold flex-1">{tournament.name}</h3>
                      {getStatusBadge(tournament.status)}
                    </div>

                    <p className="text-white/70 text-xs sm:text-sm mb-4 sm:mb-5 md:mb-6 leading-relaxed">{tournament.description}</p>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Entry Fee</span>
                        <span className="text-sm sm:text-base font-semibold text-white">{tournament.entryFee} ETH</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Prize Pool</span>
                        <span className="text-sm sm:text-base font-semibold text-white">{tournament.prizePool} ETH</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">Participants</span>
                        <span className="text-sm sm:text-base font-semibold text-white">
                          {tournament.currentParticipants}/{tournament.maxParticipants}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">
                          {Date.now() >= tournament.startTime && Date.now() < tournament.endTime ? 'Ends In' : 'Status'}
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-white">
                          {formatTimeRemaining(tournament.startTime, tournament.endTime, tournament.status)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                      <button
                        className="w-full px-3 py-3.5 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-xl font-bold hover:scale-105 hover:shadow-2xl hover:shadow-purple-600/50 transition-all"
                        onClick={() => navigate(`/tournament/${tournament.id}`)}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default TournamentBrowser;
