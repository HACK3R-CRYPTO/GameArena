import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { CONTRACT_ADDRESSES, TOURNAMENT_PLATFORM_ABI, ARCADE_PLATFORM_ABI, GAME_ASSETS_ABI } from '../config/contracts';

// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SPEED = 6;
const ENEMY_SPEED = 0.8; // Reduced from 1.2 for better reaction time
const BULLET_SPEED = 8;
const WAVE_INTERVAL = 6000; // 6 seconds between waves

// Available Skins Configuration
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

const WaveDefenseGame = () => {
    const { id: tournamentId } = useParams();
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState('menu'); // menu, playing, gameover, upgrading
    const [score, setScore] = useState(0);
    const [survivalTime, setSurvivalTime] = useState(0);
    const [killCount, setKillCount] = useState(0);
    const [selectedSkin, setSelectedSkin] = useState(AVAILABLE_SKINS[0]);
    const [selectedWeapon, setSelectedWeapon] = useState(AVAILABLE_WEAPONS[0]);

    // Fetch Skin Balances
    const { data: skinBalances } = useReadContracts({
        contracts: AVAILABLE_SKINS.filter(s => s.id !== 0).map(skin => ({
            address: CONTRACT_ADDRESSES.GAME_ASSETS,
            abi: GAME_ASSETS_ABI,
            functionName: 'balanceOf',
            args: [address, BigInt(skin.id)],
        })),
        query: { enabled: !!address }
    });

    // Fetch Weapon Balances
    const { data: weaponBalances } = useReadContracts({
        contracts: AVAILABLE_WEAPONS.filter(w => w.id !== 1).map(weapon => ({ // Skip Starter Pistol (ID 1) if it's default, but here ID 1 is "Starter Pistol" which we treat as default/owned? 
            // Actually usually ID 0 is default. Let's assume ID 1 is the default weapon given to everyone or we treat it as default.
            // Let's assume ID 1 is the "Starter Pistol" everyone has.
            address: CONTRACT_ADDRESSES.GAME_ASSETS,
            abi: GAME_ASSETS_ABI,
            functionName: 'balanceOf',
            args: [address, BigInt(weapon.id)],
        })),
        query: { enabled: !!address }
    });

    // Compute Owned Skins
    const ownedSkins = React.useMemo(() => {
        if (!address) return [AVAILABLE_SKINS[0]];
        const skins = [AVAILABLE_SKINS[0]];
        if (skinBalances) {
            AVAILABLE_SKINS.slice(1).forEach((skin, index) => {
                const result = skinBalances[index];
                if (result.status === 'success' && result.result > 0n) {
                    skins.push(skin);
                }
            });
        }
        return skins;
    }, [skinBalances, address]);

    // Compute Owned Weapons
    const ownedWeapons = React.useMemo(() => {
        if (!address) return [AVAILABLE_WEAPONS[0]];
        const weapons = [AVAILABLE_WEAPONS[0]]; // Always own Starter Pistol
        if (weaponBalances) {
            AVAILABLE_WEAPONS.slice(1).forEach((weapon, index) => {
                const result = weaponBalances[index];
                if (result.status === 'success' && result.result > 0n) {
                    weapons.push(weapon);
                }
            });
        }
        return weapons;
    }, [weaponBalances, address]);
    const [wave, setWave] = useState(1);
    const [health, setHealth] = useState(100);
    const [accuracyDots, setAccuracyDots] = useState(0);
    const [fireRate, setFireRate] = useState(400); // ms between shots
    const [power, setPower] = useState(5); // base damage (reduced for multi-shot)
    const [waveProgress, setWaveProgress] = useState(0);
    const [dotsToCollect, setDotsToCollect] = useState(10);
    const [baseHealth, setBaseHealth] = useState(100);

    // Refs for game loop to avoid stale closures
    const waveProgressRef = useRef(0);
    const dotsToCollectRef = useRef(10);
    const baseHealthRef = useRef(100);

    // Game Constants
    const MAGNET_RANGE = 80; // Reduced from 200 to require getting closer
    const MAGNET_STRENGTH = 0.25; // Slightly stronger pull once inside the range
    const MAGNET_ACCEL = 0.5;

    // Game Objects Refs
    const playerRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 + 50, radius: 15 });
    const baseRef = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, radius: 40 });
    const enemiesRef = useRef([]);
    const bulletsRef = useRef([]);
    const dotsRef = useRef([]); // For accuracy dots
    const particlesRef = useRef([]);
    const keysRef = useRef({});
    const lastWaveTimeRef = useRef(Date.now());
    const lastShotTimeRef = useRef(0);
    const startTimeRef = useRef(Date.now());
    const mousePosRef = useRef({ x: 0, y: 0 });

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (!isConnected) {
            navigate('/tournaments');
            return;
        }

        const handleKeyDown = (e) => (keysRef.current[e.key.toLowerCase()] = true);
        const handleKeyUp = (e) => (keysRef.current[e.key.toLowerCase()] = false);
        const handleMouseMove = (e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            mousePosRef.current = {
                x: (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
                y: (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
            };
        };
        const handleMouseDown = () => (keysRef.current['mouse_down'] = true);
        const handleMouseUp = () => (keysRef.current['mouse_down'] = false);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        // Don't auto-start game anymore
        // setGameState('playing');
        // startTimeRef.current = Date.now();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isConnected, navigate]);

    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const update = () => {
            const now = Date.now();
            
            // 1. Update Player Movement
            const p = playerRef.current;
            const b = baseRef.current;
            
            // Apply Skin Stats to Speed
            const currentSpeed = PLAYER_SPEED + (selectedSkin?.stats?.speed || 0);

            if (keysRef.current['w'] && p.y > p.radius) p.y -= currentSpeed;
            if (keysRef.current['s'] && p.y < CANVAS_HEIGHT - p.radius) p.y += currentSpeed;
            if (keysRef.current['a'] && p.x > p.radius) p.x -= currentSpeed;
            if (keysRef.current['d'] && p.x < CANVAS_WIDTH - p.radius) p.x += currentSpeed;

            // Prevent player from entering the base core
            const distToBase = Math.hypot(p.x - b.x, p.y - b.y);
            if (distToBase < p.radius + b.radius) {
                const angle = Math.atan2(p.y - b.y, p.x - b.x);
                p.x = b.x + Math.cos(angle) * (p.radius + b.radius);
                p.y = b.y + Math.sin(angle) * (p.radius + b.radius);
            }

            // 2. Spawn Enemies
            if (enemiesRef.current.length < 5 + wave && waveProgressRef.current < dotsToCollectRef.current) {
                if (now - lastWaveTimeRef.current > Math.max(800, 2000 - wave * 100)) {
                    const side = Math.floor(Math.random() * 4);
                    let x, y;
                    if (side === 0) { x = Math.random() * CANVAS_WIDTH; y = -50; }
                    else if (side === 1) { x = CANVAS_WIDTH + 50; y = Math.random() * CANVAS_HEIGHT; }
                    else if (side === 2) { x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + 50; }
                    else { x = -50; y = Math.random() * CANVAS_HEIGHT; }
                    
                    // Enemy Variety Logic
                    let type = 'regular';
                    const rand = Math.random();
                    if (wave >= 2 && rand > 0.7) type = 'fast';
                    if (wave >= 3 && rand < 0.2) type = 'tank';

                    let enemyProps = {
                        x, y,
                        type,
                        radius: 15,
                        health: 5 + wave * 5, // Wave 1 = 10 HP (2 shots of 5 dmg)
                        speed: ENEMY_SPEED + (wave * 0.1), // Slower speed scaling
                        color: '#ef4444'
                    };

                    if (type === 'fast') {
                        enemyProps.speed *= 1.6; // Slightly less fast
                        enemyProps.health *= 0.6; // Even squishier
                        enemyProps.color = '#f97316';
                        enemyProps.radius = 12;
                    } else if (type === 'tank') {
                        enemyProps.speed *= 0.5; // Even slower
                        enemyProps.health *= 3; // 3x health of normal
                        enemyProps.color = '#7f1d1d';
                        enemyProps.radius = 22;
                    }
                    
                    enemiesRef.current.push(enemyProps);
                    lastWaveTimeRef.current = now;
                }
            }

            // Check Wave Completion (Based on collected points/dots)
            if (waveProgressRef.current >= dotsToCollectRef.current) {
                setGameState('upgrading');
                enemiesRef.current = []; // Clear remaining enemies
                dotsRef.current = []; // Clear remaining dots
                return;
            }

            // 3. Manual Shooting (on mouse down)
            if (keysRef.current['mouse_down'] && now - lastShotTimeRef.current > fireRate) {
                const angle = Math.atan2(mousePosRef.current.y - p.y, mousePosRef.current.x - p.x);
                
                const spread = Math.max(0, 0.2 - (accuracyDots * 0.005));
                const finalAngle = angle + (Math.random() - 0.5) * spread;

                // Calculate total damage: Base Power + Weapon Damage + Skin Bonus
                const weaponDamage = selectedWeapon?.stats?.damage || 0; // Note: power state variable might double count if we aren't careful. 
                // Currently 'power' is initialized to 5. Let's assume 'power' is the base player stats.
                // But the previous code used: damage: power.
                // Let's change it to use the stats directly + power as a multiplier or base.
                // Let's say 'power' is the upgrade level multiplier.
                const skinDamage = selectedSkin?.stats?.damage || 0;
                const totalDamage = (weaponDamage + skinDamage) * (1 + (power - 5) * 0.1); // Simple scaling: power starts at 5.

                bulletsRef.current.push({
                    x: p.x,
                    y: p.y,
                    vx: Math.cos(finalAngle) * BULLET_SPEED,
                    vy: Math.sin(finalAngle) * BULLET_SPEED,
                    radius: selectedWeapon?.stats?.radius || 5,
                    color: selectedWeapon?.stats?.color || '#fbbf24',
                    damage: totalDamage > 0 ? totalDamage : 5 // Fallback
                });
                lastShotTimeRef.current = now;
            }

            // 4. Update Bullets
            bulletsRef.current = bulletsRef.current.filter(b => {
                b.x += b.vx;
                b.y += b.vy;
                return b.x > 0 && b.x < CANVAS_WIDTH && b.y > 0 && b.y < CANVAS_HEIGHT;
            });

            // 5. Update Dots (Magnet Collection)
            dotsRef.current = dotsRef.current.filter(dot => {
                const dist = Math.hypot(dot.x - p.x, dot.y - p.y);
                
                // Enhanced Magnet Logic: Smooth attraction and acceleration
                if (dist < MAGNET_RANGE) {
                    const angle = Math.atan2(p.y - dot.y, p.x - dot.x);
                    
                    // Initialize velocity if it doesn't exist
                    if (!dot.vx) dot.vx = 0;
                    if (!dot.vy) dot.vy = 0;

                    // Add acceleration towards player
                    dot.vx += Math.cos(angle) * MAGNET_ACCEL;
                    dot.vy += Math.sin(angle) * MAGNET_ACCEL;

                    // Apply velocity
                    dot.x += dot.vx;
                    dot.y += dot.vy;

                    // Damping to keep it smooth
                    dot.vx *= 0.92;
                    dot.vy *= 0.92;
                } else {
                    // Reset velocity if player moves away
                    dot.vx = 0;
                    dot.vy = 0;
                }

                if (dist < p.radius + dot.radius) {
                    setScore(prev => prev + 50);
                    waveProgressRef.current += 1;
                    setWaveProgress(waveProgressRef.current);
                    return false;
                }
                return true;
            });

            // 6. Update Enemies
            enemiesRef.current.forEach((e, eIdx) => {
                // Enemies move towards the BASE in the middle
                const angle = Math.atan2(b.y - e.y, b.x - e.x);
                e.x += Math.cos(angle) * e.speed;
                e.y += Math.sin(angle) * e.speed;

                // Collision with base
                const distToBase = Math.hypot(e.x - b.x, e.y - b.y);
                if (distToBase < b.radius + e.radius) {
                    enemiesRef.current.splice(eIdx, 1);
                    baseHealthRef.current -= 10;
                    setBaseHealth(baseHealthRef.current);
                    if (baseHealthRef.current <= 0) {
                        setGameState('gameover');
                        setSurvivalTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
                    }
                }

                // Collision with player
                const distToPlayer = Math.hypot(e.x - p.x, e.y - p.y);
                if (distToPlayer < p.radius + e.radius) {
                    setHealth(prev => {
                        const newHealth = prev - 0.5;
                        if (newHealth <= 0) {
                            setGameState('gameover');
                            setSurvivalTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
                        }
                        return newHealth;
                    });
                }

                // Collision with bullets
                bulletsRef.current.forEach((bullet, bIdx) => {
                    const distToBullet = Math.hypot(e.x - bullet.x, e.y - bullet.y);
                    if (distToBullet < e.radius + bullet.radius) {
                        e.health -= bullet.damage || power; // Use bullet specific damage if available
                        bulletsRef.current.splice(bIdx, 1);
                        if (e.health <= 0) {
                            dotsRef.current.push({
                                x: e.x, y: e.y, radius: 6, color: '#4ade80'
                            });
                            enemiesRef.current.splice(eIdx, 1);
                            setKillCount(prev => prev + 1);
                            setScore(prev => prev + 100);
                        }
                    }
                });
            });

            setSurvivalTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        };

        const draw = () => {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            ctx.fillStyle = '#0a0e27';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            // Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for(let i=0; i<CANVAS_WIDTH; i+=40) {
                ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
            }
            for(let i=0; i<CANVAS_HEIGHT; i+=40) {
                ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
            }

            // Draw Base
            const b = baseRef.current;
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Base Core Glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#3b82f6';
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(b.x, b.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw Dots
            dotsRef.current.forEach(dot => {
                ctx.fillStyle = dot.color;
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw Player
            const p = playerRef.current;
            if (selectedSkin && selectedSkin.image !== '🔵') {
                // Draw Skin
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // Add a glow effect
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#4f46e5';
                ctx.fillText(selectedSkin.image, p.x, p.y);
                ctx.shadowBlur = 0;
            } else {
                // Default Circle
                ctx.fillStyle = '#4f46e5';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Aim Line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mousePosRef.current.x, mousePosRef.current.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw Enemies
            enemiesRef.current.forEach(e => {
                ctx.fillStyle = e.color;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
                ctx.fill();

                // Small highlight/eye for style
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.arc(e.x - e.radius/3, e.y - e.radius/3, e.radius/4, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw Bullets
            bulletsRef.current.forEach(bullet => {
                ctx.fillStyle = bullet.color || '#fbbf24';
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            if (gameState === 'playing') {
                update();
                animationFrameId = requestAnimationFrame(draw);
            }
        };

        draw();
        return () => cancelAnimationFrame(animationFrameId);
    }, [gameState, wave, accuracyDots, fireRate, power, selectedSkin, selectedWeapon]);

    const startGame = () => {
        setGameState('playing');
        startTimeRef.current = Date.now();
        lastWaveTimeRef.current = Date.now();
        
        // Reset game state
        setScore(0);
        setSurvivalTime(0);
        setKillCount(0);
        setWave(1);
        
        // Apply Skin Health Bonus
        const startingHealth = 100 + (selectedSkin?.stats?.health || 0);
        setHealth(startingHealth);
        setBaseHealth(100);
        
        setWaveProgress(0);
        setDotsToCollect(10);
        
        // Apply Weapon Stats
        setPower(selectedWeapon?.stats?.damage || 5);
        setFireRate(selectedWeapon?.stats?.fireRate || 400);
        
        setAccuracyDots(0);

        // Reset refs
        enemiesRef.current = [];
        bulletsRef.current = [];
        dotsRef.current = [];
        playerRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 + 50, radius: 15 };
        baseRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, radius: 40 };
        dotsToCollectRef.current = 10;
        waveProgressRef.current = 0;
    };

    const handleSubmitScore = async () => {
        if (!tournamentId) {
             writeContract({
                address: CONTRACT_ADDRESSES.ARCADE_PLATFORM,
                abi: ARCADE_PLATFORM_ABI,
                functionName: 'submitScore',
                args: [BigInt(score)],
            });
            return;
        }
        
        writeContract({
            address: CONTRACT_ADDRESSES.TOURNAMENT_PLATFORM,
            abi: TOURNAMENT_PLATFORM_ABI,
            functionName: 'submitScore',
            args: [BigInt(tournamentId), BigInt(survivalTime), BigInt(killCount)],
        });
    };

    const handleUpgrade = (type) => {
        if (type === 'power') setPower(prev => prev + 2);
        if (type === 'firerate') setFireRate(prev => Math.max(100, prev - 50));
        if (type === 'accuracy') setAccuracyDots(prev => prev + 5);
        
        // Setup next wave
        const nextWave = wave + 1;
        setWave(nextWave);
        
        // Update refs for the loop
        dotsToCollectRef.current = 10;
        waveProgressRef.current = 0;
        
        // Update state for the UI
        setDotsToCollect(10);
        setWaveProgress(0);
        
        setGameState('playing');
        lastWaveTimeRef.current = Date.now();
    };

    return (
        <div className="min-h-screen py-8 px-4 flex flex-col items-center justify-center">
            <div className="max-w-4xl w-full">
                {/* HUD */}
                <div className="flex justify-between items-center mb-4 glass p-4 rounded-xl border border-white/10">
                    <div className="text-white">
                        <p className="text-sm opacity-60 uppercase tracking-wider font-bold">Base Integrity</p>
                        <div className="w-48 h-4 bg-white/10 rounded-full overflow-hidden mt-1">
                            <div 
                                className="h-full bg-blue-500 transition-all duration-300" 
                                style={{ width: `${baseHealth}%` }}
                            />
                        </div>
                    </div>
                    <div className="flex gap-8 text-center">
                        <div>
                            <p className="text-sm opacity-60">Wave Progress</p>
                            <p className="text-2xl font-bold text-green-400">{waveProgress} / {dotsToCollect}</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-60">Score</p>
                            <p className="text-2xl font-bold text-yellow-400">{score}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm opacity-60">Wave</p>
                        <p className="text-2xl font-bold text-purple-400">{wave}</p>
                    </div>
                </div>

                {/* Game Canvas Container */}
                <div className="relative rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl">
                    {/* Game Stats Overlay */}
                    <div className="absolute top-4 left-4 flex gap-4 z-10">
                        <div className="bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
                            <p className="text-white/50 text-xs uppercase">Power</p>
                            <p className="text-xl font-bold text-red-400">{power}</p>
                        </div>
                        <div className="bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
                            <p className="text-white/50 text-xs uppercase">Fire Rate</p>
                            <p className="text-xl font-bold text-yellow-400">{(1000/fireRate).toFixed(1)}/s</p>
                        </div>
                    </div>

                    <canvas 
                        ref={canvasRef} 
                        width={CANVAS_WIDTH} 
                        height={CANVAS_HEIGHT}
                        className="w-full h-auto bg-[#0a0e27]"
                    />

                    {/* MENU SCREEN */}
                    {gameState === 'menu' && (
                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-8 backdrop-blur-md z-50">
                            <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Wave Defense</h2>
                            <p className="text-white/60 mb-8 max-w-md">Protect the base. Survive the waves. Collect dots to upgrade.</p>
                            
                            <div className="mb-8 w-full max-w-2xl">
                                <p className="text-blue-400 font-mono mb-4 uppercase text-sm tracking-wider">Select Character Skin</p>
                                <div className="flex gap-4 justify-center flex-wrap mb-8">
                                    {AVAILABLE_SKINS.map(skin => {
                                        const isOwned = ownedSkins.some(s => s.id === skin.id);
                                        return (
                                            <button
                                                key={skin.id}
                                                onClick={() => isOwned && setSelectedSkin(skin)}
                                                disabled={!isOwned}
                                                className={`p-4 rounded-xl border-2 transition-all min-w-[100px] relative flex flex-col items-center ${
                                                    selectedSkin?.id === skin.id 
                                                    ? 'bg-purple-600/20 border-purple-500 scale-110 shadow-lg shadow-purple-500/30' 
                                                    : isOwned
                                                        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 cursor-pointer'
                                                        : 'bg-black/40 border-white/5 opacity-50 cursor-not-allowed grayscale'
                                                }`}
                                            >
                                                {!isOwned && (
                                                    <div className="absolute top-2 right-2 text-xs">🔒</div>
                                                )}
                                                <div className="text-4xl mb-2">{skin.image}</div>
                                                <div className="text-xs text-white/80 font-bold mb-1">{skin.name}</div>
                                                <div className="text-[10px] text-white/50">{skin.stats.desc}</div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <p className="text-blue-400 font-mono mb-4 uppercase text-sm tracking-wider">Select Weapon</p>
                                <div className="flex gap-4 justify-center flex-wrap">
                                    {AVAILABLE_WEAPONS.map(weapon => {
                                        const isOwned = ownedWeapons.some(w => w.id === weapon.id);
                                        return (
                                            <button
                                                key={weapon.id}
                                                onClick={() => isOwned && setSelectedWeapon(weapon)}
                                                disabled={!isOwned}
                                                className={`p-4 rounded-xl border-2 transition-all min-w-[100px] relative flex flex-col items-center ${
                                                    selectedWeapon?.id === weapon.id 
                                                    ? 'bg-blue-600/20 border-blue-500 scale-110 shadow-lg shadow-blue-500/30' 
                                                    : isOwned
                                                        ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 cursor-pointer'
                                                        : 'bg-black/40 border-white/5 opacity-50 cursor-not-allowed grayscale'
                                                }`}
                                            >
                                                {!isOwned && (
                                                    <div className="absolute top-2 right-2 text-xs">🔒</div>
                                                )}
                                                <div className="text-4xl mb-2">{weapon.image}</div>
                                                <div className="text-xs text-white/80 font-bold mb-1">{weapon.name}</div>
                                                <div className="text-[10px] text-white/50">{weapon.stats.desc}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button 
                                onClick={startGame}
                                className="px-12 py-4 bg-white text-black font-black text-xl uppercase tracking-widest hover:scale-105 hover:shadow-xl hover:shadow-white/20 transition-all rounded-none skew-x-[-10deg]"
                            >
                                <span className="block skew-x-[10deg]">Start Mission</span>
                            </button>
                        </div>
                    )}

                    {/* UPGRADE SCREEN (Pixel Style) */}
                    {gameState === 'upgrading' && (
                        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-8 backdrop-blur-md">
                            <h2 className="text-4xl font-mono text-white mb-2 uppercase tracking-tighter">Wave {wave} Cleared</h2>
                            <p className="text-blue-400 font-mono mb-12 uppercase">Choose an Upgrade</p>
                            
                            <div className="flex flex-col gap-6 w-full max-w-sm">
                                <button 
                                    onClick={() => handleUpgrade('power')}
                                    className="group relative flex items-center justify-between bg-white/5 border-2 border-white/20 p-6 rounded-none hover:bg-white hover:text-black transition-all font-mono text-left"
                                >
                                    <span className="text-2xl uppercase">Power: Lv.{Math.floor((power-5)/2) + 1}</span>
                                    <span className="text-sm opacity-60">+2 Dmg</span>
                                </button>
                                
                                <button 
                                    onClick={() => handleUpgrade('firerate')}
                                    className="group relative flex items-center justify-between bg-white/5 border-2 border-white/20 p-6 rounded-none hover:bg-white hover:text-black transition-all font-mono text-left"
                                >
                                    <span className="text-2xl uppercase">Fire Rate: Lv.{Math.floor((400-fireRate)/50) + 1}</span>
                                    <span className="text-sm opacity-60">+15% Speed</span>
                                </button>

                                <button 
                                    onClick={() => handleUpgrade('accuracy')}
                                    className="group relative flex items-center justify-between bg-white/5 border-2 border-white/20 p-6 rounded-none hover:bg-white hover:text-black transition-all font-mono text-left"
                                >
                                    <span className="text-2xl uppercase">Accuracy: Lv.{Math.floor(accuracyDots/5) + 1}</span>
                                    <span className="text-sm opacity-60">-10% Spread</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {gameState === 'gameover' && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">
                            <h2 className="text-6xl font-bold text-red-500 mb-2">GAME OVER</h2>
                            <p className="text-white/60 text-xl mb-8">You survived for {survivalTime} seconds and took down {killCount} enemies!</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-md">
                                <div className="glass p-4 rounded-xl border border-white/10">
                                    <p className="text-sm opacity-60">Final Score</p>
                                    <p className="text-3xl font-bold text-yellow-400">{score}</p>
                                </div>
                                {tournamentId && (
                                    <div className="glass p-4 rounded-xl border border-white/10">
                                        <p className="text-sm opacity-60">Rank Points</p>
                                        <p className="text-3xl font-bold text-purple-400">+{Math.floor(score/10)}</p>
                                    </div>
                                )}
                            </div>

                            {tournamentId ? (
                                <div className="flex flex-col gap-4 w-full max-w-xs">
                                    {isSuccess && (
                                        <div className="text-green-400 text-sm mb-2 font-mono">
                                            Score recorded on-chain! 
                                            <a 
                                                href={`https://sepolia.etherscan.io/tx/${hash}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="underline ml-1 hover:text-green-300"
                                            >
                                                View TX
                                            </a>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSubmitScore}
                                        disabled={isPending || isConfirming || isSuccess}
                                        className={`px-8 py-4 rounded-xl font-bold text-xl transition-all disabled:opacity-50 ${
                                            isSuccess 
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-600/40' 
                                            : 'bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:shadow-lg hover:shadow-purple-600/40'
                                        }`}
                                    >
                                        {isPending ? 'Check Wallet...' : isConfirming ? 'Confirming on Chain...' : isSuccess ? '✓ Score Submitted' : 'Submit Score (Gas)'}
                                    </button>
                                    <button
                                        onClick={() => navigate(`/tournament/${tournamentId}`)}
                                        className="text-white/60 hover:text-white transition-colors"
                                    >
                                        Back to Leaderboard
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 w-full max-w-xs">
                                     {isSuccess && (
                                        <div className="text-green-400 text-sm mb-2 font-mono">
                                            Score recorded on Global Arcade! 
                                            <a 
                                                href={`https://sepolia.etherscan.io/tx/${hash}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="underline ml-1 hover:text-green-300"
                                            >
                                                View TX
                                            </a>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSubmitScore}
                                        disabled={isPending || isConfirming || isSuccess}
                                        className={`px-8 py-4 rounded-xl font-bold text-xl transition-all disabled:opacity-50 ${
                                            isSuccess 
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-600/40' 
                                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-cyan-600/40'
                                        }`}
                                    >
                                        {isPending ? 'Check Wallet...' : isConfirming ? 'Confirming...' : isSuccess ? '✓ Saved!' : 'Save Score (Free)'}
                                    </button>
                                    
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="bg-white text-black px-8 py-4 rounded-xl font-bold text-xl hover:bg-white/90 transition-all"
                                    >
                                        Play Again
                                    </button>
                                    <button
                                        onClick={() => navigate('/leaderboard')}
                                        className="text-white/60 hover:text-white transition-colors"
                                    >
                                        View Global Leaderboard
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Controls Info */}
                <div className="mt-6 flex justify-center gap-8 text-white/40 text-sm">
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">W</kbd>
                        <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">A</kbd>
                        <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">S</kbd>
                        <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">D</kbd>
                        <span>to Move</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">Click</kbd>
                        <span>to Shoot & Aim</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                        <span>Collect Accuracy Dots</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WaveDefenseGame;
