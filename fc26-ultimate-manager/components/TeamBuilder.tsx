
import React, { useState, useEffect } from 'react';
import { Player, Formation, Team } from '../types';
import { FORMATIONS } from '../constants';
import { saveTeam, getTeams, deleteTeam } from '../services/playerService';
import PlayerCard from './PlayerCard';
import ConfirmationModal from './ConfirmationModal';
import { Plus, Save, Trash2, Check, Wand2, X, Loader2, RefreshCcw, FolderHeart, Users, CheckSquare, Square, AlertTriangle } from 'lucide-react';

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
  const [showSavedMobile, setShowSavedMobile] = useState(false);

  // Generator State
  const [showGenerator, setShowGenerator] = useState(false);
  const [genCount, setGenCount] = useState(2); // Default to 2 for a match
  const [isGenerating, setIsGenerating] = useState(false);
  const [poolSelection, setPoolSelection] = useState<Set<string>>(new Set());

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

  const requiredPoolSize = genCount * 5;

  const togglePoolPlayer = (id: string) => {
      const newSet = new Set(poolSelection);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          // STRICT LIMIT CHECK
          if (newSet.size >= requiredPoolSize) return;
          newSet.add(id);
      }
      setPoolSelection(newSet);
  };

  const clearPool = () => {
      setPoolSelection(new Set());
  };

  // --- LOGIC: FILL CURRENT TEAM ---
  const fillCurrentTeam = () => {
      const newTeam = [...team];
      const usedIds = new Set(newTeam.map(p => p?.id).filter(Boolean));

      currentFormation.positions.forEach((pos, index) => {
          if (newTeam[index]) return; // Skip filled slots
          let candidates = allPlayers.filter(p => p.position === pos.role && !usedIds.has(p.id));
          if (candidates.length === 0) candidates = allPlayers.filter(p => !usedIds.has(p.id));

          if (candidates.length > 0) {
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

  // --- LOGIC: BULK GENERATE TEAMS (ONLY POOL) ---
  const handleBulkGenerate = async () => {
      // Validate
      if (poolSelection.size !== requiredPoolSize) {
           return; // Button should be disabled anyway
      }

      setIsGenerating(true);
      
      const availablePool = allPlayers.filter(p => poolSelection.has(p.id));

      // Shuffle logic
      const shuffle = (array: Player[]) => {
          let currentIndex = array.length, randomIndex;
          while (currentIndex != 0) {
              randomIndex = Math.floor(Math.random() * currentIndex);
              currentIndex--;
              [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
          }
          return array;
      };

      let masterList = shuffle([...availablePool]);
      let masterIndex = 0;

      for (let i = 0; i < genCount; i++) {
          const rndFormation = FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)];
          const teamIds: (string|null)[] = [];
          
          for (let k = 0; k < 5; k++) {
              if (masterIndex < masterList.length) {
                  teamIds.push(masterList[masterIndex].id);
                  masterIndex++;
              } else {
                  teamIds.push(null);
              }
          }

          const newTeam: Team = {
              id: Date.now().toString() + Math.random().toString().slice(2,5),
              name: `Team ${savedTeams.length + i + 1} (Pool)`,
              formationName: rndFormation.name,
              playerIds: teamIds,
              createdAt: Date.now() + i
          };
          await saveTeam(newTeam);
      }

      const updated = await getTeams();
      setSavedTeams(updated);
      setIsGenerating(false);
      setShowGenerator(false);
      setShowSavedMobile(true);
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
      setShowSavedMobile(false); 
  };

  const activePlayers = team.filter(p => p !== null) as Player[];
  const avgRating = activePlayers.length > 0 ? Math.round(activePlayers.reduce((acc, p) => acc + p.rating, 0) / activePlayers.length) : 0;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 pb-20 lg:pb-0 relative font-sans">
      
      {/* --- GENERATOR MODAL --- */}
      {showGenerator && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-purple-500/50 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>
                
                <button onClick={() => setShowGenerator(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>

                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 shrink-0">
                    <Wand2 className="text-purple-400" /> Team Generator
                </h2>

                <div className="overflow-y-auto pr-2 space-y-6 flex-1">
                    
                    {/* Settings */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-300">Wie viele Teams?</span>
                            <span className="font-bold text-purple-400">{genCount} Teams ({requiredPoolSize} Spieler)</span>
                        </div>
                        <input 
                            type="range" 
                            min="2" 
                            max="4" 
                            value={genCount} 
                            onChange={(e) => {
                                setGenCount(parseInt(e.target.value));
                                setPoolSelection(new Set()); // Reset selection when count changes to avoid confusion
                            }}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                         <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>2</span>
                                <span>4</span>
                        </div>
                    </div>

                    {/* Pool Selection */}
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 relative">
                             <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Users size={16} className="text-blue-400"/> Spieler-Topf
                                </h3>
                                <button onClick={clearPool} className="text-xs text-red-400 font-bold uppercase hover:text-red-300">
                                    Reset
                                </button>
                             </div>
                             
                             <div className="flex justify-between items-center mb-3 bg-slate-900 p-2 rounded border border-slate-800">
                                <span className="text-xs text-slate-400">Ausgewählt:</span>
                                <span className={`text-sm font-black ${poolSelection.size === requiredPoolSize ? 'text-green-400' : 'text-yellow-500'}`}>
                                    {poolSelection.size} / {requiredPoolSize}
                                </span>
                             </div>
                             
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-900 rounded border border-slate-700">
                                 {allPlayers.map(p => {
                                     const isSelected = poolSelection.has(p.id);
                                     const isDisabled = !isSelected && poolSelection.size >= requiredPoolSize;
                                     
                                     return (
                                        <div 
                                            key={p.id} 
                                            onClick={() => !isDisabled && togglePoolPlayer(p.id)} 
                                            className={`flex items-center gap-2 p-1.5 rounded select-none transition ${isSelected ? 'bg-purple-900/50 border border-purple-500/50 cursor-pointer' : isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800 cursor-pointer'}`}
                                        >
                                            {isSelected ? <CheckSquare size={14} className="text-purple-400"/> : <Square size={14} className="text-slate-600"/>}
                                            <span className={`text-xs truncate ${isSelected ? 'text-white font-bold' : 'text-slate-400'}`}>{p.name}</span>
                                        </div>
                                     );
                                 })}
                             </div>
                    </div>

                    {poolSelection.size < requiredPoolSize && (
                        <div className="flex items-center gap-2 text-yellow-500 text-xs bg-yellow-500/10 p-2 rounded">
                            <AlertTriangle size={14} />
                            <span>Bitte wähle genau {requiredPoolSize} Spieler aus.</span>
                        </div>
                    )}

                    <button 
                        onClick={handleBulkGenerate} 
                        disabled={isGenerating || poolSelection.size !== requiredPoolSize}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                        {isGenerating ? 'Würfelt...' : 'Teams Generieren'}
                    </button>
                    
                    <div className="border-t border-slate-800 pt-4">
                        <div className="text-center text-xs text-slate-500 mb-2">Oder:</div>
                        <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700 hover:bg-slate-800 cursor-pointer flex items-center justify-between group" onClick={fillCurrentTeam}>
                            <div className="text-xs text-slate-300 group-hover:text-white">Nur aktuelles Team zufällig füllen</div>
                            <RefreshCcw size={14} className="text-slate-500 group-hover:text-white"/>
                        </div>
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
                 <button onClick={() => setShowSavedMobile(!showSavedMobile)} className="lg:hidden p-2 bg-slate-800 rounded text-green-400 border border-slate-700">
                    <FolderHeart size={18} />
                 </button>

                 <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="bg-transparent border-b border-white/20 font-bold w-full md:w-40 text-white font-sans uppercase tracking-wide text-sm md:text-base" />
                 <select value={currentFormation.name} onChange={handleFormationChange} className="bg-slate-800 rounded p-1 text-sm font-bold text-green-400 ml-2 font-sans max-w-[100px] md:max-w-none">
                    {FORMATIONS.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
                 </select>
             </div>
             <div className="flex gap-2 items-center justify-end">
                 <span className="font-bold text-xl md:text-2xl text-yellow-400 mr-2 md:mr-4 font-mono">{avgRating}</span>
                 
                 <button onClick={() => setShowGenerator(true)} title="Team Generator" className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded text-xs font-bold flex gap-1 items-center uppercase transition shadow-[0_0_10px_rgba(168,85,247,0.5)]">
                    <Wand2 size={14}/> <span className="hidden sm:inline">Topf-Gen</span>
                 </button>

                 <button onClick={handleSaveTeam} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold flex gap-1 items-center uppercase transition">
                    {showSavedMsg ? <Check size={14}/> : <Save size={14}/>} <span className="hidden sm:inline">Save</span>
                 </button>
             </div>
         </div>

         {/* Pitch */}
         <div className="relative w-full max-w-[500px] aspect-[2/3] bg-pitch-dark m-4 rounded-lg overflow-hidden border-2 border-white/20 pitch-pattern mt-20 shadow-[0_0_50px_rgba(0,0,0,0.5)] scale-90 md:scale-100 origin-top">
            {currentFormation.positions.map((pos, index) => {
                const player = team[index];
                return (
                <div key={index} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos.x}%`, top: `${100 - pos.y}%` }}>
                    {player ? (
                        <div onClick={() => setActiveSlot(index)}><PlayerCard player={player} size="sm" /></div>
                    ) : (
                        <button onClick={() => setActiveSlot(index)} className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/20 border-2 border-dashed border-white/30 flex items-center justify-center text-white/50 hover:bg-white/10 hover:border-white transition">
                            <Plus size={24}/>
                        </button>
                    )}
                </div>
                );
            })}
         </div>
      </div>

      {/* Sidebar / Mobile Overlay for Players & Saved Teams */}
      <div className={`fixed inset-0 z-50 lg:static lg:inset-auto lg:z-0 lg:w-80 bg-slate-900 border-l border-slate-800 flex flex-col ${activeSlot !== null || showSavedMobile ? 'flex' : 'hidden lg:flex'}`}>
         <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex justify-between items-center">
             <h3 className="font-bold uppercase tracking-wider text-slate-300 text-sm">
                 {activeSlot !== null ? 'Spieler wählen' : 'Gespeicherte Teams'}
             </h3>
             {(activeSlot !== null || showSavedMobile) && (
                 <button onClick={() => { setActiveSlot(null); setShowSavedMobile(false); }} className="lg:hidden text-slate-400 p-1 bg-slate-800 rounded-full">
                     <X size={18}/>
                 </button>
             )}
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
                 savedTeams.length > 0 ? savedTeams.map(t => (
                    <div key={t.id} onClick={() => loadTeam(t)} className="bg-slate-800 p-3 rounded-lg cursor-pointer hover:bg-slate-700 relative group border border-transparent hover:border-slate-600 transition">
                        <span className="font-bold block text-white uppercase tracking-wide truncate pr-6">{t.name}</span>
                        <span className="text-xs text-slate-500 uppercase">{t.formationName} • {t.playerIds.filter(x=>x).length} Spieler</span>
                        <button onClick={(e) => { e.stopPropagation(); setTeamToDelete(t.id); }} className="absolute right-2 top-2 p-1 text-slate-500 hover:text-red-400 lg:opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                    </div>
                 )) : <div className="text-center text-slate-500 text-sm py-10">Keine Teams gespeichert.</div>
             )}
         </div>
      </div>
      {teamToDelete && <ConfirmationModal title="Löschen?" message="Team löschen?" onConfirm={confirmDeleteTeam} onCancel={() => setTeamToDelete(null)} />}
    </div>
  );
};

export default TeamBuilder;
