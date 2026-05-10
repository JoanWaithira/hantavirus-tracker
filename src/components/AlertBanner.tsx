import React, { useState } from 'react';

const AlertBanner: React.FC = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="alert-banner" role="alert" aria-live="assertive">
      <span className="pulse-dot" aria-hidden="true" />
      <span className="alert-text">
        🚨 <strong>CDC LEVEL 3 EMERGENCY RESPONSE ACTIVE</strong> — MV Hondius Hantavirus Outbreak: 8 confirmed cases, 3 deaths. Andes virus (person-to-person transmission possible). Affected countries: South Africa, Netherlands, Switzerland.
      </span>
      <button
        className="alert-close"
        onClick={() => setVisible(false)}
        aria-label="Dismiss alert banner"
      >
        Dismiss
      </button>
    </div>
  );
};

export default AlertBanner;
