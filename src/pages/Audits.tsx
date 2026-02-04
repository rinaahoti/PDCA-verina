import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditService } from '../services/auditService';
import { adminService } from '../services/adminService';
import { Audit, AuditFinding } from '../types';
import { Location, AppUser } from '../types/admin';
import { FileText, Search, Calendar, MapPin, BarChart3, Clock, CheckCircle2, Activity, Plus, X, AlertCircle, Filter } from 'lucide-react';

// Helper for finding stats
const getAuditStats = (auditId: string, allFindings: AuditFinding[]) => {
    const findings = allFindings.filter(f => f.auditId === auditId);
    return {
        major: findings.filter(f => f.rating === 'Major').length,
        minor: findings.filter(f => f.rating === 'Minor').length,
        ofi: findings.filter(f => f.rating === 'OFI').length,
        total: findings.length,
        open: findings.filter(f => f.status !== 'ACT').length,
        closed: findings.filter(f => f.status === 'ACT').length
    };
};

const Audits: React.FC = () => {
    const navigate = useNavigate();
    const [audits, setAudits] = useState<Audit[]>([]);
    const [findings, setFindings] = useState<AuditFinding[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterLocation, setFilterLocation] = useState<string>('All');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newAudit, setNewAudit] = useState<Partial<Audit>>({
        type: 'Internal',
        status: 'Planned',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });
    const [generateFindings, setGenerateFindings] = useState(true);

    useEffect(() => {
        const load = () => {
            setAudits(auditService.getAllAudits());
            setFindings(auditService.getAllFindings());
            setLocations(adminService.getLocations());
            setUsers(adminService.getUsers());
        };
        load();
        window.addEventListener('storage', load);
        window.addEventListener('storage-admin', load);
        return () => {
            window.removeEventListener('storage', load);
            window.removeEventListener('storage-admin', load);
        };
    }, []);

    const filteredAudits = useMemo(() => {
        return audits.filter(audit => {
            const matchesSearch = audit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                audit.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'All' || audit.status === filterStatus;
            const matchesLocation = filterLocation === 'All' || audit.location === filterLocation;
            return matchesSearch && matchesStatus && matchesLocation;
        });
    }, [audits, searchTerm, filterStatus, filterLocation]);

    const stats = {
        total: audits.length,
        active: audits.filter(a => a.status === 'In Progress').length,
        planned: audits.filter(a => a.status === 'Planned').length,
        completed: audits.filter(a => a.status === 'Completed').length
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return { bg: 'var(--color-primary-light)', text: 'var(--color-primary-dark)', border: 'var(--color-primary)' };
            case 'In Progress': return { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' }; // Indigo for contrast
            case 'Planned': return { bg: 'var(--color-bg)', text: 'var(--color-text-muted)', border: 'var(--color-border)' };
            default: return { bg: 'var(--color-bg)', text: 'var(--color-text-muted)', border: 'var(--color-border)' };
        }
    };

    const handleAddAudit = (e: React.FormEvent) => {
        e.preventDefault();
        const id = newAudit.id || `AUD-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        const auditToAdd: Audit = {
            id,
            name: newAudit.name || 'New Audit',
            type: newAudit.type as any,
            location: newAudit.location || 'HQ',
            startDate: newAudit.startDate || '',
            endDate: newAudit.endDate || '',
            auditor: newAudit.auditor || 'TBD',
            status: newAudit.status as any || 'Planned',
            description: newAudit.description
        };

        auditService.saveAudit(auditToAdd);

        if (generateFindings) {
            auditService.generateDemoFindings(auditToAdd);
        }

        setIsModalOpen(false);
        setNewAudit({
            type: 'Internal',
            status: 'Planned',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        });
        // Force refresh local state immediately
        setAudits(auditService.getAllAudits());
        setFindings(auditService.getAllFindings());
    };

    const handleStatusChange = (audit: Audit, newStatus: Audit['status']) => {
        const updated = { ...audit, status: newStatus };
        auditService.saveAudit(updated);
        setAudits(auditService.getAllAudits());
    };

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', color: 'var(--color-text)' }}>Audits</h1>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Overview of Internal and External Audits</div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary"
                    style={{ display: 'flex', gap: '8px' }}
                >
                    <Plus size={18} /> Add Audit
                </button>
            </div>

            {/* Top Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={24} color="var(--color-primary)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Audits</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)' }}>{stats.total}</div>
                    </div>
                </div>
                <div className="card" style={{ padding: '1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={24} color="#1e40af" />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>In Progress</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e40af' }}>{stats.active}</div>
                    </div>
                </div>
                <div className="card" style={{ padding: '1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={24} color="#64748b" />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Planned</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#475569' }}>{stats.planned}</div>
                    </div>
                </div>
                <div className="card" style={{ padding: '1.5rem', marginBottom: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={24} color="#166534" />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Completed</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#166534' }}>{stats.completed}</div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '10px 16px 10px 40px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px', width: '250px', outline: 'none' }}
                            />
                            <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <select
                                value={filterLocation}
                                onChange={(e) => setFilterLocation(e.target.value)}
                                style={{ padding: '10px 32px 10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minWidth: '150px', outline: 'none', appearance: 'none', background: 'white', cursor: 'pointer' }}
                            >
                                <option value="All">All Locations</option>
                                {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                            </select>
                            <Filter size={16} color="#94a3b8" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Status:</span>
                        {['All', 'Planned', 'In Progress', 'Completed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    border: filterStatus === status ? '1px solid var(--color-primary)' : '1px solid #e2e8f0',
                                    background: filterStatus === status ? 'var(--color-primary)' : 'white',
                                    color: filterStatus === status ? 'white' : '#64748b',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', width: '25%' }}>Audit Name / ID</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Type & Location</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Plan Period</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Auditor</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ textAlign: 'left', padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Findings Summary</th>
                                <th style={{ textAlign: 'right', padding: '1.25rem 1.5rem', color: '#64748b', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAudits.length > 0 ? filteredAudits.map((audit) => {
                                const styles = getStatusColor(audit.status);
                                const auditStats = getAuditStats(audit.id, findings);
                                return (
                                    <tr key={audit.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }} className="hover-row">
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '15px' }}>{audit.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>{audit.id}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 500 }}>
                                                {audit.type} Audit
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MapPin size={12} /> {audit.location}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                                                <Calendar size={14} color="#94a3b8" />
                                                <span>{new Date(audit.startDate).toLocaleDateString()} - {new Date(audit.endDate).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
                                                    {audit.auditor.charAt(0)}
                                                </div>
                                                <span style={{ fontSize: '13px', color: '#334155' }}>{audit.auditor}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <select
                                                value={audit.status}
                                                onChange={(e) => handleStatusChange(audit, e.target.value as any)}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    background: styles.bg,
                                                    color: styles.text,
                                                    border: `1px solid ${styles.border}`,
                                                    cursor: 'pointer',
                                                    outline: 'none'
                                                }}
                                            >
                                                <option value="Planned">Planned</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {auditStats.major > 0 && (
                                                    <span title="Major Findings" style={{ background: '#fee2e2', color: 'var(--color-status-red)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid #fecaca' }}>
                                                        {auditStats.major} MJ
                                                    </span>
                                                )}
                                                {auditStats.minor > 0 && (
                                                    <span title="Minor Findings" style={{ background: '#fef9c3', color: 'var(--color-status-yellow)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid #fde68a' }}>
                                                        {auditStats.minor} MN
                                                    </span>
                                                )}
                                                {auditStats.ofi > 0 && (
                                                    <span title="Opportunities for Improvement" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid var(--color-primary)' }}>
                                                        {auditStats.ofi} OFI
                                                    </span>
                                                )}
                                                {auditStats.total === 0 && <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>-</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => navigate(`/app/dashboard?auditId=${audit.id}`)}
                                                className="btn btn-outline"
                                                style={{ fontSize: '12px', padding: '6px 12px' }}
                                            >
                                                <BarChart3 size={14} /> Dashboard
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                        No audits found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Audit Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '0', animation: 'fadeIn 0.2s' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Add New Audit</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddAudit}>
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Audit Name *</label>
                                        <input required className="input" value={newAudit.name || ''} onChange={e => setNewAudit({ ...newAudit, name: e.target.value })} placeholder="e.g. ISO 9001 Surveillance" />
                                    </div>
                                    <div className="form-group">
                                        <label>Audit ID</label>
                                        <input className="input" value={newAudit.id || ''} onChange={e => setNewAudit({ ...newAudit, id: e.target.value })} placeholder="Leave empty to auto-generate" />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Type *</label>
                                        <select className="input" value={newAudit.type} onChange={e => setNewAudit({ ...newAudit, type: e.target.value as any })}>
                                            <option value="Internal">Internal</option>
                                            <option value="External">External</option>
                                            <option value="Process">Process</option>
                                            <option value="Customer">Customer</option>
                                            <option value="Certification">Certification</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Location *</label>
                                        <select required className="input" value={newAudit.location || ''} onChange={e => setNewAudit({ ...newAudit, location: e.target.value })}>
                                            <option value="">Select Location...</option>
                                            {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label>Start Date *</label>
                                        <input required type="date" className="input" value={newAudit.startDate} onChange={e => setNewAudit({ ...newAudit, startDate: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date *</label>
                                        <input required type="date" className="input" value={newAudit.endDate} onChange={e => setNewAudit({ ...newAudit, endDate: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Lead Auditor *</label>
                                    <select required className="input" value={newAudit.auditor || ''} onChange={e => setNewAudit({ ...newAudit, auditor: e.target.value })}>
                                        <option value="">Select Auditor...</option>
                                        {users.map(u => <option key={u.id} value={u.fullName}>{u.fullName}</option>)}
                                    </select>
                                </div>

                                <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input
                                            type="checkbox"
                                            id="genFindings"
                                            checked={generateFindings}
                                            onChange={e => setGenerateFindings(e.target.checked)}
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        <label htmlFor="genFindings" style={{ fontWeight: 600, color: '#334155' }}>Generate demo findings for this audit</label>
                                    </div>
                                    <p style={{ margin: '0.5rem 0 0 26px', fontSize: '13px', color: '#64748b' }}>
                                        If enabled, 3-7 random findings (Major/Minor/OFI) will be created and linked to this audit for demonstration purposes.
                                    </p>
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Audit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Audits;


