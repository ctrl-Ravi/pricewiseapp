import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJoxRfdc2WyZLupuPacUtOvvVdktTgIJE",
  authDomain: "pricewiseapp-52ddc.firebaseapp.com",
  projectId: "pricewiseapp-52ddc",
  storageBucket: "pricewiseapp-52ddc.appspot.com",
  messagingSenderId: "1036399950997",
  appId: "1:1234567890:web:321abc456def7890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence (optional)
// This will help the app work when offline
// import { enableIndexedDbPersistence } from 'firebase/firestore';
// enableIndexedDbPersistence(db).catch((err) => {
//   console.error('Firebase persistence error:', err);
// });

export default app; 