import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { organizationService, authService, settingsService } from '../services';
import {
    Organization,
    Department,
    User,
    UserPreferences,
    NotificationSettings,
    Role
} from '../types';
import {
    Building2,
    Users,
    Settings2,
    Bell,
    Database,
    Globe,
    ChevronRight,
    Save,
    Download,
    Upload,
    RefreshCcw,
    AlertTriangle,
    Check,
    X,
    Shield,
    Edit2,
    Trash2,
    Plus
} from 'lucide-react';

const Settings: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'organization';

    const [org, setOrg] = useState<Organization | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [prefs, setPrefs] = useState<UserPreferences | null>(null);
    const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
    const [showResetModal, setShowResetModal] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [newDept, setNewDept] = useState<Omit<Department, 'id'>>({ name: '', code: '', description: '' });

    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [newUser, setNewUser] = useState<Omit<User, 'id' | 'avatar' | 'status'>>({
        name: '',
        email: '',
        role: 'ASSIGNED',
        organizationId: 'org1',
        departmentId: ''
    });

    const [isEditingProfile, setIsEditingProfile] = useState(false);

    useEffect(() => {
        setOrg(organizationService.get());
        setUsers(authService.getAllUsers());
        setPrefs(settingsService.getPreferences());
        setNotifications(settingsService.getNotifications());
    }, []);

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleTabChange = (tab: string) => {
        setSearchParams({ tab });
    };

    const handleUpdateOrg = (e: React.FormEvent) => {
        e.preventDefault();
        if (org) {
            const formData = new FormData(e.currentTarget as HTMLFormElement);
            const updates = {
                name: formData.get('name') as string,
                industry: formData.get('industry') as string,
                country: formData.get('country') as string,
                status: formData.get('status') as 'Active' | 'Demo'
            };
            const updated = organizationService.update(updates);
            setOrg(updated);
            setIsEditingProfile(false);
            showSuccess('Organization profile updated');
        }
    };

    const handleAddDept = (e: React.FormEvent) => {
        e.preventDefault();
        organizationService.addDepartment(newDept);
        setOrg(organizationService.get());
        setShowDeptModal(false);
        setNewDept({ name: '', code: '', description: '' });
        showSuccess('Department added');
    };

    const handleUpdateDept = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDept) {
            organizationService.updateDepartment(editingDept.id, editingDept);
            setOrg(organizationService.get());
            setEditingDept(null);
            setShowDeptModal(false);
            showSuccess('Department updated');
        }
    };

    const handleDeleteDept = (id: string) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            organizationService.deleteDepartment(id);
            setOrg(organizationService.get());
            showSuccess('Department deleted');
        }
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        authService.addUser(newUser);
        setUsers(authService.getAllUsers());
        setShowUserModal(false);
        setNewUser({ name: '', email: '', role: 'ASSIGNED', organizationId: 'org1', departmentId: '' });
        showSuccess('User added successfully');
    };

    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            authService.updateUser(editingUser.id, editingUser);
            setUsers(authService.getAllUsers());
            setEditingUser(null);
            setShowUserModal(false);
            showSuccess('User updated successfully');
        }
    };

    const tabs = [
        { id: 'organization', label: 'Organization', icon: <Building2 size={18} /> },
        { id: 'users', label: 'Users & Roles', icon: <Users size={18} /> },
        { id: 'governance', label: 'PDCA Governance', icon: <Shield size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { id: 'data', label: 'Data & Storage', icon: <Database size={18} /> },
        { id: 'preferences', label: 'Preferences', icon: <Globe size={18} /> },
    ];

    if (!org || !prefs || !notifications) return <div>Loading...</div>;

    const renderOrganization = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={32} color="#64748b" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0 }}>{org.name}</h3>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{org.industry} • {org.country}</p>
                        </div>
                    </div>
                    <button className="btn btn-outline" onClick={() => setIsEditingProfile(true)}>
                        <Edit2 size={16} /> Edit Profile
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{org.departments.length}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Departments</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{users.length}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Total Users</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>{org.status}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Mode</div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Organizational Structure</h3>
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }} onClick={() => { setEditingDept(null); setShowDeptModal(true); }}>
                        <Plus size={14} /> Add Department
                    </button>
                </div>
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Code</th>
                            <th style={{ textAlign: 'left', padding: '1rem' }}>Description</th>
                            <th style={{ textAlign: 'right', padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {org.departments.map(dept => (
                            <tr key={dept.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{dept.name}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>{dept.code}</span>
                                </td>
                                <td style={{ padding: '1rem', color: '#64748b', fontSize: '13px' }}>{dept.description}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                        <button className="btn btn-outline" style={{ padding: '4px' }} onClick={() => { setEditingDept(dept); setShowDeptModal(true); }}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="btn btn-outline" style={{ padding: '4px', color: '#ef4444' }} onClick={() => handleDeleteDept(dept.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Profile Edit Modal */}
            {isEditingProfile && (
                <div className="modal-overlay" onClick={() => setIsEditingProfile(false)}>
                    <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0 }}>Edit Organization Profile</h2>
                        <form onSubmit={handleUpdateOrg}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label>Organization Name</label>
                                    <input name="name" defaultValue={org.name} required />
                                </div>
                                <div>
                                    <label>Industry</label>
                                    <input name="industry" defaultValue={org.industry} required />
                                </div>
                                <div>
                                    <label>Country</label>
                                    <input name="country" defaultValue={org.country} required />
                                </div>
                                <div>
                                    <label>Environment Mode</label>
                                    <select name="status" defaultValue={org.status}>
                                        <option value="Active">Active / Enterprise</option>
                                        <option value="Demo">Demo / Sandbox</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2.5rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Dept Modal */}
            {showDeptModal && (
                <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
                    <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0 }}>{editingDept ? 'Edit Department' : 'Add New Department'}</h2>
                        <form onSubmit={editingDept ? handleUpdateDept : handleAddDept}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label>Name</label>
                                    <input
                                        value={editingDept ? editingDept.name : newDept.name}
                                        onChange={e => editingDept ? setEditingDept({ ...editingDept, name: e.target.value }) : setNewDept({ ...newDept, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Short Code</label>
                                    <input
                                        value={editingDept ? editingDept.code : newDept.code}
                                        onChange={e => editingDept ? setEditingDept({ ...editingDept, code: e.target.value }) : setNewDept({ ...newDept, code: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Description</label>
                                    <textarea
                                        rows={3}
                                        value={editingDept ? editingDept.description : newDept.description}
                                        onChange={e => editingDept ? setEditingDept({ ...editingDept, description: e.target.value }) : setNewDept({ ...newDept, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2.5rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowDeptModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingDept ? 'Update' : 'Add Department'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    const renderUsers = () => (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>User Management</h3>
                <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }} onClick={() => { setEditingUser(null); setShowUserModal(true); }}>
                    <Plus size={14} /> Add User
                </button>
            </div>
            <table style={{ width: '100%' }}>
                <thead>
                    <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '1rem' }}>User</th>
                        <th style={{ padding: '1rem' }}>Role</th>
                        <th style={{ padding: '1rem' }}>Department</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9', opacity: u.disabled ? 0.5 : 1 }}>
                            <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: 600 }}>{u.avatar} {u.name}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</div>
                            </td>
                            <td style={{ padding: '1rem' }}>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: u.role === 'ADMIN' ? '#fee2e2' : u.role === 'OWNER' ? '#fef3c7' : '#dcfce7',
                                    color: u.role === 'ADMIN' ? '#dc2626' : u.role === 'OWNER' ? '#d97706' : '#16a34a'
                                }}>{u.role}</span>
                            </td>
                            <td style={{ padding: '1rem', fontSize: '13px' }}>
                                {org.departments.find(d => d.id === u.departmentId)?.name || '-'}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-outline" style={{ padding: '4px' }} onClick={() => { setEditingUser({ ...u }); setShowUserModal(true); }}>
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        style={{ padding: '4px', color: u.disabled ? '#16a34a' : '#ef4444' }}
                                        onClick={() => {
                                            authService.updateUser(u.id, { disabled: !u.disabled });
                                            setUsers(authService.getAllUsers());
                                            showSuccess(u.disabled ? 'User activated' : 'User deactivated');
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showUserModal && (
                <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0 }}>{editingUser ? 'Edit User' : 'Add New User'}</h2>
                        <form onSubmit={editingUser ? handleUpdateUser : handleAddUser}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label>Display Name</label>
                                    <input
                                        value={editingUser ? editingUser.name : newUser.name}
                                        onChange={e => editingUser ? setEditingUser({ ...editingUser, name: e.target.value }) : setNewUser({ ...newUser, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={editingUser ? editingUser.email : newUser.email}
                                        onChange={e => editingUser ? setEditingUser({ ...editingUser, email: e.target.value }) : setNewUser({ ...newUser, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Role</label>
                                    <select
                                        value={editingUser ? editingUser.role : newUser.role}
                                        onChange={e => editingUser ? setEditingUser({ ...editingUser, role: e.target.value as Role }) : setNewUser({ ...newUser, role: e.target.value as Role })}
                                    >
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="OWNER">OWNER</option>
                                        <option value="ASSIGNED">RESPONSIBLE</option>
                                        <option value="DEMO">DEMO / VIEW-ONLY</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Department</label>
                                    <select
                                        value={editingUser ? (editingUser.departmentId || '') : (newUser.departmentId || '')}
                                        onChange={e => editingUser ? setEditingUser({ ...editingUser, departmentId: e.target.value }) : setNewUser({ ...newUser, departmentId: e.target.value })}
                                    >
                                        <option value="">No Department Assigned</option>
                                        {org.departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2.5rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowUserModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingUser ? 'Update' : 'Create User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    const renderGovernance = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
                <h3 style={{ marginTop: 0 }}>PDCA Lifecycle Rules</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '14px', fontWeight: 600 }}>Due Soon Threshold (Days)</label>
                        <input
                            type="number"
                            style={{ width: '120px' }}
                            value={org.governance.dueSoonThreshold}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) {
                                    organizationService.updateGovernance({ dueSoonThreshold: val });
                                    setOrg(organizationService.get());
                                    showSuccess('Threshold updated');
                                }
                            }}
                        />
                        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Determines when topics turn yellow (Due Soon) before the deadline.</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0 }}>Visual Standards</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    {[
                        { label: 'Critical / Overdue', color: '#ef4444' },
                        { label: 'Due Soon / At Risk', color: '#f59e0b' },
                        { label: 'On Track', color: '#10b981' },
                        { label: 'Closed / Done', color: '#94a3b8' },
                    ].map((c, i) => (
                        <div key={i} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ width: '24px', height: '24px', background: c.color, borderRadius: '4px', marginBottom: '0.75rem' }} />
                            <div style={{ fontSize: '12px', fontWeight: 700 }}>{c.label}</div>
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Global hex mapping active</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: '2rem' }}>Notification Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>Global E-mail Notifications</div>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>Master switch for all system emails</div>
                    </div>
                    <input
                        type="checkbox"
                        style={{ width: '20px', height: '20px' }}
                        checked={notifications.emailNotifications}
                        onChange={(e) => {
                            settingsService.updateNotifications({ emailNotifications: e.target.checked });
                            setNotifications(settingsService.getNotifications());
                            showSuccess('Notifications updated');
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#475569' }}>Trigger events</h4>
                    {[
                        { id: 'notifyOverdue', label: 'Overdue Topics' },
                        { id: 'notifyDueSoon', label: 'Due Soon (Threshold reached)' },
                        { id: 'notifyAssignedToDo', label: 'New To-Do Assigned' },
                        { id: 'notifyTopicClosed', label: 'Topic / Measure Closed' },
                    ].map(n => (
                        <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px' }}>{n.label}</span>
                            <input
                                type="checkbox"
                                style={{ width: '18px', height: '18px' }}
                                checked={(notifications as any)[n.id]}
                                onChange={(e) => {
                                    settingsService.updateNotifications({ [n.id]: e.target.checked });
                                    setNotifications(settingsService.getNotifications());
                                    showSuccess('Notification rule updated');
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600 }}>Delivery Frequency</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {['Instant', 'Daily Digest'].map(f => (
                            <button
                                key={f}
                                className={`btn ${notifications.frequency === f ? 'btn-primary' : 'btn-outline'}`}
                                style={{ padding: '0.5rem 1rem', fontSize: '13px' }}
                                onClick={() => {
                                    settingsService.updateNotifications({ frequency: f as any });
                                    setNotifications(settingsService.getNotifications());
                                    showSuccess('Frequency updated');
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderData = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="card" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <Download size={20} color="#435ebe" />
                        <h4 style={{ margin: 0 }}>Export System Data</h4>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1.5rem' }}>Download all organization data, topics, users, and todos as a portable JSON file.</p>
                    <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => settingsService.exportData()}>
                        Download Export
                    </button>
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <Upload size={20} color="#435ebe" />
                        <h4 style={{ margin: 0 }}>Import / Restore</h4>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1.5rem' }}>Upload a valid PDCA JSON export to restore data. This will overwrite current data.</p>
                    <input
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        id="import-file"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const success = await settingsService.importData(file);
                                if (success) showSuccess('Data imported successfully');
                                else alert('Import failed. Invalid file format.');
                            }
                        }}
                    />
                    <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => document.getElementById('import-file')?.click()}>
                        Upload JSON File
                    </button>
                </div>
            </div>

            <div className="card" style={{ border: '1px solid #fee2e2', background: '#fffcfc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <RefreshCcw size={20} color="#ef4444" />
                    <h4 style={{ margin: 0, color: '#991b1b' }}>Dangerous Zone</h4>
                </div>
                <p style={{ fontSize: '13px', color: '#991b1b', marginBottom: '1.5rem' }}>Reset the entire system to its initial demo state. All local changes will be permanently deleted.</p>
                <button className="btn" style={{ background: '#be123c', color: 'white', border: 'none' }} onClick={() => setShowResetModal(true)}>
                    Reset Demo Data
                </button>
            </div>

            {showResetModal && (
                <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
                    <div className="modal" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <AlertTriangle size={32} color="#ef4444" />
                            </div>
                            <h3 style={{ margin: '0 0 1rem' }}>Are you absolutely sure?</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '2rem' }}>This action will delete all your topics, users, and settings. This cannot be undone.</p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowResetModal(false)}>Cancel</button>
                                <button className="btn" style={{ flex: 1, background: '#ef4444', color: 'white' }} onClick={() => settingsService.resetData()}>
                                    Yes, Reset Everything
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderPreferences = () => (
        <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: '2rem' }}>General Preferences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>System Language</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Select your preferred UI language</div>
                    </div>
                    <select
                        value={prefs.language}
                        onChange={(e) => {
                            settingsService.updatePreferences({ language: e.target.value as any });
                            setPrefs(settingsService.getPreferences());
                            showSuccess('Language updated');
                        }}
                    >
                        <option value="EN">English (US)</option>
                        <option value="DE">Deutsch (DE)</option>
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>Date Format</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Regional date representation</div>
                    </div>
                    <select
                        value={prefs.dateFormat}
                        onChange={(e) => {
                            settingsService.updatePreferences({ dateFormat: e.target.value as any });
                            setPrefs(settingsService.getPreferences());
                            showSuccess('Date format updated');
                        }}
                    >
                        <option value="de-DE">DD.MM.YYYY (European)</option>
                        <option value="en-US">MM/DD/YYYY (US Standard)</option>
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 600 }}>Landing Page</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Initial view after login</div>
                    </div>
                    <select
                        value={prefs.defaultLandingPage}
                        onChange={(e) => {
                            settingsService.updatePreferences({ defaultLandingPage: e.target.value as any });
                            setPrefs(settingsService.getPreferences());
                            showSuccess('Landing page updated');
                        }}
                    >
                        <option value="Dashboard">Organization Dashboard</option>
                        <option value="Cockpit">PDCA Cockpit</option>
                        <option value="Lists">Action Lists</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'organization': return renderOrganization();
            case 'users': return renderUsers();
            case 'governance': return renderGovernance();
            case 'notifications': return renderNotifications();
            case 'data': return renderData();
            case 'preferences': return renderPreferences();
            default: return renderOrganization();
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '2rem' }}>Administration & Settings</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
                <div style={{ position: 'sticky', top: '2rem' }}>
                    <div className="card" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.85rem 1.25rem',
                                    background: activeTab === tab.id ? 'var(--color-primary-light)' : 'transparent',
                                    color: activeTab === tab.id ? 'var(--color-primary)' : '#475569',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: activeTab === tab.id ? 700 : 500,
                                    fontSize: '14px',
                                    textAlign: 'left',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{ opacity: activeTab === tab.id ? 1 : 0.7 }}>{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>MSO Maestro PDCA v1.0.0</div>
                        <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '4px' }}>Build 2026.02.03</div>
                    </div>
                </div>

                <div style={{ minHeight: '600px', position: 'relative' }}>
                    {renderContent()}

                    {/* Success Toast */}
                    {successMsg && (
                        <div style={{
                            position: 'fixed',
                            bottom: '2rem',
                            right: '2rem',
                            background: '#1e293b',
                            color: 'white',
                            padding: '1rem 1.5rem',
                            borderRadius: '12px',
                            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            zIndex: 2000,
                            animation: 'slideUp 0.3s ease-out'
                        }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={12} color="white" />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{successMsg}</span>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Settings;
