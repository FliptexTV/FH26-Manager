
import React, { useState, useEffect } from 'react';
import { Player, ViewState } from './types';
import { 
    subscribeToPlayers, 
    saveToDatabase, 
    deleteFromDatabase, 
    checkDailyLoginBonus, 
    addCurrency,
    subscribeToUserData,
    updateUserProfile,
    getAllUsers,
    giveUserCurrency,
    linkUserToPlayer,
    resetAllVotes, // Imported reset function
    UserData
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
import { LayoutGrid, Users, BarChart3, Plus, ShieldCheck, PlayCircle, ArrowUpDown, Package, Gift, CheckCircle2, LogOut, Globe, UserCircle, X, Coins, UserCog, Ghost, LogIn, AlertTriangle, RefreshCw, Timer } from 'lucide-react';

// Namespace import extraction for safety
const { signInWithPopup, signOut, onAuthStateChanged } = firebaseAuth;

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  const [view, setView] = useState<ViewState>('players');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>(undefined);
  const [votingPlayer, setVotingPlayer] = useState<Player | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Admin & User Mgmt State
  const [isAdmin, setIsAdmin] = useState(false); 
  const [showUserList, setShowUserList] = useState(false);
  const [userList, setUserList] = useState<UserData[]>([]);
  
  // Onboarding State
  const [needsUsername, setNeedsUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'rating' | 'name', direction: 'asc' | 'desc' }>({ key: 'rating', direction: 'desc' });

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
          setIsAdmin(false); 
          setNeedsUsername(false);
          setUserData(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Listener
  useEffect(() => {
    if (!user) return; // Stop data loading if not logged in

    setLoadingPlayers(true);
    let unsubUser = () => {};

    // Subscribe to User Data (Role & Currency & Username)
    unsubUser = subscribeToUserData((data) => {
        setUserData(data);
        setIsAdmin(data.role === 'admin');
        
        // Check if username is missing
        if (!data.username) {
            setNeedsUsername(true);
        } else {
            setNeedsUsername(false);
        }
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

  const handleSubmitUsername = async () => {
      if (newUsername.trim().length > 2) {
          await updateUserProfile(newUsername.trim());
          setNeedsUsername(false);
      } else {
          alert("Name muss mind. 3 Zeichen haben.");
      }
  };

  const loadUserList = async () => {
      const users = await getAllUsers();
      setUserList(users);
      setShowUserList(true);
  };

  const handleGivePoints = async (uid: string, amount: number) => {
      await giveUserCurrency(uid, amount);
      setToast({ message: `${amount} Punkte gesendet!`, type: 'success' });
      // Refresh list
      const users = await getAllUsers();
      setUserList(users);
  };

  const handleLinkPlayer = async (uid: string, playerId: string) => {
      await linkUserToPlayer(uid, playerId);
      setToast({ message: "Karte zugewiesen!", type: 'success' });
      // Refresh list
      const users = await getAllUsers();
      setUserList(users);
  };

  const handleResetVotes = async () => {
      if (window.confirm("Bist du sicher? Dies setzt ALLE Community-Votes für ALLE Spieler auf 0 zurück. Das kann nicht rückgängig gemacht werden.")) {
          await resetAllVotes();
          setToast({ message: "Saison Reset: Alle Votes gelöscht.", type: 'success' });
      }
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

  // LOGIN SCREEN (Restored)
  if (!user) {
    return (
      <div className="h-[100dvh] bg-slate-950 flex flex-col items-center justify-center text-white font-sans relative overflow-hidden">
         {/* Background pattern */}
         <div className="absolute inset-0 pitch-pattern opacity-10 pointer-events-none"></div>
         <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-950/80 to-slate-950 pointer-events-none"></div>

         <div className="z-10 flex flex-col items-center p-8 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-500">
             <div className="w-20 h-20 bg-gradient-to-tr from-green-500 to-emerald-300 rounded-2xl rotate-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] mb-6 flex items-center justify-center">
                <span className="text-4xl">⚽</span>
             </div>
             
             <h1 className="text-4xl font-bold italic tracking-tighter mb-1">FC<span className="text-green-400">26</span></h1>
             <p className="text-slate-400 text-sm mb-8 uppercase tracking-widest font-semibold">Ultimate Manager</p>

             <button 
                onClick={handleLogin}
                className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 group"
             >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Weiter mit Google</span>
             </button>

             <div className="mt-8 text-center border-t border-slate-800/50 pt-4 w-full">
                 <p className="text-[10px] text-slate-600">
                    Willkommen zurück auf dem Platz.<br/>
                    <span className="text-slate-500">Logge dich ein, um dein Team zu verwalten.</span>
                 </p>
             </div>
         </div>
      </div>
    );
  }

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
                
                <div className="flex gap-2">
                    <button onClick={loadUserList} className="flex items-center justify-center w-8 h-8 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700">
                        <Users size={18} />
                    </button>
                    {isAdmin && (
                        <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-green-500/10 border-green-500 text-green-400 uppercase tracking-wider">
                            <ShieldCheck size={12}/> Admin
                        </div>
                    )}
                </div>

                {/* User Status / Logout */}
                <div className="flex items-center gap-2 bg-slate-800 rounded-full pr-1 pl-1 py-1 border border-slate-700">
                    <img src={user.photoURL || 'https://via.placeholder.com/40'} alt="User" className="w-8 h-8 rounded-full border border-slate-600" />
                    <span className="hidden md:inline text-xs font-bold text-slate-300 px-2">{userData?.username || user.displayName || 'Spieler'}</span>
                    <button onClick={handleLogout} className="p-1.5 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-full transition ml-1" title="Abmelden">
                        <LogOut size={16} />
                    </button>
                </div>
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
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center perspective-[1000px]">
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
                    <div onClick={openCreate} className="w-48 h-[360px] rounded-t-2xl rounded-b-[2.5rem] border-2 border-dashed border-slate-700 hover:border-green-500 bg-slate-900/50 flex flex-col items-center justify-center cursor-pointer group transition-all">
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
        {view === 'matches' && <MatchView isAdmin={isAdmin} />}
        {view === 'packs' && <PackOpener />}
        {view === 'stats' && <StatsView players={players} />}

      </main>

      {/* Mobile Nav */}
      <div className="fixed bottom-0 left-0 right-0 lg:static lg:bg-transparent lg:border-none bg-slate-900 border-t border-slate-800 z-40 p-2 lg:hidden">
        <nav className="flex justify-around items-center max-w-md mx-auto">
          <button onClick={() => setView('players')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${view === 'players' ? 'text-green-400 bg-slate-800' : 'text-slate-500'}`}><LayoutGrid size={20} /></button>
          <button onClick={() => setView('team')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${view === 'team' ? 'text-green-400 bg-slate-800' : 'text-slate-500'}`}><Users size={20} /></button>
          <button onClick={() => setView('matches')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${view === 'matches' ? 'text-green-400 bg-slate-800' : 'text-slate-500'}`}><Timer size={20} /></button>
          <button onClick={() => setView('packs')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${view === 'packs' ? 'text-green-400 bg-slate-800' : 'text-slate-500'}`}><Package size={20} /></button>
          <button onClick={() => setView('stats')} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${view === 'stats' ? 'text-green-400 bg-slate-800' : 'text-slate-500'}`}><BarChart3 size={20} /></button>
        </nav>
      </div>

       {/* Desktop Sidebar */}
       <div className="hidden lg:flex fixed left-0 top-16 bottom-0 w-20 flex-col items-center py-8 gap-8 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm z-20">
          <button onClick={() => setView('players')} className={`p-3 rounded-xl transition hover:bg-slate-800 ${view === 'players' ? 'bg-slate-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-slate-400'}`}><LayoutGrid size={24} /></button>
          <button onClick={() => setView('team')} className={`p-3 rounded-xl transition hover:bg-slate-800 ${view === 'team' ? 'bg-slate-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-slate-400'}`}><Users size={24} /></button>
          <button onClick={() => setView('matches')} className={`p-3 rounded-xl transition hover:bg-slate-800 ${view === 'matches' ? 'bg-slate-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-slate-400'}`}><Timer size={24} /></button>
          <button onClick={() => setView('packs')} className={`p-3 rounded-xl transition hover:bg-slate-800 ${view === 'packs' ? 'bg-slate-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-slate-400'}`}><Package size={24} /></button>
          <button onClick={() => setView('stats')} className={`p-3 rounded-xl transition hover:bg-slate-800 ${view === 'stats' ? 'bg-slate-800 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-slate-400'}`}><BarChart3 size={24} /></button>
      </div>
      
      {/* Onboarding Modal */}
      {needsUsername && (
          <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
              <div className="bg-slate-900 p-8 rounded-xl border border-slate-700 w-full max-w-md text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">Willkommen Manager!</h2>
                  <p className="text-slate-400 mb-6">Bitte wähle einen Namen für deinen Verein / Account.</p>
                  <input 
                    type="text" 
                    placeholder="Dein Name"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 p-3 rounded text-white mb-4 text-center text-lg font-bold"
                  />
                  <button onClick={handleSubmitUsername} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded">
                      Los geht's
                  </button>
              </div>
          </div>
      )}

      {/* User Management Modal (Visible to all, editable by Admin) */}
      {showUserList && (
          <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users size={24} className="text-green-400"/> Mitglieder & Accounts</h2>
                      <button onClick={() => setShowUserList(false)} className="text-slate-400 hover:text-white bg-slate-800 rounded-full p-1"><X size={20}/></button>
                  </div>

                  {/* ADMIN TOOLS BAR */}
                  {isAdmin && (
                      <div className="p-3 bg-red-900/10 border-b border-red-900/20 flex items-center justify-between">
                          <span className="text-xs uppercase font-bold text-red-300 flex items-center gap-2"><AlertTriangle size={14}/> Admin Zone</span>
                          <button onClick={handleResetVotes} className="flex items-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-300 border border-red-800/50 px-3 py-1.5 rounded text-xs font-bold transition">
                             <RefreshCw size={12}/> Saison Reset (Votes löschen)
                          </button>
                      </div>
                  )}
                  
                  <div className="p-0 overflow-y-auto flex-1 bg-slate-950/50">
                      {userList.length === 0 ? (
                          <div className="text-center p-10 text-slate-500">Keine User gefunden.</div>
                      ) : (
                          <div className="divide-y divide-slate-800">
                              {userList.map(u => {
                                  const linkedPlayer = u.linkedPlayerId ? players.find(p => p.id === u.linkedPlayerId) : null;
                                  
                                  return (
                                    <div key={u.id} className="p-4 flex flex-col md:flex-row gap-4 md:items-center hover:bg-slate-900 transition">
                                        {/* User Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-lg text-white">{u.username || 'Unbenannt'}</span>
                                                {linkedPlayer ? (
                                                    <span className="text-[10px] bg-blue-900 text-blue-200 border border-blue-700 px-2 py-0.5 rounded uppercase font-bold tracking-wider">Spieler</span>
                                                ) : (
                                                    <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1"><Ghost size={10}/> Gast</span>
                                                )}
                                                {u.role === 'admin' && <span className="text-[10px] bg-red-900/50 text-red-400 border border-red-800 px-2 py-0.5 rounded uppercase font-bold">Admin</span>}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                                                ID: {u.id?.slice(0,8)}...
                                                <span className="text-slate-700">|</span>
                                                <span className="text-yellow-500 flex items-center gap-1"><Coins size={12}/> {u.currency} Pack-Punkte</span>
                                            </div>
                                        </div>

                                        {/* Card Linking (Display Only vs Edit) */}
                                        <div className="flex flex-col md:flex-row gap-3 md:items-center bg-slate-900 p-2 rounded-lg border border-slate-800 min-w-[200px]">
                                            {linkedPlayer ? (
                                                <div className="flex items-center gap-3">
                                                    <img src={linkedPlayer.image} alt="Linked" className="w-10 h-10 rounded-full object-cover border border-slate-600"/>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-white">{linkedPlayer.name}</span>
                                                        <span className="text-[10px] text-yellow-500">Rating: {linkedPlayer.rating}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-500 flex items-center gap-2 px-2">
                                                    <UserCircle size={16}/> Keine Karte
                                                </div>
                                            )}

                                            {isAdmin && (
                                                <div className="flex flex-col mt-2 md:mt-0 md:ml-2">
                                                    <select 
                                                        className="bg-slate-800 text-[10px] text-white border border-slate-700 rounded p-1 w-full md:w-32 focus:border-green-500 outline-none"
                                                        value={u.linkedPlayerId || ''}
                                                        onChange={(e) => u.id && handleLinkPlayer(u.id, e.target.value)}
                                                    >
                                                        <option value="">-- Zuweisen --</option>
                                                        {getSortedPlayers().map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Currency Actions (Admin Only) */}
                                        {isAdmin && (
                                            <div className="flex items-center gap-2 justify-end">
                                                <button onClick={() => u.id && handleGivePoints(u.id, 1)} className="bg-slate-800 hover:bg-green-900/30 text-xs px-3 py-2 rounded text-green-400 border border-slate-700 font-bold hover:border-green-800 transition">+1 Pts</button>
                                            </div>
                                        )}
                                    </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {isFormOpen && <PlayerForm initialPlayer={editingPlayer} onSave={handleSavePlayer} onCancel={() => setIsFormOpen(false)} />}
      {votingPlayer && <VotingModal player={votingPlayer} userData={userData} onClose={() => setVotingPlayer(undefined)} onUpdate={handlePlayerUpdate} />}
      {playerToDelete && <ConfirmationModal title="Löschen?" message="Wirklich löschen?" onConfirm={confirmDelete} onCancel={() => setPlayerToDelete(null)} />}
    </div>
  );
};

export default App;
