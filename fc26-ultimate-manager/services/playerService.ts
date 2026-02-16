
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
  getDoc,
  writeBatch
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

// --- USER DATA & ADMIN ---

export interface UserData {
    id?: string;
    username?: string;
    currency: number;
    role?: 'admin' | 'user';
    linkedPlayerId?: string; // Links this user to a specific Player Card
}

// Combined listener for Currency AND Role
export const subscribeToUserData = (callback: (data: UserData) => void) => {
    const user = auth.currentUser;
    if (!user) {
        callback({ currency: 0, role: 'user' });
        return () => {};
    }

    const userDocRef = doc(db, USERS_COLLECTION, user.uid);
    return onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            callback({ 
                id: user.uid,
                username: data.username || '',
                currency: data.currency || 0,
                role: data.role || 'user',
                linkedPlayerId: data.linkedPlayerId
            });
        } else {
            // Create user doc if it doesn't exist
            setDoc(userDocRef, { currency: 0, role: 'user', username: '' }, { merge: true });
            callback({ currency: 0, role: 'user', username: '' });
        }
    });
};

export const updateUserProfile = async (username: string) => {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, USERS_COLLECTION, user.uid), { username }, { merge: true });
};

// Admin: Get all users
export const getAllUsers = async (): Promise<UserData[]> => {
    const q = query(collection(db, USERS_COLLECTION));
    const snapshot = await getDocs(q);
    const users: UserData[] = [];
    snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() } as UserData);
    });
    return users;
};

// Admin: Link User to Player
export const linkUserToPlayer = async (targetUserId: string, playerId: string) => {
    await updateDoc(doc(db, USERS_COLLECTION, targetUserId), {
        linkedPlayerId: playerId || null // Set to null if empty string
    });
};

// Admin: Give currency to any user
export const giveUserCurrency = async (targetUserId: string, amount: number) => {
    await updateDoc(doc(db, USERS_COLLECTION, targetUserId), {
        currency: increment(amount)
    });
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

// --- ADMIN TOOLS ---

export const resetAllVotes = async () => {
    const batch = writeBatch(db);
    const playersSnapshot = await getDocs(collection(db, PLAYERS_COLLECTION));
    
    playersSnapshot.forEach((doc) => {
        batch.update(doc.ref, { votes: {} });
    });
    
    await batch.commit();
};

// --- IMAGES (STORAGE) ---

export const uploadPlayerImage = async (file: File): Promise<string> => {
    const storageRef = ref(storage, `player-images/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};

// --- INVENTORY (MY CLUB) ---

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
    // Legacy support wrapper
    return subscribeToUserData((data) => callback(data.currency));
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
    
    const snapshot = await getDocs(q);
    const teams: Team[] = [];
    snapshot.forEach(doc => {
        const t = doc.data() as Team;
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
    // 1. Save the match record itself
    await setDoc(doc(db, MATCHES_COLLECTION, match.id), match);
    await addCurrency(1); // Reward for saving

    // 2. Fetch involved teams to identify players
    try {
        const homeTeamDoc = await getDoc(doc(db, TEAMS_COLLECTION, match.homeTeamId));
        const awayTeamDoc = await getDoc(doc(db, TEAMS_COLLECTION, match.awayTeamId));

        if (homeTeamDoc.exists() && awayTeamDoc.exists()) {
            const homeTeam = homeTeamDoc.data() as Team;
            const awayTeam = awayTeamDoc.data() as Team;

            const homeWon = match.homeScore > match.awayScore;
            const awayWon = match.awayScore > match.homeScore;

            // Calculate goals per player from events
            const playerGoals: Record<string, number> = {};
            match.events.forEach(ev => {
                if (ev.type === 'goal') {
                    playerGoals[ev.playerId] = (playerGoals[ev.playerId] || 0) + 1;
                }
            });

            // Update Home Players
            for (const playerId of homeTeam.playerIds) {
                if (!playerId) continue;
                const goals = playerGoals[playerId] || 0;
                // Use setDoc with merge to ensure gameStats is created if missing
                await setDoc(doc(db, PLAYERS_COLLECTION, playerId), {
                    gameStats: {
                        played: increment(1),
                        won: increment(homeWon ? 1 : 0),
                        goals: increment(goals)
                    }
                }, { merge: true });
            }

            // Update Away Players
            for (const playerId of awayTeam.playerIds) {
                if (!playerId) continue;
                const goals = playerGoals[playerId] || 0;
                await setDoc(doc(db, PLAYERS_COLLECTION, playerId), {
                    gameStats: {
                        played: increment(1),
                        won: increment(awayWon ? 1 : 0),
                        goals: increment(goals)
                    }
                }, { merge: true });
            }
        }
    } catch (e) {
        console.error("Error updating player stats after match:", e);
    }
};

export const deleteMatch = async (id: string) => {
    await deleteDoc(doc(db, MATCHES_COLLECTION, id));
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

    // --- WEIGHTED RANDOM LOGIC (PROBABILITY) ---
    // Target: 10% Chance for Walkout (88+), 90% for others.
    const walkoutThreshold = 88;
    const highRated = allPlayers.filter(p => p.rating >= walkoutThreshold);
    const lowRated = allPlayers.filter(p => p.rating < walkoutThreshold);

    const isWalkoutChance = Math.random() < 0.10; // 10%

    let template: Player;

    if (isWalkoutChance && highRated.length > 0) {
        // Hit the jackpot
        template = highRated[Math.floor(Math.random() * highRated.length)];
    } else if (lowRated.length > 0) {
        // Normal card
        template = lowRated[Math.floor(Math.random() * lowRated.length)];
    } else {
        // Fallback if pools are empty/weird
        template = allPlayers[Math.floor(Math.random() * allPlayers.length)];
    }

    const newPlayer: Player = {
        ...template,
        id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        gameStats: { played: 0, won: 0, goals: 0, assists: 0, cleanSheets: 0 },
        votes: {}
    };

    await addToInventory(newPlayer);
    return newPlayer;
};
