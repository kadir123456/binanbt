import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyC6ENhmUrrtrN6HFbudthifGwUGSzWih7A",
  authDomain: "aviatoronline-6c2b4.firebaseapp.com",
  databaseURL: "https://aviatoronline-6c2b4-default-rtdb.firebaseio.com",
  projectId: "aviatoronline-6c2b4",
  storageBucket: "aviatoronline-6c2b4.firebasestorage.app",
  messagingSenderId: "471392622297",
  appId: "1:471392622297:web:95dca8c181277d3526d0c8",
  measurementId: "G-192Z8B860B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const analytics = getAnalytics(app);

export default app;