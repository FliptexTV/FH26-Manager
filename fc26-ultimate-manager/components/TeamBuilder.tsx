
import React, { useState, useEffect } from 'react';
import { Player, Formation, Team } from '../types';
import { FORMATIONS } from '../constants';
import { saveTeam, getTeams, deleteTeam, getDatabase, getPlayerById } from '../services/playerService';
import PlayerCard from './PlayerCard';
import ConfirmationModal from './ConfirmationModal';
import { Plus, Save, Trash2, Check } from 'lucide-react';

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
    // Reload teams
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
      
      // We need to fetch players individually or find them in allPlayers
      // Since allPlayers is passed via Realtime Listener, we can use that for speed
      const loadedPlayers = t.playerIds.map(id => {
          if (!id) return null;
          return allPlayers.find(p => p.id === id) || null;
      });
      setTeam(loadedPlayers);
  };

  // ... (JSX render logic mostly similar, simplified for brevity)
  const activePlayers = team.filter(p => p !== null) as Player[];
  const avgRating = activePlayers.length > 0 ? Math.round(activePlayers.reduce((acc, p) => acc + p.rating, 0) / activePlayers.length) : 0;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 pb-20 lg:pb-0 relative">
      <div className="flex-1 relative flex flex-col items-center justify-center min-h-[600px] bg-slate-900 rounded-xl overflow-hidden border-4 border-slate-800 shadow-2xl">
         {/* ... Top Bar ... */}
         <div className="absolute top-4 left-4 right-4 z-20 flex flex-col md:flex-row justify-between bg-black/60 backdrop-blur-md p-3 rounded-lg text-white border border-white/10 gap-3">
             <div className="flex items-center gap-2">
                 <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="bg-transparent border-b border-white/20 font-bold w-40 text-white" />
                 <select value={currentFormation.name} onChange={handleFormationChange} className="bg-slate-800 rounded p-1 text-sm font-bold text-green-400 ml-2">
                    {FORMATIONS.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
                 </select>
             </div>
             <div className="flex gap-2 items-center">
                 <span className="font-bold text-xl text-yellow-400 mr-4">{avgRating}</span>
                 <button onClick={handleSaveTeam} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold flex gap-1 items-center">
                    {showSavedMsg ? <Check size={12}/> : <Save size={12}/>} Speichern
                 </button>
             </div>
         </div>

         {/* Pitch */}
         <div className="relative w-full max-w-[500px] aspect-[2/3] bg-pitch-dark m-4 rounded-lg overflow-hidden border-2 border-white/20 pitch-pattern mt-20">
            {currentFormation.positions.map((pos, index) => {
                const player = team[index];
                return (
                <div key={index} className="absolute transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos.x}%`, top: `${100 - pos.y}%` }}>
                    {player ? (
                        <div onClick={() => setActiveSlot(index)}><PlayerCard player={player} size="sm" /></div>
                    ) : (
                        <button onClick={() => setActiveSlot(index)} className="w-16 h-16 rounded-full bg-black/20 border-2 border-dashed border-white/30 flex items-center justify-center text-white/50"><Plus size={24}/></button>
                    )}
                </div>
                );
            })}
         </div>
      </div>

      <div className={`fixed inset-0 z-50 lg:static lg:inset-auto lg:z-0 lg:w-80 bg-slate-900 border-l border-slate-800 flex flex-col ${activeSlot !== null ? 'flex' : 'hidden lg:flex'}`}>
         <div className="p-4 border-b border-slate-800">
             <h3 className="font-bold">{activeSlot !== null ? 'Spieler wählen' : 'Gespeicherte Teams'}</h3>
             {activeSlot !== null && <button onClick={() => setActiveSlot(null)} className="lg:hidden text-sm text-slate-400 mt-2">Zurück</button>}
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-2">
             {activeSlot !== null ? (
                 allPlayers.map(player => (
                     <div key={player.id} onClick={() => handlePlayerSelect(player)} className="flex items-center gap-3 p-2 rounded-lg border border-slate-800 bg-slate-800/50 cursor-pointer hover:bg-slate-700">
                         <img src={player.image} className="w-10 h-10 rounded object-cover"/>
                         <span className="font-bold text-sm">{player.name} ({player.rating})</span>
                     </div>
                 ))
             ) : (
                 savedTeams.map(t => (
                    <div key={t.id} onClick={() => loadTeam(t)} className="bg-slate-800 p-3 rounded-lg cursor-pointer hover:bg-slate-700 relative group">
                        <span className="font-bold block">{t.name}</span>
                        <span className="text-xs text-slate-500">{t.formationName} • {t.playerIds.filter(x=>x).length} Spieler</span>
                        <button onClick={(e) => { e.stopPropagation(); setTeamToDelete(t.id); }} className="absolute right-2 top-2 p-1 text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
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
