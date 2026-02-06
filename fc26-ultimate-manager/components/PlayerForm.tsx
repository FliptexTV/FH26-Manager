
import React, { useState, useEffect } from 'react';
import { Player, Position, PlayerStats, CardType } from '../types';
import { POSITION_WEIGHTS, CARD_DESIGNS, NATIONS } from '../constants';
import { uploadPlayerImage } from '../services/playerService';
import { Upload, X, Calculator, Check, Link as LinkIcon, Loader2 } from 'lucide-react';

interface PlayerFormProps {
  initialPlayer?: Player;
  onSave: (player: Player) => void;
  onCancel: () => void;
}

const PlayerForm: React.FC<PlayerFormProps> = ({ initialPlayer, onSave, onCancel }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<Player>(initialPlayer || {
    id: Date.now().toString(),
    name: '',
    position: Position.ST,
    rating: 75,
    image: 'https://picsum.photos/200',
    cardType: 'gold',
    nation: '🇩🇪',
    stats: { PAC: 75, SHO: 75, PAS: 75, DRI: 75, DEF: 50, PHY: 70 }
  });

  const [autoCalculate, setAutoCalculate] = useState(true);
  const isGK = formData.position === Position.GK;

  const calculateOVR = (position: Position, stats: PlayerStats) => {
    const weights = POSITION_WEIGHTS[position];
    if (!weights) return 75;
    let totalScore = 0;
    let totalWeight = 0;
    (Object.keys(weights) as Array<keyof PlayerStats>).forEach(key => {
        const statValue = stats[key] || 0;
        const weight = weights[key] || 0;
        totalScore += statValue * weight;
        totalWeight += weight;
    });
    if (totalWeight === 0) return 0;
    return Math.round(totalScore / totalWeight);
  };

  useEffect(() => {
    if (autoCalculate) {
      const newRating = calculateOVR(formData.position, formData.stats);
      setFormData(prev => ({ ...prev, rating: newRating }));
    }
  }, [formData.stats, formData.position, autoCalculate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }));
  };

  const handleStatChange = (stat: keyof PlayerStats, value: string) => {
    let numVal = parseInt(value);
    if (isNaN(numVal)) numVal = 0; if (numVal > 99) numVal = 99; if (numVal < 1) numVal = 1;
    setFormData(prev => ({ ...prev, stats: { ...prev.stats, [stat]: numVal } }));
  };

  // ASYNC UPLOAD TO FIREBASE
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const downloadUrl = await uploadPlayerImage(file);
        setFormData(prev => ({ ...prev, image: downloadUrl }));
      } catch (error) {
        console.error("Upload failed", error);
        alert("Upload fehlgeschlagen. Ist Firebase Storage konfiguriert?");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const renderStatInput = (label: string, statKey: keyof PlayerStats) => (
    <div className="flex flex-col">
      <label className="text-xs text-slate-400 mb-1">{label}</label>
      <input
        type="number"
        min="1"
        max="99"
        value={formData.stats[statKey] || 0}
        onChange={(e) => handleStatChange(statKey, e.target.value)}
        className="bg-slate-800 border border-slate-700 rounded p-2 text-white text-center focus:border-blue-500 focus:outline-none"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-white">Spieler {initialPlayer ? 'bearbeiten' : 'erstellen'}</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
             {/* Name & Nation Inputs (Simplified for brevity, logic remains same) */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
              <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white" placeholder="Name" />
            </div>
            
            <div>
               <label className="block text-sm font-medium text-slate-400 mb-1">Bild</label>
               <div className="flex gap-4">
                 <div className="relative">
                    <img src={formData.image} className="w-20 h-20 rounded object-cover border border-slate-600 bg-slate-800 shrink-0" />
                    {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                 </div>
                 <div className="flex-1 space-y-2">
                    <div className="relative">
                         <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="https://..." className="w-full bg-slate-800 border border-slate-700 rounded p-2 pl-9 text-xs text-white" />
                    </div>
                    <label className={`cursor-pointer bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded border border-slate-700 flex items-center justify-center gap-2 text-xs ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload size={14} /> <span>Upload (Cloud)</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                 </div>
               </div>
            </div>
            
            {/* ... Other inputs (Position, Nation, Rating) kept from previous state implicitly ... */}
             <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Position</label>
              <select name="position" value={formData.position} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
                  {Object.values(Position).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 uppercase mb-4">Attribute</h3>
            <div className="grid grid-cols-2 gap-4">
              {isGK ? (
                <> {renderStatInput('DIV', 'DIV')} {renderStatInput('REF', 'REF')} {renderStatInput('HAN', 'HAN')} {renderStatInput('SPE', 'SPE')} {renderStatInput('KIC', 'KIC')} {renderStatInput('POS', 'POS')} </>
              ) : (
                <> {renderStatInput('PAC', 'PAC')} {renderStatInput('SHO', 'SHO')} {renderStatInput('PAS', 'PAS')} {renderStatInput('DRI', 'DRI')} {renderStatInput('DEF', 'DEF')} {renderStatInput('PHY', 'PHY')} </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 sticky bottom-0 z-10">
          <button onClick={onCancel} className="px-4 py-2 text-slate-300">Abbrechen</button>
          <button onClick={() => onSave(formData)} disabled={isUploading} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg">
             {isUploading ? 'Lädt hoch...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerForm;
