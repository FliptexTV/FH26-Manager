
import { Formation, Player, Position, PlayerStats, CardType } from './types';

// Card Design Configuration
export const CARD_DESIGNS: Record<CardType, { url: string; textColor: string; borderColor: string; label: string }> = {
  gold: {
    url: 'https://i.imgur.com/JpDFXLj.png',
    textColor: '#3e2e13',
    borderColor: '#e2b748',
    label: 'Standard Gold'
  },
  icon: {
    url: 'https://i.imgur.com/J4DdvvM.png',
    textColor: '#3e2e13', 
    borderColor: '#d4af37',
    label: 'Icon / Legend'
  },
  inform: {
    url: 'https://i.imgur.com/7kVOCLG.png',
    textColor: '#f1f5f9', 
    borderColor: '#94a3b8', 
    label: 'Inform (TOTW)'
  }
};

export const NATIONS = [
  { label: 'Deutschland', flag: '🇩🇪' },
  { label: 'Österreich', flag: '🇦🇹' },
  { label: 'Schweiz', flag: '🇨🇭' },
  { label: 'Frankreich', flag: '🇫🇷' },
  { label: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { label: 'Spanien', flag: '🇪🇸' },
  { label: 'Italien', flag: '🇮🇹' },
  { label: 'Brasilien', flag: '🇧🇷' },
  { label: 'Argentinien', flag: '🇦🇷' },
  { label: 'Niederlande', flag: '🇳🇱' },
  { label: 'Portugal', flag: '🇵🇹' },
  { label: 'Belgien', flag: '🇧🇪' },
  { label: 'Polen', flag: '🇵🇱' },
  { label: 'Türkei', flag: '🇹🇷' },
  { label: 'Kroatien', flag: '🇭🇷' },
  { label: 'USA', flag: '🇺🇸' },
  { label: 'Kanada', flag: '🇨🇦' },
  { label: 'Japan', flag: '🇯🇵' },
  { label: 'Südkorea', flag: '🇰🇷' },
  { label: 'Welt', flag: '🌍' }
];

// Gewichtung der Stats pro Position für die OVR Berechnung (FC Style Logic)
export const POSITION_WEIGHTS: Record<string, Partial<Record<keyof PlayerStats, number>>> = {
  [Position.GK]:  { DIV: 0.25, REF: 0.25, HAN: 0.20, POS: 0.20, KIC: 0.05, SPE: 0.05 },
  
  [Position.CB]:  { DEF: 0.45, PHY: 0.35, PAC: 0.10, PAS: 0.05, DRI: 0.05 },
  [Position.LB]:  { DEF: 0.35, PAC: 0.25, PHY: 0.20, PAS: 0.10, DRI: 0.10 },
  [Position.RB]:  { DEF: 0.35, PAC: 0.25, PHY: 0.20, PAS: 0.10, DRI: 0.10 },
  [Position.LWB]: { PAC: 0.30, DEF: 0.25, PAS: 0.20, DRI: 0.15, PHY: 0.10 },
  [Position.RWB]: { PAC: 0.30, DEF: 0.25, PAS: 0.20, DRI: 0.15, PHY: 0.10 },
  
  [Position.CDM]: { DEF: 0.35, PAS: 0.25, PHY: 0.25, DRI: 0.10, PAC: 0.05 },
  [Position.CM]:  { PAS: 0.35, DRI: 0.25, DEF: 0.15, PHY: 0.15, SHO: 0.10 },
  [Position.CAM]: { PAS: 0.30, DRI: 0.30, SHO: 0.20, PAC: 0.15, PHY: 0.05 },
  [Position.LM]:  { PAC: 0.35, DRI: 0.30, PAS: 0.20, SHO: 0.10, PHY: 0.05 },
  [Position.RM]:  { PAC: 0.35, DRI: 0.30, PAS: 0.20, SHO: 0.10, PHY: 0.05 },
  
  [Position.LW]:  { PAC: 0.35, DRI: 0.30, SHO: 0.25, PAS: 0.10 },
  [Position.RW]:  { PAC: 0.35, DRI: 0.30, SHO: 0.25, PAS: 0.10 },
  [Position.CF]:  { DRI: 0.30, SHO: 0.30, PAS: 0.25, PAC: 0.15 },
  [Position.ST]:  { SHO: 0.45, PAC: 0.25, PHY: 0.15, DRI: 0.10, PAS: 0.05 },
};

export const MOCK_PLAYERS: Player[] = [
  {
    id: '1',
    name: 'M. Neuer',
    position: Position.GK,
    rating: 89,
    image: 'https://picsum.photos/seed/neuer/200/200',
    cardType: 'gold',
    nation: '🇩🇪',
    stats: { DIV: 88, HAN: 85, KIC: 91, REF: 89, SPE: 50, POS: 88 }
  },
  {
    id: '2',
    name: 'J. Musiala',
    position: Position.CAM,
    rating: 88,
    image: 'https://picsum.photos/seed/musiala/200/200',
    cardType: 'inform',
    nation: '🇩🇪',
    stats: { PAC: 85, SHO: 82, PAS: 85, DRI: 93, DEF: 60, PHY: 65 }
  },
  {
    id: '3',
    name: 'H. Kane',
    position: Position.ST,
    rating: 91,
    image: 'https://picsum.photos/seed/kane/200/200',
    cardType: 'gold',
    nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    stats: { PAC: 70, SHO: 93, PAS: 85, DRI: 83, DEF: 45, PHY: 82 }
  },
  {
    id: '4',
    name: 'A. Davies',
    position: Position.LB,
    rating: 84,
    image: 'https://picsum.photos/seed/davies/200/200',
    cardType: 'gold',
    nation: '🇨🇦',
    stats: { PAC: 96, SHO: 70, PAS: 75, DRI: 84, DEF: 78, PHY: 76 }
  },
  {
    id: '5',
    name: 'K. Coman',
    position: Position.LM,
    rating: 83,
    image: 'https://picsum.photos/seed/coman/200/200',
    cardType: 'inform',
    nation: '🇫🇷',
    stats: { PAC: 90, SHO: 78, PAS: 79, DRI: 86, DEF: 35, PHY: 68 }
  },
  {
    id: '6',
    name: 'Kim Min Jae',
    position: Position.CB,
    rating: 86,
    image: 'https://picsum.photos/seed/kim/200/200',
    cardType: 'gold',
    nation: '🇰🇷',
    stats: { PAC: 80, SHO: 40, PAS: 65, DRI: 68, DEF: 88, PHY: 86 }
  },
  {
    id: '7',
    name: 'Pele',
    position: Position.CF,
    rating: 98,
    image: 'https://picsum.photos/seed/pele/200/200',
    cardType: 'icon',
    nation: '🇧🇷',
    stats: { PAC: 95, SHO: 96, PAS: 93, DRI: 96, DEF: 60, PHY: 76 }
  },
  // Added more players to reach minimum count for 2 teams
  {
    id: '8',
    name: 'K. Mbappe',
    position: Position.ST,
    rating: 91,
    image: 'https://picsum.photos/seed/mbappe/200/200',
    cardType: 'gold',
    nation: '🇫🇷',
    stats: { PAC: 97, SHO: 90, PAS: 80, DRI: 92, DEF: 36, PHY: 78 }
  },
  {
    id: '9',
    name: 'E. Haaland',
    position: Position.ST,
    rating: 91,
    image: 'https://picsum.photos/seed/haaland/200/200',
    cardType: 'gold',
    nation: '🇳🇴',
    stats: { PAC: 89, SHO: 93, PAS: 65, DRI: 80, DEF: 45, PHY: 88 }
  },
  {
    id: '10',
    name: 'J. Bellingham',
    position: Position.CM,
    rating: 90,
    image: 'https://picsum.photos/seed/bellingham/200/200',
    cardType: 'inform',
    nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    stats: { PAC: 82, SHO: 84, PAS: 87, DRI: 88, DEF: 78, PHY: 82 }
  },
  {
    id: '11',
    name: 'Vini Jr.',
    position: Position.LW,
    rating: 90,
    image: 'https://picsum.photos/seed/vini/200/200',
    cardType: 'gold',
    nation: '🇧🇷',
    stats: { PAC: 95, SHO: 82, PAS: 81, DRI: 94, DEF: 29, PHY: 68 }
  },
  {
    id: '12',
    name: 'Rodri',
    position: Position.CDM,
    rating: 91,
    image: 'https://picsum.photos/seed/rodri/200/200',
    cardType: 'gold',
    nation: '🇪🇸',
    stats: { PAC: 58, SHO: 73, PAS: 86, DRI: 79, DEF: 85, PHY: 82 }
  }
];

// 5v5 Formations adapted for generic positions
export const FORMATIONS: Formation[] = [
  {
    name: '1-2-1',
    label: 'Raute (Diamond)',
    positions: [
      { x: 50, y: 90, role: Position.GK },
      { x: 20, y: 60, role: Position.LB },
      { x: 80, y: 60, role: Position.RB },
      { x: 50, y: 40, role: Position.CM },
      { x: 50, y: 10, role: Position.ST },
    ]
  },
  {
    name: '2-2',
    label: 'Box (2-2)',
    positions: [
      { x: 50, y: 90, role: Position.GK },
      { x: 30, y: 70, role: Position.CB },
      { x: 70, y: 70, role: Position.CB },
      { x: 30, y: 20, role: Position.ST },
      { x: 70, y: 20, role: Position.ST },
    ]
  },
  {
    name: '1-3-1',
    label: 'Offensive (1-3-1)',
    positions: [
      { x: 50, y: 90, role: Position.GK },
      { x: 50, y: 75, role: Position.CB },
      { x: 15, y: 45, role: Position.LM },
      { x: 50, y: 45, role: Position.CAM },
      { x: 85, y: 45, role: Position.RM },
    ]
  }
];
