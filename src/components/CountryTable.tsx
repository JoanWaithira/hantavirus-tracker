import React, { useState } from 'react';
import { CountryData } from '../types';

interface Props {
  countries: CountryData[];
  loading: boolean;
}

const sortArrow = (sortKey: keyof CountryData, col: keyof CountryData, sortDir: 'asc' | 'desc') =>
  sortKey === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

const CountryTable: React.FC<Props> = ({ countries, loading }) => {
  const [sortKey, setSortKey] = useState<keyof CountryData>('cases');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: keyof CountryData) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...countries].sort((a, b) => {
    const av = a[sortKey] as any;
    const bv = b[sortKey] as any;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ height: 36, background: 'var(--border-color)', borderRadius: 4, marginBottom: 4, animation: 'pulse 1.5s infinite', opacity: 1 - i * 0.15 }} />
        ))}
      </div>
    );
  }

  const ariaSort = sortDir === 'asc' ? 'ascending' : 'descending';

  return (
    <div style={{ overflowX: 'auto' }} role="region" aria-label="Country-level case data">
      <table className="country-table">
        <thead>
          <tr>
            <th aria-sort={sortKey === 'name' ? ariaSort : 'none'}>
              <button onClick={() => handleSort('name')} style={{ background: 'none', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', padding: 0, cursor: 'pointer' }}>
                Country{sortArrow(sortKey, 'name', sortDir)}
              </button>
            </th>
            <th aria-sort={sortKey === 'cases' ? ariaSort : 'none'}>
              <button onClick={() => handleSort('cases')} style={{ background: 'none', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', padding: 0, cursor: 'pointer' }}>
                Cases{sortArrow(sortKey, 'cases', sortDir)}
              </button>
            </th>
            <th aria-sort={sortKey === 'deaths' ? ariaSort : 'none'}>
              <button onClick={() => handleSort('deaths')} style={{ background: 'none', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', padding: 0, cursor: 'pointer' }}>
                Deaths{sortArrow(sortKey, 'deaths', sortDir)}
              </button>
            </th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.id}>
              <td>
                <strong>{c.name}</strong>
              </td>
              <td style={{ color: c.cases > 0 ? 'var(--color-outbreak)' : 'var(--text-muted)', fontWeight: c.cases > 0 ? 700 : 400 }}>
                {c.cases}
              </td>
              <td style={{ color: c.deaths > 0 ? '#fc8181' : 'var(--text-muted)', fontWeight: c.deaths > 0 ? 700 : 400 }}>
                {c.deaths}
              </td>
              <td>
                <span className={`status-chip ${c.status}`}>
                  {c.status === 'confirmed' && '🔴'}
                  {c.status === 'monitoring' && '🟡'}
                  {c.status === 'suspected' && '🟠'}
                  {c.status === 'safe' && '🟢'}
                  {' '}{c.status}
                </span>
              </td>
              <td style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', maxWidth: 200 }}>
                {c.notes || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CountryTable;
