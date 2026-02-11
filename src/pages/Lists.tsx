import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Topic, ToDo } from '../types';
import { Search, Filter, X } from 'lucide-react';
import { authService, topicsService } from '../services';
import { getStatusColor, getStatusLabel } from '../utils/statusUtils';
import { useLanguage } from '../contexts/LanguageContext';

const Lists: React.FC = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [search, setSearch] = useState('');
    const user = authService.getCurrentUser();

    // Read filters from URL
    const filterOwner = searchParams.get('owner');
    const filterStep = searchParams.get('step') || 'ALL';

    useEffect(() => {
        setTopics(topicsService.getAll());
    }, []);

    const filtered = topics.filter((t: Topic) => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
        const matchesStep = filterStep === 'ALL' || t.step === filterStep;
        const matchesOwner = filterOwner !== 'me' || t.ownerId === user?.id;
        return matchesSearch && matchesStep && matchesOwner;
    });

    const clearFilters = () => {
        setSearchParams({});
        setSearch('');
    };

    const hasActiveFilters = filterOwner || filterStep !== 'ALL' || search;

    const getTranslatedTitle = (title: string) => {
        const titleMap: Record<string, string> = {
            'Reduction of Post-operative Infection Rates': 'Reduktion postoperativer Infektionsraten',
            'Medication Administration Error Reduction': 'Reduktion von Medikationsfehlern',
            'Patient Fall Prevention Protocol Compliance': 'Einhaltung des Sturzpräventionsprotokolls'
        };
        return titleMap[title] || title;
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>{t('lists.pageTitle')}</h2>
                {hasActiveFilters && (
                    <button onClick={clearFilters} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }}>
                        <X size={14} /> {t('common.clearAllFilters')}
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        style={{ paddingLeft: '40px' }}
                        placeholder={t('common.searchTopics')}
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
                        <option value="ALL">{t('lists.allSteps')}</option>
                        <option value="PLAN">{t('pdca.plan')}</option>
                        <option value="DO">{t('pdca.do')}</option>
                        <option value="CHECK">{t('pdca.check')}</option>
                        <option value="ACT">{t('pdca.act')}</option>
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
                        <Filter size={16} /> {t('lists.myTopics')}
                    </button>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>{t('common.id')}</th>
                        <th>{t('common.status')}</th>
                        <th>{t('common.title')}</th>
                        <th>{t('common.step')}</th>
                        <th>{t('common.dueDate')}</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((topic: Topic) => (
                        <tr key={topic.id} onClick={() => navigate(`/app/topic/${topic.id}`)} style={{ cursor: 'pointer' }}>
                            <td>{topic.id}</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="status-dot" style={{ backgroundColor: getStatusColor(topic.status) }}></span>
                                    <span style={{ fontSize: '12px' }}>{getStatusLabel(t, topic.status)}</span>
                                </div>
                            </td>
                            <td style={{ fontWeight: 500 }}>{getTranslatedTitle(topic.title)}</td>
                            <td>{t(`pdca.${topic.step.toLowerCase()}`)}</td>
                            <td>{new Date(topic.dueDate).toLocaleDateString(language === 'en' ? 'en-US' : 'de-DE')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Lists;
