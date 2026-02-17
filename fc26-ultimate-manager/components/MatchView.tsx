
import React, { useState, useEffect, useRef } from 'react';
import { Player, Team, MatchResult, MatchEvent } from '../types';
import { getTeams, saveMatch, getMatches, getPlayerById, deleteMatch, getDatabase } from '../services/playerService';
import { Play, Pause, Save, Trophy, Timer, Club, History, Calendar, LayoutList, Minus, Trash2, ChevronDown, ChevronUp, Users, Plus, X, RefreshCw, UserMinus, UserPlus } from 'lucide-react';
import PlayerCard from './PlayerCard';

interface MatchViewProps {
    isAdmin?: boolean;
}

const MatchView: React.FC<MatchViewProps> = ({ isAdmin }) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchResult[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  
  // History Expansion State
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // --- SETUP STATE (LOBBY) ---
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [homeSquad, setHomeSquad] = useState<Player[]>([]);
  const [awaySquad, setAwaySquad] = useState<Player[]>([]);
  
  // Player Picker Modal (Used for Lobby AND Subs)
  const [showPlayerPicker, setShowPlayerPicker] = useState<'home' | 'away' | null>(null);
  
  // Active Squad Management Modal (Mid-Game)
  const [showSquadManager, setShowSquadManager] = useState<'home' | 'away' | null>(null);

  // --- LIVE MATCH STATE ---
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [matchFinished, setMatchFinished] = useState(false);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [scoringTeam, setScoringTeam] = useState<string | null>(null);

  // Stats Tracking: Keep track of EVERYONE who played, even if subbed out
  const allHomeParticipants = useRef<Set<string>>(new Set());
  const allAwayParticipants = useRef<Set<string>>(new Set());

  // Cache for player names to avoid excessive async calls during render
  const [playerCache, setPlayerCache] = useState<Record<string, Player>>({});

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
        setTeams(await getTeams());
        setMatchHistory((await getMatches()).reverse());
        // Load all players for the picker
        setAllPlayers(await getDatabase());
    };
    loadData();
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => setTime(t => t + 1), 1000); 
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  // Helper to fetch and cache player info
  const resolvePlayer = async (id: string) => {
      if (playerCache[id]) return playerCache[id];
      const p = await getPlayerById(id);
      if (p) {
          setPlayerCache(prev => ({...prev, [id]: p}));
          return p;
      }
      return null;
  };

  // Resolve players when events change or history loads
  useEffect(() => {
      matchHistory.forEach(m => m.events.forEach(e => resolvePlayer(e.playerId)));
  }, [matchHistory]);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  
  // --- LOBBY LOGIC ---

  const handleSelectHomeTeam = async (id: string) => {
      setHomeTeamId(id);
      if (!id) { setHomeSquad([]); return; }
      const t = teams.find(t => t.id === id);
      if (t) {
          const loadedPlayers: Player[] = [];
          for (const pid of t.playerIds) {
              if(pid) {
                  const p = allPlayers.find(ap => ap.id === pid) || await getPlayerById(pid);
                  if (p) loadedPlayers.push(p);
              }
          }
          setHomeSquad(loadedPlayers);
      }
  };

  const handleSelectAwayTeam = async (id: string) => {
      setAwayTeamId(id);
      if (!id) { setAwaySquad([]); return; }
      const t = teams.find(t => t.id === id);
      if (t) {
          const loadedPlayers: Player[] = [];
          for (const pid of t.playerIds) {
              if(pid) {
                  const p = allPlayers.find(ap => ap.id === pid) || await getPlayerById(pid);
                  if (p) loadedPlayers.push(p);
              }
          }
          setAwaySquad(loadedPlayers);
      }
  };

  const removePlayerFromSquad = (side: 'home' | 'away', playerId: string) => {
      if (side === 'home') setHomeSquad(prev => prev.filter(p => p.id !== playerId));
      else setAwaySquad(prev => prev.filter(p => p.id !== playerId));
  };

  const addPlayerToSquad = (player: Player) => {
      // Add to visible squad
      if (showPlayerPicker === 'home') {
          setHomeSquad(prev => [...prev, player]);
          // Add to participant history (if match is running, this ensures they get stats)
          if(isMatchActive) allHomeParticipants.current.add(player.id);
      } else if (showPlayerPicker === 'away') {
          setAwaySquad(prev => [...prev, player]);
          if(isMatchActive) allAwayParticipants.current.add(player.id);
      }
      
      // Update cache so names appear correctly immediately
      setPlayerCache(prev => ({...prev, [player.id]: player}));
      
      setShowPlayerPicker(null);
  };

  const startMatch = () => {
    // Only verify we have players, ignoring team IDs if custom mix
    if (homeSquad.length > 0 && awaySquad.length > 0) {
      // Initialize Participants for tracking stats
      allHomeParticipants.current = new Set(homeSquad.map(p => p.id));
      allAwayParticipants.current = new Set(awaySquad.map(p => p.id));

      setIsMatchActive(true);
      setIsRunning(true);
      
      // Pre-cache
      [...homeSquad, ...awaySquad].forEach(p => {
          setPlayerCache(prev => ({...prev, [p.id]: p}));
      });
    }
  };

  const handleGoal = (teamId: string) => { if (isRunning || matchFinished) setScoringTeam(teamId); };

  const confirmGoal = (playerId: string) => {
    if (!scoringTeam) return;
    const isHome = scoringTeam === 'home_custom' || scoringTeam === homeTeamId;
    if (isHome) setHomeScore(h => h + 1); else setAwayScore(a => a + 1);
    setEvents(prev => [...prev, { type: 'goal', playerId, minute: Math.floor(time / 60), teamId: scoringTeam }]);
    setScoringTeam(null);
  };

  const undoGoal = (teamId: string) => {
      const isHome = teamId === 'home_custom' || teamId === homeTeamId;
      if (isHome && homeScore > 0) setHomeScore(h => h - 1);
      if (!isHome && awayScore > 0) setAwayScore(a => a - 1);

      const newEvents = [...events];
      const lastEventIndex = newEvents.reverse().findIndex(e => e.teamId === teamId && e.type === 'goal');
      
      if (lastEventIndex !== -1) {
          const trueIndex = newEvents.length - 1 - lastEventIndex;
          setEvents(prev => prev.filter((_, i) => i !== trueIndex));
      }
  };

  const deleteEvent = (index: number) => {
      const eventToDelete = events[index];
      if (eventToDelete.type === 'goal') {
           if (eventToDelete.teamId === homeTeamId || eventToDelete.teamId === 'home_custom') setHomeScore(h => Math.max(0, h - 1));
           else setAwayScore(a => Math.max(0, a - 1));
      }
      setEvents(prev => prev.filter((_, i) => i !== index));
  };

  const finishMatch = () => { setIsRunning(false); setMatchFinished(true); };

  const saveMatchResult = async () => {
    const match: MatchResult = {
      id: Date.now().toString(),
      homeTeamId: homeTeamId || 'custom_home',
      awayTeamId: awayTeamId || 'custom_away',
      homeScore, awayScore, date: Date.now(), duration: time, events,
      // CRITICAL: Save EVERYONE who participated, not just the final 5 on the pitch
      homePlayerIds: Array.from(allHomeParticipants.current),
      awayPlayerIds: Array.from(allAwayParticipants.current)
    };
    await saveMatch(match);
    setMatchHistory(prev => [match, ...prev]);
    setIsMatchActive(false);
    setMatchFinished(false);
    setTime(0); setHomeScore(0); setAwayScore(0); setEvents([]);
    // Clear squads for next
    setHomeSquad([]); setAwaySquad([]); setHomeTeamId(''); setAwayTeamId('');
    setActiveTab('history');
  };

  const toggleHistoryExpand = (matchId: string) => {
      if (expandedMatchId === matchId) setExpandedMatchId(null);
      else setExpandedMatchId(matchId);
  };

  const handleDeleteMatch = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm("Match unwiderruflich löschen?")) {
          await deleteMatch(id);
          setMatchHistory(prev => prev.filter(m => m.id !== id));
      }
  };

  // --- RENDER ---

  // ACTIVE MATCH
  if (isMatchActive || matchFinished) {
      const effectiveHomeTeamName = teams.find(t => t.id === homeTeamId)?.name || "Heim";
      const effectiveAwayTeamName = teams.find(t => t.id === awayTeamId)?.name || "Auswärts";
      const effectiveHomeId = homeTeamId || 'home_custom';
      const effectiveAwayId = awayTeamId || 'away_custom';

      return (
        <div className="flex flex-col h-full max-w-4xl mx-auto p-4 pb-24">
            {/* Scoreboard */}
            <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-6 text-center relative shadow-2xl">
                 <div className="text-3xl font-mono text-yellow-400 mb-6 font-bold tracking-widest bg-black/40 inline-block px-6 py-2 rounded-lg border border-slate-700/50">
                    {formatTime(time)}
                 </div>
                 
                 <div className="flex justify-between items-start text-white">
                     {/* Home Score & Controls */}
                     <div className="flex flex-col items-center gap-2 w-1/3">
                         <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 truncate max-w-full">{effectiveHomeTeamName}</div>
                         <div onClick={() => handleGoal(effectiveHomeId)} className="text-5xl md:text-7xl font-black cursor-pointer text-green-100 hover:text-green-400 transition select-none drop-shadow-[0_0_15px_rgba(74,222,128,0.3)]">{homeScore}</div>
                         
                         <div className="flex gap-2 mt-2">
                            <button onClick={() => undoGoal(effectiveHomeId)} className="text-slate-500 hover:text-red-400 p-2 border border-slate-700 bg-slate-800 rounded-full transition" title="Tor löschen"><Minus size={16}/></button>
                            <button onClick={() => setShowSquadManager('home')} className="text-slate-500 hover:text-blue-400 p-2 border border-slate-700 bg-slate-800 rounded-full transition" title="Wechseln"><RefreshCw size={16}/></button>
                         </div>
                     </div>
                     
                     <div className="text-slate-700 text-4xl font-black pt-4 select-none opacity-50">:</div>
                     
                     {/* Away Score & Controls */}
                     <div className="flex flex-col items-center gap-2 w-1/3">
                         <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 truncate max-w-full">{effectiveAwayTeamName}</div>
                         <div onClick={() => handleGoal(effectiveAwayId)} className="text-5xl md:text-7xl font-black cursor-pointer text-red-100 hover:text-red-400 transition select-none drop-shadow-[0_0_15px_rgba(248,113,113,0.3)]">{awayScore}</div>
                         
                         <div className="flex gap-2 mt-2">
                             <button onClick={() => undoGoal(effectiveAwayId)} className="text-slate-500 hover:text-red-400 p-2 border border-slate-700 bg-slate-800 rounded-full transition" title="Tor löschen"><Minus size={16}/></button>
                             <button onClick={() => setShowSquadManager('away')} className="text-slate-500 hover:text-blue-400 p-2 border border-slate-700 bg-slate-800 rounded-full transition" title="Wechseln"><RefreshCw size={16}/></button>
                         </div>
                     </div>
                 </div>

                 <div className="mt-8 flex justify-center gap-4 border-t border-slate-800 pt-6">
                     {!matchFinished ? (
                         <><button onClick={() => setIsRunning(!isRunning)} className="bg-slate-800 p-4 rounded-full text-white border border-slate-700 hover:bg-slate-700 hover:border-slate-500 transition shadow-lg">{isRunning ? <Pause size={24}/> : <Play size={24} className="ml-1"/>}</button> 
                           <button onClick={finishMatch} className="bg-red-600/90 px-8 py-2 rounded-lg text-white font-bold hover:bg-red-500 shadow-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all">Abpfiff</button></>
                     ) : (
                         <div className="flex gap-2 w-full justify-center">
                             <button onClick={() => setMatchFinished(false)} className="bg-slate-700 px-6 py-3 rounded-lg text-white font-bold hover:bg-slate-600 transition">Zurück</button>
                             <button onClick={saveMatchResult} className="bg-green-600 px-8 py-3 rounded-lg text-white font-bold flex gap-2 hover:bg-green-500 items-center shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"><Save size={20}/> Speichern</button>
                         </div>
                     )}
                 </div>
            </div>

            {/* Events */}
            <div className="mt-6 space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase ml-2 mb-2 flex items-center gap-2"><LayoutList size={14}/> Match Timeline</h3>
                {[...events].map((ev, i) => (
                    <div key={i} className="bg-slate-900/80 p-3 rounded-lg flex gap-3 items-center border border-slate-800 justify-between group animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-slate-500 font-bold min-w-[30px]">{ev.minute}'</span>
                            <div className={`p-1 rounded-full ${ev.teamId === effectiveHomeId ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                <Club size={14}/>
                            </div>
                            <span className={`font-bold ${ev.teamId === effectiveHomeId ? 'text-green-100' : 'text-red-100'}`}>
                                {playerCache[ev.playerId]?.name || 'Loading...'}
                            </span>
                        </div>
                        <button onClick={() => deleteEvent(i)} className="text-slate-600 hover:text-red-500 p-1.5 hover:bg-red-900/20 rounded transition"><Trash2 size={16}/></button>
                    </div>
                )).reverse()}
            </div>

            {/* Scorer Overlay */}
            {scoringTeam && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                            <Club size={24} className={(scoringTeam === effectiveHomeId) ? 'text-green-400' : 'text-red-400'}/>
                            Torschütze wählen
                        </h3>
                        <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                            {(scoringTeam === effectiveHomeId ? homeSquad : awaySquad).map(p => {
                                return (
                                    <button key={p.id} onClick={() => confirmGoal(p.id)} className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-left truncate font-bold transition flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-yellow-500 font-mono border border-slate-600">{p.rating}</div>
                                        {p.name}
                                    </button>
                                )
                            })}
                        </div>
                        <button onClick={() => setScoringTeam(null)} className="mt-4 w-full py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded font-bold uppercase tracking-wider text-sm transition">Abbrechen</button>
                    </div>
                </div>
            )}

            {/* SQUAD MANAGER MODAL (Mid-Game Subs) */}
            {showSquadManager && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[70vh]">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-xl">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <RefreshCw size={18} className="text-blue-400"/>
                                {showSquadManager === 'home' ? effectiveHomeTeamName : effectiveAwayTeamName} verwalten
                            </h3>
                            <button onClick={() => setShowSquadManager(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto flex-1 space-y-2">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-2">Aktuell auf dem Feld</div>
                            {(showSquadManager === 'home' ? homeSquad : awaySquad).map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="font-bold text-yellow-500 w-6 text-center">{p.rating}</div>
                                        <span className="font-bold text-white">{p.name}</span>
                                    </div>
                                    <button 
                                        onClick={() => removePlayerFromSquad(showSquadManager, p.id)} 
                                        className="text-red-400 hover:bg-red-900/30 p-2 rounded-full transition flex items-center gap-1 text-xs font-bold uppercase"
                                    >
                                        <UserMinus size={14}/> Raus
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-800 bg-slate-900 rounded-b-xl">
                             <button 
                                onClick={() => {
                                    setShowPlayerPicker(showSquadManager); 
                                    setShowSquadManager(null);
                                }} 
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg transition"
                             >
                                 <UserPlus size={18}/> Spieler einwechseln
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PLAYER PICKER REUSED (Appears above Manager) */}
            {showPlayerPicker && (
              <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-[70] backdrop-blur-md">
                  <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
                      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-xl">
                          <h3 className="text-white font-bold flex items-center gap-2"><Plus size={18} className="text-green-400"/> Spieler hinzufügen</h3>
                          <button onClick={() => setShowPlayerPicker(null)}><X className="text-slate-400"/></button>
                      </div>
                      <div className="p-2 overflow-y-auto space-y-1 flex-1">
                          {allPlayers
                              .filter(p => !homeSquad.find(hp => hp.id === p.id) && !awaySquad.find(ap => ap.id === p.id))
                              .sort((a,b) => b.rating - a.rating)
                              .map(p => (
                                  <button key={p.id} onClick={() => addPlayerToSquad(p)} className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-slate-700 group">
                                      <div className="font-bold text-yellow-500 w-8 text-center bg-slate-950 rounded py-1 border border-slate-800 group-hover:border-yellow-500/50">{p.rating}</div>
                                      <div className="text-left font-bold text-slate-200">{p.name}</div>
                                      <div className="ml-auto text-xs text-slate-500 uppercase font-mono bg-slate-950 px-2 py-1 rounded">{p.position}</div>
                                  </button>
                              ))
                          }
                      </div>
                  </div>
              </div>
            )}

        </div>
      );
  }

  // --- LOBBY VIEW ---
  return (
      <div className="max-w-4xl mx-auto p-4">
          <div className="flex bg-slate-900 p-1 rounded-xl mb-6 border border-slate-800">
             <button onClick={() => setActiveTab('new')} className={`flex-1 py-2 rounded-lg font-bold ${activeTab === 'new' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Neues Match</button>
             <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg font-bold ${activeTab === 'history' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Verlauf</button>
          </div>
          
          {activeTab === 'new' ? (
              <div className="space-y-6">
                  {/* Team Selectors & Squad Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* HOME TEAM */}
                      <div className="bg-slate-900 border border-green-900/50 p-4 rounded-xl shadow-lg shadow-green-900/10">
                          <h3 className="text-green-400 font-bold uppercase mb-4 flex items-center gap-2"><Club size={18}/> Heim</h3>
                          <select className="bg-slate-800 border border-slate-700 p-3 rounded w-full mb-4 text-sm text-white focus:ring-2 focus:ring-green-500 outline-none" value={homeTeamId} onChange={e => handleSelectHomeTeam(e.target.value)}>
                              <option value="">-- Team wählen --</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          
                          <div className="space-y-2 min-h-[200px]">
                              {homeSquad.map(p => (
                                  <div key={p.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-800 animate-in fade-in">
                                      <span className="text-sm font-bold text-slate-200">{p.name}</span>
                                      <button onClick={() => removePlayerFromSquad('home', p.id)} className="text-slate-500 hover:text-red-400 p-1"><X size={16}/></button>
                                  </div>
                              ))}
                              {homeSquad.length < 1 && <div className="text-slate-600 text-xs italic text-center py-10 border-2 border-dashed border-slate-800 rounded">Kader leer</div>}
                              
                              <button onClick={() => setShowPlayerPicker('home')} className="w-full py-3 border border-dashed border-slate-700 text-slate-500 hover:text-green-400 hover:border-green-500/50 hover:bg-green-500/5 rounded-lg flex items-center justify-center gap-2 text-sm transition mt-2 font-bold uppercase tracking-wider">
                                  <Plus size={16}/> Spieler hinzufügen
                              </button>
                          </div>
                      </div>

                      {/* AWAY TEAM */}
                      <div className="bg-slate-900 border border-red-900/50 p-4 rounded-xl shadow-lg shadow-red-900/10">
                          <h3 className="text-red-400 font-bold uppercase mb-4 flex items-center gap-2"><Club size={18}/> Auswärts</h3>
                          <select className="bg-slate-800 border border-slate-700 p-3 rounded w-full mb-4 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none" value={awayTeamId} onChange={e => handleSelectAwayTeam(e.target.value)}>
                              <option value="">-- Team wählen --</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          
                          <div className="space-y-2 min-h-[200px]">
                              {awaySquad.map(p => (
                                  <div key={p.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-800 animate-in fade-in">
                                      <span className="text-sm font-bold text-slate-200">{p.name}</span>
                                      <button onClick={() => removePlayerFromSquad('away', p.id)} className="text-slate-500 hover:text-red-400 p-1"><X size={16}/></button>
                                  </div>
                              ))}
                              {awaySquad.length < 1 && <div className="text-slate-600 text-xs italic text-center py-10 border-2 border-dashed border-slate-800 rounded">Kader leer</div>}

                              <button onClick={() => setShowPlayerPicker('away')} className="w-full py-3 border border-dashed border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/5 rounded-lg flex items-center justify-center gap-2 text-sm transition mt-2 font-bold uppercase tracking-wider">
                                  <Plus size={16}/> Spieler hinzufügen
                              </button>
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={startMatch} 
                    disabled={homeSquad.length === 0 || awaySquad.length === 0} 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black uppercase tracking-widest py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-green-900/20 transition transform hover:scale-[1.01] active:scale-[0.99] border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
                  >
                    Match Starten
                  </button>
              </div>
          ) : (
              /* HISTORY */
              <div className="space-y-4">
                  {matchHistory.map(m => {
                      const hName = teams.find(t=>t.id===m.homeTeamId)?.name || "Heim (Mix)";
                      const aName = teams.find(t=>t.id===m.awayTeamId)?.name || "Auswärts (Mix)";
                      return (
                      <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition hover:border-slate-700">
                          {/* Match Header Row */}
                          <div 
                              onClick={() => toggleHistoryExpand(m.id)}
                              className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition"
                          >
                            <span className="font-bold truncate w-1/3 text-sm md:text-base text-slate-300">{hName}</span>
                            <div className="flex items-center gap-3">
                                <span className={`px-4 py-1 rounded-lg font-mono font-bold text-xl ${m.homeScore > m.awayScore ? 'bg-green-900/40 text-green-400' : m.awayScore > m.homeScore ? 'bg-red-900/40 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                                    {m.homeScore} : {m.awayScore}
                                </span>
                                <span className="text-slate-600">{expandedMatchId === m.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</span>
                            </div>
                            <span className="font-bold truncate w-1/3 text-right text-sm md:text-base text-slate-300">{aName}</span>
                          </div>

                          {/* Expanded Details */}
                          {expandedMatchId === m.id && (
                              <div className="bg-slate-950/50 p-4 border-t border-slate-800 animate-in slide-in-from-top-2">
                                  {m.events && m.events.length > 0 ? (
                                      <div className="space-y-2 mb-4">
                                          <div className="text-[10px] text-slate-500 font-bold uppercase mb-2 tracking-wider">Spielereignisse</div>
                                          {m.events.sort((a,b) => a.minute - b.minute).map((ev, i) => {
                                              const isHome = ev.teamId === m.homeTeamId || ev.teamId === 'home_custom';
                                              return (
                                              <div key={i} className="flex items-center gap-3 text-sm border-b border-slate-800/50 pb-2 last:border-0">
                                                  <span className="font-mono text-slate-500 w-8 text-right">{ev.minute}'</span>
                                                  <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded border border-slate-800/50">
                                                      <Club size={12} className={isHome ? 'text-green-400' : 'text-red-400'} />
                                                      <span className={isHome ? 'text-green-100 font-bold' : 'text-red-100 font-bold'}>
                                                          {playerCache[ev.playerId]?.name || 'Unbekannt'}
                                                      </span>
                                                  </div>
                                              </div>
                                              )
                                          })}
                                      </div>
                                  ) : (
                                      <div className="text-slate-500 text-sm italic p-4 text-center bg-slate-900 rounded border border-dashed border-slate-800">Keine Ereignisse aufgezeichnet.</div>
                                  )}
                                  
                                  {/* Footer with Delete for Admin */}
                                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-800">
                                      <span className="text-[10px] text-slate-600 font-mono">ID: {m.id}</span>
                                      {isAdmin && (
                                          <button 
                                              onClick={(e) => handleDeleteMatch(m.id, e)} 
                                              className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-bold uppercase px-3 py-2 rounded hover:bg-red-900/20 transition"
                                          >
                                              <Trash2 size={14} /> Löschen
                                          </button>
                                      )}
                                  </div>
                              </div>
                          )}
                      </div>
                  )})}
                  {matchHistory.length === 0 && <div className="text-center text-slate-500 py-10">Keine Spiele gefunden.</div>}
              </div>
          )}

          {/* PLAYER PICKER MODAL (Global) */}
          {showPlayerPicker && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[70] backdrop-blur-sm">
                  <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
                      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 rounded-t-xl">
                          <h3 className="text-white font-bold flex items-center gap-2"><Plus size={18} className="text-green-400"/> Spieler hinzufügen</h3>
                          <button onClick={() => setShowPlayerPicker(null)}><X className="text-slate-400"/></button>
                      </div>
                      <div className="p-2 overflow-y-auto space-y-1 flex-1">
                          {allPlayers
                              .filter(p => !homeSquad.find(hp => hp.id === p.id) && !awaySquad.find(ap => ap.id === p.id))
                              .sort((a,b) => b.rating - a.rating)
                              .map(p => (
                                  <button key={p.id} onClick={() => addPlayerToSquad(p)} className="w-full flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg transition border border-transparent hover:border-slate-700 group">
                                      <div className="font-bold text-yellow-500 w-8 text-center bg-slate-950 rounded py-1 border border-slate-800 group-hover:border-yellow-500/50">{p.rating}</div>
                                      <div className="text-left font-bold text-slate-200">{p.name}</div>
                                      <div className="ml-auto text-xs text-slate-500 uppercase font-mono bg-slate-950 px-2 py-1 rounded">{p.position}</div>
                                  </button>
                              ))
                          }
                      </div>
                  </div>
              </div>
          )}
      </div>
  )
};

export default MatchView;
