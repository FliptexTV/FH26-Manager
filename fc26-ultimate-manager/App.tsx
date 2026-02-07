
import React, { useState, useEffect } from 'react';
import { Player, ViewState } from './types';
import { 
    subscribeToPlayers, 
    saveToDatabase, 
    deleteFromDatabase, 
    checkDailyLoginBonus, 
    addCurrency,
    subscribeToUserData
} from './services/playerService';
import { auth, googleProvider } from './services/firebase';
import * as firebaseAuth from 'firebase/auth';
import type { User } from 'firebase/auth';

import PlayerCard from './components/PlayerCard';
import PlayerForm from './components/PlayerForm';
import TeamBuilder from './components/TeamBuilder';
import StatsView from './components/StatsView';
import MatchView from './components/MatchView';
import PackOpener from './components/PackOpener';
import VotingModal from './components/VotingModal';
import ConfirmationModal from './components/ConfirmationModal';
import { LayoutGrid, Users, BarChart3, Plus, ShieldCheck, PlayCircle, ArrowUpDown, Package, Gift, CheckCircle2, LogOut, Globe } from 'lucide-react';

// Namespace import extraction for safety
const { signInWithPopup, signOut, onAuthStateChanged } = firebaseAuth;

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
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false); 
  
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'rating' | 'name', direction: 'asc' | 'desc' }>({ key: 'rating', direction: 'desc' });

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
          setIsAdmin(false); 
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Listener
  useEffect(() => {
    if (!user) return; // Don't fetch data if not logged in

    setLoadingPlayers(true);
    
    // Subscribe to User Data (Role & Currency)
    const unsubUser = subscribeToUserData((data) => {
        setIsAdmin(data.role === 'admin');
    });

    // Check Daily Bonus
    checkDailyLoginBonus().then(hasBonus => {
        if (hasBonus) setToast({ message: "Täglicher Bonus: +5 Punkte!", type: 'success' });
    });

    // Subscribe to Players
    const unsubPlayers = subscribeToPlayers((data) => {
        setPlayers(data);
        setLoadingPlayers(false);
    });

    return () => {
        unsubUser();
        unsubPlayers();
    };
  }, [user]);

  // Auth Functions
  const handleLogin = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.error("Login failed", error);
        alert("Login fehlgeschlagen. Bitte prüfe die Konsole oder deine Internetverbindung.");
    }
  };

  const handleLogout = async () => {
      await signOut(auth);
      setView('players');
  };

  // CRUD & Interaction
  const handleSavePlayer = async (player: Player) => {
    setLoadingPlayers(true); 
    await saveToDatabase(player);
    setIsFormOpen(false);
    setEditingPlayer(undefined);
  };

  const handleRequestDelete = (id: string) => setPlayerToDelete(id);

  const confirmDelete = async () => {
    if (playerToDelete) {
      await deleteFromDatabase(playerToDelete);
      setPlayerToDelete(null);
    }
  };

  const handlePlayerUpdate = (updatedPlayer: Player) => {
     setVotingPlayer(updatedPlayer);
  };

  const handleCardClick = (player: Player) => {
    setVotingPlayer(player);
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

  if (authLoading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-sans text-xl animate-pulse">Lade Manager...</div>;

  // --- LOGIN SCREEN (MANDATORY) ---
  if (!user) {
    return (
        <div className="h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background FX */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-slate-950/80 radial-gradient"></div>
            <div className="w-96 h-96 bg-green-500/10 rounded-full blur-[128px] absolute top-1/4 left-1/4 animate-pulse"></div>
            <div className="w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] absolute bottom-1/4 right-1/4 animate-pulse delay-700"></div>

            <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 md:p-12 rounded-3xl shadow-2xl max-w-md w-full text-center">
                <div className="w-20 h-20 bg-gradient-to-tr from-green-500 to-emerald-300 rounded-2xl rotate-6 shadow-[0_0_40px_rgba(34,197,94,0.4)] mx-auto mb-8 flex items-center justify-center">
                    <span className="text-4xl">⚽</span>
                </div>
                
                <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic">
                    FH<span className="text-green-400">26</span>
                </h1>
                <p className="text-slate-400 mb-10 font-light text-lg tracking-wide uppercase">Ultimate Manager</p>

                <button 
                    onClick={handleLogin} 
                    className="w-full bg-white hover:bg-slate-200 text-slate-950 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl flex items-center justify-center gap-3"
                >
                    <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    <span>Login mit Google</span>
                </button>
            </div>
            
            <div className="absolute bottom-8 text-center text-slate-600 text-xs">
                &copy; 2026 FC Ultimate Manager. Powered by React & Firebase.
            </div>
        </div>
    );
  }

  // --- MAIN APP (Authenticated) ---
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
            <div className="flex items-center gap-3">
                {isAdmin && (
                    <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-green-500/10 border-green-500 text-green-400 uppercase tracking-wider">
                        <ShieldCheck size={12}/> Admin
                    </div>
                )}
                <div className="flex items-center gap-2 bg-slate-800 rounded-full pr-4 pl-1 py-1 border border-slate-700">
                    <img src={user.photoURL || ''} alt="User" className="w-6 h-6 rounded-full border border-slate-600" />
                    <span className="hidden md:inline text-xs font-bold text-slate-300">{user.displayName}</span>
                </div>
                <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-400 transition" title="Abmelden">
                    <LogOut size={20} />
                </button>
            </div>
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
                    <p className="text-xs text-slate-400">Alle Spieler im System</p>
                  </div>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                 {/* Sorting */}
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
