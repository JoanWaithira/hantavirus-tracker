import React from 'react';
import { GlobalStats } from '../types';

interface Props {
  stats: GlobalStats | null;
  loading: boolean;
}

const StatsCards: React.FC<Props> = ({ stats, loading }) => {
  const cards = [
    {
      label: 'Confirmed Cases',
      value: stats?.confirmedCases ?? '—',
      subtext: 'MV Hondius outbreak 2024',
      variant: 'outbreak',
      icon: '🔴',
      ariaLabel: `${stats?.confirmedCases ?? 0} confirmed cases`,
    },
    {
      label: 'Deaths',
      value: stats?.deaths ?? '—',
      subtext: `CFR: ${stats?.casesFatalityRate ?? '—'}%`,
      variant: 'deaths',
      icon: '💀',
      ariaLabel: `${stats?.deaths ?? 0} deaths`,
    },
    {
      label: 'Under Monitoring',
      value: stats?.underMonitoring ?? '—',
      subtext: 'Across 12 countries',
      variant: 'monitoring',
      icon: '👁️',
      ariaLabel: `${stats?.underMonitoring ?? 0} persons under monitoring`,
    },
    {
      label: 'Countries Affected',
      value: stats?.countriesAffected ?? '—',
      subtext: '3 confirmed, 9 monitoring',
      variant: 'countries',
      icon: '🌍',
      ariaLabel: `${stats?.countriesAffected ?? 0} countries affected`,
    },
    {
      label: 'Case Fatality Rate',
      value: stats ? `${stats.casesFatalityRate}%` : '—',
      subtext: 'Current outbreak',
      variant: 'fatality',
      icon: '📊',
      ariaLabel: `Case fatality rate: ${stats?.casesFatalityRate ?? 0}%`,
    },
    {
      label: 'US Historical Cases',
      value: 890,
      subtext: 'Since 1993 (36% CFR)',
      variant: 'safe',
      icon: '📋',
      ariaLabel: '890 US historical cases since 1993',
    },
  ];

  return (
    <div className="stats-grid" role="region" aria-label="Key surveillance statistics">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`stat-card ${card.variant}`}
          aria-label={card.ariaLabel}
        >
          <div className="stat-label">
            <span aria-hidden="true">{card.icon}</span>
            {card.label}
          </div>
          {loading ? (
            <div style={{ height: 40, background: 'var(--border-color)', borderRadius: 4, marginBottom: 4, animation: 'pulse 1.5s infinite' }} />
          ) : (
            <div className={`stat-value ${card.variant}`}>{card.value}</div>
          )}
          <div className="stat-subtext">{card.subtext}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
