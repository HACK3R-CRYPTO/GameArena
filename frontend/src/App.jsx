import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/appkit';
import { Toaster } from 'react-hot-toast';

import Navigation from './components/Navigation';
import ArenaGame from './pages/ArenaGame';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: 'rgba(13, 13, 25, 0.9)',
            border: '1px solid rgba(0, 212, 255, 0.1)',
            color: '#fff',
            fontFamily: 'Orbitron, sans-serif',
          },
        }} />
        <Router>
          <div className="min-h-screen relative overflow-hidden bg-[#050510] text-gray-200 selection:bg-cyan-500/30">
            {/* Animated Background Grid */}
            <div className="cyber-grid"></div>
            <div className="particle-bg absolute inset-0 z-0"></div>

            <Navigation />

            <div className="relative z-10 pt-24 px-4 pb-12">
              <Routes>
                <Route path="/" element={<ArenaGame />} />
                <Route path="/arena" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
