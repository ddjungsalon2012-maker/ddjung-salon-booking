// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// lib/firebase.ts

const firebaseConfig = {
  apiKey: "AIzaSyB7UrNib4nu101b6HtOjOUpKgcM8g1TU84",
  authDomain: "ddjung-salon-v2.firebaseapp.com",
  projectId: "ddjung-salon-v2",
  storageBucket: "ddjung-salon-v2.firebasestorage.app",
  messagingSenderId: "692498039840",
  appId: "1:692498039840:web:23bd3a15aed9f7bf052b45"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
