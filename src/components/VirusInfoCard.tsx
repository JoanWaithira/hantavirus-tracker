import React from 'react';
import { VirusStrain } from '../types';
import { virusStrain } from '../data/mockData';

const VirusInfoCard: React.FC = () => {
  const v: VirusStrain = virusStrain;

  return (
    <div className="virus-info-card" role="region" aria-label="Virus strain information">
      <div className="virus-info-row">
        <span className="virus-info-label">Strain</span>
        <span className="virus-info-value danger">{v.name}</span>
      </div>
      <div className="virus-info-row">
        <span className="virus-info-label">Disease Type</span>
        <span className="virus-info-value">{v.type}</span>
      </div>
      <div className="virus-info-row">
        <span className="virus-info-label">Transmission</span>
        <span className="virus-info-value warning">{v.transmissionRoute}</span>
      </div>
      <div className="virus-info-row">
        <span className="virus-info-label">Person-to-Person</span>
        <span className={`virus-info-value ${v.personToPerson ? 'danger' : ''}`}>
          {v.personToPerson ? '⚠️ YES — Unique to Andes virus' : 'No'}
        </span>
      </div>
      <div className="virus-info-row">
        <span className="virus-info-label">Case Fatality Rate</span>
        <span className="virus-info-value danger">{v.fatalityRate}%</span>
      </div>
      <div className="virus-info-row">
        <span className="virus-info-label">Reservoir Host</span>
        <span className="virus-info-value">{v.reservoirHost}</span>
      </div>
      <div className="virus-info-row" style={{ gridColumn: '1 / -1' }}>
        <span className="virus-info-label">Geographic Range</span>
        <span className="virus-info-value">{v.geographicRange}</span>
      </div>
    </div>
  );
};

export default VirusInfoCard;
