import { useAdminUsers, useUpdateUserRole, useUpdateUserStatus } from '../../hooks/useUsers';
import DataTable from '../../components/admin/DataTable';
import Badge from '../../components/common/Badge';
import { toast } from '../../store/useToastStore';

export default function AdminCustomersListPage() {
  const { data: users, isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();

  const toggleRole = (user) => {
    const nextRole = user.role === 'admin' ? 'customer' : 'admin';
    if (!window.confirm(`Change ${user.name}'s role to "${nextRole}"?`)) return;
    updateRole.mutate(
      { id: user._id, role: nextRole },
      { onSuccess: () => toast.success('Role updated'), onError: () => toast.error('Could not update role') }
    );
  };

  const toggleStatus = (user) => {
    updateStatus.mutate(
      { id: user._id, isActive: !user.isActive },
      { onSuccess: () => toast.success('Status updated'), onError: () => toast.error('Could not update status') }
    );
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <button
          type="button"
          onClick={() => toggleRole(u)}
          className="text-left"
        >
          <Badge tone={u.role === 'admin' ? 'accent' : 'neutral'}>{u.role}</Badge>
        </button>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (u) => (
        <button type="button" onClick={() => toggleStatus(u)} className="text-left">
          <Badge tone={u.isActive ? 'success' : 'error'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
        </button>
      ),
    },
    { key: 'createdAt', header: 'Joined', render: (u) => new Date(u.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl">Customers</h1>
      <DataTable columns={columns} data={users} isLoading={isLoading} emptyMessage="No customers yet" />
    </div>
  );
}
