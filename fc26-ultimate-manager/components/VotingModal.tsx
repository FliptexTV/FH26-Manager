
import React, { useState } from 'react';
import { Player, Position } from '../types';
import { voteForStat, getUserId } from '../services/playerService';
import { X, Trophy, Activity, ThumbsUp, ThumbsDown, Coins, TrendingUp, Club, Calendar, Crosshair } from 'lucide-react';
import PlayerCard from './PlayerCard';

interface VotingModalProps {
  player: Player;
  onClose: () => void;
  onUpdate: (updatedPlayer: Player) => void;
}

const VotingModal: React.FC<VotingModalProps> = ({ player, onClose, onUpdate }) => {
  const currentUserId = getUserId();
  const isGK = player.position === Position.GK;
  
  const statKeys = isGK 
    ? ['DIV', 'HAN', 'KIC', 'REF', 'SPE', 'POS']
    : ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

  const statLabels: Record<string, string> = isGK 
    ? { DIV: 'Hechten', HAN: 'Ballsicherheit', KIC: 'Abschlag', REF: 'Reflexe', SPE: 'Tempo', POS: 'Stellungsspiel' }
    : { PAC: 'Tempo', SHO: 'Schießen', PAS: 'Passen', DRI: 'Dribbling', DEF: 'Defensive', PHY: 'Physis' };

  const handleVote = async (statKey: string, direction: 'up' | 'down') => {
    const updatedPlayer = await voteForStat(player.id, statKey, direction);
    if (updatedPlayer) {
      onUpdate(updatedPlayer);
    }
  };
  
  const marketValue = (20 + (player.rating - 80)*3.3).toFixed(1);
  const totalVotes = Object.values(player.votes || {}).reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) as number;
  
  // Stats safe access
  const played = player.gameStats?.played || 0;
  const goals = player.gameStats?.goals || 0;
  const won = player.gameStats?.won || 0;
  const winRate = played > 0 ? Math.round((won / played) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Container: Full height on mobile (scrolling), fixed height on desktop */}
      <div className="bg-slate-900 border border-slate-700 w-full md:max-w-4xl h-full md:h-auto md:max-h-[90vh] md:rounded-xl shadow-2xl flex flex-col md:flex-row relative overflow-hidden">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-50 bg-black/50 rounded-full p-1">
          <X size={24} />
        </button>

        {/* Wrapper: Scrolling only on mobile vertically, desktop hidden overflow */}
        <div className="flex flex-col md:flex-row w-full h-full overflow-y-auto md:overflow-hidden">
            
            {/* Left Side: Card Preview */}
            <div className="w-full md:w-1/3 bg-slate-950 p-8 pt-24 md:p-0 flex flex-col items-center justify-start md:justify-center border-b md:border-b-0 md:border-r border-slate-800 bg-pitch-pattern relative shrink-0 min-h-[650px] md:min-h-0">
                <div className="absolute inset-0 bg-green-900/10 z-0"></div>
                
                {/* Desktop: Scale up slightly, Mobile: Normal */}
                <div className="relative z-10 md:scale-110 mb-6">
                    <PlayerCard player={player} size="lg" disableHover />
                </div>
                
                {/* Real Stats Display */}
                <div className="w-full md:w-[85%] bg-slate-900/90 rounded-xl border border-slate-700 backdrop-blur relative z-10 overflow-hidden mb-4">
                     <div className="bg-slate-800 p-2 border-b border-slate-700 flex items-center justify-between">
                         <span className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1"><Trophy size={12}/> Saison Stats</span>
                         <span className="text-[10px] text-green-400 font-mono bg-green-900/30 px-1 rounded border border-green-800">{winRate}% Siege</span>
                     </div>
                     <div className="grid grid-cols-3 divide-x divide-slate-800">
                         <div className="p-3 flex flex-col items-center">
                             <span className="text-xl font-bold text-white leading-none mb-1">{played}</span>
                             <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Calendar size={10}/> Spiele</span>
                         </div>
                         <div className="p-3 flex flex-col items-center">
                             <span className="text-xl font-bold text-green-400 leading-none mb-1">{goals}</span>
                             <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Crosshair size={10}/> Tore</span>
                         </div>
                         <div className="p-3 flex flex-col items-center">
                             <span className="text-xl font-bold text-blue-400 leading-none mb-1">{won}</span>
                             <span className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1"><Trophy size={10}/> Siege</span>
                         </div>
                     </div>
                </div>

                {/* Value Display */}
                <div className="w-full md:w-[85%] bg-slate-900/80 rounded-xl p-3 border border-slate-700 backdrop-blur relative z-10 text-sm">
                    <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                        <span className="text-xs text-slate-400 uppercase font-bold">Marktwert</span>
                        <div className="flex items-center gap-1 text-yellow-400 font-bold">
                            <Coins size={14} /> {marketValue} Mio.
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 uppercase font-bold">Community Vote</span>
                        <div className={`flex items-center gap-1 font-bold ${totalVotes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            <TrendingUp size={14} /> {totalVotes > 0 ? '+' : ''}{totalVotes}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Voting */}
            <div className="w-full md:w-2/3 p-6 md:p-8 bg-slate-900 md:overflow-y-auto">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                    <Activity className="text-green-400" />
                    <div>
                    <h3 className="text-xl font-bold text-white">Scouting Report</h3>
                    <p className="text-sm text-slate-400">Bewerte die Attribute des Spielers</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {statKeys.map(key => {
                        const voteData = player.votes?.[key] || { score: 0, userVotes: {} };
                        const userVote = voteData.userVotes[currentUserId];
                        const netScore = voteData.score;
                        const baseValue = player.stats[key as keyof typeof player.stats] || 0;

                        return (
                        <div key={key} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 flex items-center justify-between group hover:border-slate-600 transition">
                            <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-slate-900 mb-1 ${netScore > 0 ? 'bg-green-400' : netScore < 0 ? 'bg-red-400' : 'bg-slate-300'}`}>
                                    <span className="text-lg leading-none">{baseValue}</span>
                                </div>
                                <span className="text-[0.6rem] uppercase opacity-70 font-bold">{key}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="block font-medium text-slate-200">{statLabels[key]}</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-500 uppercase">Score:</span>
                                    <span className={`text-sm font-black ${netScore > 0 ? 'text-green-400' : netScore < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                        {netScore > 0 ? '+' : ''}{netScore}
                                    </span>
                                </div>
                            </div>
                            </div>

                            <div className="flex flex-col gap-1">
                            <button 
                                onClick={() => handleVote(key, 'up')}
                                className={`p-1.5 rounded hover:bg-slate-700 transition flex items-center gap-1 ${userVote === 'up' ? 'text-green-400 bg-green-400/10' : 'text-slate-500'}`}
                            >
                                <ThumbsUp size={16} />
                            </button>
                            <button 
                                onClick={() => handleVote(key, 'down')}
                                className={`p-1.5 rounded hover:bg-slate-700 transition flex items-center gap-1 ${userVote === 'down' ? 'text-red-400 bg-red-400/10' : 'text-slate-500'}`}
                            >
                                <ThumbsDown size={16} />
                            </button>
                            </div>
                        </div>
                        );
                    })}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default VotingModal;
