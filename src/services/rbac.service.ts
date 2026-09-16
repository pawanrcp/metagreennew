import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { UserProfile } from './auth.service';

export interface Permission {
  id: string;
  module: string;
  resource: string;
  action: string;
  code: string;
  description: string;
  createdAt?: any;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  isSystem?: boolean;
  status: 'active' | 'inactive';
  permissions: string[]; // array of permission codes (e.g. 'crm:leads:view')
  createdAt?: any;
  updatedAt?: any;
}

export const rbacService = {
  // 1. Fetch all dynamic permissions from Firestore
  async getPermissions(): Promise<Permission[]> {
    try {
      const snap = await getDocs(collection(db, 'permissions'));
      if (snap.empty) {
        return [];
      }
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Permission));
    } catch (err) {
      console.error('Error loading dynamic permissions:', err);
      return [];
    }
  },

  // Real-time listener for permissions
  subscribePermissions(callback: (permissions: Permission[]) => void) {
    return onSnapshot(collection(db, 'permissions'), (snap) => {
      const perms = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Permission));
      callback(perms);
    });
  },

  // Create new permission dynamically
  async createPermission(data: Omit<Permission, 'id'>): Promise<Permission> {
    const code = data.code || `${data.module}:${data.resource}:${data.action}`.toLowerCase();
    const docRef = await addDoc(collection(db, 'permissions'), {
      ...data,
      code,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...data, code };
  },

  // 2. Fetch all dynamic roles from Firestore
  async getRoles(): Promise<Role[]> {
    try {
      const snap = await getDocs(collection(db, 'roles'));
      if (snap.empty) {
        return [];
      }
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Role));
    } catch (err) {
      console.error('Error loading dynamic roles:', err);
      return [];
    }
  },

  // Real-time listener for roles
  subscribeRoles(callback: (roles: Role[]) => void) {
    return onSnapshot(collection(db, 'roles'), (snap) => {
      const roles = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Role));
      callback(roles);
    });
  },

  // Fetch single role
  async getRoleById(roleId: string): Promise<Role | null> {
    try {
      const docSnap = await getDoc(doc(db, 'roles', roleId));
      if (!docSnap.exists()) return null;
      return { id: docSnap.id, ...docSnap.data() } as Role;
    } catch (err) {
      console.error(`Error fetching role ${roleId}:`, err);
      return null;
    }
  },

  // Create new role dynamically (Super Admin)
  async createRole(data: {
    name: string;
    code: string;
    description: string;
    permissions: string[];
    status?: 'active' | 'inactive';
  }): Promise<Role> {
    const roleCode = data.code.toUpperCase().replace(/\s+/g, '_');
    const newDoc = {
      name: data.name,
      code: roleCode,
      description: data.description,
      isSystem: false,
      status: data.status || 'active',
      permissions: data.permissions || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'roles'), newDoc);
    return { id: docRef.id, ...newDoc };
  },

  // Edit role & assign/remove permissions (Super Admin)
  async updateRole(
    roleId: string,
    updates: Partial<Pick<Role, 'name' | 'description' | 'status' | 'permissions'>>
  ): Promise<void> {
    const roleRef = doc(db, 'roles', roleId);
    await updateDoc(roleRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  // Deactivate or delete role (Super Admin)
  async deleteRole(roleId: string): Promise<void> {
    const roleRef = doc(db, 'roles', roleId);
    const roleSnap = await getDoc(roleRef);
    if (roleSnap.exists() && roleSnap.data().isSystem) {
      throw new Error('System primary roles cannot be deleted. You can deactivate them instead.');
    }
    await deleteDoc(roleRef);
  },

  // 3. View users assigned to a role
  async getUsersForRole(roleNameOrId: string): Promise<UserProfile[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', roleNameOrId)
      );
      const snap = await getDocs(q);
      const users: UserProfile[] = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));

      // Also check roleId if role was queried by ID
      if (users.length === 0) {
        const qId = query(
          collection(db, 'users'),
          where('roleId', '==', roleNameOrId)
        );
        const snapId = await getDocs(qId);
        return snapId.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
      }

      return users;
    } catch (err) {
      console.error('Error fetching users for role:', err);
      return [];
    }
  },

  // 4. Compute effective permissions for user (Role permissions + Custom permissions)
  async getUserPermissions(user: UserProfile): Promise<string[]> {
    if (!user) return [];

    // Super Admin has all privileges
    if (user.role === 'Super Admin' || user.isSuperAdmin) {
      return ['*'];
    }

    const permSet = new Set<string>();

    // If user has direct roleId or role name, load role permissions from Firestore
    let roleDoc: Role | null = null;
    if (user.roleId) {
      roleDoc = await this.getRoleById(user.roleId);
    }

    if (!roleDoc && user.role) {
      // Find role by name or code
      const q = query(collection(db, 'roles'), where('name', '==', user.role));
      const snap = await getDocs(q);
      if (!snap.empty) {
        roleDoc = { id: snap.docs[0].id, ...snap.docs[0].data() } as Role;
      }
    }

    if (roleDoc && Array.isArray(roleDoc.permissions)) {
      for (const p of roleDoc.permissions) {
        permSet.add(p.toLowerCase());
      }
    }

    // Add user-specific custom permissions
    if (Array.isArray(user.customPermissions)) {
      for (const p of user.customPermissions) {
        permSet.add(p.toLowerCase());
      }
    }

    return Array.from(permSet);
  },

  // 5. Dynamic Permission Check: Module -> Resource -> Action
  hasPermission(
    permissions: string[] | undefined,
    module: string,
    resource: string,
    action: string,
    isSuperAdmin?: boolean
  ): boolean {
    if (isSuperAdmin) return true;
    if (!permissions || permissions.length === 0) return false;
    if (permissions.includes('*')) return true;

    const targetCode = `${module}:${resource}:${action}`.toLowerCase();
    const moduleWildcard = `${module}:*:*`.toLowerCase();
    const resourceWildcard = `${module}:${resource}:*`.toLowerCase();

    return permissions.some(
      (p) =>
        p.toLowerCase() === targetCode ||
        p.toLowerCase() === moduleWildcard ||
        p.toLowerCase() === resourceWildcard
    );
  },
};
