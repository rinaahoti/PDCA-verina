import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Topic, ToDo } from '../types';
import { Search, Filter, X } from 'lucide-react';
import { authService, topicsService } from '../services';
import { getStatusMeta } from '../utils/statusUtils';

const Lists: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [search, setSearch] = useState('');
    const user = authService.getCurrentUser();

    // Read filters from URL
    const filterOwner = searchParams.get('owner');
    const filterSeverity = searchParams.get('severity');
    const filterStep = searchParams.get('step') || 'ALL';

    useEffect(() => {
        setTopics(topicsService.getAll());
    }, []);

    const filtered = topics.filter((t: Topic) => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
        const matchesStep = filterStep === 'ALL' || t.step === filterStep;
        const matchesOwner = filterOwner !== 'me' || t.ownerId === user?.id;
        const matchesSeverity = filterSeverity !== 'critical' || (t.severity === 'Critical' || t.severity === 'Business Critical');
        return matchesSearch && matchesStep && matchesOwner && matchesSeverity;
    });

    const clearFilters = () => {
        setSearchParams({});
        setSearch('');
    };

    const hasActiveFilters = filterOwner || filterSeverity || filterStep !== 'ALL' || search;

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Initiatives & Measures</h2>
                {hasActiveFilters && (
                    <button onClick={clearFilters} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>
                        <X size={14} /> Clear all filters
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        style={{ paddingLeft: '40px' }}
                        placeholder="Search topics..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <select
                        style={{ width: '160px' }}
                        value={filterStep}
                        onChange={e => setSearchParams(prev => {
                            if (e.target.value === 'ALL') prev.delete('step');
                            else prev.set('step', e.target.value);
                            return prev;
                        })}
                    >
                        <option value="ALL">All Steps</option>
                        <option value="PLAN">PLAN</option>
                        <option value="DO">DO</option>
                        <option value="CHECK">CHECK</option>
                        <option value="ACT">ACT</option>
                    </select>

                    <button
                        className={`btn ${filterOwner === 'me' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setSearchParams(prev => {
                            if (filterOwner === 'me') prev.delete('owner');
                            else prev.set('owner', 'me');
                            return prev;
                        })}
                        style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Filter size={16} /> My Topics
                    </button>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Status</th>
                        <th>Title</th>
                        <th>Step</th>
                        <th>Due Date</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((t: Topic) => (
                        <tr key={t.id} onClick={() => navigate(`/app/topic/${t.id}`)} style={{ cursor: 'pointer' }}>
                            <td>{t.id}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className={`status-dot ${getStatusMeta(t.status, t.dueDate).class}`}></span>
                                    <span style={{ fontSize: '12px' }}>{getStatusMeta(t.status, t.dueDate).label}</span>
                                </div>
                            </td>
                            <td style={{ fontWeight: 500 }}>{t.title}</td>
                            <td>{t.step}</td>
                            <td>{new Date(t.dueDate).toLocaleDateString('de-DE')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Lists;
