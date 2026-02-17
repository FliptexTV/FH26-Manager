
import React, { useState, useEffect } from 'react';
import { Player, PotmHistory, PotmState } from '../types';
import { UserData, subscribeToPotmState, subscribeToPotmHistory, startPotmVoting, castPotmVote, endPotmVoting, getUserId, getAllUsers } from '../services/playerService';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Club, Crown, Play, Square, Calendar, Vote, AlertTriangle, Lock, Eye, EyeOff, List } from 'lucide-react';
import PlayerCard from './PlayerCard';

interface StatsViewProps {
  players: Player[];
  userData: UserData | null;
}

const StatsView: React.FC<StatsViewProps> = ({ players, userData }) => {
  const [activePotm, setActivePotm] = useState<PotmState>({ isActive: false, matchDate: '', votes: {} });
  const [potmHistory, setPotmHistory] = useState<PotmHistory[]>([]);
  
  // Admin Controls
  const [matchDateInput, setMatchDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [adminUserList, setAdminUserList] = useState<UserData[]>([]);
  const [showVoteDetails, setShowVoteDetails] = useState(false);

  const isAdmin = userData?.role === 'admin';
  const hasPlayerCard = !!userData?.linkedPlayerId;
  const currentUserId = getUserId();

  useEffect(() => {
      const unsubState = subscribeToPotmState(setActivePotm);
      const unsubHistory = subscribeToPotmHistory(setPotmHistory);
      return () => { unsubState(); unsubHistory(); };
  }, []);

  // Fetch all users for name resolution if admin
  useEffect(() => {
      if (isAdmin) {
          getAllUsers().then(setAdminUserList);
      }
  }, [isAdmin]);

  // Helpers
  const handleStartVoting = async () => {
      if(!matchDateInput) return;
      await startPotmVoting(matchDateInput);
  };

  const handleEndVoting = async () => {
      // Calculate Winner
      const voteCounts: Record<string, number> = {};
      const votesArray = Object.values(activePotm.votes || {}) as string[];
      votesArray.forEach(pid => {
          voteCounts[pid] = (voteCounts[pid] || 0) + 1;
      });
      
      let winnerId = '';
      let maxVotes = -1;

      Object.entries(voteCounts).forEach(([pid, count]) => {
          if (count > maxVotes) {
              maxVotes = count;
              winnerId = pid;
          }
      });
      
      // If no votes, just take first active player or random to avoid crash (or block it)
      if (!winnerId && players.length > 0) winnerId = players[0].id;
      
      await endPotmVoting(winnerId, maxVotes > 0 ? maxVotes : 0, activePotm.matchDate);
  };

  const getVoterNamesForPlayer = (playerId: string) => {
      const voterIds = Object.entries(activePotm.votes || {})
          .filter(([uid, pid]) => pid === playerId)
          .map(([uid]) => uid);
      
      return voterIds.map(uid => {
          const user = adminUserList.find(u => u.id === uid);
          return user ? (user.username || 'Unbenannt') : 'Unbekannt';
      });
  };

  // --- STATS CALCULATION ---

  if (players.length === 0) return <div className="p-10 text-center text-slate-500">Keine Daten verfügbar.</div>;

  const topScorers = [...players]
    .filter(p => p.gameStats && p.gameStats.goals > 0)
    .sort((a, b) => (b.gameStats?.goals || 0) - (a.gameStats?.goals || 0))
    .slice(0, 5)
    .map(p => ({ name: p.name, goals: p.gameStats?.goals || 0 }));

  const topRatedData = [...players]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .map(p => ({ name: p.name, rating: p.rating }));

  const bestWinRate = [...players]
    .filter(p => p.gameStats && p.gameStats.played > 0)
    .sort((a, b) => {
        const rateB = (b.gameStats!.won / b.gameStats!.played);
        const rateA = (a.gameStats!.won / a.gameStats!.played);
        return rateB - rateA;
    })
    .slice(0, 5)
    .map(p => ({ 
        name: p.name, 
        rate: Math.round(((p.gameStats!.won / p.gameStats!.played) * 100))
    }));

  // Resolve current voting stats for chart
  const currentVoteData = activePotm.isActive 
      ? (Object.values(activePotm.votes || {}) as string[]).reduce((acc: any[], pid) => {
          const existing = acc.find(x => x.id === pid);
          if (existing) existing.votes++;
          else {
              const p = players.find(pl => pl.id === pid);
              if (p) acc.push({ name: p.name, votes: 1, id: pid });
          }
          return acc;
      }, []).sort((a: any, b: any) => b.votes - a.votes) 
      : [];

  const lastWinner = potmHistory.length > 0 ? players.find(p => p.id === potmHistory[0].playerId) : null;
  const lastWinnerData = potmHistory.length > 0 ? potmHistory[0] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
      
      {/* 1. POTM VOTING CARD (Replaces MVP) */}
      <div className={`md:col-span-2 rounded-xl p-6 shadow-2xl relative overflow-hidden border transition-colors ${activePotm.isActive ? 'bg-indigo-950 border-indigo-500/50' : 'bg-slate-900 border-slate-800'}`}>
         
         {/* Active Badge */}
         {activePotm.isActive && (
             <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg animate-pulse uppercase">
                 Live Voting
             </div>
         )}
         
         <div className="flex flex-col md:flex-row gap-8 items-center">
             
             {/* Left: Content / Controls */}
             <div className="flex-1 w-full">
                 <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 uppercase italic tracking-tighter mb-1 flex items-center gap-2">
                    <Crown className="text-yellow-400 fill-yellow-600"/> Player of the Match
                 </h2>
                 <p className="text-slate-400 text-sm mb-6">Wähle den besten Spieler des heutigen Spieltags.</p>

                 {activePotm.isActive ? (
                     <div className="space-y-4">
                         {/* VOTING AREA */}
                         {hasPlayerCard ? (
                             <div className="bg-black/30 p-4 rounded-xl border border-indigo-500/30">
                                 <h3 className="text-indigo-200 font-bold mb-3 flex items-center gap-2"><Vote size={18}/> Deine Stimme abgeben</h3>
                                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-1">
                                     {players.map(p => {
                                         const isSelected = activePotm.votes[currentUserId] === p.id;
                                         return (
                                             <button 
                                                key={p.id}
                                                onClick={() => castPotmVote(p.id)}
                                                className={`text-left p-2 rounded text-xs font-bold truncate transition border ${isSelected ? 'bg-yellow-500 text-black border-yellow-400 shadow-lg scale-105' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                                             >
                                                 {p.name}
                                             </button>
                                         );
                                     })}
                                 </div>
                             </div>
                         ) : (
                             <div className="bg-red-900/20 text-red-300 p-4 rounded-xl border border-red-900/50 flex items-center gap-3">
                                 <Lock size={20}/>
                                 <span className="text-sm">Du benötigst eine eigene Spielerkarte um abzustimmen.</span>
                             </div>
                         )}

                         {/* Live Results Bar (Visible to all) */}
                         <div className="mt-4">
                             <h4 className="text-xs text-indigo-300 uppercase font-bold mb-2">Live Ergebnisse</h4>
                             <div className="space-y-1">
                                 {currentVoteData.map((d: any) => (
                                     <div key={d.id} className="flex items-center gap-2 text-xs">
                                         <div className="w-20 truncate text-indigo-100">{d.name}</div>
                                         <div className="flex-1 h-2 bg-indigo-900/50 rounded-full overflow-hidden">
                                             <div className="h-full bg-yellow-400" style={{ width: `${(d.votes / Object.keys(activePotm.votes).length) * 100}%` }}></div>
                                         </div>
                                         <span className="font-mono text-indigo-300">{d.votes}</span>
                                     </div>
                                 ))}
                                 {currentVoteData.length === 0 && <span className="text-indigo-400/50 text-xs italic">Noch keine Stimmen...</span>}
                             </div>
                         </div>
                         
                         {/* ADMIN DETAILS TOGGLE */}
                         {isAdmin && activePotm.isActive && (
                            <div className="bg-slate-950/50 border border-slate-700 rounded-lg p-3 mt-4">
                                <button 
                                    onClick={() => setShowVoteDetails(!showVoteDetails)} 
                                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-white uppercase font-bold w-full"
                                >
                                    {showVoteDetails ? <EyeOff size={14}/> : <Eye size={14}/>} 
                                    {showVoteDetails ? 'Details ausblenden' : 'Details / Log anzeigen'}
                                </button>
                                
                                {showVoteDetails && (
                                    <div className="mt-3 space-y-3 max-h-40 overflow-y-auto pr-2">
                                        {currentVoteData.length === 0 && <span className="text-xs text-slate-600">Keine Daten.</span>}
                                        {currentVoteData.map((d: any) => {
                                            const voters = getVoterNamesForPlayer(d.id);
                                            return (
                                                <div key={d.id} className="text-xs border-b border-slate-800 pb-2 last:border-0">
                                                    <div className="flex justify-between text-indigo-300 font-bold mb-1">
                                                        <span>{d.name}</span>
                                                        <span>{d.votes} Stimmen</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {voters.map((voter, i) => (
                                                            <span key={i} className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
                                                                {voter}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                         )}

                         {/* Admin End Button */}
                         {isAdmin && (
                             <button onClick={handleEndVoting} className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-red-900/20 transition">
                                 <Square size={16} fill="currentColor"/> Voting Beenden & Gewinner küren
                             </button>
                         )}
                     </div>
                 ) : (
                     <div className="space-y-6">
                         {/* Show Last Winner Info */}
                         {lastWinnerData ? (
                             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                 <div className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-2">
                                     <Calendar size={12}/> Letzter Gewinner ({lastWinnerData.date})
                                 </div>
                                 <div className="text-white text-lg font-bold">
                                     {players.find(p => p.id === lastWinnerData.playerId)?.name || 'Unbekannt'}
                                     <span className="text-yellow-500 text-sm ml-2 font-normal">mit {lastWinnerData.votesReceived} Stimmen</span>
                                 </div>
                             </div>
                         ) : (
                             <div className="text-slate-500 italic">Noch keine POTM Historie.</div>
                         )}

                         {/* Admin Start Controls */}
                         {isAdmin && (
                             <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                 <label className="text-xs text-slate-400 uppercase font-bold block mb-2">Datum des Spiels</label>
                                 <div className="flex gap-2">
                                     <input 
                                        type="date" 
                                        value={matchDateInput}
                                        onChange={(e) => setMatchDateInput(e.target.value)}
                                        className="bg-slate-900 border border-slate-600 text-white rounded px-3 py-2 text-sm flex-1"
                                     />
                                     <button onClick={handleStartVoting} className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded flex items-center gap-2 text-sm transition">
                                         <Play size={16}/> Voting Starten
                                     </button>
                                 </div>
                             </div>
                         )}
                     </div>
                 )}
             </div>

             {/* Right: Winner Display / Placeholder */}
             <div className="w-full md:w-auto flex justify-center md:justify-end">
                 {activePotm.isActive ? (
                     <div className="w-48 h-64 bg-indigo-900/20 rounded-xl border-2 border-dashed border-indigo-500/30 flex items-center justify-center flex-col gap-2 animate-pulse">
                         <Crown size={48} className="text-indigo-500/50"/>
                         <span className="text-indigo-300/50 text-xs font-bold uppercase">Wird gesucht...</span>
                     </div>
                 ) : lastWinner ? (
                     <div className="relative group perspective-1000">
                         <div className="absolute -inset-1 bg-gradient-to-tr from-yellow-600 via-yellow-400 to-yellow-600 rounded-[2.5rem] blur opacity-50"></div>
                         <div className="relative transform rotate-3 transition group-hover:rotate-0 duration-500">
                            <PlayerCard player={lastWinner} size="md" disableHover />
                         </div>
                         <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-black px-4 py-1 rounded-full shadow-xl border-2 border-yellow-200 text-xs whitespace-nowrap z-20">
                             POTM {lastWinnerData?.date}
                         </div>
                     </div>
                 ) : (
                     <div className="w-48 h-64 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center">
                         <span className="text-slate-600 text-xs font-bold">Kein Gewinner</span>
                     </div>
                 )}
             </div>

         </div>
      </div>

      {/* Real Game Stats: Top Scorers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Club size={100} /></div>
        <h3 className="text-xl font-bold mb-6 text-white border-b border-slate-800 pb-2 relative z-10">Torschützenkönige</h3>
        {topScorers.length > 0 ? (
            <div className="h-[250px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topScorers}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="goals" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={30} label={{ position: 'top', fill: 'white' }} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500 italic">
                Noch keine Spiele gespielt.
            </div>
        )}
      </div>

      {/* Ratings Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-6 text-white border-b border-slate-800 pb-2">Top 5 OVR Ratings</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topRatedData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="rating" fill="#facc15" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Win Rate Stats (Table style) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
         <h3 className="text-xl font-bold mb-4 text-white">Gewinnquote (Top 5)</h3>
         <div className="space-y-2">
            {bestWinRate.length > 0 ? bestWinRate.map((p, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-800/50 p-3 rounded border border-slate-700">
                    <span className="text-sm font-bold text-slate-200">{i+1}. {p.name}</span>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${p.rate}%` }}></div>
                        </div>
                        <span className="text-xs font-mono text-blue-400 w-8 text-right">{p.rate}%</span>
                    </div>
                </div>
            )) : (
                <div className="text-center text-slate-500 py-10 italic">Noch keine Spiele gespielt.</div>
            )}
         </div>
      </div>

    </div>
  );
};

export default StatsView;
