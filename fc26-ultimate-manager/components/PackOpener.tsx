
import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { openPack, addCurrency, deleteFromInventory, subscribeToCurrency, subscribeToInventory } from '../services/playerService';
import PlayerCard from './PlayerCard';
import ConfirmationModal from './ConfirmationModal';
import { Package, Sparkles, Coins, Zap, Star, Trash2, ArrowUpDown } from 'lucide-react';

const PackOpener: React.FC = () => {
  const [currency, setCurrency] = useState(0);
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');
  const [inventory, setInventory] = useState<Player[]>([]);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: 'rating' | 'name', direction: 'asc' | 'desc' }>({ key: 'rating', direction: 'desc' });

  // Pack Opening State
  const [isOpening, setIsOpening] = useState(false);
  const [revealedPlayer, setRevealedPlayer] = useState<Player | null>(null);
  
  // Stages: idle -> opening (shake) -> flash (white) -> nation -> position -> revealed
  const [stage, setStage] = useState<'idle' | 'opening' | 'flash' | 'nation' | 'position' | 'revealed'>('idle');
  
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
    setStage('opening'); // Phase 1: Pack Wackeln

    // 1. Backend Call (Punkte abziehen, Spieler generieren)
    const player = await openPack();
    
    if (!player) {
        setIsOpening(false);
        setStage('idle');
        return;
    }
    
    // Kleiner Delay damit das Wackeln wirkt
    await new Promise(r => setTimeout(r, 800));

    setRevealedPlayer(player);
    const isWalkout = player.rating >= 88; // NUR 88+ ist ein Walkout

    // Phase 2: Flashbang (Weißer Blitz)
    setStage('flash');

    if (isWalkout) {
        // --- WALKOUT SEQUENZ ---
        // Nach 500ms Flash -> Nation (Dunkler Tunnel)
        setTimeout(() => setStage('nation'), 500);
        
        // Nach weiteren 2s -> Position
        setTimeout(() => setStage('position'), 2500);
        
        // Nach weiteren 2s -> Reveal (Karte)
        setTimeout(() => setStage('revealed'), 4500);
    } else {
        // --- KEIN WALKOUT (Schnell) ---
        // Nach 800ms Flash -> Direkt Karte anzeigen
        setTimeout(() => setStage('revealed'), 800);
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
    setStage('idle');
    setIsOpening(false);
  };

  const getSortedInventory = () => {
    return [...inventory].sort((a, b) => {
        if (sortConfig.key === 'name') {
            return sortConfig.direction === 'asc' 
                ? a.name.localeCompare(b.name) 
                : b.name.localeCompare(a.name);
        } else {
            return sortConfig.direction === 'asc' 
                ? a.rating - b.rating 
                : b.rating - a.rating;
        }
    });
  };

  // --- RENDER HELPERS ---

  // Rendert die Walkout-Informationen (Nation -> Position -> Club)
  const renderWalkoutContent = () => {
      if (!revealedPlayer) return null;

      // Determine visibility based on stage sequence
      const showNation = ['nation', 'position', 'club'].includes(stage);
      const showPos = ['position', 'club'].includes(stage);
      
      // Force render if we are in nation stage
      if (!showNation) return null;

      return (
          <div className="flex flex-col items-center justify-center gap-6 z-[60]">
              {/* NATION */}
              <div className={`transition-all duration-500 transform ${showNation ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-20 scale-150'}`}>
                  {showNation && (
                      <div className="flex flex-col items-center animate-slam">
                          <span className="text-[12rem] drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] text-white">{revealedPlayer.nation}</span>
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
          </div>
      );
  };

  return (
    <div className="flex flex-col items-center h-full min-h-[600px] pb-20 relative overflow-x-hidden">
      
      {/* --- CSS ANIMATIONS --- */}
      <style>{`
        @keyframes shake-extreme {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          10% { transform: translate(-5px, -5px) rotate(-5deg); }
          20% { transform: translate(5px, 5px) rotate(5deg); }
          30% { transform: translate(-5px, 5px) rotate(-5deg); }
          40% { transform: translate(5px, -5px) rotate(5deg); }
          50% { transform: translate(-2px, 2px) rotate(0deg) scale(1.1); }
          100% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
        }
        @keyframes tunnel-pulse {
            0% { background-size: 100% 100%; opacity: 0.8; }
            50% { background-size: 150% 150%; opacity: 1; }
            100% { background-size: 100% 100%; opacity: 0.8; }
        }
        @keyframes slam-in {
            0% { transform: scale(5); opacity: 0; filter: blur(10px); }
            40% { transform: scale(0.9); opacity: 1; filter: blur(0px); }
            60% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        @keyframes rays-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-shake-extreme { animation: shake-extreme 0.5s infinite; }
        .animate-tunnel { animation: tunnel-pulse 2s infinite ease-in-out; }
        .animate-slam { animation: slam-in 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>

      {/* --- HEADER --- */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-8 z-10">
        <div className="bg-slate-900 border border-slate-700 px-6 py-3 rounded-full flex items-center gap-3 shadow-lg mb-6">
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
            
            {/* --- FULLSCREEN ANIMATION OVERLAY --- */}
            {(stage !== 'idle' && stage !== 'opening') && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
                     
                     {/* 1. FLASHBANG (Nur kurz beim Übergang) */}
                     <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-700 ease-out z-[110] ${stage === 'flash' ? 'opacity-100' : 'opacity-0'}`}></div>

                     {/* 2. TUNNEL BACKGROUND (Nur bei Walkout Stages) */}
                     {(stage === 'nation' || stage === 'position') && (
                         <div className="absolute inset-0 z-[50] bg-[radial-gradient(circle_at_center,_#3b0764_0%,_#000000_70%)] animate-tunnel">
                             {/* Moving Lights */}
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-blue-500/50 blur-xl animate-pulse"></div>
                             <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[2px] bg-purple-500/50 blur-xl animate-pulse"></div>
                         </div>
                     )}

                     {/* 3. GOD RAYS (Nur beim Reveal) */}
                     {stage === 'revealed' && (
                         <div className="absolute inset-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,215,0,0.15)_20deg,transparent_40deg,rgba(255,215,0,0.15)_60deg,transparent_80deg,rgba(255,215,0,0.15)_100deg,transparent_120deg,rgba(255,215,0,0.15)_140deg,transparent_160deg,rgba(255,215,0,0.15)_180deg,transparent_200deg,rgba(255,215,0,0.15)_220deg,transparent_240deg,rgba(255,215,0,0.15)_260deg,transparent_280deg,rgba(255,215,0,0.15)_300deg,transparent_320deg,rgba(255,215,0,0.15)_340deg,transparent_360deg)] animate-[rays-spin_20s_linear_infinite] z-[40]"></div>
                     )}

                     {/* --- CONTENT: NATION --- */}
                     {stage === 'nation' && revealedPlayer && (
                        <div className="z-[60] flex flex-col items-center animate-slam">
                            <span className="text-[12rem] drop-shadow-[0_0_50px_rgba(255,255,255,0.6)] filter brightness-110">
                                {revealedPlayer.nation}
                            </span>
                        </div>
                     )}

                     {/* --- CONTENT: POSITION --- */}
                     {stage === 'position' && revealedPlayer && (
                        <div className="z-[60] flex flex-col items-center animate-slam">
                            <span className="text-[10rem] font-black text-white font-mono tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] border-4 border-white px-8 py-2 rounded-xl bg-white/10 backdrop-blur">
                                {revealedPlayer.position}
                            </span>
                        </div>
                     )}

                     {/* --- CONTENT: REVEALED CARD --- */}
                     {stage === 'revealed' && revealedPlayer && (
                         <div className="flex flex-col items-center animate-slam z-[60]">
                            <div className="relative group scale-125 md:scale-150">
                                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
                                <PlayerCard player={revealedPlayer} size="lg" disableHover={false} />
                            </div>
                            
                            {/* Nur anzeigen wenn es wirklich ein Walkout war (88+) */}
                            {revealedPlayer.rating >= 88 && (
                                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 mt-12 uppercase tracking-[0.2em] drop-shadow-lg flex items-center gap-4 animate-bounce">
                                    <Star className="fill-yellow-400 text-yellow-600 w-10 h-10" /> 
                                    Walkout 
                                    <Star className="fill-yellow-400 text-yellow-600 w-10 h-10" />
                                </h2>
                            )}

                            <div className="flex gap-4 mt-12">
                                <button onClick={handleQuickSell} className="bg-red-950/80 hover:bg-red-900 text-red-200 font-bold py-4 px-8 rounded-xl border border-red-800 transition transform hover:scale-105 shadow-xl">
                                    Verkaufen (0.5 <Coins className="inline w-4 h-4"/>)
                                </button>
                                <button onClick={handleReset} className="bg-white text-black hover:bg-slate-200 font-bold py-4 px-12 rounded-xl border-4 border-slate-300 shadow-[0_0_30px_rgba(255,255,255,0.4)] transition transform hover:scale-105">
                                    Behalten
                                </button>
                            </div>
                        </div>
                     )}
                </div>
            )}

            {/* --- IDLE PACK STATE --- */}
            <div className="flex flex-col items-center z-10 mt-10">
                <div 
                    onClick={currency >= 1 ? handleOpenPack : undefined} 
                    className={`
                        relative w-72 h-96 bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-800 rounded-2xl 
                        shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-y-8 border-yellow-400/30 
                        flex flex-col items-center justify-center cursor-pointer transition-all 
                        ${stage === 'opening' ? 'animate-shake-extreme scale-110 shadow-yellow-500/50' : 'hover:scale-105 hover:-translate-y-2'}
                    `}
                >
                    {/* Pack Details */}
                    <div className="absolute inset-3 border-2 border-dashed border-yellow-300/30 rounded-xl"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay"></div>
                    
                    <Package size={100} className={`text-yellow-100 mb-6 drop-shadow-2xl ${stage === 'opening' ? 'text-white' : ''}`} />
                    
                    <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-yellow-300 uppercase tracking-widest drop-shadow-sm">Ultimate</h3>
                    <div className="bg-black/40 px-4 py-1 rounded mt-2 border border-white/10">
                        <span className="text-yellow-200 font-mono text-sm tracking-widest">PACK</span>
                    </div>
                    
                    {stage === 'opening' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px] rounded-2xl">
                            <Zap className="text-white w-32 h-32 animate-ping" />
                        </div>
                    )}
                </div>

                <button 
                    disabled={currency < 1 || isOpening} 
                    onClick={handleOpenPack} 
                    className={`mt-12 w-full py-5 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl border-t border-white/20 ${currency >= 1 ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-900/50' : 'bg-slate-800 text-slate-500 cursor-not-allowed border-none'}`}
                >
                    {isOpening ? 'Opening...' : <><span>Pack öffnen</span><div className="bg-black/20 px-3 py-1 rounded text-sm flex items-center gap-1 font-mono">1 <Coins size={14}/></div></>}
                </button>
            </div>
        </div>
      ) : (
          /* INVENTORY LIST */
          <div className="w-full max-w-5xl">
              
              {/* Filter Bar */}
              <div className="flex justify-between items-center w-full mb-4 px-2">
                 <div className="text-slate-400 text-sm">{inventory.length} Spieler</div>
                 <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <span className="px-2 text-slate-500"><ArrowUpDown size={14}/></span>
                    <select 
                        className="bg-transparent text-sm text-white focus:outline-none py-1 pr-2 cursor-pointer"
                        onChange={(e) => {
                            const [key, dir] = e.target.value.split('-');
                            setSortConfig({ key: key as 'name'|'rating', direction: dir as 'asc'|'desc' });
                        }}
                        value={`${sortConfig.key}-${sortConfig.direction}`}
                    >
                        <option value="rating-desc" className="bg-slate-800">Rating (High)</option>
                        <option value="rating-asc" className="bg-slate-800">Rating (Low)</option>
                        <option value="name-asc" className="bg-slate-800">Name (A-Z)</option>
                        <option value="name-desc" className="bg-slate-800">Name (Z-A)</option>
                    </select>
                </div>
              </div>

              {inventory.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center perspective-[1000px]">
                      {getSortedInventory().map(player => (
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
