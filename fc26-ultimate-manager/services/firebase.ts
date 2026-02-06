
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Fix: Use namespace import
import * as firebaseAuth from "firebase/auth";
import { getStorage } from "firebase/storage";

// WICHTIG: Ersetze diese Werte mit deinen eigenen aus der Firebase Console!
// Gehe zu: Project Settings -> General -> Your apps -> SDK Setup and Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5xPP_ammRgLrafbJJnkRnsL3RZI0C5wg",
  authDomain: "fh26-manager.firebaseapp.com",
  projectId: "fh26-manager",
  storageBucket: "fh26-manager.firebasestorage.app",
  messagingSenderId: "645894710223",
  appId: "1:645894710223:web:4c9ce125d1276c252828ba"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Services
export const db = getFirestore(app);
// Fix: Use namespace import methods
export const auth = firebaseAuth.getAuth(app);
export const googleProvider = new firebaseAuth.GoogleAuthProvider();
export const storage = getStorage(app);
