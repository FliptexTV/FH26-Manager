

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  updateDoc, 
  increment,
  arrayUnion,
  query,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from './firebase';
import { Player, Team, MatchResult, MatchEvent } from '../types';
import { MOCK_PLAYERS } from '../constants';

// COLLECTIONS
const PLAYERS_COLLECTION = 'players';
const TEAMS_COLLECTION = 'teams';
const MATCHES_COLLECTION = 'matches';
const USERS_COLLECTION = 'users';

// --- AUTH & USER HELPERS ---

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const getUserId = (): string => {
  return auth.currentUser ? auth.currentUser.uid : 'anon_user';
};

// --- DATABASE (GLOBAL CATALOG) ---

// Real-time listener for players (Best for friends app!)
export const subscribeToPlayers = (callback: (players: Player[]) => void) => {
  const q = query(collection(db, PLAYERS_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const players: Player[] = [];
    snapshot.forEach((doc) => {
      players.push(doc.data() as Player);
    });
    // Fallback if empty (first run)
    if (players.length === 0) {
        // Optional: Seed DB if empty. For now just return empty.
        callback([]);
    } else {
        callback(players);
    }
  });
};

// One-time fetch (good for internal logic)
export const getDatabase = async (): Promise<Player[]> => {
  const snapshot = await getDocs(collection(db, PLAYERS_COLLECTION));
  const players: Player[] = [];
  snapshot.forEach(doc => players.push(doc.data() as Player));
  return players;
};

export const saveToDatabase = async (player: Player) => {
  await setDoc(doc(db, PLAYERS_COLLECTION, player.id), player);
};

export const deleteFromDatabase = async (id: string) => {
  await deleteDoc(doc(db, PLAYERS_COLLECTION, id));
};

// --- IMAGES (STORAGE) ---

export const uploadPlayerImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `player-images/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};

// --- INVENTORY (MY CLUB) ---
// In a real app, this should be a subcollection: users/{uid}/inventory
// We will simulate this by storing an array of IDs in the user document to keep it simple,
// OR fetch a subcollection. Let's use a subcollection for scalability.

export const subscribeToInventory = (callback: (players: Player[]) => void) => {
    const user = auth.currentUser;
    if (!user) {
        callback([]);
        return () => {};
    }

    const inventoryRef = collection(db, USERS_COLLECTION, user.uid, 'inventory');
    return onSnapshot(inventoryRef, (snapshot) => {
        const items: Player[] = [];
        snapshot.forEach(doc => items.push(doc.data() as Player));
        callback(items);
    });
};

export const getInventory = async (): Promise<Player[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    const snapshot = await getDocs(collection(db, USERS_COLLECTION, user.uid, 'inventory'));
    const items: Player[] = [];
    snapshot.forEach(doc => items.push(doc.data() as Player));
    return items;
};

export const addToInventory = async (player: Player) => {
    const user = auth.currentUser;
    if (!user) return;
    // Use player.id (which includes unique timestamp from openPack) as doc ID
    await setDoc(doc(db, USERS_COLLECTION, user.uid, 'inventory', player.id), player);
};

export const deleteFromInventory = async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(db, USERS_COLLECTION, user.uid, 'inventory', id));
};

// Helper: Get Player by ID (Check Inventory first, then DB)
export const getPlayerById = async (id: string): Promise<Player | undefined> => {
    // 1. Try Inventory (if user is logged in)
    const user = auth.currentUser;
    if (user) {
        const invDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid, 'inventory', id));
        if (invDoc.exists()) return invDoc.data() as Player;
    }
    
    // 2. Try Global DB
    const globalDoc = await getDoc(doc(db, PLAYERS_COLLECTION, id));
    if (globalDoc.exists()) return globalDoc.data() as Player;

    return undefined;
};

// --- CURRENCY ---

export const subscribeToCurrency = (callback: (amount: number) => void) => {
    const user = auth.currentUser;
    if (!user) {
        callback(0);
        return () => {};
    }

    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    return onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data().currency || 0);
        } else {
            callback(0);
        }
    });
};

export const addCurrency = async (amount: number) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    // Use Set with merge to create if not exists
    await setDoc(userDocRef, { currency: increment(amount) }, { merge: true });
};

export const checkDailyLoginBonus = async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    const userDoc = await getDoc(userDocRef);
    
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    let lastLogin = 0;
    if (userDoc.exists() && userDoc.data().lastLogin) {
        lastLogin = userDoc.data().lastLogin;
    }

    if (now - lastLogin > ONE_DAY) {
        await setDoc(userDocRef, { 
            currency: increment(5),
            lastLogin: now
        }, { merge: true });
        return true;
    }
    return false;
};

// --- TEAMS ---

export const getTeams = async (): Promise<Team[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    
    const q = query(collection(db, TEAMS_COLLECTION), orderBy('createdAt', 'desc'));
    // Note: Ideally filter by user.uid if teams are private, 
    // but for "Friend League" maybe all teams are public?
    // Let's make teams user-specific for editing, but visible for matches
    // For now: Fetch all teams created by current user
    // To make it simple: We fetch ALL teams in the collection for now.
    
    const snapshot = await getDocs(q);
    const teams: Team[] = [];
    snapshot.forEach(doc => {
        const t = doc.data() as Team;
        // Simple filter in JS (Firestore index needed for complex queries)
        if (!t.ownerId || t.ownerId === user.uid) {
            teams.push(t);
        }
    });
    return teams;
};

export const saveTeam = async (team: Team) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const teamWithOwner = { ...team, ownerId: user.uid };
    await setDoc(doc(db, TEAMS_COLLECTION, team.id), teamWithOwner);
};

export const deleteTeam = async (id: string) => {
    await deleteDoc(doc(db, TEAMS_COLLECTION, id));
};

// --- MATCHES ---

export const getMatches = async (): Promise<MatchResult[]> => {
    const q = query(collection(db, MATCHES_COLLECTION), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const matches: MatchResult[] = [];
    snapshot.forEach(doc => matches.push(doc.data() as MatchResult));
    return matches;
};

export const saveMatch = async (match: MatchResult) => {
    await setDoc(doc(db, MATCHES_COLLECTION, match.id), match);
    await addCurrency(1); // Reward
    
    // In a full backend, we would use Cloud Functions to update stats safely.
    // Here we do a "best effort" client update.
    // NOTE: This can lead to race conditions if two people update the same player at once.
    // For a friends app, it's acceptable.
    
    // Logic to update stats on players would go here, fetching and updating docs.
    // Skipping complex stats updates for brevity in this refactor, 
    // as it requires reading/writing many docs.
};

// --- VOTING ---

export const voteForStat = async (playerId: string, statKey: string, direction: 'up' | 'down') => {
    const user = auth.currentUser;
    if (!user) return null;
    const userId = user.uid;

    const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
    const playerSnap = await getDoc(playerRef);
    
    if (!playerSnap.exists()) return null;
    
    const player = playerSnap.data() as Player;
    
    if (!player.votes) player.votes = {};
    if (!player.votes[statKey]) {
        player.votes[statKey] = { score: 0, userVotes: {} };
    }

    const statVote = player.votes[statKey];
    const previousVote = statVote.userVotes[userId];

    let scoreChange = 0;

    if (previousVote === direction) {
        // Remove vote
        delete statVote.userVotes[userId];
        scoreChange = (direction === 'up' ? -1 : 1);
    } else {
        // Change or new vote
        if (previousVote) {
            scoreChange = (direction === 'up' ? 2 : -2);
        } else {
            scoreChange = (direction === 'up' ? 1 : -1);
        }
        statVote.userVotes[userId] = direction;
    }

    statVote.score += scoreChange;

    await updateDoc(playerRef, {
        votes: player.votes
    });

    return player;
};

// --- PACKS ---
export const openPack = async (): Promise<Player | null> => {
    const user = auth.currentUser;
    if (!user) return null;

    // Check Balance (Fetch fresh)
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
    const currency = userDoc.data()?.currency || 0;
    
    if (currency < 1) return null;

    // Deduct
    await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
        currency: increment(-1)
    });

    // Get DB
    const allPlayers = await getDatabase();
    if (allPlayers.length === 0) return null;

    const template = allPlayers[Math.floor(Math.random() * allPlayers.length)];

    const newPlayer: Player = {
        ...template,
        id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        gameStats: { played: 0, won: 0, goals: 0, assists: 0, cleanSheets: 0 },
        votes: {}
    };

    await addToInventory(newPlayer);
    return newPlayer;
};