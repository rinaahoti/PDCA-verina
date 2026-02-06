import React, { useState, useEffect } from 'react';
import { organizationService } from '../services';
import { Organization, Department, Role } from '../types';
import {
    Building2,
    Users,
    Settings2,
    Target,
    Plus,
    Edit2,
    Trash2,
    Check,
    X,
    Info,
    AlertCircle
} from 'lucide-react';

const OrganizationPage: React.FC = () => {
    const [org, setOrg] = useState<Organization | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [newDept, setNewDept] = useState<Omit<Department, 'id'>>({ name: '', code: '', description: '' });

    useEffect(() => {
        setOrg(organizationService.get());
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsEditingProfile(false);
                setShowDeptModal(false);
                setEditingDept(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!org) return <div>Loading...</div>;

    const handleUpdateOrg = (updates: Partial<Organization>) => {
        const updated = organizationService.update(updates);
        setOrg(updated);
        setIsEditingProfile(false);
    };

    const handleAddDept = (e: React.FormEvent) => {
        e.preventDefault();
        organizationService.addDepartment(newDept);
        setOrg(organizationService.get());
        setShowDeptModal(false);
        setNewDept({ name: '', code: '', description: '' });
    };

    const handleUpdateDept = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDept) {
            organizationService.updateDepartment(editingDept.id, editingDept);
            setOrg(organizationService.get());
            setEditingDept(null);
            setShowDeptModal(false);
        }
    };

    const handleDeleteDept = (id: string) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            organizationService.deleteDepartment(id);
            setOrg(organizationService.get());
        }
    };

    const permissions = [
        { label: 'Can create topic', key: 'create' },
        { label: 'Can edit topic', key: 'edit' },
        { label: 'Can close topic', key: 'close' },
        { label: 'Can manage departments', key: 'manage_depts' },
        { label: 'Can view dashboard', key: 'view_dashboard' },
    ];

    const roles: Role[] = ['OWNER', 'ASSIGNED', 'DEMO'];

    const permissionMatrix: Record<string, Record<Role, boolean>> = {
        'create': { OWNER: true, ASSIGNED: true, DEMO: false, ADMIN: true, CLIENT_ADMIN: true, VIEWER: false },
        'edit': { OWNER: true, ASSIGNED: true, DEMO: false, ADMIN: true, CLIENT_ADMIN: true, VIEWER: false },
        'close': { OWNER: true, ASSIGNED: false, DEMO: false, ADMIN: true, CLIENT_ADMIN: true, VIEWER: false },
        'manage_depts': { OWNER: true, ASSIGNED: false, DEMO: false, ADMIN: true, CLIENT_ADMIN: true, VIEWER: false },
        'view_dashboard': { OWNER: true, ASSIGNED: true, DEMO: true, ADMIN: true, CLIENT_ADMIN: true, VIEWER: true },
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Organization Settings</h2>
                <div style={{ padding: '4px 12px', background: org.status === 'Active' ? '#dcfce7' : '#fef3c7', color: org.status === 'Active' ? '#16a34a' : '#d97706', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                    {org.status.toUpperCase()} MODE
                </div>
            </div>

            {/* 1. ORGANIZATION PROFILE */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                            <Building2 size={32} color="#64748b" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{org.name}</h3>
                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{org.industry} • {org.country}</p>
                        </div>
                    </div>
                    <button className="btn btn-outline" onClick={() => setIsEditingProfile(true)}>
                        <Edit2 size={16} /> Edit Profile
                    </button>
                </div>

                {isEditingProfile && (
                    <div className="modal-overlay" onClick={() => setIsEditingProfile(false)}>
                        <div className="modal" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setIsEditingProfile(false)}
                                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                            <h2 style={{ marginTop: 0 }}>Edit Organization Profile</h2>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                handleUpdateOrg({
                                    name: formData.get('name') as string,
                                    industry: formData.get('industry') as string,
                                    country: formData.get('country') as string,
                                    status: formData.get('status') as 'Active' | 'Demo'
                                });
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Organization Name</label>
                                        <input name="name" defaultValue={org.name} required />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Industry</label>
                                        <input name="industry" defaultValue={org.industry} required />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Country</label>
                                        <input name="country" defaultValue={org.country} required />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Status</label>
                                        <select name="status" defaultValue={org.status}>
                                            <option value="Active">Active</option>
                                            <option value="Demo">Demo</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. ORGANIZATIONAL STRUCTURE */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Users size={20} color="#435ebe" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Organizational Structure</h3>
                    </div>
                    <button className="btn btn-primary" onClick={() => { setEditingDept(null); setShowDeptModal(true); }}>
                        <Plus size={16} /> Add Department
                    </button>
                </div>
                <div style={{ padding: '0 1rem' }}>
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <th style={{ padding: '1rem', width: '25%' }}>Department Name</th>
                                <th style={{ padding: '1rem', width: '15%' }}>Code</th>
                                <th style={{ padding: '1rem', width: '45%' }}>Description</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {org.departments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                        <Info size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                        <p style={{ margin: 0 }}>No departments added yet.</p>
                                    </td>
                                </tr>
                            ) : (
                                org.departments.map(dept => (
                                    <tr key={dept.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{dept.name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '2px 8px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                                                {dept.code}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#64748b', fontSize: '14px' }}>{dept.description}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => { setEditingDept(dept); setShowDeptModal(true); }}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="btn btn-outline" style={{ padding: '4px 8px', color: '#ef4444' }} onClick={() => handleDeleteDept(dept.id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {showDeptModal && (
                    <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
                        <div className="modal" style={{ width: '500px' }} onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setShowDeptModal(false)}
                                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                            <h2 style={{ marginTop: 0 }}>{editingDept ? 'Edit Department' : 'Add New Department'}</h2>
                            <form onSubmit={editingDept ? handleUpdateDept : handleAddDept}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Department Name</label>
                                        <input
                                            value={editingDept ? editingDept.name : newDept.name}
                                            onChange={e => editingDept ? setEditingDept({ ...editingDept, name: e.target.value }) : setNewDept({ ...newDept, name: e.target.value })}
                                            placeholder="e.g. Quality Assurance"
                                            required
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Short Code</label>
                                        <input
                                            value={editingDept ? editingDept.code : newDept.code}
                                            onChange={e => editingDept ? setEditingDept({ ...editingDept, code: e.target.value }) : setNewDept({ ...newDept, code: e.target.value })}
                                            placeholder="e.g. QA"
                                            required
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label>Description</label>
                                        <textarea
                                            value={editingDept ? editingDept.description : newDept.description}
                                            onChange={e => editingDept ? setEditingDept({ ...editingDept, description: e.target.value }) : setNewDept({ ...newDept, description: e.target.value })}
                                            placeholder="Optional description..."
                                            rows={3}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setShowDeptModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">{editingDept ? 'Update Department' : 'Add Department'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. ROLES & PERMISSIONS */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Settings2 size={20} color="#435ebe" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Roles & Permissions Matrix</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ width: '40%', textAlign: 'left', padding: '1.25rem 1.5rem', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Capability</th>
                                {roles.map(r => (
                                    <th key={r} style={{ textAlign: 'center', padding: '1.25rem 1.5rem', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>{r}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {permissions.map(p => (
                                <tr key={p.key} style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '1.25rem 1.5rem', fontWeight: 500, color: '#334155' }}>{p.label}</td>
                                    {roles.map(r => (
                                        <td key={`${p.key}-${r}`} style={{ textAlign: 'center', padding: '1.25rem 1.5rem' }}>
                                            <div style={{
                                                width: '24px',
                                                height: '24px',
                                                margin: '0 auto',
                                                borderRadius: '6px',
                                                background: permissionMatrix[p.key][r] ? '#dcfce7' : '#f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {permissionMatrix[p.key][r] ? <Check size={14} color="#16a34a" /> : <X size={14} color="#94a3b8" />}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <AlertCircle size={16} color="#64748b" />
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Admin roles (ADMIN, CLIENT_ADMIN) inherit all OWNER permissions by default.</p>
                </div>
            </div>

            {/* 4. PDCA GOVERNANCE RULES */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Target size={20} color="#435ebe" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>PDCA Governance Rules</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Due Soon Threshold (Days)</label>
                            <input
                                type="number"
                                value={org.governance.dueSoonThreshold}
                                onChange={e => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) organizationService.updateGovernance({ dueSoonThreshold: val });
                                    setOrg(organizationService.get());
                                }}
                                style={{ width: '100px' }}
                            />
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Topics within this window will be marked as "Due Soon" (Yellow).</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Allowed Workflow</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {['PLAN', 'DO', 'CHECK', 'ACT'].map((s, i) => (
                                    <React.Fragment key={s}>
                                        <div style={{ padding: '4px 12px', background: '#f1f5f9', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>{s}</div>
                                        {i < 3 && <div style={{ width: '10px', height: '1px', background: '#e2e8f0' }} />}
                                    </React.Fragment>
                                ))}
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Standard PDCA cycle is enforced across all topics.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Status Color Scheme</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#ef4444' }} />
                                <span style={{ fontSize: '13px', fontWeight: 500 }}>Critical / Overdue</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#f59e0b' }} />
                                <span style={{ fontSize: '13px', fontWeight: 500 }}>Due Soon / At Risk</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#10b981' }} />
                                <span style={{ fontSize: '13px', fontWeight: 500 }}>On Track</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#94a3b8' }} />
                                <span style={{ fontSize: '13px', fontWeight: 500 }}>Closed / Done</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationPage;
