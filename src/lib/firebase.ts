import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import config from '@/firebase-applet-config.json';

// Priority: 1. window.firebaseConfig (injected), 2. firebase-applet-config.json (file)
const firebaseConfig = (window as any).firebaseConfig || config;

if (!firebaseConfig.projectId) {
  console.error('Firebase Project ID is missing. Ensure Firebase is properly provisioned.');
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
