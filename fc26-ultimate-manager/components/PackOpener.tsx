
import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { openPack, addCurrency, deleteFromInventory, subscribeToCurrency, subscribeToInventory } from '../services/playerService';
import PlayerCard from './PlayerCard';
import ConfirmationModal from './ConfirmationModal';
import { Package, Sparkles, Coins, Zap, Star, Trash2 } from 'lucide-react';

const PackOpener: React.FC = () => {
  const [currency, setCurrency] = useState(0);
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');
  const [inventory, setInventory] = useState<Player[]>([]);
  
  // Pack Opening State
  const [isOpening, setIsOpening] = useState(false);
  const [revealedPlayer, setRevealedPlayer] = useState<Player | null>(null);
  const [walkoutStage, setWalkoutStage] = useState<'idle' | 'opening' | 'flash' | 'nation' | 'position' | 'club' | 'revealed'>('idle');
  const [playerToSell, setPlayerToSell] = useState<string | null>(null);

  useEffect(() => {
    const unsubCurrency = subscribeToCurrency((amount) => setCurrency(amount));
    const unsubInv = subscribeToInventory((items) => setInventory(items));
    return () => { unsubCurrency(); unsubInv(); };
  }, []); 

  const handleOpenPack = async () => {
    if (currency < 1 || isOpening) return;
    setIsOpening(true);
    setRevealedPlayer(null);
    setWalkoutStage('opening'); // Shaking

    // Async Open
    const player = await openPack();
    
    if (!player) {
        setIsOpening(false);
        setWalkoutStage('idle');
        return;
    }
    
    setRevealedPlayer(player);
    const isWalkout = player.rating >= 88; // WALKOUT NUR NOCH AB 88+

    // Animation Timeline
    setTimeout(() => setWalkoutStage('flash'), 1200); // 1.2s Shake -> Flash

    if (isWalkout) {
        setTimeout(() => setWalkoutStage('nation'), 2000);   // Flagge
        setTimeout(() => setWalkoutStage('position'), 3500); // Position dazu
        setTimeout(() => setWalkoutStage('club'), 5000);     // Verein dazu
        setTimeout(() => setWalkoutStage('revealed'), 6500); // BOOM
    } else {
        // Schneller Reveal für Karten unter 88
        setTimeout(() => setWalkoutStage('revealed'), 2500);
    }
  };

  const handleQuickSell = async () => {
      if (revealedPlayer) {
          await deleteFromInventory(revealedPlayer.id);
          await addCurrency(0.5);
          handleReset();
      }
  };

  const confirmSell = async () => {
      if (playerToSell) {
          await deleteFromInventory(playerToSell);
          await addCurrency(0.5);
          setPlayerToSell(null);
      }
  };

  const handleReset = () => {
    setRevealedPlayer(null);
    setWalkoutStage('idle');
    setIsOpening(false);
  };

  // --- RENDER HELPERS ---

  // Rendert die Walkout-Informationen (Nation -> Position -> Club)
  const renderWalkoutContent = () => {
      if (!revealedPlayer) return null;

      // Determine visibility based on stage sequence
      const showNation = ['nation', 'position', 'club'].includes(walkoutStage);
      const showPos = ['position', 'club'].includes(walkoutStage);
      const showClub = ['club'].includes(walkoutStage);

      // Force render if we are in nation stage
      if (!showNation) return null;

      return (
          <div className="flex flex-col items-center justify-center gap-6 z-[60]">
              {/* NATION */}
              <div className={`transition-all duration-500 transform ${showNation ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-20 scale-150'}`}>
                  {showNation && (
                      <div className="flex flex-col items-center animate-slam">
                          <span className="text-9xl drop-shadow-[0_0_25px_rgba(255,255,255,0.8)] text-white">{revealedPlayer.nation}</span>
                      </div>
                  )}
              </div>

              {/* POSITION */}
              <div className={`transition-all duration-500 transform ${showPos ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
                  {showPos && (
                      <div className="flex flex-col items-center animate-slam-delay">
                          <span className="text-8xl font-black text-white uppercase tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] font-mono">
                            {revealedPlayer.position}
                          </span>
                      </div>
                  )}
              </div>

              {/* CLUB */}
              <div className={`transition-all duration-500 transform ${showClub ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                  {showClub && (
                      <div className="flex flex-col items-center animate-slam-delay-2 bg-white/10 px-8 py-2 rounded-xl backdrop-blur-md border border-white/20 shadow-xl">
                          <span className="text-4xl font-bold text-yellow-400 uppercase tracking-widest drop-shadow-md">
                             {revealedPlayer.club || 'Free Agent'}
                          </span>
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="flex flex-col items-center h-full min-h-[600px] pb-20 relative overflow-x-hidden">
      
      {/* --- CSS ANIMATIONS --- */}
      <style>{`
        @keyframes shake-hard {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-3px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        @keyframes slam {
            0% { transform: scale(3); opacity: 0; }
            50% { transform: scale(0.9); opacity: 1; }
            75% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes god-rays {
            0% { transform: rotate(0deg) scale(1); opacity: 0.5; }
            50% { transform: rotate(180deg) scale(1.2); opacity: 0.8; }
            100% { transform: rotate(360deg) scale(1); opacity: 0.5; }
        }
        .animate-shake-hard { animation: shake-hard 0.1s infinite; }
        .animate-slam { animation: slam 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-slam-delay { animation: slam 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; animation-delay: 0.1s; opacity: 0; }
        .animate-slam-delay-2 { animation: slam 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; animation-delay: 0.2s; opacity: 0; }
      `}</style>

      {/* --- HEADER --- */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-8">
        <div className="bg-slate-900 border border-slate-700 px-6 py-3 rounded-full flex items-center gap-3 shadow-lg mb-6 z-10">
            <div className="flex items-center gap-2">
                <Coins className="text-yellow-400" />
                <span className="text-2xl font-black text-white">{currency}</span>
            </div>
        </div>
        <div className="flex gap-4 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button onClick={() => setActiveTab('shop')} className={`px-6 py-2 rounded-lg font-bold text-sm ${activeTab === 'shop' ? 'bg-slate-700' : 'text-slate-500'}`}>Shop</button>
            <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 rounded-lg font-bold text-sm ${activeTab === 'inventory' ? 'bg-slate-700' : 'text-slate-500'}`}>Verein</button>
        </div>
      </div>

      {activeTab === 'shop' ? (
        <div className="relative w-full max-w-md flex flex-col items-center justify-center">
            
            {/* --- WALKOUT OVERLAY --- */}
            {(walkoutStage !== 'idle' && walkoutStage !== 'opening') && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
                     
                     {/* Background Effects */}
                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 via-black to-black opacity-80"></div>
                     
                     {/* God Rays (Show only on Reveal) */}
                     {walkoutStage === 'revealed' && (
                         <div className="absolute inset-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,215,0,0.1)_20deg,transparent_40deg,rgba(255,215,0,0.1)_60deg,transparent_80deg,rgba(255,215,0,0.1)_100deg,transparent_120deg,rgba(255,215,0,0.1)_140deg,transparent_160deg,rgba(255,215,0,0.1)_180deg,transparent_200deg,rgba(255,215,0,0.1)_220deg,transparent_240deg,rgba(255,215,0,0.1)_260deg,transparent_280deg,rgba(255,215,0,0.1)_300deg,transparent_320deg,rgba(255,215,0,0.1)_340deg,transparent_360deg)] animate-[spin-slow_20s_linear_infinite]"></div>
                     )}

                     {/* Flashbang Effect - FIXED: Persistent during Flash AND start of Nation to allow smooth fade */}
                     {(walkoutStage === 'flash' || walkoutStage === 'nation') && (
                         <div className="absolute inset-0 bg-white animate-out fade-out duration-[1500ms] z-50 pointer-events-none fill-mode-forwards"></div>
                     )}

                     {/* Tunnel Spotlights */}
                     {['nation', 'position', 'club'].includes(walkoutStage) && (
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-[100vh] bg-gradient-to-b from-white/20 to-transparent blur-3xl z-40"></div>
                     )}

                     {/* --- STAGE CONTENT --- */}
                     {walkoutStage !== 'revealed' ? (
                         renderWalkoutContent()
                     ) : (
                         /* REVEALED CARD */
                         <div className="flex flex-col items-center animate-in zoom-in-50 duration-500 z-20">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-[2.5rem] blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                                <PlayerCard player={revealedPlayer!} size="lg" disableHover={false} />
                            </div>
                            
                            <h2 className="text-4xl font-black text-white mt-8 uppercase tracking-widest drop-shadow-lg flex items-center gap-3">
                                <Star className="text-yellow-400 fill-yellow-400" /> Walkout <Star className="text-yellow-400 fill-yellow-400" />
                            </h2>

                            <div className="flex gap-4 mt-8">
                                <button onClick={handleQuickSell} className="bg-red-950/80 hover:bg-red-900 text-red-200 font-bold py-4 px-8 rounded-xl border border-red-800 transition transform hover:scale-105">
                                    Verkaufen (0.5 <Coins className="inline w-4 h-4"/>)
                                </button>
                                <button onClick={handleReset} className="bg-white text-black hover:bg-slate-200 font-bold py-4 px-10 rounded-xl border-4 border-slate-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition transform hover:scale-105">
                                    In Verein speichern
                                </button>
                            </div>
                        </div>
                     )}
                </div>
            )}

            {/* --- IDLE PACK STATE --- */}
            <div className="flex flex-col items-center z-10">
                <div 
                    onClick={currency >= 1 ? handleOpenPack : undefined} 
                    className={`
                        relative w-64 h-80 bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl 
                        shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-y-4 border-yellow-400/50 
                        flex flex-col items-center justify-center cursor-pointer transition-all 
                        ${walkoutStage === 'opening' ? 'animate-shake-hard scale-110' : 'hover:scale-105 hover:-translate-y-2'}
                    `}
                >
                    {/* Pack Design */}
                    <div className="absolute inset-2 border border-yellow-500/30 rounded-lg"></div>
                    <Package size={80} className={`text-yellow-200 mb-4 drop-shadow-lg ${walkoutStage === 'opening' ? 'animate-pulse' : ''}`} />
                    <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 to-yellow-400 uppercase tracking-widest">Ultimate</h3>
                    <span className="text-yellow-200/80 font-mono text-xs mt-1">Pack</span>
                    
                    {walkoutStage === 'opening' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[2px] rounded-lg">
                            <Zap className="text-white animate-ping" size={64} />
                        </div>
                    )}
                </div>

                <button 
                    disabled={currency < 1 || isOpening} 
                    onClick={handleOpenPack} 
                    className={`mt-10 w-full py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg ${currency >= 1 ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                    {isOpening ? 'Öffnet...' : <><span>Pack öffnen (1 Punkt)</span><Coins size={20}/></>}
                </button>
            </div>
        </div>
      ) : (
          /* INVENTORY LIST */
          <div className="w-full max-w-5xl">
              {inventory.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center perspective-[1000px]">
                      {[...inventory].reverse().map(player => (
                          <div key={player.id} className="relative group">
                              <PlayerCard player={player} />
                              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 translate-y-2 group-hover:translate-y-0">
                                  <button onClick={() => setPlayerToSell(player.id)} className="bg-red-600 hover:bg-red-500 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-1 font-bold border border-red-400">
                                    <Trash2 size={12}/> Sell (0.5)
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : <div className="text-center py-20 text-slate-500 italic">Dein Verein ist leer. Öffne Packs im Shop!</div>}
          </div>
      )}
      {playerToSell && <ConfirmationModal title="Verkaufen?" message="Spieler wirklich für 0.5 Punkte verkaufen?" onConfirm={confirmSell} onCancel={() => setPlayerToSell(null)} />}
    </div>
  );
};

export default PackOpener;
