import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  Query,
  DocumentData,
  doc,
  getDoc,
} from 'firebase/firestore';
import { UserProfile } from './auth.service';

export class TenantSecurityError extends Error {
  constructor(message: string, public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' = 'FORBIDDEN') {
    super(message);
    this.name = 'TenantSecurityError';
  }
}

export const tenantService = {
  /**
   * Scopes a Firestore query to enforce database-level tenant isolation.
   * Super Admins can access all data or filter by a specific tenant.
   * Non-Super Admins are strictly locked to WHERE organizationId == user.organizationId.
   */
  scopeQuery<T extends DocumentData>(
    collectionName: string,
    user: UserProfile | null,
    targetOrgId?: string
  ): Query<T> {
    if (!user) {
      throw new TenantSecurityError('Unauthenticated request. Cannot query tenant resources.', 'UNAUTHORIZED');
    }

    const colRef = collection(db, collectionName) as any;

    // Super Admin can view all or filter by selected organization
    if (user.role === 'Super Admin' || user.isSuperAdmin) {
      if (targetOrgId && targetOrgId !== 'all') {
        return query(colRef, where('organizationId', '==', targetOrgId));
      }
      return colRef;
    }

    // Identify user's organization ID
    const userOrgId = user.organizationId || user.vendorAccount?.id || user.uid;

    if (!userOrgId) {
      throw new TenantSecurityError('User is not associated with an organization.', 'FORBIDDEN');
    }

    // Strict tenant isolation at the database query level
    return query(colRef, where('organizationId', '==', userOrgId));
  },

  /**
   * Validates resource ownership before any read, update, or delete operation.
   * If a user tries to alter an ID (via Burp Suite or URL tampering) pointing to another tenant,
   * this check throws a TenantSecurityError.
   */
  async validateOwnership(
    collectionName: string,
    documentId: string,
    user: UserProfile | null
  ): Promise<DocumentData> {
    if (!user) {
      throw new TenantSecurityError('Unauthenticated request.', 'UNAUTHORIZED');
    }

    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new TenantSecurityError(`Resource ${documentId} does not exist in ${collectionName}.`, 'NOT_FOUND');
    }

    const data = docSnap.data();

    // Super Admin bypasses ownership restrictions
    if (user.role === 'Super Admin' || user.isSuperAdmin) {
      return data;
    }

    const userOrgId = user.organizationId || user.vendorAccount?.id || user.uid;

    // Check organization ownership
    if (data.organizationId && data.organizationId !== userOrgId) {
      throw new TenantSecurityError(
        `Access Denied. Resource ${documentId} belongs to another organization.`,
        'FORBIDDEN'
      );
    }

    // Installer-specific scope: verify assignment if applicable
    if (user.role === 'Installer' || user.role === 'Solar Installer') {
      const isAssigned =
        data.installerId === user.uid ||
        data.assignedToId === user.uid ||
        data.assignedInstallerId === user.uid;

      if (data.installerId && !isAssigned) {
        throw new TenantSecurityError(
          `Access Denied. Resource ${documentId} is not assigned to you.`,
          'FORBIDDEN'
        );
      }
    }

    return data;
  },

  /**
   * Sanitizes payload to prevent tenant or user ID spoofing.
   * Never trusts client-supplied organization_id, vendor_id, or user_id.
   */
  sanitizePayload<T extends Record<string, any>>(payload: T, user: UserProfile | null): T {
    if (!user) {
      throw new TenantSecurityError('Unauthenticated action.', 'UNAUTHORIZED');
    }

    const sanitized = { ...payload } as any;

    if (!user.isSuperAdmin && user.role !== 'Super Admin') {
      const userOrgId = user.organizationId || user.vendorAccount?.id || user.uid;
      // Strictly enforce caller's organization ID
      sanitized.organizationId = userOrgId;
      sanitized.createdBy = user.uid;
      sanitized.creatorEmail = user.email;
      sanitized.creatorName = user.name;
    }

    return sanitized as T;
  },
};
