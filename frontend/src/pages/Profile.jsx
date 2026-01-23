import React, { useState, useMemo } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES, ERC20_ABI, GAME_ASSETS_ABI } from '../config/contracts';
import { formatUnits } from 'viem';

// Available Skins Configuration (Synced with Game)
const AVAILABLE_SKINS = [
    { id: 0, name: 'Default', type: 'Skin', rarity: 'Common', image: '🔵', stats: { speed: 0, health: 0, damage: 0, desc: 'Balanced' } },
    { id: 101, name: 'Basic Scout', type: 'Skin', rarity: 'Common', image: '👤', stats: { speed: 2, health: -10, damage: 0, desc: '+Speed, -Health' } },
    { id: 3, name: 'Neon Ninja', type: 'Skin', rarity: 'Epic', image: '🥷', stats: { speed: 4, health: -15, damage: 2, desc: '++Speed, +Damage' } },
    { id: 103, name: 'Cyber Punk', type: 'Skin', rarity: 'Rare', image: '🤖', stats: { speed: -1, health: 60, damage: 1, desc: '+Health, +Damage' } },
];

// Available Weapons Configuration
const AVAILABLE_WEAPONS = [
    { id: 0, name: 'Starter Pistol', type: 'Weapon', rarity: 'Common', image: '🔫', stats: { fireRate: 400, damage: 5, color: '#fbbf24', radius: 5, desc: 'Standard Issue' } },
    { id: 1, name: 'Plasma Rifle', type: 'Weapon', rarity: 'Rare', image: '🧬', stats: { fireRate: 150, damage: 3, color: '#3b82f6', radius: 4, desc: 'Rapid Fire' } },
    { id: 4, name: 'Void Cannon', type: 'Weapon', rarity: 'Epic', image: '🔮', stats: { fireRate: 800, damage: 20, color: '#8b5cf6', radius: 12, desc: 'High Damage, Slow' } },
    { id: 2, name: 'Cyber Sword', type: 'Weapon', rarity: 'Epic', image: '⚔️', stats: { fireRate: 600, damage: 40, color: '#10b981', radius: 30, desc: 'Melee Energy Wave' } },
];

const Profile = () => {
    const { address, isConnected } = useAccount();
    const { writeContract, data: hash } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    // Mock Owner Check (Replace with actual owner check if needed)
    const isOwner = true; 

    const handleMintGold = () => {
        writeContract({
            address: CONTRACT_ADDRESSES.GOLD_TOKEN,
            abi: ERC20_ABI,
            functionName: 'mint',
            args: [address, BigInt(1000 * 10**18)],
        });
    };

    const handleMintDiamonds = () => {
        writeContract({
            address: CONTRACT_ADDRESSES.DIAMOND_TOKEN,
            abi: ERC20_ABI,
            functionName: 'mint',
            args: [address, BigInt(100 * 10**18)],
        });
    };

    const handleMintSkin = (skin) => {
        writeContract({
            address: CONTRACT_ADDRESSES.GAME_ASSETS,
            abi: GAME_ASSETS_ABI,
            functionName: 'mintAsset',
            args: [address, BigInt(skin.id), BigInt(1), skin.name, BigInt(2), "0x"], // AssetType 2 = Skin
        });
    };

    const handleMintWeapon = (weapon) => {
        writeContract({
            address: CONTRACT_ADDRESSES.GAME_ASSETS,
            abi: GAME_ASSETS_ABI,
            functionName: 'mintAsset',
            args: [address, BigInt(weapon.id), BigInt(1), weapon.name, BigInt(1), "0x"], // AssetType 1 = Weapon
        });
    };

    // Read Gold Balance
    const { data: goldBalance } = useReadContract({
        address: CONTRACT_ADDRESSES.GOLD_TOKEN,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    });

    // Read Diamond Balance
    const { data: diamondBalance } = useReadContract({
        address: CONTRACT_ADDRESSES.DIAMOND_TOKEN,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    });

    // Fetch Skin Balances
    const { data: skinBalances, refetch: refetchSkins } = useReadContracts({
        contracts: AVAILABLE_SKINS.map(skin => ({
            address: CONTRACT_ADDRESSES.GAME_ASSETS,
            abi: GAME_ASSETS_ABI,
            functionName: 'balanceOf',
            args: [address, BigInt(skin.id)],
        })),
        query: { enabled: !!address }
    });

    // Fetch Weapon Balances
    const { data: weaponBalances, refetch: refetchWeapons } = useReadContracts({
        contracts: AVAILABLE_WEAPONS.map(weapon => ({
            address: CONTRACT_ADDRESSES.GAME_ASSETS,
            abi: GAME_ASSETS_ABI,
            functionName: 'balanceOf',
            args: [address, BigInt(weapon.id)],
        })),
        query: { enabled: !!address }
    });

    // Compute Owned Skins
    const mySkins = useMemo(() => {
        if (!skinBalances) return [AVAILABLE_SKINS[0]];
        const owned = [AVAILABLE_SKINS[0]];
        AVAILABLE_SKINS.forEach((skin, index) => {
            if (skin.id === 0) return;
            const result = skinBalances[index];
            if (result && result.status === 'success' && result.result > 0n) {
                owned.push(skin);
            }
        });
        return [...new Set(owned)]; // Dedupe
    }, [skinBalances]);

    // Compute Owned Weapons
    const myWeapons = useMemo(() => {
        if (!weaponBalances) return [AVAILABLE_WEAPONS[0]];
        const owned = [AVAILABLE_WEAPONS[0]];
        AVAILABLE_WEAPONS.forEach((weapon, index) => {
            if (weapon.id === 0) return;
            const result = weaponBalances[index];
            if (result && result.status === 'success' && result.result > 0n) {
                owned.push(weapon);
            }
        });
        return [...new Set(owned)]; // Dedupe
    }, [weaponBalances]);

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="glass p-12 rounded-2xl text-center border border-white/10 max-w-md">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4">Connect Wallet</h2>
                    <p className="text-white/60 mb-8">Please connect your wallet to view your inventory and profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Profile Header */}
                <div className="glass rounded-3xl p-8 mb-8 border border-white/10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-5xl border-4 border-white/20">
                        👤
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
                        <p className="text-white/60 font-mono text-sm break-all">{address}</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="glass p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
                            <p className="text-sm text-yellow-500 font-bold mb-1">GOLD</p>
                            <p className="text-2xl font-bold text-white">{goldBalance ? formatUnits(goldBalance, 18) : '0'}</p>
                        </div>
                        <div className="glass p-4 rounded-2xl border border-white/10 text-center min-w-[120px]">
                            <p className="text-sm text-blue-400 font-bold mb-1">DIAMONDS</p>
                            <p className="text-2xl font-bold text-white">{diamondBalance ? formatUnits(diamondBalance, 18) : '0'}</p>
                        </div>
                    </div>
                </div>

                {/* Inventory Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Weapons */}
                    <div className="glass rounded-3xl p-8 border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                🔫 Weapons
                            </h2>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/60 border border-white/10">
                                {myWeapons.length} Items
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {myWeapons.length > 0 ? myWeapons.map(weapon => (
                                <div key={weapon.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-blue-500/50 transition-all group">
                                    <div className="text-4xl mb-3 text-center group-hover:scale-110 transition-transform">{weapon.image}</div>
                                    <h3 className="text-lg font-bold text-white mb-1">{weapon.name}</h3>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-white/40">{weapon.type}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                            weapon.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' :
                                            weapon.rarity === 'Rare' ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' : 
                                            'border-white/10 text-white/40'
                                        }`}>
                                            {weapon.rarity}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-[10px] text-white/40 text-center">
                                        {weapon.stats.desc}
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 text-center text-white/40 py-8">
                                    No weapons owned. Use the Dev Tools below to mint some!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Skins */}
                    <div className="glass rounded-3xl p-8 border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                👕 Skins
                            </h2>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/60 border border-white/10">
                                {mySkins.length} Items
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {mySkins.length > 0 ? mySkins.map(skin => (
                                <div key={skin.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-purple-500/50 transition-all group">
                                    <div className="text-4xl mb-3 text-center group-hover:scale-110 transition-transform">{skin.image}</div>
                                    <h3 className="text-lg font-bold text-white mb-1">{skin.name}</h3>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-white/40">{skin.type}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                            skin.rarity === 'Epic' ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' :
                                            skin.rarity === 'Rare' ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' : 
                                            'border-white/10 text-white/40'
                                        }`}>
                                            {skin.rarity}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 text-center text-white/40 py-8">
                                    No skins owned. Use the Dev Tools below to mint some!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dev Tools (Only for Owner) */}
                {isOwner && (
                    <div className="glass rounded-3xl p-8 border border-yellow-500/30 bg-yellow-500/5">
                        <h2 className="text-2xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
                            🛠️ Developer Tools
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                                <h3 className="text-white font-bold mb-2">Currency Faucet</h3>
                                <p className="text-sm text-white/50 mb-4">Mint testnet tokens for yourself</p>
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={handleMintGold}
                                        className="w-full py-2 px-4 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500/50 rounded-xl transition-all font-bold text-sm"
                                    >
                                        Mint 1000 GOLD
                                    </button>
                                    <button 
                                        onClick={handleMintDiamonds}
                                        className="w-full py-2 px-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 rounded-xl transition-all font-bold text-sm"
                                    >
                                        Mint 100 DIAMONDS
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/20 p-6 rounded-2xl border border-white/5 col-span-2">
                                <h3 className="text-white font-bold mb-2">Asset Minter</h3>
                                <p className="text-sm text-white/50 mb-4">Mint specific skins/weapons for testing</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {AVAILABLE_SKINS.map(skin => (
                                        <button 
                                            key={skin.id}
                                            onClick={() => handleMintSkin(skin)}
                                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex flex-col items-center gap-2"
                                        >
                                            <span className="text-2xl">{skin.image}</span>
                                            <span className="text-xs text-white/70">{skin.name}</span>
                                        </button>
                                    ))}
                                    {AVAILABLE_WEAPONS.map(weapon => (
                                        <button 
                                            key={weapon.id}
                                            onClick={() => handleMintWeapon(weapon)}
                                            className="p-3 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-xl transition-all flex flex-col items-center gap-2"
                                        >
                                            <span className="text-2xl">{weapon.image}</span>
                                            <span className="text-xs text-white/70">{weapon.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
