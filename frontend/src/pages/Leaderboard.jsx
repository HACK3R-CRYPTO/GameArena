import { useState, useEffect, useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { CONTRACT_ADDRESSES, ARCADE_PLATFORM_ABI } from '../config/contracts';

function Leaderboard() {
  const [timeFilter, setTimeFilter] = useState('all-time');

  const SEPOLIA_CHAIN_ID = 11155111;

  // Fetch scores from ArcadePlatform
  const { data: arcadeData } = useReadContract({
    address: CONTRACT_ADDRESSES.ARCADE_PLATFORM,
    abi: ARCADE_PLATFORM_ABI,
    functionName: 'getLeaderboard',
    chainId: SEPOLIA_CHAIN_ID,
  });

  const leaderboard = useMemo(() => {
    if (!arcadeData || arcadeData.length === 0) {
      console.log('No leaderboard data available');
      return [];
    }

    console.log('Raw arcade data:', arcadeData);
    
    const data = arcadeData
      .filter(item => item.player && item.score) // Filter out invalid entries
      .map(item => ({
        address: item.player,
        score: Number(item.score),
        tournaments: 1, 
        avgRank: 1, 
        winRate: 100
      }));

    console.log('Processed leaderboard data:', data);

    return data.sort((a, b) => b.score - a.score).map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }, [arcadeData]);

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f1419] text-white particle-bg">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 animate-slide-up">
          <h1 className="m-0 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gradient">🎯 Global Leaderboard</h1>
          <p className="mt-2 text-sm sm:text-base md:text-lg text-white/70">Top players ranked by their Arcade High Scores</p>
          <div className="mt-4 glass rounded-lg p-3 sm:p-4 border border-yellow-500/30">
            <p className="text-xs sm:text-sm md:text-base text-yellow-400">ℹ️ <strong>Global Arcade Leaderboard:</strong> Showing top scores from Free-to-Play Arcade Mode.</p>
          </div>
        </div>

        <div className="mb-6 sm:mb-8 flex justify-center sm:justify-end animate-slide-up">
          <div className="inline-flex glass rounded-xl p-1.5 border border-white/10 overflow-x-auto">
            {['all-time', 'monthly', 'weekly'].map(filter => (
              <button
                key={filter}
                className={`px-3 py-2 sm:px-4 md:px-6 sm:py-2.5 rounded-lg font-bold transition-all text-xs sm:text-sm whitespace-nowrap ${timeFilter === filter
                  ? 'bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-600/50'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                onClick={() => setTimeFilter(filter)}
              >
                {filter === 'all-time' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 sm:mb-10 md:mb-12 glass-strong rounded-2xl p-4 sm:p-6 md:p-8 border border-purple-500/30 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="mt-0 mb-6 sm:mb-8 text-xl sm:text-2xl md:text-3xl font-black text-center">🏆 Top Champions 🏆</h2>
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 sm:py-16">
              <div className="text-5xl sm:text-6xl md:text-7xl mb-4 sm:mb-6">🎮</div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">No Players Yet!</h3>
              <p className="text-sm sm:text-base text-white/60 max-w-md mx-auto">
                Be the first to play and set a high score in the Wave Defense game!
              </p>
            </div>
          ) : (          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* 2nd Place */}
            <div className="glass-strong rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-gray-400/50 text-center md:h-[280px] flex flex-col justify-end transform md:-translate-y-4 hover:scale-105 transition-all animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="mb-3 sm:mb-4 text-4xl sm:text-5xl md:text-6xl animate-float" style={{ animationDelay: '0.5s' }}>🥈</div>
              <div className="mb-2 text-3xl sm:text-4xl md:text-5xl font-black text-gradient-silver">2</div>
              <div className="mb-2 sm:mb-3 font-mono text-xs sm:text-sm md:text-base lg:text-lg truncate">{topThree[1]?.address}</div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                <div className="glass p-2 sm:p-3 rounded-lg">
                  <p className="text-white/60 mb-1 text-[10px] sm:text-xs">High Score</p>
                  <p className="font-bold text-cyan-400 text-xs sm:text-sm">{topThree[1]?.score}</p>
                </div>
                <div className="glass p-2 sm:p-3 rounded-lg">
                  <p className="text-white/60 mb-1 text-[10px] sm:text-xs">Tournaments</p>
                  <p className="font-bold text-xs sm:text-sm">{topThree[1]?.tournaments}</p>
                </div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="glass-strong rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-yellow-400/70 text-center md:h-[320px] flex flex-col justify-end shadow-2xl shadow-yellow-600/40 hover:scale-105 transition-all animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <div className="mb-3 sm:mb-4 text-5xl sm:text-6xl md:text-7xl animate-float">👑</div>
              <div className="mb-2 text-4xl sm:text-5xl md:text-6xl font-black text-gradient-gold">1</div>
              <div className="mb-2 sm:mb-3 font-mono text-sm sm:text-base md:text-lg lg:text-xl font-bold truncate">{topThree[0]?.address}</div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                <div className="glass p-2 sm:p-3 rounded-lg">
                  <p className="text-white/60 mb-1 text-[10px] sm:text-xs">High Score</p>
                  <p className="font-bold text-cyan-400 text-xs sm:text-sm">{topThree[0]?.score}</p>
                </div>
                <div className="glass p-2 sm:p-3 rounded-lg">
                  <p className="text-white/60 mb-1 text-[10px] sm:text-xs">Tournaments</p>
                  <p className="font-bold text-xs sm:text-sm">{topThree[0]?.tournaments}</p>
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="glass-strong rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-amber-600/50 text-center md:h-[280px] flex flex-col justify-end transform md:-translate-y-4 hover:scale-105 transition-all animate-slide-up" style={{ animationDelay: '0.25s' }}>
              <div className="mb-3 sm:mb-4 text-4xl sm:text-5xl md:text-6xl animate-float" style={{ animationDelay: '1s' }}>🥉</div>
              <div className="mb-2 text-3xl sm:text-4xl md:text-5xl font-black text-gradient-bronze">3</div>
              <div className="mb-2 sm:mb-3 font-mono text-xs sm:text-sm md:text-base lg:text-lg truncate">{topThree[2]?.address}</div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
                <div className="glass p-2 sm:p-3 rounded-lg">
                  <p className="text-white/60 mb-1 text-[10px] sm:text-xs">High Score</p>
                  <p className="font-bold text-cyan-400 text-xs sm:text-sm">{topThree[2]?.score}</p>
                </div>
                <div className="glass p-2 sm:p-3 rounded-lg">
                  <p className="text-white/60 mb-1 text-[10px] sm:text-xs">Tournaments</p>
                  <p className="font-bold text-xs sm:text-sm">{topThree[2]?.tournaments}</p>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>

        {leaderboard.length > 3 && (
        <div className="glass rounded-2xl border border-white/10 overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="glass-strong">
                <tr className="border-b border-white/10">
                  <th className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 text-left font-bold text-white/90 text-xs sm:text-sm">Rank</th>
                  <th className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 text-left font-bold text-white/90 text-xs sm:text-sm">Player</th>
                  <th className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 text-left font-bold text-white/90 text-xs sm:text-sm hidden sm:table-cell">Tournaments</th>
                  <th className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 text-left font-bold text-white/90 text-xs sm:text-sm">High Score</th>
                  <th className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 text-left font-bold text-white/90 text-xs sm:text-sm hidden md:table-cell">Avg. Rank</th>
                  <th className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 text-left font-bold text-white/90 text-xs sm:text-sm hidden lg:table-cell">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {rest.map((player, index) => (
                  <tr
                    key={player.rank}
                    className="border-b border-white/5 hover:bg-white/10 transition-all animate-fade-in"
                    style={{ animationDelay: `${0.4 + index * 0.02}s` }}
                  >
                    <td className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6">
                      <span className="inline-flex items-center justify-center min-w-[32px] sm:min-w-[36px] md:min-w-[40px] h-8 sm:h-9 md:h-10 px-2 sm:px-3 rounded-full glass font-black text-white/90 text-xs sm:text-sm">
                        {player.rank}
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 font-mono font-semibold text-xs sm:text-sm truncate">{player.address}</td>
                    <td className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 font-semibold text-xs sm:text-sm hidden sm:table-cell">{player.tournaments}</td>
                    <td className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 font-black text-gradient text-xs sm:text-sm">{player.score}</td>
                    <td className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 font-semibold text-xs sm:text-sm hidden md:table-cell">{player.avgRank}</td>
                    <td className="py-2 sm:py-3 md:py-4 px-2 sm:px-4 md:px-6 hidden lg:table-cell">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex-1 glass rounded-full h-2 sm:h-2.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 transition-all"
                            style={{ width: `${player.winRate}%` }}
                          />
                        </div>
                        <span className="min-w-[35px] sm:min-w-[45px] text-right font-bold text-xs sm:text-sm">{player.winRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        <div className="mt-8 text-center text-white/60">
          <p>Showing {leaderboard.length} players • Global Arcade Rankings</p>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
