import React, { useState, useRef, useEffect, useCallback } from 'react';

interface DateTimePickerProps {
    value: string; // stored as "MM/DD/YYYY hh:mm AM" or ""
    onChange: (val: string) => void;
    style?: React.CSSProperties;
    placeholder?: string;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function parseValue(val: string): { date: Date | null; hour: number; minute: number; ampm: 'AM' | 'PM' } {
    if (!val) return { date: null, hour: 12, minute: 0, ampm: 'AM' };
    const parts = val.split(' ');
    const datePart = parts[0];
    const timePart = parts[1] || '12:00';
    const ampmPart = (parts[2] || 'AM') as 'AM' | 'PM';
    const [m, d, y] = datePart.split('/').map(Number);
    const [h, min] = timePart.split(':').map(Number);
    const date = (m && d && y) ? new Date(y, m - 1, d) : null;
    return { date, hour: h || 12, minute: min || 0, ampm: ampmPart };
}

function formatValue(date: Date | null, hour: number, minute: number, ampm: 'AM' | 'PM'): string {
    if (!date) return '';
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const y = date.getFullYear();
    const h = String(hour).padStart(2, '0');
    const min = String(minute).padStart(2, '0');
    return `${m}/${d}/${y} ${h}:${min} ${ampm}`;
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
}

const ScrollColumn: React.FC<{
    items: number[];
    selected: number;
    onSelect: (v: number) => void;
    format?: (v: number) => string;
    highlight?: boolean;
}> = ({ items, selected, onSelect, format, highlight }) => {
    const ref = useRef<HTMLDivElement>(null);
    const ITEM_H = 36;

    useEffect(() => {
        const idx = items.indexOf(selected);
        if (ref.current && idx >= 0) {
            ref.current.scrollTop = idx * ITEM_H - ITEM_H;
        }
    }, [selected, items]);

    return (
        <div
            ref={ref}
            style={{
                width: '52px',
                height: '216px',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                borderLeft: '1px solid #e2e8f0',
            }}
        >
            {/* padding top/bottom so selected can center */}
            <div style={{ height: ITEM_H }} />
            {items.map(v => {
                const isSelected = v === selected;
                return (
                    <div
                        key={v}
                        onClick={() => onSelect(v)}
                        style={{
                            height: `${ITEM_H}px`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: isSelected ? 700 : 400,
                            color: isSelected ? '#fff' : '#334155',
                            background: isSelected ? (highlight ? '#1d4ed8' : '#1d4ed8') : 'transparent',
                            borderRadius: isSelected ? '6px' : '0',
                            margin: isSelected ? '0 4px' : '0',
                            width: isSelected ? 'calc(100% - 8px)' : '100%',
                            transition: 'background 0.15s',
                            userSelect: 'none',
                        }}
                    >
                        {format ? format(v) : String(v).padStart(2, '0')}
                    </div>
                );
            })}
            <div style={{ height: ITEM_H }} />
        </div>
    );
};

const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, style, placeholder }) => {
    const parsed = parseValue(value);
    const today = new Date();

    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(parsed.date?.getFullYear() ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(parsed.date?.getMonth() ?? today.getMonth());
    const [selDate, setSelDate] = useState<Date | null>(parsed.date);
    const [selHour, setSelHour] = useState(parsed.hour);
    const [selMinute, setSelMinute] = useState(parsed.minute);
    const [selAmPm, setSelAmPm] = useState<'AM' | 'PM'>(parsed.ampm);

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Sync internal state when value prop changes externally
    useEffect(() => {
        const p = parseValue(value);
        setSelDate(p.date);
        setSelHour(p.hour);
        setSelMinute(p.minute);
        setSelAmPm(p.ampm);
        if (p.date) {
            setViewYear(p.date.getFullYear());
            setViewMonth(p.date.getMonth());
        }
    }, [value]);

    const emit = useCallback((d: Date | null, h: number, m: number, ap: 'AM' | 'PM') => {
        onChange(formatValue(d, h, m, ap));
    }, [onChange]);

    const handleDateClick = (day: number) => {
        const d = new Date(viewYear, viewMonth, day);
        setSelDate(d);
        emit(d, selHour, selMinute, selAmPm);
    };

    const handleHour = (h: number) => { setSelHour(h); emit(selDate, h, selMinute, selAmPm); };
    const handleMinute = (m: number) => { setSelMinute(m); emit(selDate, selHour, m, selAmPm); };
    const handleAmPm = (ap: 'AM' | 'PM') => { setSelAmPm(ap); emit(selDate, selHour, selMinute, ap); };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

    // Build calendar grid
    const prevDays = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);
    const cells: { day: number; type: 'prev' | 'cur' | 'next' }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, type: 'prev' });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, type: 'cur' });
    let nextDay = 1;
    while (cells.length % 7 !== 0) cells.push({ day: nextDay++, type: 'next' });

    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const displayValue = value || '';

    const isToday = (day: number) => {
        return today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
    };
    const isSelected = (day: number) => {
        return selDate?.getDate() === day && selDate?.getMonth() === viewMonth && selDate?.getFullYear() === viewYear;
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', ...style }}>
            {/* Input trigger */}
            <input
                readOnly
                value={displayValue}
                placeholder={placeholder || 'mm/dd/yyyy hh:mm AM'}
                onClick={() => setOpen(o => !o)}
                style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '13px',
                    color: displayValue ? '#334155' : '#94a3b8',
                    outline: 'none',
                    width: '100%',
                    padding: 0,
                    cursor: 'pointer',
                }}
            />

            {/* Picker dropdown */}
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        zIndex: 99999,
                        background: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        overflow: 'hidden',
                        minWidth: '420px',
                    }}
                >
                    {/* LEFT: Calendar */}
                    <div style={{ padding: '16px', minWidth: '260px' }}>
                        {/* Month/Year nav */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#1a202c' }}>
                                {MONTHS[viewMonth]} {viewYear} ▾
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>↑</button>
                                <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>↓</button>
                            </div>
                        </div>

                        {/* Day headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
                            {DAYS_OF_WEEK.map(d => (
                                <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#94a3b8', padding: '4px 0' }}>{d}</div>
                            ))}
                        </div>

                        {/* Day cells */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                            {cells.map((cell, i) => {
                                const isCur = cell.type === 'cur';
                                const sel = isCur && isSelected(cell.day);
                                const tod = isCur && isToday(cell.day);
                                return (
                                    <div
                                        key={i}
                                        onClick={() => isCur && handleDateClick(cell.day)}
                                        style={{
                                            textAlign: 'center',
                                            padding: '6px 0',
                                            fontSize: '13px',
                                            borderRadius: '6px',
                                            cursor: isCur ? 'pointer' : 'default',
                                            color: sel ? '#fff' : tod ? '#1d4ed8' : isCur ? '#1a202c' : '#cbd5e1',
                                            background: sel ? '#1d4ed8' : 'transparent',
                                            fontWeight: sel || tod ? 700 : 400,
                                            border: tod && !sel ? '1px solid #1d4ed8' : '1px solid transparent',
                                            userSelect: 'none',
                                        }}
                                    >
                                        {cell.day}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                            <button
                                onClick={() => { setSelDate(null); onChange(''); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#64748b', fontWeight: 500 }}
                            >
                                Clear
                            </button>
                            <button
                                onClick={() => {
                                    const t = new Date();
                                    setSelDate(t);
                                    setViewYear(t.getFullYear());
                                    setViewMonth(t.getMonth());
                                    emit(t, selHour, selMinute, selAmPm);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#1d4ed8', fontWeight: 600 }}
                            >
                                Today
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Time columns */}
                    <div style={{ display: 'flex', borderLeft: '1px solid #e2e8f0', background: '#fafbfc' }}>
                        {/* AM/PM toggle at top */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* AM/PM header */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                                <div style={{ width: '52px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #e2e8f0' }} />
                                <div style={{ width: '52px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #e2e8f0' }} />
                                <div style={{ width: '52px', height: '36px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                    <div
                                        onClick={() => handleAmPm('AM')}
                                        style={{
                                            flex: 1,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px', fontWeight: 700,
                                            cursor: 'pointer',
                                            background: selAmPm === 'AM' ? '#1d4ed8' : 'transparent',
                                            color: selAmPm === 'AM' ? '#fff' : '#64748b',
                                        }}
                                    >AM</div>
                                </div>
                            </div>

                            {/* Scroll columns */}
                            <div style={{ display: 'flex', height: '216px' }}>
                                <ScrollColumn items={hours} selected={selHour} onSelect={handleHour} format={v => String(v).padStart(2, '0')} />
                                <ScrollColumn items={minutes} selected={selMinute} onSelect={handleMinute} format={v => String(v).padStart(2, '0')} />
                                {/* AM/PM column */}
                                <div style={{ width: '52px', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <div
                                        onClick={() => handleAmPm('AM')}
                                        style={{
                                            width: '40px', height: '32px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            borderRadius: '6px', cursor: 'pointer',
                                            background: selAmPm === 'AM' ? '#1d4ed8' : 'transparent',
                                            color: selAmPm === 'AM' ? '#fff' : '#64748b',
                                            fontSize: '13px', fontWeight: 700,
                                        }}
                                    >AM</div>
                                    <div
                                        onClick={() => handleAmPm('PM')}
                                        style={{
                                            width: '40px', height: '32px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            borderRadius: '6px', cursor: 'pointer',
                                            background: selAmPm === 'PM' ? '#1d4ed8' : 'transparent',
                                            color: selAmPm === 'PM' ? '#fff' : '#64748b',
                                            fontSize: '13px', fontWeight: 700,
                                        }}
                                    >PM</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateTimePicker;
