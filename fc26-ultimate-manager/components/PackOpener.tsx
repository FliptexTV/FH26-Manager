
import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { openPack, addCurrency, deleteFromInventory, subscribeToCurrency, subscribeToInventory } from '../services/playerService';
import PlayerCard from './PlayerCard';
import ConfirmationModal from './ConfirmationModal';
import { Package, Sparkles, Coins, Flag, Shirt, LayoutGrid, Store, Trash2 } from 'lucide-react';

const PackOpener: React.FC = () => {
  const [currency, setCurrency] = useState(0);
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');
  const [inventory, setInventory] = useState<Player[]>([]);
  
  // Pack Opening State
  const [isOpening, setIsOpening] = useState(false);
  const [revealedPlayer, setRevealedPlayer] = useState<Player | null>(null);
  const [walkoutStage, setWalkoutStage] = useState<'idle' | 'opening' | 'nation' | 'position' | 'club' | 'revealed'>('idle');
  const [playerToSell, setPlayerToSell] = useState<string | null>(null);

  useEffect(() => {
    // Real-time currency & inventory
    const unsubCurrency = subscribeToCurrency((amount) => setCurrency(amount));
    const unsubInv = subscribeToInventory((items) => setInventory(items));
    return () => { unsubCurrency(); unsubInv(); };
  }, []); 

  const handleOpenPack = async () => {
    if (currency < 1 || isOpening) return;
    setIsOpening(true);
    setRevealedPlayer(null);
    setWalkoutStage('opening');

    // Async Open
    const player = await openPack();
    
    if (!player) {
        setIsOpening(false);
        return;
    }
    
    setRevealedPlayer(player);
    const isWalkout = player.rating >= 88;

    if (isWalkout) {
        setTimeout(() => setWalkoutStage('nation'), 1500);
        setTimeout(() => setWalkoutStage('position'), 3000);
        setTimeout(() => setWalkoutStage('club'), 4500);
        setTimeout(() => { setWalkoutStage('revealed'); setIsOpening(false); }, 6000);
    } else {
        setTimeout(() => { setWalkoutStage('revealed'); setIsOpening(false); }, 2000);
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
  };

  return (
    <div className="flex flex-col items-center h-full min-h-[600px] pb-20 relative">
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
            {(walkoutStage !== 'idle' && walkoutStage !== 'revealed' && walkoutStage !== 'opening') && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in">
                     <h2 className="text-6xl font-black text-white uppercase tracking-widest">{walkoutStage}</h2>
                </div>
            )}
            {walkoutStage === 'revealed' && revealedPlayer ? (
                <div className="flex flex-col items-center animate-in zoom-in z-10">
                    <PlayerCard player={revealedPlayer} size="lg" disableHover={false} />
                    <div className="flex gap-4 mt-6">
                        <button onClick={handleQuickSell} className="bg-red-900/50 hover:bg-red-900 text-red-200 font-bold py-3 px-6 rounded-full border border-red-800">Sell (0.5)</button>
                        <button onClick={handleReset} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-full border border-slate-600">Behalten</button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center z-10">
                    <div onClick={currency >= 1 ? handleOpenPack : undefined} className={`relative w-64 h-80 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl shadow-[0_0_50px_rgba(234,179,8,0.3)] border-4 border-yellow-200 flex flex-col items-center justify-center cursor-pointer transition-all ${isOpening ? 'animate-bounce' : 'hover:scale-105'}`}>
                        <Package size={80} className="text-yellow-900 mb-4" />
                        <h3 className="text-2xl font-black text-yellow-900">Gold Pack</h3>
                        {isOpening && <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-lg"><Sparkles className="text-yellow-600 animate-spin" size={48} /></div>}
                    </div>
                    <button disabled={currency < 1 || isOpening} onClick={handleOpenPack} className={`mt-10 w-full py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-3 ${currency >= 1 ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {isOpening ? 'Öffnet...' : <><span>Öffnen (1 Punkt)</span><Coins size={20}/></>}
                    </button>
                </div>
            )}
        </div>
      ) : (
          <div className="w-full max-w-5xl">
              {inventory.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
                      {[...inventory].reverse().map(player => (
                          <div key={player.id} className="relative group">
                              <PlayerCard player={player} />
                              <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                  <button onClick={() => setPlayerToSell(player.id)} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 font-bold">Sell (0.5)</button>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : <div className="text-center py-20 text-slate-500">Dein Verein ist leer.</div>}
          </div>
      )}
      {playerToSell && <ConfirmationModal title="Verkaufen?" message="Wirklich verkaufen?" onConfirm={confirmSell} onCancel={() => setPlayerToSell(null)} />}
    </div>
  );
};

export default PackOpener;
