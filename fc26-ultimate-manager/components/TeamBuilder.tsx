
import React, { useState, useEffect } from 'react';
import { Player, Formation, Team } from '../types';
import { FORMATIONS } from '../constants';
import { saveTeam, getTeams, deleteTeam, getDatabase, getPlayerById } from '../services/playerService';
import PlayerCard from './PlayerCard';
import ConfirmationModal from './ConfirmationModal';
import { Plus, Save, Trash2, Check, Wand2, X, Loader2, RefreshCcw } from 'lucide-react';

interface TeamBuilderProps {
  allPlayers: Player[]; 
}

const TeamBuilder: React.FC<TeamBuilderProps> = ({ allPlayers }) => {
  const [currentFormation, setCurrentFormation] = useState<Formation>(FORMATIONS[0]);
  const [team, setTeam] = useState<(Player | null)[]>([null, null, null, null, null]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('Mein Team');
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [savedTeams, setSavedTeams] = useState<Team[]>([]);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  // Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [genCount, setGenCount] = useState(3);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load Saved Teams on Mount
  useEffect(() => {
    const loadData = async () => {
        const t = await getTeams();
        setSavedTeams(t);
    };
    loadData();
  }, []);

  const handleSlotClick = (index: number) => setActiveSlot(index);

  const handlePlayerSelect = (player: Player) => {
    if (activeSlot !== null) {
      const newTeam = [...team];
      const existingIndex = newTeam.findIndex(p => p?.id === player.id);
      if (existingIndex >= 0) newTeam[existingIndex] = null;
      newTeam[activeSlot] = player;
      setTeam(newTeam);
      setActiveSlot(null);
    }
  };

  // --- LOGIC: FILL CURRENT TEAM ---
  const fillCurrentTeam = () => {
      const newTeam = [...team];
      const usedIds = new Set(newTeam.map(p => p?.id).filter(Boolean));

      currentFormation.positions.forEach((pos, index) => {
          if (newTeam[index]) return; // Skip filled slots

          // 1. Try exact position match
          let candidates = allPlayers.filter(p => p.position === pos.role && !usedIds.has(p.id));
          
          // 2. Fallback: Any player not used
          if (candidates.length === 0) {
              candidates = allPlayers.filter(p => !usedIds.has(p.id));
          }

          if (candidates.length > 0) {
              // Pick random from top 5 best fit to keep it strong but varied
              candidates.sort((a,b) => b.rating - a.rating);
              const topCut = candidates.slice(0, 5);
              const selected = topCut[Math.floor(Math.random() * topCut.length)];
              
              newTeam[index] = selected;
              usedIds.add(selected.id);
          }
      });
      setTeam(newTeam);
      setShowGenerator(false);
  };

  // --- LOGIC: BULK GENERATE TEAMS ---
  const handleBulkGenerate = async () => {
      if (allPlayers.length < 5) {
          alert("Nicht genügend Spieler in der Datenbank!");
          return;
      }
      setIsGenerating(true);

      for (let i = 0; i < genCount; i++) {
          // 1. Random Formation
          const rndFormation = FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)];
          
          // 2. Select Players
          const teamIds: (string|null)[] = [];
          const usedInThisTeam = new Set<string>();

          for (const pos of rndFormation.positions) {
              let candidates = allPlayers.filter(p => p.position === pos.role && !usedInThisTeam.has(p.id));
              if (candidates.length === 0) candidates = allPlayers.filter(p => !usedInThisTeam.has(p.id));

              if (candidates.length > 0) {
                  // Randomize selection slightly so not always the same best players
                  const randomIndex = Math.floor(Math.random() * Math.min(candidates.length, 8)); 
                  const selected = candidates[randomIndex]; // Pick one of the top 8 available
                  teamIds.push(selected.id);
                  usedInThisTeam.add(selected.id);
              } else {
                  teamIds.push(null);
              }
          }

          // 3. Create & Save
          const newTeam: Team = {
              id: Date.now().toString() + Math.random().toString().slice(2,5),
              name: `Gen. Team ${savedTeams.length + i + 1} (${rndFormation.name})`,
              formationName: rndFormation.name,
              playerIds: teamIds,
              createdAt: Date.now() + i
          };
          await saveTeam(newTeam);
      }

      // Reload
      const updated = await getTeams();
      setSavedTeams(updated);
      setIsGenerating(false);
      setShowGenerator(false);
  };

  const handleFormationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formation = FORMATIONS.find(f => f.name === e.target.value);
    if (formation) {
      setCurrentFormation(formation);
      setTeam([null, null, null, null, null]);
    }
  };

  const handleSaveTeam = async () => {
    const playerIds = team.map(p => p ? p.id : null);
    const newTeam: Team = {
        id: Date.now().toString(),
        name: teamName,
        formationName: currentFormation.name,
        playerIds,
        createdAt: Date.now()
    };
    await saveTeam(newTeam);
    const updated = await getTeams();
    setSavedTeams(updated);
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 2000);
  };

  const confirmDeleteTeam = async () => {
      if (teamToDelete) {
          await deleteTeam(teamToDelete);
          const updated = await getTeams();
          setSavedTeams(updated);
          setTeamToDelete(null);
      }
  };

  const loadTeam = async (t: Team) => {
      setTeamName(t.name);
      const form = FORMATIONS.find(f => f.name === t.formationName) || FORMATIONS[0];
      setCurrentFormation(form);
      const loadedPlayers = t.playerIds.map(id => {
          if (!id) return null;
          return allPlayers.find(p => p.id === id) || null;
      });
      setTeam(loadedPlayers);
  };

  const activePlayers = team.filter(p => p !== null) as Player[];
  const avgRating = activePlayers.length > 0 ? Math.round(activePlayers.reduce((acc, p) => acc + p.rating, 0) / activePlayers.length) : 0;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 pb-20 lg:pb-0 relative font-sans">
      
      {/* --- GENERATOR MODAL --- */}
      {showGenerator && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-purple-500/50 rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>
                
                <button onClick={() => setShowGenerator(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>

                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Wand2 className="text-purple-400" /> Team Generator
                </h2>

                <div className="space-y-6">
                    {/* Option 1: Current Field */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 hover:border-slate-500 transition cursor-pointer" onClick={fillCurrentTeam}>
                        <h3 className="font-bold text-white flex items-center gap-2 mb-1">
                            <RefreshCcw size={16} className="text-blue-400"/> Aktuelles Feld füllen
                        </h3>
                        <p className="text-xs text-slate-400">Füllt leere Positionen in der aktuellen Formation auf.</p>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px bg-slate-700 flex-1"></div>
                        <span className="text-slate-500 text-xs font-bold uppercase">ODER</span>
                        <div className="h-px bg-slate-700 flex-1"></div>
                    </div>

                    {/* Option 2: Bulk Generation */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                            <Save size={16} className="text-green-400"/> Neue Teams erstellen
                        </h3>
                        
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-300">Anzahl</span>
                                <span className="font-bold text-purple-400">{genCount} Teams</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                value={genCount} 
                                onChange={(e) => setGenCount(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>1</span>
                                <span>10</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleBulkGenerate} 
                            disabled={isGenerating}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                            {isGenerating ? 'Generiere...' : 'Generieren & Speichern'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- BUILDER UI --- */}
      <div className="flex-1 relative flex flex-col items-center justify-center min-h-[600px] bg-slate-900 rounded-xl overflow-hidden border-4 border-slate-800 shadow-2xl">
         {/* Top Bar */}
         <div className="absolute top-4 left-4 right-4 z-20 flex flex-col md:flex-row justify-between bg-black/60 backdrop-blur-md p-3 rounded-lg text-white border border-white/10 gap-3">
             <div className="flex items-center gap-2">
                 <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="bg-transparent border-b border-white/20 font-bold w-40 text-white font-sans uppercase tracking-wide" />
                 <select value={currentFormation.name} onChange={handleFormationChange} className="bg-slate-800 rounded p-1 text-sm font-bold text-green-400 ml-2 font-sans">
                    {FORMATIONS.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
                 </select>
             </div>
             <div className="flex gap-2 items-center">
                 <span className="font-bold text-2xl text-yellow-400 mr-4 font-mono">{avgRating}</span>
                 
                 <button onClick={() => setShowGenerator(true)} title="Team Generator" className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs font-bold flex gap-1 items-center uppercase transition shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                    <Wand2 size={14}/> <span className="hidden sm:inline">Auto</span>
                 </button>

                 <button onClick={handleSaveTeam} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold flex gap-1 items-center uppercase transition">
                    {showSavedMsg ? <Check size={14}/> : <Save size={14}/>} <span className="hidden sm:inline">Save</span>
                 </button>
             </div>
         </div>

         {/* Pitch */}
         <div className="relative w-full max-w-[500px] aspect-[2/3] bg-pitch-dark m-4 rounded-lg overflow-hidden border-2 border-white/20 pitch-pattern mt-20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {currentFormation.positions.map((pos, index) => {
                const player = team[index];
                return (
                <div key={index} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos.x}%`, top: `${100 - pos.y}%` }}>
                    {player ? (
                        <div onClick={() => setActiveSlot(index)}><PlayerCard player={player} size="sm" /></div>
                    ) : (
                        <button onClick={() => setActiveSlot(index)} className="w-16 h-16 rounded-full bg-black/20 border-2 border-dashed border-white/30 flex items-center justify-center text-white/50 hover:bg-white/10 hover:border-white transition">
                            <Plus size={24}/>
                        </button>
                    )}
                </div>
                );
            })}
         </div>
      </div>

      <div className={`fixed inset-0 z-50 lg:static lg:inset-auto lg:z-0 lg:w-80 bg-slate-900 border-l border-slate-800 flex flex-col ${activeSlot !== null ? 'flex' : 'hidden lg:flex'}`}>
         <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
             <h3 className="font-bold uppercase tracking-wider text-slate-300 text-sm">{activeSlot !== null ? 'Spieler wählen' : 'Gespeicherte Teams'}</h3>
             {activeSlot !== null && <button onClick={() => setActiveSlot(null)} className="lg:hidden text-sm text-slate-400 mt-2">Zurück</button>}
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-2">
             {activeSlot !== null ? (
                 allPlayers.map(player => (
                     <div key={player.id} onClick={() => handlePlayerSelect(player)} className="flex items-center gap-3 p-2 rounded-lg border border-slate-800 bg-slate-800/50 cursor-pointer hover:bg-slate-700 hover:border-slate-600 transition group">
                         <img src={player.image} className="w-10 h-10 rounded object-cover border border-slate-700"/>
                         <div>
                             <span className="font-bold text-sm block group-hover:text-green-400">{player.name}</span>
                             <span className="text-xs text-yellow-500 font-mono font-bold">{player.rating}</span> <span className="text-xs text-slate-500 uppercase">{player.position}</span>
                         </div>
                     </div>
                 ))
             ) : (
                 savedTeams.map(t => (
                    <div key={t.id} onClick={() => loadTeam(t)} className="bg-slate-800 p-3 rounded-lg cursor-pointer hover:bg-slate-700 relative group border border-transparent hover:border-slate-600 transition">
                        <span className="font-bold block text-white uppercase tracking-wide">{t.name}</span>
                        <span className="text-xs text-slate-500 uppercase">{t.formationName} • {t.playerIds.filter(x=>x).length} Spieler</span>
                        <button onClick={(e) => { e.stopPropagation(); setTeamToDelete(t.id); }} className="absolute right-2 top-2 p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                    </div>
                 ))
             )}
         </div>
      </div>
      {teamToDelete && <ConfirmationModal title="Löschen?" message="Team löschen?" onConfirm={confirmDeleteTeam} onCancel={() => setTeamToDelete(null)} />}
    </div>
  );
};

export default TeamBuilder;
