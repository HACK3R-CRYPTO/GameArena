import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/appkit';

import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import TournamentBrowser from './pages/TournamentBrowser';
import CreateTournament from './pages/CreateTournament';
import TournamentDetails from './pages/TournamentDetails';
import MyTournaments from './pages/MyTournaments';
import Leaderboard from './pages/Leaderboard';
import MiniGames from './pages/MiniGames';
import WaveDefenseGame from './pages/WaveDefenseGame';
import Profile from './pages/Profile';
import Lottery from './pages/Lottery';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0f1419]">
            <Navigation />
            <div className="pt-20">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/tournaments" element={<TournamentBrowser />} />
                <Route path="/mini-games" element={<MiniGames />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/lottery" element={<Lottery />} />
                <Route path="/play/:id" element={<WaveDefenseGame />} />
                <Route path="/play-solo" element={<WaveDefenseGame />} />
                <Route path="/create-tournament" element={<CreateTournament />} />
                <Route path="/tournament/:id" element={<TournamentDetails />} />
                <Route path="/my-tournaments" element={<MyTournaments />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Routes>
            </div>
          </div>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
