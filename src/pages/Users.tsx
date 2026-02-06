import React, { useState, useEffect } from 'react';
import { authService } from '../services';
import { User, Role } from '../types';
import {
    Users as UsersIcon,
    Shield,
    UserCheck,
    UserPlus,
    Edit2,
    Key,
    Check,
    X,
    MoreVertical,
    Search
} from 'lucide-react';

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newUser, setNewUser] = useState<Omit<User, 'id' | 'avatar' | 'status'>>({
        name: '',
        email: '',
        role: 'ASSIGNED',
        organizationId: 'org1'
    });
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        setUsers(authService.getAllUsers());
    }, []);

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            authService.updateUser(editingUser.id, editingUser);
            setUsers(authService.getAllUsers());
            setShowEditModal(false);
            setEditingUser(null);
        }
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        authService.addUser(newUser);
        setUsers(authService.getAllUsers());
        setShowAddModal(false);
        setNewUser({
            name: '',
            email: '',
            role: 'ASSIGNED',
            organizationId: 'org1'
        });
    };

    const stats = [
        { label: 'Total Users', value: users.length, icon: <UsersIcon size={24} color="#435ebe" />, bg: '#ebf1ff' },
        { label: 'Administrators', value: users.filter(u => u.role === 'ADMIN').length, icon: <Shield size={24} color="#dc2626" />, bg: '#fee2e2' },
        { label: 'Owners', value: users.filter(u => u.role === 'OWNER').length, icon: <UserCheck size={24} color="#f59e0b" />, bg: '#fef3c7' },
        { label: 'Assigned Users', value: users.filter(u => u.role === 'ASSIGNED').length, icon: <UserPlus size={24} color="#10b981" />, bg: '#dcfce7' },
    ];

    const roleColors: Record<Role, string> = {
        ADMIN: '#fee2e2',
        OWNER: '#fef3c7',
        ASSIGNED: '#dcfce7',
        VIEWER: '#f1f5f9',
        CLIENT_ADMIN: '#e0f2fe',
        DEMO: '#f1f5f9'
    };

    const roleTextColors: Record<Role, string> = {
        ADMIN: '#dc2626',
        OWNER: '#d97706',
        ASSIGNED: '#16a34a',
        VIEWER: '#64748b',
        CLIENT_ADMIN: '#0284c7',
        DEMO: '#64748b'
    };

    const permissions = [
        { key: 'measures:read', label: 'measures:read' },
        { key: 'measures:write', label: 'measures:write' },
        { key: 'templates:read', label: 'templates:read' },
        { key: 'templates:write', label: 'templates:write' },
        { key: 'users:manage', label: 'users:manage' },
    ];

    const roles: Role[] = ['ADMIN', 'OWNER', 'ASSIGNED', 'VIEWER'];

    const matrixData: Record<string, Record<Role, boolean>> = {
        'measures:read': { ADMIN: true, OWNER: true, ASSIGNED: true, VIEWER: true, CLIENT_ADMIN: true, DEMO: true },
        'measures:write': { ADMIN: true, OWNER: true, ASSIGNED: true, VIEWER: false, CLIENT_ADMIN: true, DEMO: false },
        'templates:read': { ADMIN: true, OWNER: true, ASSIGNED: true, VIEWER: true, CLIENT_ADMIN: true, DEMO: true },
        'templates:write': { ADMIN: true, OWNER: false, ASSIGNED: false, VIEWER: false, CLIENT_ADMIN: false, DEMO: false },
        'users:manage': { ADMIN: true, OWNER: false, ASSIGNED: false, VIEWER: false, CLIENT_ADMIN: true, DEMO: false },
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Users & Permissions</h2>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {stat.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>{stat.value}</div>
                            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* User Management */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfd' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>User Management</h3>
                    <button
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '13px' }}
                        onClick={() => setShowAddModal(true)}
                    >
                        <UserPlus size={16} /> Add User
                    </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ width: '25%' }}>Name</th>
                                <th style={{ width: '25%' }}>Email</th>
                                <th style={{ width: '15%' }}>Role</th>
                                <th style={{ width: '10%' }}>Organization</th>
                                <th style={{ width: '10%' }}>Status</th>
                                <th style={{ width: '15%', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                                    <td style={{ color: '#64748b' }}>{u.email}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            background: roleColors[u.role] || '#f1f5f9',
                                            color: roleTextColors[u.role] || '#64748b',
                                            textTransform: 'capitalize'
                                        }}>
                                            {u.role.toLowerCase().replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ color: '#64748b', fontSize: '13px' }}>{u.organizationId}</td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            background: u.id === currentUser?.id ? '#dcfce7' : '#f1f5f9',
                                            color: u.id === currentUser?.id ? '#16a34a' : '#64748b'
                                        }}>
                                            {u.id === currentUser?.id ? 'Current User' : (u.status || 'Active')}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                                onClick={() => {
                                                    setEditingUser({ ...u });
                                                    setShowEditModal(true);
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                                Permissions
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Role Permissions Matrix */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfd' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Role Permissions Matrix</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ width: '30%' }}>Permission</th>
                                {roles.map(r => (
                                    <th key={r} style={{ textAlign: 'center' }}>{r.charAt(0) + r.slice(1).toLowerCase()}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {permissions.map(p => (
                                <tr key={p.key}>
                                    <td style={{ fontWeight: 500, color: '#334155', fontSize: '13px' }}>{p.label}</td>
                                    {roles.map(r => (
                                        <td key={`${p.key}-${r}`} style={{ textAlign: 'center' }}>
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                margin: '0 auto',
                                                borderRadius: '4px',
                                                background: matrixData[p.key][r] ? '#dcfce7' : '#f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {matrixData[p.key][r] ? <Check size={14} color="#16a34a" /> : <X size={14} color="#cbd5e1" />}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0, marginBottom: '2rem' }}>Edit User</h2>
                        <form onSubmit={handleSaveUser}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Display Name</label>
                                    <input
                                        type="text"
                                        value={editingUser.name}
                                        onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Email</label>
                                    <input
                                        type="email"
                                        value={editingUser.email}
                                        onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Role</label>
                                    <select
                                        value={editingUser.role}
                                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value as Role })}
                                    >
                                        <option value="ADMIN">Administrator</option>
                                        <option value="OWNER">Owner</option>
                                        <option value="ASSIGNED">Assigned User</option>
                                        <option value="VIEWER">Viewer</option>
                                        <option value="CLIENT_ADMIN">Client Admin</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Organization ID</label>
                                    <input
                                        type="text"
                                        value={editingUser.organizationId}
                                        onChange={e => setEditingUser({ ...editingUser, organizationId: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '3rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0, marginBottom: '2rem' }}>Add New User</h2>
                        <form onSubmit={handleAddUser}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Display Name</label>
                                    <input
                                        type="text"
                                        value={newUser.name}
                                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Email Address</label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="user@demo.com"
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Assign Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })}
                                    >
                                        <option value="ADMIN">Administrator</option>
                                        <option value="OWNER">Owner</option>
                                        <option value="ASSIGNED">Assigned User</option>
                                        <option value="VIEWER">Viewer</option>
                                        <option value="CLIENT_ADMIN">Client Admin</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Organization ID</label>
                                    <input
                                        type="text"
                                        value={newUser.organizationId}
                                        onChange={e => setNewUser({ ...newUser, organizationId: e.target.value })}
                                        placeholder="e.g. org1"
                                        required
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '3rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
