
import { Formation, Player, Position, PlayerStats, CardType } from './types';

// Card Design Configuration
export const CARD_DESIGNS: Record<CardType, { url: string; textColor: string; borderColor: string; label: string }> = {
  gold: {
    url: 'https://i.imgur.com/JpDFXLj.png',
    textColor: '#171717', // Geändert zu fast Schwarz (Dark Neutral)
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
  { label: 'Afghanistan', flag: '🇦🇫' },
  { label: 'Ägypten', flag: '🇪🇬' },
  { label: 'Albanien', flag: '🇦🇱' },
  { label: 'Algerien', flag: '🇩🇿' },
  { label: 'Amerikanisch-Samoa', flag: '🇦🇸' },
  { label: 'Andorra', flag: '🇦🇩' },
  { label: 'Angola', flag: '🇦🇴' },
  { label: 'Antigua und Barbuda', flag: '🇦🇬' },
  { label: 'Äquatorialguinea', flag: '🇬🇶' },
  { label: 'Argentinien', flag: '🇦🇷' },
  { label: 'Armenien', flag: '🇦🇲' },
  { label: 'Aruba', flag: '🇦🇼' },
  { label: 'Aserbaidschan', flag: '🇦🇿' },
  { label: 'Äthiopien', flag: '🇪🇹' },
  { label: 'Australien', flag: '🇦🇺' },
  { label: 'Bahamas', flag: '🇧🇸' },
  { label: 'Bahrain', flag: '🇧🇭' },
  { label: 'Bangladesch', flag: '🇧🇩' },
  { label: 'Barbados', flag: '🇧🇧' },
  { label: 'Belgien', flag: '🇧🇪' },
  { label: 'Belize', flag: '🇧🇿' },
  { label: 'Benin', flag: '🇧🇯' },
  { label: 'Bermuda', flag: '🇧🇲' },
  { label: 'Bhutan', flag: '🇧🇹' },
  { label: 'Bolivien', flag: '🇧🇴' },
  { label: 'Bosnien und Herzegowina', flag: '🇧🇦' },
  { label: 'Botsuana', flag: '🇧🇼' },
  { label: 'Brasilien', flag: '🇧🇷' },
  { label: 'Britische Jungferninseln', flag: '🇻🇬' },
  { label: 'Brunei', flag: '🇧🇳' },
  { label: 'Bulgarien', flag: '🇧🇬' },
  { label: 'Burkina Faso', flag: '🇧🇫' },
  { label: 'Burundi', flag: '🇧🇮' },
  { label: 'Chile', flag: '🇨🇱' },
  { label: 'China', flag: '🇨🇳' },
  { label: 'Cookinseln', flag: '🇨🇰' },
  { label: 'Costa Rica', flag: '🇨🇷' },
  { label: 'Curaçao', flag: '🇨🇼' },
  { label: 'Dänemark', flag: '🇩🇰' },
  { label: 'Deutschland', flag: '🇩🇪' },
  { label: 'Dominica', flag: '🇩🇲' },
  { label: 'Dominikanische Republik', flag: '🇩🇴' },
  { label: 'Dschibuti', flag: '🇩🇯' },
  { label: 'Ecuador', flag: '🇪🇨' },
  { label: 'Elfenbeinküste', flag: '🇨🇮' },
  { label: 'El Salvador', flag: '🇸🇻' },
  { label: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { label: 'Eritrea', flag: '🇪🇷' },
  { label: 'Estland', flag: '🇪🇪' },
  { label: 'Eswatini', flag: '🇸🇿' },
  { label: 'Färöer', flag: '🇫🇴' },
  { label: 'Fidschi', flag: '🇫🇯' },
  { label: 'Finnland', flag: '🇫🇮' },
  { label: 'Frankreich', flag: '🇫🇷' },
  { label: 'Gabun', flag: '🇬🇦' },
  { label: 'Gambia', flag: '🇬🇲' },
  { label: 'Georgien', flag: '🇬🇪' },
  { label: 'Ghana', flag: '🇬🇭' },
  { label: 'Gibraltar', flag: '🇬🇮' },
  { label: 'Grenada', flag: '🇬🇩' },
  { label: 'Griechenland', flag: '🇬🇷' },
  { label: 'Guam', flag: '🇬🇺' },
  { label: 'Guatemala', flag: '🇬🇹' },
  { label: 'Guinea', flag: '🇬🇳' },
  { label: 'Guinea-Bissau', flag: '🇬🇼' },
  { label: 'Guyana', flag: '🇬🇾' },
  { label: 'Haiti', flag: '🇭🇹' },
  { label: 'Honduras', flag: '🇭🇳' },
  { label: 'Hongkong', flag: '🇭🇰' },
  { label: 'Indien', flag: '🇮🇳' },
  { label: 'Indonesien', flag: '🇮🇩' },
  { label: 'Irak', flag: '🇮🇶' },
  { label: 'Iran', flag: '🇮🇷' },
  { label: 'Irland', flag: '🇮🇪' },
  { label: 'Island', flag: '🇮🇸' },
  { label: 'Israel', flag: '🇮🇱' },
  { label: 'Italien', flag: '🇮🇹' },
  { label: 'Jamaika', flag: '🇯🇲' },
  { label: 'Japan', flag: '🇯🇵' },
  { label: 'Jemen', flag: '🇾🇪' },
  { label: 'Jordanien', flag: '🇯🇴' },
  { label: 'Kambodscha', flag: '🇰🇭' },
  { label: 'Kamerun', flag: '🇨🇲' },
  { label: 'Kanada', flag: '🇨🇦' },
  { label: 'Kap Verde', flag: '🇨🇻' },
  { label: 'Kasachstan', flag: '🇰🇿' },
  { label: 'Katar', flag: '🇶🇦' },
  { label: 'Kenia', flag: '🇰🇪' },
  { label: 'Kirgisistan', flag: '🇰🇬' },
  { label: 'Kolumbien', flag: '🇨🇴' },
  { label: 'Komoren', flag: '🇰🇲' },
  { label: 'Kongo (Dem. Rep.)', flag: '🇨🇩' },
  { label: 'Kongo (Rep.)', flag: '🇨🇬' },
  { label: 'Kosovo', flag: '🇽🇰' },
  { label: 'Kroatien', flag: '🇭🇷' },
  { label: 'Kuba', flag: '🇨🇺' },
  { label: 'Kuwait', flag: '🇰🇼' },
  { label: 'Laos', flag: '🇱🇦' },
  { label: 'Lesotho', flag: '🇱🇸' },
  { label: 'Lettland', flag: '🇱🇻' },
  { label: 'Libanon', flag: '🇱🇧' },
  { label: 'Liberia', flag: '🇱🇷' },
  { label: 'Libyen', flag: '🇱🇾' },
  { label: 'Liechtenstein', flag: '🇱🇮' },
  { label: 'Litauen', flag: '🇱🇹' },
  { label: 'Luxemburg', flag: '🇱🇺' },
  { label: 'Madagaskar', flag: '🇲🇬' },
  { label: 'Malawi', flag: '🇲🇼' },
  { label: 'Malaysia', flag: '🇲🇾' },
  { label: 'Malediven', flag: '🇲🇻' },
  { label: 'Mali', flag: '🇲🇱' },
  { label: 'Malta', flag: '🇲🇹' },
  { label: 'Marokko', flag: '🇲🇦' },
  { label: 'Mauretanien', flag: '🇲🇷' },
  { label: 'Mauritius', flag: '🇲🇺' },
  { label: 'Mexiko', flag: '🇲🇽' },
  { label: 'Moldawien', flag: '🇲🇩' },
  { label: 'Monaco', flag: '🇲🇨' },
  { label: 'Mongolei', flag: '🇲🇳' },
  { label: 'Montenegro', flag: '🇲🇪' },
  { label: 'Mosambik', flag: '🇲🇿' },
  { label: 'Myanmar', flag: '🇲🇲' },
  { label: 'Namibia', flag: '🇳🇦' },
  { label: 'Nepal', flag: '🇳🇵' },
  { label: 'Neuseeland', flag: '🇳🇿' },
  { label: 'Nicaragua', flag: '🇳🇮' },
  { label: 'Niederlande', flag: '🇳🇱' },
  { label: 'Niger', flag: '🇳🇪' },
  { label: 'Nigeria', flag: '🇳🇬' },
  { label: 'Nordkorea', flag: '🇰🇵' },
  { label: 'Nordmazedonien', flag: '🇲🇰' },
  { label: 'Norwegen', flag: '🇳🇴' },
  { label: 'Oman', flag: '🇴🇲' },
  { label: 'Österreich', flag: '🇦🇹' },
  { label: 'Pakistan', flag: '🇵🇰' },
  { label: 'Palästina', flag: '🇵🇸' },
  { label: 'Panama', flag: '🇵🇦' },
  { label: 'Papua-Neuguinea', flag: '🇵🇬' },
  { label: 'Paraguay', flag: '🇵🇾' },
  { label: 'Peru', flag: '🇵🇪' },
  { label: 'Philippinen', flag: '🇵🇭' },
  { label: 'Polen', flag: '🇵🇱' },
  { label: 'Portugal', flag: '🇵🇹' },
  { label: 'Puerto Rico', flag: '🇵🇷' },
  { label: 'Ruanda', flag: '🇷🇼' },
  { label: 'Rumänien', flag: '🇷🇴' },
  { label: 'Russland', flag: '🇷🇺' },
  { label: 'Salomonen', flag: '🇸🇧' },
  { label: 'Sambia', flag: '🇿🇲' },
  { label: 'Samoa', flag: '🇼🇸' },
  { label: 'San Marino', flag: '🇸🇲' },
  { label: 'Saudi-Arabien', flag: '🇸🇦' },
  { label: 'Schottland', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { label: 'Schweden', flag: '🇸🇪' },
  { label: 'Schweiz', flag: '🇨🇭' },
  { label: 'Senegal', flag: '🇸🇳' },
  { label: 'Serbien', flag: '🇷🇸' },
  { label: 'Seychellen', flag: '🇸🇨' },
  { label: 'Sierra Leone', flag: '🇸🇱' },
  { label: 'Simbabwe', flag: '🇿🇼' },
  { label: 'Singapur', flag: '🇸🇬' },
  { label: 'Slowakei', flag: '🇸🇰' },
  { label: 'Slowenien', flag: '🇸🇮' },
  { label: 'Somalia', flag: '🇸🇴' },
  { label: 'Spanien', flag: '🇪🇸' },
  { label: 'Sri Lanka', flag: '🇱🇰' },
  { label: 'Südafrika', flag: '🇿🇦' },
  { label: 'Sudan', flag: '🇸🇩' },
  { label: 'Südkorea', flag: '🇰🇷' },
  { label: 'Südsudan', flag: '🇸🇸' },
  { label: 'Suriname', flag: '🇸🇷' },
  { label: 'Syrien', flag: '🇸🇾' },
  { label: 'Tadschikistan', flag: '🇹🇯' },
  { label: 'Taiwan', flag: '🇹🇼' },
  { label: 'Tansania', flag: '🇹🇿' },
  { label: 'Thailand', flag: '🇹🇭' },
  { label: 'Togo', flag: '🇹🇬' },
  { label: 'Tonga', flag: '🇹🇴' },
  { label: 'Trinidad und Tobago', flag: '🇹🇹' },
  { label: 'Tschad', flag: '🇹🇩' },
  { label: 'Tschechien', flag: '🇨🇿' },
  { label: 'Tunesien', flag: '🇹🇳' },
  { label: 'Türkei', flag: '🇹🇷' },
  { label: 'Turkmenistan', flag: '🇹🇲' },
  { label: 'Uganda', flag: '🇺🇬' },
  { label: 'Ukraine', flag: '🇺🇦' },
  { label: 'Ungarn', flag: '🇭🇺' },
  { label: 'Uruguay', flag: '🇺🇾' },
  { label: 'USA', flag: '🇺🇸' },
  { label: 'Usbekistan', flag: '🇺🇿' },
  { label: 'Vanuatu', flag: '🇻🇺' },
  { label: 'Venezuela', flag: '🇻🇪' },
  { label: 'Vereinigte Arab. Emirate', flag: '🇦🇪' },
  { label: 'Vietnam', flag: '🇻🇳' },
  { label: 'Wales', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { label: 'Welt', flag: '🌍' },
  { label: 'Weißrussland', flag: '🇧🇾' },
  { label: 'Zentralafrikanische Rep.', flag: '🇨🇫' },
  { label: 'Zypern', flag: '🇨🇾' }
].sort((a, b) => a.label.localeCompare(b.label));

// REVISED WEIGHTS TO MATCH FC STYLE (OVR Calculation)
// Key stats heavily weighted, irrelevant stats almost ignored.
export const POSITION_WEIGHTS: Record<string, Partial<Record<keyof PlayerStats, number>>> = {
  // Goalkeeper: DIV, REF, HAN, POS are 90% of the rating. Speed is irrelevant.
  [Position.GK]:  { REF: 0.28, DIV: 0.26, POS: 0.24, HAN: 0.15, KIC: 0.07, SPE: 0.00 },
  
  // Center Back: DEF > PHY > PAC. Shooting/Dribbling mostly irrelevant.
  [Position.CB]:  { DEF: 0.45, PHY: 0.35, PAC: 0.10, PAS: 0.05, DRI: 0.05, SHO: 0.00 },
  
  // Full Backs: Needs a bit of everything, but PACE and DEF are key.
  [Position.LB]:  { DEF: 0.35, PAC: 0.25, DRI: 0.15, PAS: 0.15, PHY: 0.10, SHO: 0.00 },
  [Position.RB]:  { DEF: 0.35, PAC: 0.25, DRI: 0.15, PAS: 0.15, PHY: 0.10, SHO: 0.00 },
  [Position.LWB]: { PAC: 0.25, DRI: 0.20, DEF: 0.25, PAS: 0.20, PHY: 0.05, SHO: 0.05 },
  [Position.RWB]: { PAC: 0.25, DRI: 0.20, DEF: 0.25, PAS: 0.20, PHY: 0.05, SHO: 0.05 },
  
  // CDM: Defense and Passing/Physicality.
  [Position.CDM]: { DEF: 0.40, PAS: 0.25, PHY: 0.25, DRI: 0.05, PAC: 0.05, SHO: 0.00 },
  
  // CM: The engine. Passing and Dribbling are highest coefficients.
  [Position.CM]:  { PAS: 0.35, DRI: 0.30, SHO: 0.10, DEF: 0.10, PHY: 0.10, PAC: 0.05 },
  
  // CAM: Dribbling and Passing dominate.
  [Position.CAM]: { PAS: 0.30, DRI: 0.30, SHO: 0.20, PAC: 0.10, PHY: 0.10, DEF: 0.00 },
  
  // Wingers: Dribbling, Pace, Crossing (Pas).
  [Position.LM]:  { DRI: 0.35, PAC: 0.25, PAS: 0.25, SHO: 0.10, PHY: 0.05, DEF: 0.00 },
  [Position.RM]:  { DRI: 0.35, PAC: 0.25, PAS: 0.25, SHO: 0.10, PHY: 0.05, DEF: 0.00 },
  [Position.LW]:  { DRI: 0.35, PAC: 0.25, SHO: 0.25, PAS: 0.10, PHY: 0.05, DEF: 0.00 },
  [Position.RW]:  { DRI: 0.35, PAC: 0.25, SHO: 0.25, PAS: 0.10, PHY: 0.05, DEF: 0.00 },
  
  // CF: Like CAM but more shooting focus.
  [Position.CF]:  { SHO: 0.30, DRI: 0.30, PAS: 0.20, PAC: 0.15, PHY: 0.05, DEF: 0.00 },
  
  // Striker: Finishing (Shooting) is king (approx 45% weight in FC).
  [Position.ST]:  { SHO: 0.55, PHY: 0.20, DRI: 0.15, PAC: 0.15, PAS: 0.05, DEF: 0.00 },
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

// 5v5 Formations - Updated strictly to user request
export const FORMATIONS: Formation[] = [
  {
    name: '2-2',
    label: 'Box (2-2)',
    positions: [
      { x: 50, y: 90, role: Position.GK },
      { x: 25, y: 65, role: Position.CB }, // Def 1
      { x: 75, y: 65, role: Position.CB }, // Def 2
      { x: 25, y: 25, role: Position.ST }, // Att 1
      { x: 75, y: 25, role: Position.ST }, // Att 2
    ]
  },
  {
    name: '3-1',
    label: 'Defensiv (3-1)',
    positions: [
      { x: 50, y: 90, role: Position.GK },
      { x: 20, y: 60, role: Position.LB },
      { x: 50, y: 60, role: Position.CB },
      { x: 80, y: 60, role: Position.RB },
      { x: 50, y: 20, role: Position.ST }, // 1 Striker
    ]
  },
  {
    name: '1-3',
    label: 'Offensiv (1-3)',
    positions: [
      { x: 50, y: 90, role: Position.GK },
      { x: 50, y: 70, role: Position.CB },
      { x: 15, y: 30, role: Position.LW },
      { x: 50, y: 20, role: Position.ST },
      { x: 85, y: 30, role: Position.RW },
    ]
  },
  {
    name: '1-2-1',
    label: 'Raute (1-2-1)',
    positions: [
      { x: 50, y: 90, role: Position.GK },
      { x: 50, y: 75, role: Position.CB }, // Tiefer IV
      { x: 20, y: 50, role: Position.LM }, // Breit Links
      { x: 80, y: 50, role: Position.RM }, // Breit Rechts
      { x: 50, y: 20, role: Position.ST }, // Spitze
    ]
  }
];
