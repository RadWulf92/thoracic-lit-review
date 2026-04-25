import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

// Firebase config — not a secret; security is enforced by Firestore rules.
// Replace these values with your own from Firebase Console > Project Settings > Web App.
const firebaseConfig = {
  apiKey: 'AIzaSyBeaUjbB3Wgy-mELF9kTbwf5cAk08GYpcA',
  authDomain: 'literature-uptodate.firebaseapp.com',
  projectId: 'literature-uptodate',
  storageBucket: 'literature-uptodate.firebasestorage.app',
  messagingSenderId: '239050024971',
  appId: '1:239050024971:web:1f984f574eebf2e43dff0e',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
