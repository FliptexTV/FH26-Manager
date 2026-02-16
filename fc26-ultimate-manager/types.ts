
export enum Position {
  GK = 'TW',
  // Defense
  LWB = 'LAV',
  LB = 'LV',
  CB = 'IV',
  RB = 'RV',
  RWB = 'RAV',
  // Midfield
  CDM = 'ZDM',
  LM = 'LM',
  CM = 'ZM',
  RM = 'RM',
  CAM = 'ZOM',
  // Attack
  LW = 'LF',
  CF = 'MS',
  ST = 'ST',
  RW = 'RF'
}

export type StatType = 'outfield' | 'goalkeeper';

export interface PlayerStats {
  // Outfield
  PAC?: number; // Pace / Tempo
  SHO?: number; // Shooting / Schießen
  PAS?: number; // Passing / Passen
  DRI?: number; // Dribbling
  DEF?: number; // Defense / Defensive
  PHY?: number; // Physical / Physis
  
  // Goalkeeper
  DIV?: number; // Diving / Hechten
  HAN?: number; // Handling / Ballsicherheit
  KIC?: number; // Kicking / Abschlag
  REF?: number; // Reflexes / Reflexe
  SPE?: number; // Speed / Tempo (GK)
  POS?: number; // Positioning / Stellungsspiel
}

export interface VoteData {
  [statName: string]: {
    score: number; // Netto wert (Up - Down)
    userVotes: Record<string, 'up' | 'down'>; // UserID -> Vote
  }
}

export interface GameStats {
  played: number;
  won: number;
  goals: number;
  assists: number;
  cleanSheets: number;
}

export type CardType = 'gold' | 'icon' | 'inform';

export interface Player {
  id: string;
  name: string;
  position: Position;
  rating: number; // 1-99
  ratingMode?: 'auto' | 'manual'; // NEU: Speichert, ob Rating manuell festgelegt wurde
  image: string; // URL or Base64
  nation?: string; // Optional: ISO code or name
  club?: string;
  stats: PlayerStats;
  votes?: VoteData; 
  cardType: CardType;
  gameStats?: GameStats; // New: Real stats from Match Mode
}

export interface Formation {
  name: string;
  label: string;
  positions: { x: number; y: number; role: Position }[]; // x/y in percent
}

export interface Team {
  id: string;
  name: string;
  formationName: string;
  playerIds: (string | null)[]; // Array of player IDs matching the formation slots
  createdAt: number;
  ownerId?: string;
}

export interface MatchEvent {
  type: 'goal';
  playerId: string;
  minute: number;
  teamId: string; // 'home' or 'away'
}

export interface MatchResult {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  date: number;
  duration: number; // in seconds
  events: MatchEvent[];
}

// POTM System
export interface PotmState {
  isActive: boolean;
  matchDate: string; // ISO String YYYY-MM-DD
  votes: Record<string, string>; // UserId -> PlayerId
}

export interface PotmHistory {
  id: string;
  date: string;
  playerId: string;
  votesReceived: number;
}

export type ViewState = 'players' | 'team' | 'matches' | 'stats' | 'packs';
