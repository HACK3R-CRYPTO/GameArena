import { createContext, useContext, useState, useEffect } from 'react';
import web3auth from '../config/web3auth';
import { ethers } from 'ethers';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [user, setUser] = useState(null);
    const [address, setAddress] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                // Check if web3auth instance exists
                if (!web3auth) {
                    console.warn("⚠️ Web3Auth Client ID not configured. Social login is disabled.");
                    console.info("📋 To enable social login:");
                    console.info("1. Get your Client ID from https://dashboard.web3auth.io");
                    console.info("2. Create a .env file with: VITE_WEB3AUTH_CLIENT_ID=your_client_id");
                    console.info("3. Restart the dev server");
                    setIsLoading(false);
                    return;
                }

                console.log("🔄 Initializing Web3Auth...");
                await web3auth.init();
                setIsInitialized(true);
                console.log("✅ Web3Auth initialized successfully!");

                if (web3auth.connected) {
                    const web3authProvider = web3auth.provider;
                    setProvider(web3authProvider);

                    // Get user info
                    const userInfo = await web3auth.getUserInfo();
                    setUser(userInfo);

                    // Get wallet address
                    const ethersProvider = new ethers.BrowserProvider(web3authProvider);
                    const signer = await ethersProvider.getSigner();
                    const userAddress = await signer.getAddress();
                    setAddress(userAddress);
                    setIsConnected(true);
                }
            } catch (error) {
                console.error("❌ Error initializing Web3Auth:", error);
                console.info("💡 If you see initialization errors, make sure you have a valid Web3Auth Client ID configured.");
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, []);

    const login = async (loginProvider = null) => {
        try {
            // Check if web3auth instance exists
            if (!web3auth) {
                alert("⚠️ Web3Auth is not configured.\n\nTo enable social login:\n1. Get your Client ID from https://dashboard.web3auth.io\n2. Create a .env file with: VITE_WEB3AUTH_CLIENT_ID=your_client_id\n3. Restart the dev server");
                return { success: false, error: "Web3Auth not configured" };
            }

            // Check if Web3Auth is initialized
            if (!isInitialized) {
                console.warn("⚠️ Web3Auth is still initializing. Please wait a moment and try again.");
                alert("Web3Auth is still initializing. Please wait a moment and try again.");
                return { success: false, error: "Web3Auth not initialized yet" };
            }

            setIsLoading(true);
            console.log("🔐 Opening Web3Auth login modal...");
            console.log("💡 If a popup doesn't open, check your popup blocker!");

            const web3authProvider = await web3auth.connect();

            if (!web3authProvider) {
                throw new Error("No provider returned from Web3Auth. Login may have been cancelled or popup was blocked.");
            }

            setProvider(web3authProvider);

            // Get user info
            const userInfo = await web3auth.getUserInfo();
            setUser(userInfo);
            console.log("👤 User info:", userInfo);

            // Get wallet address
            const ethersProvider = new ethers.BrowserProvider(web3authProvider);
            const signer = await ethersProvider.getSigner();
            const userAddress = await signer.getAddress();
            setAddress(userAddress);
            setIsConnected(true);

            console.log("✅ Login successful! Address:", userAddress);
            console.log("🎉 Welcome,", userInfo.name || userInfo.email || "User!");

            return { success: true, address: userAddress };
        } catch (error) {
            console.error("❌ Error during login:", error);

            // Provide user-friendly error messages
            let userMessage = "Login failed. ";

            if (error.message?.includes("popup") || error.message?.includes("blocked")) {
                userMessage += "Please allow popups for this site and try again.";
            } else if (error.message?.includes("cancelled") || error.message?.includes("closed")) {
                userMessage += "Login was cancelled.";
            } else if (error.message?.includes("localhost")) {
                userMessage += "Make sure you've whitelisted http://localhost:5173 in your Web3Auth dashboard.";
            } else {
                userMessage += error.message || "Please try again.";
            }

            console.warn("💡 Troubleshooting tips:");
            console.warn("1. Check if popups are blocked");
            console.warn("2. Ensure http://localhost:5173 is whitelisted in Web3Auth dashboard");
            console.warn("3. Try a different browser if issues persist");

            alert(userMessage);

            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            if (web3auth) {
                await web3auth.logout();
            }
            setProvider(null);
            setUser(null);
            setAddress(null);
            setIsConnected(false);
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    const getBalance = async () => {
        if (!provider) return null;

        try {
            const ethersProvider = new ethers.BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const balance = await ethersProvider.getBalance(signer.address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error("Error getting balance:", error);
            return null;
        }
    };

    const value = {
        provider,
        user,
        address,
        isConnected,
        isLoading,
        login,
        logout,
        getBalance,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
