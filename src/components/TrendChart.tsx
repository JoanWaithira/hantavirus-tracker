import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { TrendDataPoint } from '../types';

interface Props {
  data: TrendDataPoint[];
  loading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 8,
      padding: '0.75rem 1rem',
      fontSize: '0.8rem',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Year {label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, color: p.color }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
      {payload[0] && payload[1] && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>CFR</span>
          <span style={{ fontWeight: 700 }}>{Math.round((payload[1].value / payload[0].value) * 100)}%</span>
        </div>
      )}
    </div>
  );
};

const TrendChart: React.FC<Props> = ({ data, loading }) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  if (loading) {
    return (
      <div style={{ padding: '1.25rem' }}>
        <div style={{ height: 260, background: 'var(--border-color)', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
      </div>
    );
  }

  const tickStyle = { fontSize: 11, fill: 'var(--text-muted)' };
  const gridProps = { stroke: 'var(--border-color)', strokeDasharray: '3 3' };

  return (
    <div style={{ padding: '1.25rem' }}>
      <div className="chart-tabs">
        {(['area', 'bar'] as const).map((t) => (
          <button
            key={t}
            className={`tab-btn ${chartType === t ? 'active' : ''}`}
            onClick={() => setChartType(t)}
            aria-pressed={chartType === t}
          >
            {t === 'area' ? '📈 Trend Area' : '📊 Bar Chart'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        {chartType === 'area' ? (
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="casesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3182ce" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3182ce" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="deathsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e53e3e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#e53e3e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="year" tick={tickStyle} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '0.78rem', paddingTop: 8 }}
              formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>}
            />
            <ReferenceLine
              x={2012}
              stroke="var(--color-monitoring)"
              strokeDasharray="4 2"
              label={{ value: "Yosemite", position: 'insideTop', fill: 'var(--color-monitoring)', fontSize: 10 }}
            />
            <Area type="monotone" dataKey="cases" name="Cases" stroke="#3182ce" fill="url(#casesGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="deaths" name="Deaths" stroke="#e53e3e" fill="url(#deathsGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid {...gridProps} vertical={false} />
            <XAxis dataKey="year" tick={tickStyle} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={tickStyle} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: 8 }} formatter={(v) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
            <Bar dataKey="cases" name="Cases" fill="#3182ce" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
            <Bar dataKey="deaths" name="Deaths" fill="#e53e3e" radius={[3, 3, 0, 0]} fillOpacity={0.85} />
          </BarChart>
        )}
      </ResponsiveContainer>

      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
        {[
          { label: 'Peak Year', value: '1993 (outbreak)', color: 'var(--color-outbreak)' },
          { label: 'Total Cases', value: '890 (1993–2024)', color: '#63b3ed' },
          { label: 'Total Deaths', value: '~320 (36% CFR)', color: '#fc8181' },
          { label: 'Avg Per Year', value: '~27 cases/yr', color: '#68d391' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.6rem 0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendChart;
