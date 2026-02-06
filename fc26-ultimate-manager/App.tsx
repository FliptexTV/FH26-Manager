
import React, { useState, useEffect } from 'react';
import { Player, ViewState } from './types';
import { 
    subscribeToPlayers, 
    saveToDatabase, 
    deleteFromDatabase, 
    checkDailyLoginBonus, 
    addCurrency,
    getCurrentUser
} from './services/playerService';
import { auth, googleProvider } from './services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

import PlayerCard from './components/PlayerCard';
import PlayerForm from './components/PlayerForm';
import TeamBuilder from './components/TeamBuilder';
import StatsView from './components/StatsView';
import MatchView from './components/MatchView';
import PackOpener from './components/PackOpener';
import VotingModal from './components/VotingModal';
import ConfirmationModal from './components/ConfirmationModal';
import { LayoutGrid, Users, BarChart3, Plus, ShieldCheck, Shield, PlayCircle, ArrowUpDown, Package, Gift, CheckCircle2, LogIn, LogOut, Globe } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [view, setView] = useState<ViewState>('players');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>(undefined);
  const [votingPlayer, setVotingPlayer] = useState<Player | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'rating' | 'name', direction: 'asc' | 'desc' }>({ key: 'rating', direction: 'desc' });

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Listener (Only if logged in)
  useEffect(() => {
    if (user) {
        setLoadingPlayers(true);
        // Real-time subscription to the Global Player Catalog
        const unsubscribe = subscribeToPlayers((data) => {
            setPlayers(data);
            setLoadingPlayers(false);
        });

        // Check Daily Bonus
        checkDailyLoginBonus().then(hasBonus => {
            if (hasBonus) setToast({ message: "Täglicher Bonus: +5 Punkte!", type: 'success' });
        });

        return () => unsubscribe();
    } else {
        setPlayers([]);
    }
  }, [user]);

  // Auth Functions
  const handleLogin = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.error("Login failed", error);
        alert("Login fehlgeschlagen. Prüfe deine Firebase Config.");
    }
  };

  const handleLogout = () => signOut(auth);

  // CRUD & Interaction
  const handleSavePlayer = async (player: Player) => {
    setLoadingPlayers(true); // Optimistic loading
    await saveToDatabase(player);
    setIsFormOpen(false);
    setEditingPlayer(undefined);
    // Note: No need to setPlayers, the subscription will update it automatically!
  };

  const handleRequestDelete = (id: string) => setPlayerToDelete(id);

  const confirmDelete = async () => {
    if (playerToDelete) {
      await deleteFromDatabase(playerToDelete);
      setPlayerToDelete(null);
    }
  };

  const handlePlayerUpdate = (updatedPlayer: Player) => {
     // The voting modal updates the DB directly. 
     // The real-time listener will update the 'players' list.
     // We just need to update the modal view if it's open.
     setVotingPlayer(updatedPlayer);
  };

  const handleCardClick = (player: Player) => {
    if (!isAdmin) setVotingPlayer(player);
  };

  const handleRewardPlayer = async (e: React.MouseEvent, player: Player) => {
    e.stopPropagation();
    await addCurrency(1);
    setToast({ message: `1 Punkt für ${player.name} vergeben!`, type: 'success' });
  };

  const openEdit = (player: Player) => {
    setEditingPlayer(player);
    setIsFormOpen(true);
  };

  const openCreate = () => {
    setEditingPlayer(undefined);
    setIsFormOpen(true);
  };

  const getSortedPlayers = () => {
    const sorted = [...players].sort((a, b) => {
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
    return sorted;
  };

  // --- LOGIN SCREEN ---
  if (authLoading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Lade...</div>;

  if (!user) {
      return (
          <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-green-500/10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-slate-950 to-slate-950"></div>
              <div className="z-10 bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-700 text-center max-w-md w-full">
                  <div className="w-16 h-16 bg-gradient-to-tr from-green-500 to-emerald-300 rounded-xl rotate-3 shadow-[0_0_20px_rgba(34,197,94,0.5)] mx-auto mb-6"></div>
                  <h1 className="text-3xl font-black text-white italic uppercase mb-2">FC<span className="text-green-400">26</span> Manager</h1>
                  <p className="text-slate-400 mb-8">Baue dein Team, sammle Karten und vote mit deinen Freunden.</p>
                  
                  <button 
                    onClick={handleLogin}
                    className="w-full py-3 bg-white text-slate-900 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-slate-200 transition"
                  >
                      <LogIn size={20} />
                      Mit Google anmelden
                  </button>
                  <p className="mt-4 text-xs text-slate-600">
                      Hinweis: Dies ist eine Demo-App. Bitte konfiguriere Firebase in <code>services/firebase.ts</code>.
                  </p>
              </div>
          </div>
      );
  }

  // --- MAIN APP ---
  return (
    <div className="h-[100dvh] bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden relative">
      
      {/* Toast */}
      {toast && (
          <div className="fixed top-20 right-4 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
              <div className="bg-slate-900 border border-green-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
                  <div className="bg-green-500/20 p-2 rounded-full text-green-400">
                      {toast.message.includes('Bonus') ? <Gift size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <p className="font-bold text-sm">{toast.message}</p>
              </div>
          </div>
      )}

      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('players')}>
           <div className="w-8 h-8 bg-gradient-to-tr from-green-500 to-emerald-300 rounded-lg rotate-3 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
           <h1 className="text-xl font-bold tracking-tight text-white uppercase italic hidden md:block">
             FC<span className="text-green-400">26</span>
           </h1>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border border-slate-600" />
                <span className="hidden md:inline text-sm font-bold">{user.displayName}</span>
            </div>
            
            <button 
            onClick={() => setIsAdmin(!isAdmin)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isAdmin ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
            >
            {isAdmin ? <ShieldCheck size={14}/> : <Shield size={14}/>}
            {isAdmin ? 'ADMIN' : 'USER'}
            </button>
            
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400" title="Logout">
                <LogOut size={20} />
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {view === 'players' && (
          <div className="space-y-6 pb-20 lg:pb-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2">
                  <Globe className="text-slate-500" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Datenbank</h2>
                    <p className="text-xs text-slate-400">Live synchronisiert</p>
                  </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                 {/* Sorting & Admin Create Buttons (Same as before) */}
                 <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <span className="px-2 text-slate-500"><ArrowUpDown size={14}/></span>
                    <select 
                        className="bg-transparent text-sm text-white focus:outline-none py-1 pr-2"
                        onChange={(e) => {
                            const [key, dir] = e.target.value.split('-');
                            setSortConfig({ key: key as 'name'|'rating', direction: dir as 'asc'|'desc' });
                        }}
                        value={`${sortConfig.key}-${sortConfig.direction}`}
                    >
                        <option value="rating-desc" className="bg-slate-800">Rating (99-1)</option>
                        <option value="rating-asc" className="bg-slate-800">Rating (1-99)</option>
                        <option value="name-asc" className="bg-slate-800">Name (A-Z)</option>
                        <option value="name-desc" className="bg-slate-800">Name (Z-A)</option>
                    </select>
                </div>

                {isAdmin && (
                    <button 
                    onClick={openCreate}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-lg hover:shadow-green-500/20 transition ml-auto md:ml-0"
                    >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Neu</span>
                    </button>
                )}
              </div>
            </div>

            {loadingPlayers ? (
                <div className="text-center py-20 text-slate-500 animate-pulse">Lade Datenbank...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center perspective-[1000px]">
                {getSortedPlayers().map(player => (
                    <PlayerCard 
                    key={player.id} 
                    player={player} 
                    showDelete={isAdmin}
                    onClick={() => handleCardClick(player)}
                    onDelete={(e) => { e.stopPropagation(); handleRequestDelete(player.id); }}
                    onEdit={(e) => { e.stopPropagation(); openEdit(player); }}
                    onReward={(e) => handleRewardPlayer(e, player)}
                    />
                ))}
                
                {isAdmin && (
                    <div onClick={openCreate} className="w-48 h-[296px] rounded-t-2xl rounded-b-[2rem] border-2 border-dashed border-slate-700 hover:border-green-500 bg-slate-900/50 flex flex-col items-center justify-center cursor-pointer group transition-all">
                        <Plus size={32} className="text-slate-500 group-hover:text-green-400" />
                        <span className="mt-4 text-sm font-medium text-slate-500 group-hover:text-green-400">Erstellen</span>
                    </div>
                )}
                </div>
            )}
          </div>
        )}

        {/* View Routing */}
        {view === 'team' && <TeamBuilder allPlayers={players} />}
        {view === 'matches' && <MatchView />}
        {view === 'packs' && <PackOpener />}
        {view === 'stats' && <StatsView players={players} />}

      </main>

      {/* Mobile Nav */}
      <div className="fixed bottom-0 left-0 right-0 lg:static lg:bg-transparent lg:border-none bg-slate-900 border-t border-slate-800 z-40 p-2 lg:hidden">
        <nav className="flex justify-around items-center max-w-md mx-auto">
          <button onClick={() => setView('players')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${view === 'players' ? 'text-green-400 bg-slate-800' : 'text-slate-500'}`}><LayoutGrid size={20} /></button>
          <button onClick={() => setView('team')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${view === 'team' ? 'text-green-400 bg-slate-800' : 'text-slate-500'}`}><Users size={20} /></button>
          <button onClick={() => setView('matches')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${view === 'matches' ? 'text-green-400 bg-slate-800' : 'text-slate-500'}`}><PlayCircle size={20} /></button>
          <button onClick={() => setView('packs')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${view === 'packs' ? 'text-green-400 bg-slate-800' : 'text-slate-500'}`}><Package size={20} /></button>
          <button onClick={() => setView('stats')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${view === 'stats' ? 'text-green-400 bg-slate-800' : 'text-slate-500'}`}><BarChart3 size={20} /></button>
        </nav>
      </div>

       {/* Desktop Sidebar */}
       <div className="hidden lg:flex fixed left-0 top-16 bottom-0 w-20 flex-col items-center py-8 gap-8 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm z-20">
          <button onClick={() => setView('players')} className={`p-3 rounded-xl transition hover:bg-slate-800 ${view === 'players' ? 'bg-slate-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-slate-400'}`}><LayoutGrid size={24} /></button>
          <button onClick={() => setView('team')} className={`p-3 rounded-xl transition hover:bg-slate-800 ${view === 'team' ? 'bg-slate-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-slate-400'}`}><Users size={24} /></button>
          <button onClick={() => setView('matches')} className={`p-3 rounded-xl transition hover:bg-slate-800 ${view === 'matches' ? 'bg-slate-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-slate-400'}`}><PlayCircle size={24} /></button>
          <button onClick={() => setView('packs')} className={`p-3 rounded-xl transition hover:bg-slate-800 ${view === 'packs' ? 'bg-slate-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-slate-400'}`}><Package size={24} /></button>
          <button onClick={() => setView('stats')} className={`p-3 rounded-xl transition hover:bg-slate-800 ${view === 'stats' ? 'bg-slate-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-slate-400'}`}><BarChart3 size={24} /></button>
      </div>

      {isFormOpen && <PlayerForm initialPlayer={editingPlayer} onSave={handleSavePlayer} onCancel={() => setIsFormOpen(false)} />}
      {votingPlayer && <VotingModal player={votingPlayer} onClose={() => setVotingPlayer(undefined)} onUpdate={handlePlayerUpdate} />}
      {playerToDelete && <ConfirmationModal title="Löschen?" message="Wirklich löschen?" onConfirm={confirmDelete} onCancel={() => setPlayerToDelete(null)} />}
    </div>
  );
};

export default App;
