import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { caipAddress } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (caipAddress && isConnected) {
      // Extract email or identifier from CAIP address
      // CAIP format: eip155:1:0x... or email format
      const parts = caipAddress.split(':');
      if (parts.length > 2) {
        const identifier = parts[parts.length - 1];
        // Check if it looks like an email
        if (identifier.includes('@')) {
          setDisplayName(identifier);
        } else if (identifier.startsWith('0x')) {
          // It's a wallet address, format it
          setDisplayName(`${identifier.slice(0, 6)}...${identifier.slice(-4)}`);
        } else {
          // Use the identifier as-is (might be a username)
          setDisplayName(identifier);
        }
      } else if (address) {
        // Fallback to formatted address
        setDisplayName(`${address.slice(0, 6)}...${address.slice(-4)}`);
      }
    }
  }, [caipAddress, address, isConnected]);

  // Close mobile menu when resizing to larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isActivePath = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const navLinks = [
    { path: '/', label: 'Arena' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
      <div className="max-w-7xl mx-auto glass-panel rounded-2xl px-6 py-3 border border-white/5 shadow-[0_0_15px_rgba(0,123,255,0.1)]">
        <div className="flex items-center justify-between">

          {/* Logo Area */}
          <Link to="/" className="flex items-center gap-3 group no-underline">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 group-hover:shadow-[0_0_15px_rgba(0,212,255,0.4)] transition-all duration-300">
              <span className="text-2xl animate-pulse-glow">⚔️</span>
            </div>
            <div className="flex flex-col">
              <span className="font-cyber text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:to-cyan-300 transition-all">
                ARENA AGENT
              </span>
              <span className="text-[10px] text-cyan-500/60 font-mono tracking-widest uppercase">EIP-8004 Powered</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 rounded-lg font-cyber text-sm tracking-wide transition-all duration-300 ${isActivePath(link.path)
                  ? 'text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(0,212,255,0.2)] border border-cyan-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="font-mono text-xs text-cyan-300 truncate max-w-[120px]">
                    {displayName || formatAddress(address)}
                  </span>
                </div>
                <button
                  className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  onClick={() => disconnect()}
                  title="Disconnect"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            ) : (
              <button
                className="btn-cyber px-6 py-2 rounded-lg text-sm font-bold shadow-[0_0_20px_rgba(0,212,255,0.15)] hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]"
                onClick={() => open()}
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className={`w-6 h-6 transition-transform duration-300 ${mobileMenuOpen ? 'rotate-90' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden absolute left-4 right-4 top-[80px] transition-all duration-300 ease-out origin-top ${mobileMenuOpen
            ? 'transform scale-y-100 opacity-100 visible'
            : 'transform scale-y-95 opacity-0 invisible'
          }`}
      >
        <div className="glass-panel p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-cyan-500/20">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-3 rounded-lg font-cyber text-sm ${isActivePath(link.path)
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            {isConnected ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-3 py-2 bg-black/40 rounded-lg border border-white/5">
                  <span className="font-mono text-sm text-cyan-300">{displayName || formatAddress(address)}</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(0,255,136,0.6)]"></div>
                </div>
                <button
                  className="w-full py-2.5 rounded-lg border border-red-500/30 text-red-400 font-cyber text-xs uppercase tracking-wider hover:bg-red-500/10 transition-colors"
                  onClick={() => { disconnect(); setMobileMenuOpen(false); }}
                >
                  Disconnect System
                </button>
              </div>
            ) : (
              <button
                className="w-full btn-cyber py-3 rounded-lg font-bold"
                onClick={() => { open(); setMobileMenuOpen(false); }}
              >
                Connect Interface
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
