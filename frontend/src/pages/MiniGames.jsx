import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

function MiniGames() {
    const { isConnected } = useAccount();
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('all');

    const games = [
        {
            id: 'wave-defense',
            title: 'Wave Defense',
            description: 'Defend your base from waves of increasingly difficult enemies in this survival action game.',
            category: 'action',
            players: '5,123',
            image: '🛡️',
            difficulty: 'Hard',
            path: '/play-solo',
            comingSoon: false
        },
        {
            id: 1,
            title: 'Puzzle Master',
            description: 'Test your puzzle-solving skills in this challenging brain teaser',
            category: 'puzzle',
            players: '1,234',
            image: '🧩',
            difficulty: 'Medium',
            comingSoon: true
        },
        {
            id: 2,
            title: 'Speed Racer',
            description: 'Race against time in this fast-paced arcade game',
            category: 'arcade',
            players: '2,456',
            image: '🏎️',
            difficulty: 'Easy',
            comingSoon: true
        },
        {
            id: 3,
            title: 'Memory Match',
            description: 'Challenge your memory with this classic matching game',
            category: 'puzzle',
            players: '3,789',
            image: '🎴',
            difficulty: 'Easy',
            comingSoon: true
        },
        {
            id: 4,
            title: 'Space Shooter',
            description: 'Defend the galaxy from alien invaders',
            category: 'action',
            players: '5,123',
            image: '🚀',
            difficulty: 'Hard',
            comingSoon: true
        },
        {
            id: 5,
            title: 'Word Quest',
            description: 'Find words and expand your vocabulary',
            category: 'puzzle',
            players: '987',
            image: '📝',
            difficulty: 'Medium',
            comingSoon: true
        }
    ];

    const categories = [
        { id: 'all', label: 'All Games' },
        { id: 'puzzle', label: 'Puzzle' },
        { id: 'arcade', label: 'Arcade' },
        { id: 'action', label: 'Action' },
        { id: 'strategy', label: 'Strategy' }
    ];

    const filteredGames = selectedCategory === 'all'
        ? games
        : games.filter(game => game.category === selectedCategory);

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return 'text-green-400 bg-green-400/10 border-green-400/30';
            case 'Medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
            case 'Hard': return 'text-red-400 bg-red-400/10 border-red-400/30';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
        }
    };

    const handlePlay = (game) => {
        if (game.path && !game.comingSoon) {
            navigate(game.path);
        } else {
            // No action needed as button is disabled or shows coming soon
        }
    };

    return (
        <div className="min-h-screen py-4 sm:py-6 md:py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient mb-2 sm:mb-3 md:mb-4">
                        🎮 Mini Games
                    </h1>
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white/70 max-w-2xl mx-auto">
                        Compete in the Wave Defense tournament to climb the leaderboard and win rewards!
                    </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3 mb-4 sm:mb-6 md:mb-8">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-2.5 py-1 sm:px-3 md:px-4 lg:px-6 sm:py-1.5 md:py-2 rounded-lg font-medium transition-all text-[11px] sm:text-xs md:text-sm ${selectedCategory === category.id
                                    ? 'bg-purple-600 text-white border border-purple-500'
                                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>

                {/* Games Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
                    {filteredGames.map(game => (
                        <div
                            key={game.id}
                            className={`glass rounded-2xl p-4 sm:p-5 md:p-6 border transition-all relative ${game.comingSoon 
                                ? 'opacity-75 grayscale border-white/5 cursor-not-allowed' 
                                : 'border-white/10 hover:border-purple-500/50 hover:transform hover:scale-105'}`}
                        >
                            {/* Coming Soon Badge */}
                            {game.comingSoon && (
                                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-yellow-500/20 text-yellow-500 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border border-yellow-500/30 uppercase tracking-widest z-10">
                                    Coming Soon
                                </div>
                            )}

                            {/* Game Icon */}
                            <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 sm:mb-3 md:mb-4 text-center">
                                {game.image}
                            </div>

                            {/* Game Info */}
                            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">
                                {game.title}
                            </h3>
                            <p className="text-white/60 mb-2 sm:mb-3 md:mb-4 text-[11px] sm:text-xs md:text-sm">
                                {game.description}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-white/60">
                                    <span>👥</span>
                                    <span>{game.players} players</span>
                                </div>
                                <span className={`px-1.5 py-0.5 sm:px-2 md:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-medium border ${getDifficultyColor(game.difficulty)}`}>
                                    {game.difficulty}
                                </span>
                            </div>

                            {/* Play Button */}
                            {isConnected ? (
                                <button 
                                    onClick={() => handlePlay(game)}
                                    disabled={game.comingSoon}
                                    className={`w-full px-3 py-2 sm:px-4 md:px-6 sm:py-2.5 md:py-3 rounded-lg font-semibold transition-all text-xs sm:text-sm md:text-base ${game.comingSoon
                                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:shadow-lg hover:shadow-purple-600/40'}`}
                                >
                                    {game.comingSoon ? 'Coming Soon' : 'Play Now'}
                                </button>
                            ) : (
                                <div className="text-center">
                                    <p className="text-[10px] sm:text-xs md:text-sm text-white/60 mb-1 sm:mb-2">Sign in to play</p>
                                    <Link
                                        to="/"
                                        className="inline-block bg-gradient-to-r from-purple-600 to-purple-800 text-white px-3 py-1.5 sm:px-4 md:px-6 sm:py-2 md:py-2 rounded-lg font-medium text-[11px] sm:text-xs md:text-sm hover:shadow-lg hover:shadow-purple-600/40 transition-all no-underline"
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* No Games Message */}
                {filteredGames.length === 0 && (
                    <div className="text-center py-12 sm:py-16">
                        <p className="text-lg sm:text-xl md:text-2xl text-white/60">
                            No games found in this category
                        </p>
                    </div>
                )}

                {/* Coming Soon Section */}
                <div className="mt-8 sm:mt-12 md:mt-16 text-center glass rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
                        More Games Coming Soon! 🎉
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-white/70 max-w-2xl mx-auto">
                        We're constantly adding new mini games to keep you entertained.
                        Check back regularly for updates!
                    </p>
                </div>
            </div>
        </div>
    );
}

export default MiniGames;
