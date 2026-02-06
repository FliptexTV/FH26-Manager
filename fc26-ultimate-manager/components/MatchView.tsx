
import React, { useState, useEffect, useRef } from 'react';
import { Player, Team, MatchResult, MatchEvent } from '../types';
import { getTeams, saveMatch, getMatches, getPlayerById } from '../services/playerService';
import { Play, Pause, Save, Trophy, Timer, Club, History, Calendar, LayoutList } from 'lucide-react';

const MatchView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [teams, setTeams] = useState<Team[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchResult[]>([]);
  
  const [homeTeamId, setHomeTeamId] = useState<string>('');
  const [awayTeamId, setAwayTeamId] = useState<string>('');
  const [isMatchActive, setIsMatchActive] = useState(false);
  const [matchFinished, setMatchFinished] = useState(false);
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [scoringTeam, setScoringTeam] = useState<string | null>(null);

  // Cache for player names to avoid excessive async calls during render
  const [playerCache, setPlayerCache] = useState<Record<string, Player>>({});

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
        setTeams(await getTeams());
        setMatchHistory((await getMatches()).reverse());
    };
    loadData();
  }, []);

  // Timer Logic (Same as before)
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
      // Pre-fetch players involved in history
      matchHistory.forEach(m => m.events.forEach(e => resolvePlayer(e.playerId)));
  }, [matchHistory]);

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  
  const startMatch = () => {
    if (homeTeamId && awayTeamId && homeTeamId !== awayTeamId) {
      setIsMatchActive(true);
      setIsRunning(true);
      // Pre-fetch team players
      const home = teams.find(t => t.id === homeTeamId);
      const away = teams.find(t => t.id === awayTeamId);
      home?.playerIds.forEach(id => id && resolvePlayer(id));
      away?.playerIds.forEach(id => id && resolvePlayer(id));
    }
  };

  const handleGoal = (teamId: string) => { if (isRunning) setScoringTeam(teamId); };

  const confirmGoal = (playerId: string) => {
    if (!scoringTeam) return;
    if (scoringTeam === homeTeamId) setHomeScore(h => h + 1); else setAwayScore(a => a + 1);
    setEvents(prev => [...prev, { type: 'goal', playerId, minute: Math.floor(time / 60), teamId: scoringTeam }]);
    setScoringTeam(null);
  };

  const finishMatch = () => { setIsRunning(false); setMatchFinished(true); };

  const saveMatchResult = async () => {
    const match: MatchResult = {
      id: Date.now().toString(),
      homeTeamId, awayTeamId, homeScore, awayScore, date: Date.now(), duration: time, events
    };
    await saveMatch(match);
    setMatchHistory(prev => [match, ...prev]);
    setIsMatchActive(false);
    setMatchFinished(false);
    setTime(0); setHomeScore(0); setAwayScore(0); setEvents([]);
    setActiveTab('history');
  };

  if (isMatchActive || matchFinished) {
      const homeTeam = teams.find(t => t.id === homeTeamId);
      const awayTeam = teams.find(t => t.id === awayTeamId);

      return (
        <div className="flex flex-col h-full max-w-4xl mx-auto p-4 pb-24">
            {/* Scoreboard */}
            <div className="bg-slate-900 border-4 border-slate-800 rounded-2xl p-6 text-center relative">
                 <div className="text-2xl font-mono text-yellow-400 mb-4">{formatTime(time)}</div>
                 <div className="flex justify-between items-center text-4xl md:text-6xl font-black text-white">
                     <div onClick={() => handleGoal(homeTeamId)} className="cursor-pointer hover:text-green-400">{homeScore}</div>
                     <div className="text-slate-600">:</div>
                     <div onClick={() => handleGoal(awayTeamId)} className="cursor-pointer hover:text-red-400">{awayScore}</div>
                 </div>
                 <div className="flex justify-between text-sm mt-2 text-slate-400 font-bold">
                     <span>{homeTeam?.name}</span><span>{awayTeam?.name}</span>
                 </div>
                 <div className="mt-8 flex justify-center gap-4">
                     {!matchFinished ? (
                         <><button onClick={() => setIsRunning(!isRunning)} className="bg-slate-800 p-3 rounded-full text-white">{isRunning ? <Pause/> : <Play/>}</button> 
                           <button onClick={finishMatch} className="bg-red-600 px-6 py-2 rounded-lg text-white font-bold">Ende</button></>
                     ) : (
                         <button onClick={saveMatchResult} className="bg-green-600 px-8 py-3 rounded-lg text-white font-bold flex gap-2"><Save/> Speichern</button>
                     )}
                 </div>
            </div>

            {/* Events */}
            <div className="mt-4 space-y-2">
                {[...events].reverse().map((ev, i) => (
                    <div key={i} className="bg-slate-900 p-2 rounded flex gap-2 items-center border border-slate-800">
                        <span className="font-mono text-slate-500">{ev.minute}'</span>
                        <Club size={12} className={ev.teamId === homeTeamId ? 'text-green-400' : 'text-red-400'}/>
                        <span>{playerCache[ev.playerId]?.name || 'Loading...'}</span>
                    </div>
                ))}
            </div>

            {/* Scorer Overlay */}
            {scoringTeam && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                        <h3 className="font-bold text-white mb-4">Torschütze</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {(scoringTeam === homeTeamId ? homeTeam : awayTeam)?.playerIds.map(pid => {
                                if(!pid) return null;
                                const p = playerCache[pid];
                                return (
                                    <button key={pid} onClick={() => confirmGoal(pid)} className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded text-left truncate">
                                        {p ? p.name : 'Lade...'}
                                    </button>
                                )
                            })}
                        </div>
                        <button onClick={() => setScoringTeam(null)} className="mt-4 w-full py-2 text-slate-400">Abbrechen</button>
                    </div>
                </div>
            )}
        </div>
      );
  }

  // Simplified Setup View
  return (
      <div className="max-w-2xl mx-auto p-4">
          <div className="flex bg-slate-900 p-1 rounded-xl mb-6 border border-slate-800">
             <button onClick={() => setActiveTab('new')} className={`flex-1 py-2 rounded-lg font-bold ${activeTab === 'new' ? 'bg-slate-700' : 'text-slate-500'}`}>Neues Match</button>
             <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-lg font-bold ${activeTab === 'history' ? 'bg-slate-700' : 'text-slate-500'}`}>Verlauf</button>
          </div>
          
          {activeTab === 'new' ? (
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl">
                  <div className="flex justify-between gap-4 mb-8">
                      <select className="bg-slate-800 border border-slate-700 p-3 rounded w-full" value={homeTeamId} onChange={e => setHomeTeamId(e.target.value)}>
                          <option value="">Heim...</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <span className="font-bold text-2xl pt-2">VS</span>
                      <select className="bg-slate-800 border border-slate-700 p-3 rounded w-full" value={awayTeamId} onChange={e => setAwayTeamId(e.target.value)}>
                          <option value="">Auswärts...</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                  </div>
                  <button onClick={startMatch} disabled={!homeTeamId || !awayTeamId || homeTeamId === awayTeamId} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded disabled:opacity-50">Starten</button>
              </div>
          ) : (
              <div className="space-y-4">
                  {matchHistory.map(m => (
                      <div key={m.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                          <span className="font-bold">{teams.find(t=>t.id===m.homeTeamId)?.name}</span>
                          <span className="bg-black/40 px-3 py-1 rounded font-mono font-bold text-xl">{m.homeScore} : {m.awayScore}</span>
                          <span className="font-bold">{teams.find(t=>t.id===m.awayTeamId)?.name}</span>
                      </div>
                  ))}
                  {matchHistory.length === 0 && <div className="text-center text-slate-500">Keine Spiele.</div>}
              </div>
          )}
      </div>
  )
};

export default MatchView;
