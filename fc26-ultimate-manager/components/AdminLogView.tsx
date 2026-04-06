import React, { useState, useEffect } from 'react';
import { AdminLog } from '../types';
import { subscribeToLogs } from '../services/playerService';
import { ClipboardList, Clock, User, Activity } from 'lucide-react';

const AdminLogView: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLogs((data) => {
      setLogs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'VISIT': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'VOTE': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'PACK_OPEN': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="text-red-400" size={32} />
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Log</h2>
          <p className="text-sm text-slate-400">Überwache alle Aktivitäten der User in Echtzeit</p>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse">Lade Logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Keine Logs vorhanden.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/80 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Zeit</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Aktion</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-xs flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-white flex items-center gap-2">
                      <User size={14} className="text-slate-500" />
                      {log.username}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogView;
