import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { authService, UserProfile } from '../services/auth.service';
import { rbacService } from '../services/rbac.service';
import { checkAndSeedFirebase } from '../services/firebaseSeed.service';

interface AuthContextType {
  user: UserProfile | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (module: string, resource: string, action: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  permissions: [],
  loading: true,
  hasPermission: () => false,
  refreshPermissions: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial seed check (ensures dynamic roles, permissions, plans, and website configs exist in Firestore)
  useEffect(() => {
    checkAndSeedFirebase().catch(console.error);
  }, []);

  const loadUserPermissions = useCallback(async (profile: UserProfile) => {
    try {
      const perms = await rbacService.getUserPermissions(profile);
      setPermissions(perms);
    } catch (err) {
      console.error('Error resolving user permissions:', err);
      setPermissions([]);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await authService.getUserProfile(firebaseUser.uid);
          setUser(profile);
          if (profile) {
            await loadUserPermissions(profile);
          } else {
            setPermissions([]);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(null);
          setPermissions([]);
        }
      } else {
        setUser(null);
        setPermissions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserPermissions]);

  const hasPermission = useCallback(
    (module: string, resource: string, action: string): boolean => {
      if (!user) return false;
      return rbacService.hasPermission(
        permissions,
        module,
        resource,
        action,
        user.isSuperAdmin || user.role === 'Super Admin'
      );
    },
    [user, permissions]
  );

  const refreshPermissions = useCallback(async () => {
    if (user) {
      await loadUserPermissions(user);
    }
  }, [user, loadUserPermissions]);

  return (
    <AuthContext.Provider value={{ user, permissions, loading, hasPermission, refreshPermissions }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

