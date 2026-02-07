
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
import { LayoutGrid, Users, BarChart3, Plus, ShieldCheck, PlayCircle, ArrowUpDown, Package, Gift, CheckCircle2, LogIn, LogOut, Globe, Code2 } from 'lucide-react';

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
  const [isAdmin, setIsAdmin] = useState(false); // Default false for production safety
  
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'rating' | 'name', direction: 'asc' | 'desc' }>({ key: 'rating', direction: 'desc' });

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
          // Reset admin state if logged out
          setIsAdmin(false); 
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Listener
  useEffect(() => {
    setLoadingPlayers(true);
    
    let unsubUser = () => {};

    if (user) {
        // Wenn eingeloggt, hole echte Rolle und Bonus
        unsubUser = subscribeToUserData((data) => {
            setIsAdmin(data.role === 'admin');
        });

        checkDailyLoginBonus().then(hasBonus => {
            if (hasBonus) setToast({ message: "Täglicher Bonus: +5 Punkte!", type: 'success' });
        });
    } else {
        // Wenn nicht eingeloggt: Gast-Modus (Lesezugriff)
        // HINWEIS: Für lokale Entwicklung kannst du hier setIsAdmin(true) setzen, 
        // aber für die Webseite sollte es false sein.
        setIsAdmin(false); 
    }

    // Datenbank immer abrufen (Public Read)
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
      setView('players'); // Reset view on logout
  };

  // CRUD & Interaction
  const handleSavePlayer = async (player: Player) => {
    if (!user) {
        alert("Bitte melde dich an, um Änderungen zu speichern.");
        return;
    }
    setLoadingPlayers(true); 
    await saveToDatabase(player);
    setIsFormOpen(false);
    setEditingPlayer(undefined);
  };

  const handleRequestDelete = (id: string) => setPlayerToDelete(id);

  const confirmDelete = async () => {
    if (playerToDelete) {
      if (!user) {
          alert("Bitte melde dich an, um zu löschen.");
          setPlayerToDelete(null);
          return;
      }
      await deleteFromDatabase(playerToDelete);
      setPlayerToDelete(null);
    }
  };

  const handlePlayerUpdate = (updatedPlayer: Player) => {
     setVotingPlayer(updatedPlayer);
  };

  const handleCardClick = (player: Player) => {
    // Voting für alle erlauben (auch Gäste können sehen, aber voteForStat in service prüft Auth)
    setVotingPlayer(player);
  };

  const handleRewardPlayer = async (e: React.MouseEvent, player: Player) => {
    e.stopPropagation();
    if (!user) return;
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
            
            {/* User Status / Login Button */}
            {user ? (
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
            ) : (
                <div className="flex items-center gap-3">
                     <span className="hidden md:inline text-xs font-bold text-slate-500 uppercase tracking-wide">Gastzugang</span>
                    <button 
                        onClick={handleLogin} 
                        className="flex items-center gap-2 bg-white text-slate-950 hover:bg-slate-200 px-4 py-2 rounded-full font-bold text-sm transition shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        title="Mit Google anmelden"
                    >
                        <LogIn size={16} />
                        <span>Anmelden</span>
                    </button>
                </div>
            )}
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
