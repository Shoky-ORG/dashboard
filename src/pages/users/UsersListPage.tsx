import React, { useState, useEffect, useCallback } from 'react';
import { usersApi } from '@/api/users';
import { authApi } from '@/api/auth';
import { User, RoleEnum, Department, NormalizedPagination, ROLE_ID_MAP, ROLE_NAME_MAP } from '@/types/api';
import { can } from '@/auth/permissions';
import { useAuth } from '@/auth/AuthContext';
import { PermissionGate } from '@/components/common/PermissionGate';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { RoleBadge, DepartmentBadge, Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';
import { UserPlus, Search, Edit2, Trash2, Mail, User as UserIcon } from 'lucide-react';
import './UsersListPage.css';

export const UsersListPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<NormalizedPagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleEnum | ''>('');
  const [departmentFilter, setDepartmentFilter] = useState<Department | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Staff Creation Modal
  const [createModalType, setCreateModalType] = useState<'admin' | 'doctor' | 'ta' | null>(null);
  const [staffFullName, setStaffFullName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffDepartment, setStaffDepartment] = useState<Department>('computer_science');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState<Department>('computer_science');
  const [editRoleId, setEditRoleId] = useState<number>(3);
  const [editIsActive, setEditIsActive] = useState(true);

  const fetchUsers = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    try {
      const res = await usersApi.getUsers({
        page,
        limit: 10,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        department: departmentFilter || undefined,
      });
      setUsers(res.items);
      setPagination(res.pagination);
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to fetch users', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, departmentFilter]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleOpenCreateStaff = (type: 'admin' | 'doctor' | 'ta') => {
    setCreateModalType(type);
    setStaffFullName('');
    setStaffEmail('');
    setStaffDepartment(currentUser?.department || 'computer_science');
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFullName || !staffEmail) return;

    if (!staffEmail.endsWith('@hti.edu.eg')) {
      setToast({ message: 'Staff email must be a valid @hti.edu.eg domain.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { fullName: staffFullName, email: staffEmail, department: staffDepartment };
      if (createModalType === 'admin') await authApi.createAdmin(payload);
      else if (createModalType === 'doctor') await authApi.createDoctor(payload);
      else if (createModalType === 'ta') await authApi.createTa(payload);

      setToast({ message: `${createModalType?.toUpperCase()} user created successfully`, type: 'success' });
      setCreateModalType(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Staff creation failed', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditEmail(user.email || '');
    setEditDepartment(user.department || 'computer_science');
    setEditRoleId(user.role?.id || ROLE_ID_MAP[user.role?.name] || 5);
    setEditIsActive(user.isActive);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      await usersApi.updateUser(editingUser.id, {
        fullName: editFullName,
        email: editEmail,
        department: editDepartment,
        roleId: Number(editRoleId),
        isActive: editIsActive,
      });
      setToast({ message: 'User role and profile updated successfully', type: 'success' });
      setEditingUser(null);
      fetchUsers(pagination.page);
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to update user', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (!window.confirm(`Delete user "${targetUser.fullName}"?`)) return;

    try {
      await usersApi.deleteUser(targetUser.id);
      setToast({ message: 'User deleted successfully', type: 'success' });
      fetchUsers(pagination.page);
    } catch (err: any) {
      setToast({ message: typeof err === 'string' ? err : 'Failed to delete user', type: 'error' });
    }
  };

  const columns: Column<User>[] = [
    {
      header: 'ID',
      accessor: (row) => <span style={{ fontFamily: 'var(--font-mono)' }}>#{row.id}</span>,
      width: '70px',
    },
    {
      header: 'User Name',
      accessor: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="table-user-avatar">
            {row.avatar_url ? <img src={row.avatar_url} alt="" /> : row.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{row.fullName}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (row) => <RoleBadge role={row.role?.name || 'student'} size="sm" />,
    },
    {
      header: 'Department',
      accessor: (row) => <DepartmentBadge department={row.department} size="sm" />,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.isActive ? 'success' : 'danger'} size="sm">
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <PermissionGate action="users.update" context={{ targetUser: row }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEditUser(row)}
              leftIcon={<Edit2 size={14} />}
            >
              Edit Role & Info
            </Button>
          </PermissionGate>

          <PermissionGate action="users.delete" context={{ targetUser: row }}>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteUser(row)}
              leftIcon={<Trash2 size={14} />}
            />
          </PermissionGate>
        </div>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="users-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-action-header">
        <div>
          <h2 className="page-header-title">User & Staff Administration</h2>
          <p className="page-header-desc">Manage system users, modify roles, create staff accounts, and control permissions</p>
        </div>

        {currentUser?.role?.name === 'super_admin' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="sm" leftIcon={<UserPlus size={16} />} onClick={() => handleOpenCreateStaff('admin')}>
              + Admin
            </Button>
            <Button variant="outline" size="sm" leftIcon={<UserPlus size={16} />} onClick={() => handleOpenCreateStaff('doctor')}>
              + Doctor
            </Button>
            <Button variant="primary" size="sm" leftIcon={<UserPlus size={16} />} onClick={() => handleOpenCreateStaff('ta')}>
              + TA
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader
          title="System Users Directory"
          action={
            <div className="table-filter-bar">
              <div className="search-input-wrapper">
                <Input
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search size={16} />}
                />
              </div>

              <select
                className="shoky-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleEnum | '')}
              >
                <option value="">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="ta">TA</option>
                <option value="student">Student</option>
              </select>

              <select
                className="shoky-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value as Department | '')}
              >
                <option value="">All Departments</option>
                <option value="engineering">Engineering</option>
                <option value="computer_science">Computer Science</option>
                <option value="business_administration">Business Admin</option>
              </select>
            </div>
          }
        />
        <CardBody>
          <DataTable
            columns={columns}
            data={users}
            keyExtractor={(row) => row.id}
            isLoading={isLoading}
            emptyMessage="No users found matching filter criteria"
          />
          <Pagination pagination={pagination} onPageChange={(page) => fetchUsers(page)} />
        </CardBody>
      </Card>

      {/* Staff Creation Modal */}
      <Modal
        isOpen={!!createModalType}
        onClose={() => setCreateModalType(null)}
        title={`Create New ${createModalType?.toUpperCase()} Account`}
      >
        <form onSubmit={handleCreateStaff} className="modal-form-stack">
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Ahmed Hassan"
            value={staffFullName}
            onChange={(e) => setStaffFullName(e.target.value)}
            leftIcon={<UserIcon size={18} />}
            required
          />

          <Input
            label="Staff Email (@hti.edu.eg)"
            type="email"
            placeholder="ahmed.hassan@hti.edu.eg"
            value={staffEmail}
            onChange={(e) => setStaffEmail(e.target.value)}
            leftIcon={<Mail size={18} />}
            helperText="An activation password-setup email will be sent automatically"
            required
          />

          <div className="shoky-input-group">
            <label className="input-label">Department</label>
            <select
              className="shoky-input"
              value={staffDepartment}
              onChange={(e) => setStaffDepartment(e.target.value as Department)}
            >
              <option value="computer_science">Computer Science</option>
              <option value="engineering">Engineering</option>
              <option value="business_administration">Business Administration</option>
            </select>
          </div>

          <div className="modal-actions-right">
            <Button type="button" variant="outline" onClick={() => setCreateModalType(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>Create Account</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User & Role Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit User: ${editingUser?.fullName}`}
      >
        <form onSubmit={handleUpdateUser} className="modal-form-stack">
          <Input
            label="Full Name"
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            required
          />

          <div className="shoky-input-group">
            <label className="input-label">User Role *</label>
            <select
              className="shoky-input"
              value={editRoleId}
              onChange={(e) => setEditRoleId(Number(e.target.value))}
            >
              {currentUser?.role?.name === 'super_admin' && <option value={1}>Super Admin</option>}
              {currentUser?.role?.name === 'super_admin' && <option value={2}>Admin</option>}
              <option value={3}>Doctor</option>
              <option value={4}>Teaching Assistant (TA)</option>
              <option value={5}>Student</option>
            </select>
          </div>

          <div className="shoky-input-group">
            <label className="input-label">Department</label>
            <select
              className="shoky-input"
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value as Department)}
            >
              <option value="computer_science">Computer Science</option>
              <option value="engineering">Engineering</option>
              <option value="business_administration">Business Administration</option>
            </select>
          </div>

          <div className="shoky-input-group">
            <label className="input-label">Account Status</label>
            <select
              className="shoky-input"
              value={editIsActive ? 'active' : 'inactive'}
              onChange={(e) => setEditIsActive(e.target.value === 'active')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="modal-actions-right">
            <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
