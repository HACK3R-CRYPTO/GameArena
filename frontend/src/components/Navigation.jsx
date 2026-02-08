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
    <nav className="fixed top-0 left-0 right-0 z-50 px-1 py-1.5 sm:px-2 md:px-4 sm:py-2 md:py-4">
      <div className="w-full max-w-sm px-2 py-1.5 mx-auto border shadow-lg bg-black/40 backdrop-blur-md border-white/10 rounded-lg sm:max-w-md md:max-w-4xl lg:max-w-6xl xl:max-w-7xl sm:px-3 md:px-6 sm:py-2 md:py-3 sm:rounded-xl md:rounded-2xl">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 md:gap-4 lg:gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0 min-w-0 gap-1 text-sm font-bold no-underline transition-transform sm:gap-2 sm:text-lg md:text-xl hover:scale-105">
            <span className="text-lg sm:text-2xl md:text-3xl">⚔️</span>
            <span className="hidden text-xs truncate text-gradient xs:inline sm:inline sm:text-sm md:text-base">ArenaAgent</span>
          </Link>

          {/* Desktop Navigation - Improved responsive breakpoints */}
          <div className="items-center justify-center flex-1 hidden gap-1 lg:flex xl:gap-2 max-w-[60%] xl:max-w-[70%]">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-2 xl:px-4 py-1.5 xl:py-2 rounded-lg font-medium transition-all no-underline text-sm xl:text-base whitespace-nowrap ${isActivePath(link.path)
                  ? 'text-white bg-white/10 border border-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Tablet Navigation - Hidden on mobile, shown on medium screens */}
          <div className="items-center justify-center flex-1 hidden md:flex lg:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-2 py-1.5 rounded-lg font-medium transition-all no-underline text-xs whitespace-nowrap ${isActivePath(link.path)
                  ? 'text-white bg-white/10 border border-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Authentication Section - Responsive */}
          <div className="items-center flex-shrink-0 hidden gap-2 md:gap-3 md:flex">
            {isConnected ? (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-2 border rounded-lg glass border-white/10">
                  <span className="font-mono text-xs font-medium truncate text-cyan-400 max-w-24 lg:max-w-32">
                    {displayName || formatAddress(address)}
                  </span>
                  <button
                    className="bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-1 md:px-3 md:py-1.5 rounded-md text-xs font-medium hover:bg-red-500/30 transition-all"
                    onClick={() => disconnect()}
                  >
                    <span className="hidden sm:inline">Logout</span>
                    <span className="inline sm:hidden">×</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="px-3 py-1.5 md:px-4 lg:px-5 md:py-2 font-medium text-white transition-all rounded-lg bg-gradient-to-r from-purple-600 to-purple-800 hover:shadow-lg hover:shadow-purple-600/40 text-xs md:text-sm"
                onClick={() => open()}
              >
                <span className="hidden sm:inline">Sign In</span>
                <span className="inline sm:hidden">Login</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button - Improved */}
          <button
            className="flex-shrink-0 p-1.5 text-white lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <svg 
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${mobileMenuOpen ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
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

      {/* Mobile Menu - Enhanced with animations and better responsive design */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen 
            ? 'max-h-[500px] opacity-100' 
            : 'max-h-0 opacity-0'
        } md:block lg:hidden`}
      >
        <div className="w-full max-w-sm p-3 mx-auto mt-2 border shadow-lg bg-black/40 backdrop-blur-md border-white/10 rounded-xl sm:max-w-md md:max-w-4xl sm:p-4 md:rounded-2xl">
          <div className="flex flex-col gap-1 mb-3 sm:gap-2 sm:mb-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 sm:px-4 sm:py-3 rounded-lg font-medium transition-all no-underline text-xs sm:text-sm md:text-base ${isActivePath(link.path)
                  ? 'text-white bg-purple-600/20 border border-purple-600/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Authentication Section */}
          <div className="pt-2 border-t sm:pt-3 border-white/10">
            {isConnected ? (
              <div className="flex flex-col gap-2 p-3 border rounded-lg sm:gap-3 sm:p-4 bg-white/5 border-white/10">
                <div className="flex items-center justify-between">
                  <span className="flex-1 mr-2 font-mono text-[10px] font-medium truncate sm:text-xs text-cyan-400">
                    {displayName || formatAddress(address)}
                  </span>
                  <span className="px-2 py-1 text-[10px] text-green-400 border rounded-full bg-green-500/20 border-green-500/30">
                    Connected
                  </span>
                </div>
                <button
                  className="w-full px-3 py-2 text-[11px] font-medium text-red-400 transition-all border rounded-md sm:px-4 sm:py-2 sm:text-sm bg-red-500/20 border-red-500/30 hover:bg-red-500/30"
                  onClick={() => {
                    disconnect();
                    setMobileMenuOpen(false);
                  }}
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <button
                className="w-full px-4 py-3 text-xs font-medium text-white transition-all rounded-lg sm:px-6 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:shadow-lg hover:shadow-purple-600/40 sm:text-sm md:text-base"
                onClick={() => {
                  open();
                  setMobileMenuOpen(false);
                }}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
