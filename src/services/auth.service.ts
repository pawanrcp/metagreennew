import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updatePassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  companyLogo?: string;
  doorNo?: string;
  companyAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  latitude?: string;
  longitude?: string;
  status?: 'Pending' | 'Active' | 'Rejected';
  mustChangePassword?: boolean;
  isFirstLogin?: boolean;
  tempPassword?: string;
  vendorAccount?: any;
  createdAt?: any;
}

export const authService = {
  async login(email: string, password: string): Promise<UserProfile> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      let profile = await this.getUserProfile(userCredential.user.uid);
      if (!profile) {
        const isVendorEmail = email.toLowerCase().includes('vendor') || email.toLowerCase().includes('vikram');
        const isEmp = email.toLowerCase().includes('emp') || email.toLowerCase().includes('staff');
        profile = {
          uid: userCredential.user.uid,
          email: userCredential.user.email || email,
          name: isEmp ? 'Amit Kumar (Vendor Staff)' : (isVendorEmail ? 'Vikram Solar Admin' : (userCredential.user.displayName || email.split('@')[0])),
          companyName: isVendorEmail || isEmp ? 'Vikram Solar' : 'Meta Green Global HQ',
          role: isEmp ? 'Vendor Employee' : (isVendorEmail ? 'Vendor' : 'Super Admin'),
          status: 'Active',
          mustChangePassword: isEmp,
          isFirstLogin: isEmp,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', profile.uid), profile);
      }
      return profile;
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        const isVendor = email.toLowerCase().includes('vendor') || email.toLowerCase().includes('vikram');
        const isEmp = email.toLowerCase().includes('emp') || email.toLowerCase().includes('staff');
        try {
          return await this.register(
            email, 
            password, 
            isEmp ? 'Amit Kumar (Vendor Staff)' : (isVendor ? 'Vikram Solar Admin' : 'Global Super Admin'), 
            isEmp ? 'Vendor Employee' : (isVendor ? 'Vendor' : 'Super Admin')
          );
        } catch (registerError: any) {
          if (registerError.code === 'auth/email-already-in-use') {
            throw new Error('Invalid password for existing account.');
          }
          throw registerError;
        }
      }
      throw error;
    }
  },

  // Bulletproof Quick Demo Logins with multi-password fallback
  async loginDemoUser(targetRole: 'admin' | 'vendor' | 'vendor-employee'): Promise<UserProfile> {
    let demoEmail = 'admin@metagreen.com';
    let demoPasses = ['demo1234', 'Admin123!', 'Password123!'];
    let expectedRole: UserRole = 'Super Admin';
    let demoName = 'Global Super Admin';
    let demoCompany = 'Meta Green Global HQ';
    let mustChange = false;

    if (targetRole === 'vendor') {
      demoEmail = 'vendor@vikramsolar.com';
      demoPasses = ['demo1234', 'Vendor123!', 'Password123!'];
      expectedRole = 'Vendor';
      demoName = 'Vikram Solar Admin';
      demoCompany = 'Vikram Solar';
    } else if (targetRole === 'vendor-employee') {
      demoEmail = 'emp@vikramsolar.com';
      demoPasses = ['VendorEmp123!', 'demo1234', 'Password123!'];
      expectedRole = 'Vendor Employee';
      demoName = 'Amit Kumar (Vendor Dispatch Tech)';
      demoCompany = 'Vikram Solar';
      mustChange = true;
    }

    // 1. Try signing in with known demo passwords
    for (const pass of demoPasses) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, demoEmail, pass);
        let profile = await this.getUserProfile(userCredential.user.uid);

        if (!profile || profile.role !== expectedRole) {
          profile = {
            uid: userCredential.user.uid,
            email: demoEmail,
            name: demoName,
            companyName: demoCompany,
            role: expectedRole,
            status: 'Active',
            mustChangePassword: mustChange,
            isFirstLogin: mustChange,
            createdAt: serverTimestamp()
          };
          await setDoc(doc(db, 'users', profile.uid), profile);
        }
        return profile;
      } catch (err: any) {
        // Continue trying next candidate password
      }
    }

    // 2. If existing account password was changed, register a fresh dedicated demo email
    const freshEmail = targetRole === 'vendor-employee'
      ? `staff_${Date.now().toString().slice(-4)}@vikramsolar.com`
      : targetRole === 'vendor'
      ? `vendor_${Date.now().toString().slice(-4)}@vikramsolar.com`
      : `admin_${Date.now().toString().slice(-4)}@metagreen.com`;

    return await this.register(
      freshEmail,
      'VendorEmp123!',
      demoName,
      expectedRole,
      demoCompany,
      mustChange
    );
  },

  async register(
    email: string, 
    password: string, 
    name: string, 
    role: UserRole, 
    companyName?: string, 
    mustChangePassword: boolean = false,
    companyLogo?: string
  ): Promise<UserProfile> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const profile: UserProfile = {
      uid: userCredential.user.uid,
      email,
      name,
      companyName: companyName || (role === 'Vendor' || role === 'Vendor Employee' ? 'Vikram Solar' : 'Meta Green Global HQ'),
      companyLogo,
      role,
      status: 'Active',
      mustChangePassword,
      isFirstLogin: mustChangePassword,
      tempPassword: mustChangePassword ? password : undefined,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', profile.uid), profile);
    return profile;
  },

  async updateUserPassword(newPassword: string): Promise<void> {
    if (!auth.currentUser) throw new Error("No user currently logged in.");
    
    // Update Firebase Auth password
    await updatePassword(auth.currentUser, newPassword);

    // Update Firestore User Profile
    const docRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(docRef, {
      mustChangePassword: false,
      isFirstLogin: false,
      tempPassword: null
    });
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
