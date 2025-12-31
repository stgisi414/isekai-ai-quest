import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAtvTSSvaufmsaIKXnMp7dSU9vKYkciaGM",
  authDomain: "isekai-ai-quest.firebaseapp.com",
  projectId: "isekai-ai-quest",
  storageBucket: "isekai-ai-quest.firebasestorage.app",
  messagingSenderId: "320239491310",
  appId: "1:320239491310:web:f34601e35b1f79e4bb7bff",
  measurementId: "G-NLXJXCY8HD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();