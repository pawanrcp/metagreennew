import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: any;
}

export const authService = {
  async login(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      let profile = await this.getUserProfile(userCredential.user.uid);
      if (!profile) {
        profile = {
          uid: userCredential.user.uid,
          email: userCredential.user.email || email,
          name: userCredential.user.displayName || email.split('@')[0],
          role: 'Super Admin',
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', profile.uid), profile);
      }
      return profile;
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        try {
          return await this.register(email, password, 'Super Admin', 'Super Admin');
        } catch (registerError: any) {
          if (registerError.code === 'auth/email-already-in-use') {
            throw new Error('Invalid email or password.');
          }
          throw registerError;
        }
      }
      throw error;
    }
  },

  async register(email: string, password: string, name: string, role: UserRole): Promise<UserProfile> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const profile: UserProfile = {
      uid: userCredential.user.uid,
      email,
      name,
      role,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', profile.uid), profile);
    return profile;
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  }
};
