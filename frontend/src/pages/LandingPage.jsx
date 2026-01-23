import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

function LandingPage() {
  const { isConnected } = useAccount();

  const features = [
    {
      icon: '🎮',
      title: 'Wave Defense Game',
      description: 'Play our fully integrated survival shooter. Survive waves, kill enemies, and set high scores.'
    },
    {
      icon: '⚡',
      title: 'Smart Contract Payouts',
      description: 'Automatic prize distribution powered by blockchain technology for fast, secure rewards'
    },
    {
      icon: '✅',
      title: 'Transparent Scoring',
      description: 'All scores and tournament results are stored on-chain for complete transparency and fairness'
    },
    {
      icon: '🌍',
      title: 'Global Tournaments',
      description: 'Compete against players worldwide in daily and weekly tournaments'
    },
    {
      icon: '⚔️',
      title: 'Own Your Assets',
      description: 'Weapons and Skins are ERC-1155 NFTs that you truly own and can trade'
    },
    {
      icon: '💰',
      title: 'Play to Earn',
      description: 'Win Gold and Diamonds to mint exclusive items and participate in high-stakes events'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Connect Wallet',
      description: 'Connect your crypto wallet (MetaMask, etc.) to access your profile and inventory.',
      icon: '🔗'
    },
    {
      number: '02',
      title: 'Play Wave Defense',
      description: 'Survive endless waves of enemies. Your score is verified and recorded on the blockchain.',
      icon: '🎯'
    },
    {
      number: '03',
      title: 'Win Crypto Prizes',
      description: 'Top the leaderboard or win tournaments to automatically receive Gold, Diamonds, and NFTs.',
      icon: '💎'
    }
  ];

  const stats = [
    { value: '250+ ETH', label: 'Total Prize Pool' },
    { value: '150+', label: 'Active Tournaments' },
    { value: '10K+', label: 'Players Worldwide' },
    { value: '5K+', label: 'Games Won' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f1419] text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center particle-bg overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-800/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20 text-center">
          {/* Floating Icon */}
          <div className="mb-6 sm:mb-8 animate-float">
            <div className="inline-block text-5xl sm:text-6xl md:text-7xl lg:text-8xl">🏆</div>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 leading-tight">
            <span className="text-gradient-gaming">Play.</span>{' '}
            <span className="text-gradient-gold">Compete.</span>{' '}
            <span className="text-gradient">Earn.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience the future of Web3 esports. Battle in our flagship <strong>Wave Defense</strong> game, earn real on-chain assets (ERC-1155), and climb the leaderboard for crypto prizes.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-16">
            <Link
              to="/tournaments"
              className="group relative px-6 py-3 sm:px-8 md:px-10 sm:py-4 md:py-5 bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl font-bold text-sm sm:text-base md:text-lg hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-600/50 no-underline text-white"
            >
              <span className="relative z-10">Browse Tournaments</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
            </Link>

            <Link
              to={isConnected ? "/create-tournament" : "/tournaments"}
              className="px-6 py-3 sm:px-8 md:px-10 sm:py-4 md:py-5 glass-strong rounded-xl font-bold text-sm sm:text-base md:text-lg hover:scale-105 transition-all duration-300 border-2 border-white/20 hover:border-purple-500/50 no-underline text-white"
            >
              {isConnected ? 'Create Tournament' : 'Learn More'}
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="glass rounded-xl p-3 sm:p-4 md:p-6 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-gradient mb-2">{stat.value}</div>
                <div className="text-xs sm:text-sm text-white/60 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              Why <span className="text-gradient">GameArena</span>?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              The complete tournament infrastructure for gamers, organizers, and communities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group glass rounded-2xl p-4 sm:p-6 md:p-8 hover:glass-strong transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-600/20 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 text-gradient-purple">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 bg-black/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6">
              How It <span className="text-gradient-gaming">Works</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 -translate-y-1/2 opacity-30"></div>

            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="glass-strong rounded-2xl p-4 sm:p-6 md:p-8 text-center hover:scale-105 transition-all duration-300 relative z-10">
                  {/* Step Number */}
                  <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center text-lg sm:text-xl md:text-2xl font-black shadow-lg shadow-purple-600/50">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 sm:mb-6 mt-6 sm:mt-8 animate-float" style={{ animationDelay: `${index * 0.3}s` }}>
                    {step.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 text-gradient">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] md:w-[800px] h-[400px] sm:h-[600px] md:h-[800px] bg-gradient-to-r from-purple-600/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 sm:mb-8">
            Ready to <span className="text-gradient-gold">Win</span> Big?
          </h2>
          <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white/80 mb-8 sm:mb-10 md:mb-12 leading-relaxed">
            Join the tournament, equip your best NFT weapons, and dominate the leaderboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <Link
              to="/tournaments"
              className="group relative px-8 py-4 sm:px-10 md:px-12 sm:py-5 md:py-6 bg-gradient-to-r from-purple-600 via-purple-700 to-cyan-600 rounded-xl font-black text-base sm:text-lg md:text-xl hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-600/50 no-underline text-white animate-gradient"
            >
              <span className="relative z-10">Play Now</span>
            </Link>

            <Link
              to="/leaderboard"
              className="px-8 py-4 sm:px-10 md:px-12 sm:py-5 md:py-6 glass-strong rounded-xl font-bold text-base sm:text-lg md:text-xl hover:scale-105 transition-all duration-300 border-2 border-white/20 hover:border-cyan-500/50 no-underline text-white"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-8 border-t border-white/10 bg-black/30">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-4">
            <span className="text-2xl sm:text-3xl md:text-4xl">⚡</span>
            <span className="text-lg sm:text-xl md:text-2xl font-black text-gradient">GameArena</span>
          </div>
          <p className="text-white/50 text-xs sm:text-sm">
            Universal Gaming Tournament Platform • Supporting All Games
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
