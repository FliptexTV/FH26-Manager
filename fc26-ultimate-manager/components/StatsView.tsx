
import React from 'react';
import { Player } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from 'recharts';
import { Club } from 'lucide-react';

interface StatsViewProps {
  players: Player[];
}

const StatsView: React.FC<StatsViewProps> = ({ players }) => {
  if (players.length === 0) return <div className="p-10 text-center text-slate-500">Keine Daten verfügbar.</div>;

  // 1. Top Ratings
  const topRatedData = [...players]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .map(p => ({ name: p.name, rating: p.rating }));

  // 2. Top Scorers (from Real Games)
  const topScorers = [...players]
    .filter(p => p.gameStats && p.gameStats.goals > 0)
    .sort((a, b) => (b.gameStats?.goals || 0) - (a.gameStats?.goals || 0))
    .slice(0, 5)
    .map(p => ({ name: p.name, goals: p.gameStats?.goals || 0 }));

  // 3. Win Rates (min 1 game)
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

  // MVP Analysis
  const topPlayer = players.reduce((prev, current) => (prev.rating > current.rating) ? prev : current);
  const radarData = Object.entries(topPlayer.stats).map(([key, value]) => ({
    subject: key,
    A: value,
    fullMark: 99
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
      
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

      {/* MVP Radar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-2">
           <h3 className="text-xl font-bold text-white">MVP Analyse</h3>
           <span className="text-sm text-yellow-400 font-mono">{topPlayer.name} ({topPlayer.rating})</span>
        </div>
        
        <div className="h-[300px] w-full flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name={topPlayer.name}
                dataKey="A"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.4}
              />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
            </RadarChart>
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
