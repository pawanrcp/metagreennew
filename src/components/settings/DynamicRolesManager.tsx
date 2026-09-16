import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Users,
  Check,
  X,
  AlertTriangle,
  Search,
  Lock,
  CheckCircle2,
  Shield,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { rbacService, Role, Permission } from '@/src/services/rbac.service';
import { UserProfile } from '@/src/services/auth.service';
import { useToast } from '@/src/context/ToastContext';
import { cn } from '@/src/lib/utils';

export function DynamicRolesManager() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    name: '',
    code: '',
    description: '',
  });

  // Assigned users modal
  const [assignedUsersModalRole, setAssignedUsersModalRole] = useState<Role | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Collapsed modules in permission matrix
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  // 1. Subscribe to roles and permissions
  useEffect(() => {
    setLoading(true);
    const unsubRoles = rbacService.subscribeRoles((liveRoles) => {
      setRoles(liveRoles);
      if (liveRoles.length > 0) {
        setSelectedRole((prev) => {
          if (!prev) return liveRoles[0];
          const found = liveRoles.find((r) => r.id === prev.id);
          return found || liveRoles[0];
        });
      }
      setLoading(false);
    });

    const unsubPerms = rbacService.subscribePermissions((livePerms) => {
      setPermissions(livePerms);
    });

    return () => {
      unsubRoles();
      unsubPerms();
    };
  }, []);

  // 2. Group permissions by Module
  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    for (const p of permissions) {
      if (!groups[p.module]) {
        groups[p.module] = [];
      }
      groups[p.module].push(p);
    }
    return groups;
  }, [permissions]);

  const modules = Object.keys(groupedPermissions).sort();

  // 3. Permission toggling
  const handleTogglePermission = async (permCode: string) => {
    if (!selectedRole) return;
    const currentPerms = new Set(selectedRole.permissions || []);
    const normalizedCode = permCode.toLowerCase();

    if (currentPerms.has(normalizedCode)) {
      currentPerms.delete(normalizedCode);
    } else {
      currentPerms.add(normalizedCode);
    }

    const updatedList = Array.from(currentPerms);

    // Optimistic local update
    setSelectedRole({ ...selectedRole, permissions: updatedList });

    try {
      setIsSaving(true);
      await rbacService.updateRole(selectedRole.id, { permissions: updatedList });
      toast.success(`Permissions updated for role ${selectedRole.name}`, 'Permissions Saved');
    } catch (err: any) {
      console.error('Error updating role permissions:', err);
      toast.error(err.message || 'Failed to update permissions', 'Update Failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleModuleAll = async (moduleName: string, shouldEnable: boolean) => {
    if (!selectedRole) return;
    const currentPerms = new Set(selectedRole.permissions || []);
    const modulePerms = groupedPermissions[moduleName] || [];

    for (const p of modulePerms) {
      if (shouldEnable) {
        currentPerms.add(p.code.toLowerCase());
      } else {
        currentPerms.delete(p.code.toLowerCase());
      }
    }

    const updatedList = Array.from(currentPerms);
    setSelectedRole({ ...selectedRole, permissions: updatedList });

    try {
      setIsSaving(true);
      await rbacService.updateRole(selectedRole.id, { permissions: updatedList });
      toast.success(
        `${shouldEnable ? 'Granted' : 'Revoked'} all permissions in ${moduleName}`,
        'Permissions Batch Update'
      );
    } catch (err: any) {
      console.error('Batch permission update error:', err);
      toast.error('Failed to update module permissions', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Create Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleForm.name.trim()) {
      alert('Please provide a role name.');
      return;
    }

    const code = newRoleForm.code.trim() || newRoleForm.name.toUpperCase().replace(/\s+/g, '_');

    try {
      setIsSaving(true);
      const created = await rbacService.createRole({
        name: newRoleForm.name.trim(),
        code,
        description: newRoleForm.description.trim() || `Custom role for ${newRoleForm.name}`,
        permissions: ['dashboard:overview:view'],
        status: 'active',
      });

      toast.success(`Role "${created.name}" created successfully!`, 'Role Created');
      setIsCreateModalOpen(false);
      setNewRoleForm({ name: '', code: '', description: '' });
      setSelectedRole(created);
    } catch (err: any) {
      console.error('Error creating role:', err);
      alert(err.message || 'Failed to create role');
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Delete Role
  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      alert('System primary roles cannot be deleted. You can deactivate them instead.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      try {
        await rbacService.deleteRole(role.id);
        toast.info(`Role "${role.name}" has been deleted.`, 'Role Deleted');
        if (selectedRole?.id === role.id) {
          setSelectedRole(roles.find((r) => r.id !== role.id) || null);
        }
      } catch (err: any) {
        console.error('Error deleting role:', err);
        alert(err.message || 'Failed to delete role.');
      }
    }
  };

  // 6. View Assigned Users
  const handleViewUsers = async (role: Role) => {
    setAssignedUsersModalRole(role);
    setLoadingUsers(true);
    try {
      const users = await rbacService.getUsersForRole(role.name);
      setAssignedUsers(users);
    } catch (err) {
      console.error('Error fetching assigned users:', err);
      setAssignedUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-medium">Loading dynamic roles & permission matrix...</p>
      </div>
    );
  }

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" /> Dynamic Access Control (RBAC)
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Roles & Granular Permissions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Zero hardcoded roles. Super Admins can dynamically create roles, define access matrices across Module → Resource → Action, and instantly restrict features for any organization.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Custom Role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Roles List */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roles by name or code..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
            {filteredRoles.map((role) => {
              const isSelected = selectedRole?.id === role.id;
              const permCount = (role.permissions || []).length;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    'p-4 transition-all cursor-pointer flex items-start justify-between gap-3',
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-emerald-600'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  )}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {role.name}
                      </span>
                      {role.isSystem && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <Lock className="w-2.5 h-2.5" /> System
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {role.description}
                    </p>
                    <div className="flex items-center gap-2 pt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <span>{permCount} Permissions Granted</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewUsers(role);
                      }}
                      title="View Assigned Users"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                    </button>
                    {!role.isSystem && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role);
                        }}
                        title="Delete Role"
                        className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Permission Matrix */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          {selectedRole ? (
            <div className="space-y-6">
              {/* Selected Role Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Editing Matrix</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedRole.code}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {selectedRole.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedRole.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleViewUsers(selectedRole)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Assigned Users</span>
                  </button>
                  {isSaving && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                    </span>
                  )}
                </div>
              </div>

              {/* Module-by-Module Permission Matrix */}
              <div className="space-y-4">
                {modules.map((moduleName) => {
                  const modulePerms = groupedPermissions[moduleName] || [];
                  const isCollapsed = Boolean(collapsedModules[moduleName]);
                  const allSelected = modulePerms.every((p) =>
                    selectedRole.permissions?.includes(p.code.toLowerCase())
                  );
                  const selectedCount = modulePerms.filter((p) =>
                    selectedRole.permissions?.includes(p.code.toLowerCase())
                  ).length;

                  return (
                    <div
                      key={moduleName}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 overflow-hidden"
                    >
                      {/* Module Header */}
                      <div className="p-4 bg-slate-100/70 dark:bg-slate-900/90 flex items-center justify-between gap-3 select-none">
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedModules((prev) => ({
                              ...prev,
                              [moduleName]: !prev[moduleName],
                            }))
                          }
                          className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white cursor-pointer"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                          <span>{moduleName} Module</span>
                          <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                            ({selectedCount}/{modulePerms.length} enabled)
                          </span>
                        </button>

                        <div className="flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => handleToggleModuleAll(moduleName, !allSelected)}
                            className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            {allSelected ? 'Revoke All' : 'Grant All'}
                          </button>
                        </div>
                      </div>

                      {/* Permissions List */}
                      {!isCollapsed && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white dark:bg-slate-900/60">
                          {modulePerms.map((perm) => {
                            const isChecked = Boolean(
                              selectedRole.permissions?.includes(perm.code.toLowerCase())
                            );
                            return (
                              <label
                                key={perm.id}
                                className={cn(
                                  'flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none',
                                  isChecked
                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-slate-900 dark:text-white'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(perm.code)}
                                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                      {perm.resource} • {perm.action}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                      {perm.code}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                    {perm.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <Shield className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm">Select a role from the left to view its permission matrix</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE ROLE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Create Custom Dynamic Role</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  placeholder="e.g. Field Quality Inspector"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Role Code (Identifier)
                </label>
                <input
                  type="text"
                  value={newRoleForm.code}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, code: e.target.value })}
                  placeholder="e.g. QUALITY_INSPECTOR"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  placeholder="Describe the operational responsibilities of this custom role..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow cursor-pointer disabled:opacity-60"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGNED USERS MODAL */}
      {assignedUsersModalRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-white space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Role Membership
                </span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Users with role: {assignedUsersModalRole.name}
                </h3>
              </div>
              <button
                onClick={() => setAssignedUsersModalRole(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingUsers ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                  <p className="text-xs">Fetching assigned users...</p>
                </div>
              ) : assignedUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-medium">No users are currently assigned to this role.</p>
                </div>
              ) : (
                assignedUsers.map((u) => (
                  <div
                    key={u.uid}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</p>
                      {u.companyName && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {u.companyName}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold',
                        u.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      )}
                    >
                      {u.status || 'Active'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setAssignedUsersModalRole(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
