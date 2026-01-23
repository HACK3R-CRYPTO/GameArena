import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, ERC20_ABI, GAME_LOTTERY_ABI } from '../config/contracts';
import { formatUnits, parseUnits } from 'viem';

const Lottery = () => {
    // Coming Soon Flag
    const COMING_SOON = true;

    if (COMING_SOON) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass p-6 sm:p-8 md:p-12 rounded-2xl text-center border border-white/10 max-w-xs sm:max-w-sm md:max-w-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 z-0"></div>
                    <div className="relative z-10">
                        <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 animate-bounce">🚧</div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 text-gradient">Coming Soon</h2>
                        <p className="text-white/60 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg leading-relaxed">
                            The Diamond Lottery is currently under maintenance. 
                            <br className="hidden sm:inline"/>We're making improvements to ensure a fair and exciting experience!
                        </p>
                        <div className="inline-block px-4 py-2 sm:px-6 sm:py-2 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs sm:text-sm font-mono">
                            ETA: TBD
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { address, isConnected } = useAccount();
    const [ticketCount, setTicketCount] = useState(1);
    
    // Read Diamond Balance for player
    const { data: diamondBalance } = useReadContract({
        address: CONTRACT_ADDRESSES.DIAMOND_TOKEN,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    });

    // Read Ticket Price
    const { data: ticketPrice } = useReadContract({
        address: CONTRACT_ADDRESSES.GAME_LOTTERY,
        abi: GAME_LOTTERY_ABI,
        functionName: 'ticketPrice',
    });

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // Handle Allowance (simplified for hackathon: check if enough, otherwise approve)
    // In a real app, we'd have a separate Approve button or a multi-step flow
    const handleEnterLottery = async () => {
        if (!ticketPrice) return;
        
        const totalCost = BigInt(ticketCount) * ticketPrice;
        
        // Step 1: Approve (For hackathon, we assume the user knows they need to approve or we'd handle it here)
        // Since we want a smooth UI, let's just trigger the enterLottery and let wagmi/wallet handle errors if not approved
        writeContract({
            address: CONTRACT_ADDRESSES.GAME_LOTTERY,
            abi: GAME_LOTTERY_ABI,
            functionName: 'enterLottery',
            args: [BigInt(ticketCount)],
        });
    };

    const handleApprove = async () => {
        if (!ticketPrice) return;
        const totalCost = BigInt(ticketCount) * ticketPrice;
        
        writeContract({
            address: CONTRACT_ADDRESSES.DIAMOND_TOKEN,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONTRACT_ADDRESSES.GAME_LOTTERY, totalCost],
        });
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="glass p-12 rounded-2xl text-center border border-white/10 max-w-md">
                    <h2 className="text-3xl font-bold text-white mb-4">Connect Wallet</h2>
                    <p className="text-white/60 mb-8">Please connect your wallet to participate in the lottery.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gradient mb-4">💎 Diamond Lottery</h1>
                    <p className="text-xl text-white/70">Win Gold, Diamonds, and Rare Game Assets!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Entry Card */}
                    <div className="glass rounded-3xl p-8 border border-white/10 flex flex-col items-center">
                        <div className="text-6xl mb-6">🎟️</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Buy Tickets</h2>
                        <p className="text-white/60 mb-8 text-center">
                            Each ticket costs <span className="text-blue-400 font-bold">{ticketPrice ? formatUnits(ticketPrice, 18) : '10'} DIAMONDS</span>
                        </p>

                        <div className="flex items-center gap-4 mb-8">
                            <button 
                                onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                            >
                                -
                            </button>
                            <span className="text-3xl font-bold text-white w-12 text-center">{ticketCount}</span>
                            <button 
                                onClick={() => setTicketCount(ticketCount + 1)}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                            >
                                +
                            </button>
                        </div>

                        <div className="w-full space-y-4">
                            <button
                                onClick={handleApprove}
                                disabled={isPending || isConfirming}
                                className="w-full py-4 rounded-xl font-bold text-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all disabled:opacity-50"
                            >
                                1. Approve Diamonds
                            </button>
                            <button
                                onClick={handleEnterLottery}
                                disabled={isPending || isConfirming || isSuccess}
                                className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/40 transition-all disabled:opacity-50"
                            >
                                {isPending ? 'Signing...' : isConfirming ? 'Rolling...' : isSuccess ? 'Success!' : '2. Spin the Wheel!'}
                            </button>
                        </div>

                        {error && (
                            <p className="mt-4 text-red-400 text-sm text-center">
                                {error.message.includes('insufficient funds') ? 'Insufficient Diamonds' : 'Transaction failed'}
                            </p>
                        )}
                    </div>

                    {/* Info Card */}
                    <div className="space-y-6">
                        <div className="glass rounded-3xl p-6 border border-white/10">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                💰 Your Balance
                            </h3>
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="text-white/60">Diamonds</span>
                                <span className="text-xl font-bold text-blue-400">
                                    {diamondBalance ? formatUnits(diamondBalance, 18) : '0'} 💎
                                </span>
                            </div>
                        </div>

                        <div className="glass rounded-3xl p-6 border border-white/10">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                🎁 Possible Prizes
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="flex items-center gap-2">🪙 Gold Jackpot</span>
                                    <span className="text-yellow-500 font-bold">500 GOLD</span>
                                </li>
                                <li className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="flex items-center gap-2">💎 Diamond Refund</span>
                                    <span className="text-blue-400 font-bold">20 DIAMOND</span>
                                </li>
                                <li className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="flex items-center gap-2">🔫 Plasma Rifle</span>
                                    <span className="text-purple-400 font-bold">WEAPON</span>
                                </li>
                                <li className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="flex items-center gap-2">⚔️ Cyber Sword</span>
                                    <span className="text-purple-400 font-bold">WEAPON</span>
                                </li>
                                <li className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="flex items-center gap-2">👕 Neon Skin</span>
                                    <span className="text-pink-400 font-bold">SKIN</span>
                                </li>
                            </ul>
                        </div>

                        <div className="glass rounded-3xl p-6 border border-white/10 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                            <h3 className="text-lg font-bold text-white mb-2">Fair Play Guarantee</h3>
                            <p className="text-sm text-white/60">
                                All rolls are processed on-chain using transparent randomness. Your chances are equal every time you spin!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Lottery;
