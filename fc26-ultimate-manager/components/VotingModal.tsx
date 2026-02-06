

import React, { useState } from 'react';
import { Player, Position } from '../types';
import { voteForStat, getUserId } from '../services/playerService';
import { X, ChevronUp, ChevronDown, Trophy, Activity, ThumbsUp, ThumbsDown, Coins, TrendingUp } from 'lucide-react';
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
  
  // Calculate approximate value (just a fun formula)
  const marketValue = (player.rating * 1.5).toFixed(1);
  
  // Total Votes
  const totalVotes = Object.values(player.votes || {}).reduce((acc, curr) => acc + curr.score, 0);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white z-20 bg-black/50 rounded-full p-1">
          <X size={24} />
        </button>

        {/* Left Side: Card Preview */}
        <div className="w-full md:w-1/3 bg-slate-950 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 bg-pitch-pattern relative overflow-hidden">
           <div className="absolute inset-0 bg-green-900/10 z-0"></div>
           <div className="relative z-10 scale-110">
             <PlayerCard player={player} size="lg" disableHover />
           </div>
           
           {/* Player Account Balance / Value */}
           <div className="mt-8 w-full bg-slate-900/80 rounded-xl p-4 border border-slate-700 backdrop-blur relative z-10">
               <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                   <span className="text-xs text-slate-400 uppercase font-bold">Marktwert</span>
                   <div className="flex items-center gap-1 text-yellow-400 font-bold">
                       <Coins size={14} /> {marketValue} Mio.
                   </div>
               </div>
               <div className="flex justify-between items-center">
                   <span className="text-xs text-slate-400 uppercase font-bold">Community Score</span>
                   <div className={`flex items-center gap-1 font-bold ${totalVotes >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                       <TrendingUp size={14} /> {totalVotes > 0 ? '+' : ''}{totalVotes}
                   </div>
               </div>
           </div>
        </div>

        {/* Right Side: Voting */}
        <div className="w-full md:w-2/3 p-6 md:p-8 bg-slate-900">
           <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
             <Activity className="text-green-400" />
             <div>
               <h3 className="text-xl font-bold text-white">Community Scouting</h3>
               <p className="text-sm text-slate-400">Stimme ab: Sind die Werte zu hoch oder zu niedrig?</p>
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
                    
                    {/* Stat Label & Value */}
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

                    {/* Voting Buttons */}
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => handleVote(key, 'up')}
                        className={`p-1.5 rounded hover:bg-slate-700 transition flex items-center gap-1 ${userVote === 'up' ? 'text-green-400 bg-green-400/10' : 'text-slate-500'}`}
                        title="Zu niedrig bewertet (Vote Up)"
                      >
                        <ThumbsUp size={16} />
                      </button>
                      <button 
                        onClick={() => handleVote(key, 'down')}
                        className={`p-1.5 rounded hover:bg-slate-700 transition flex items-center gap-1 ${userVote === 'down' ? 'text-red-400 bg-red-400/10' : 'text-slate-500'}`}
                        title="Zu hoch bewertet (Vote Down)"
                      >
                        <ThumbsDown size={16} />
                      </button>
                    </div>

                  </div>
                );
              })}
           </div>

           <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex gap-3 items-start">
              <Trophy className="text-yellow-400 shrink-0 mt-1" size={20} />
              <div className="text-sm text-slate-300">
                <strong className="text-white block mb-1">So funktioniert's:</strong>
                Die Zahl neben "Score" zeigt an, wie viele Punkte der Stat von der Community erhalten hat.
              </div>
           </div>

        </div>

      </div>
    </div>
  );
};

export default VotingModal;