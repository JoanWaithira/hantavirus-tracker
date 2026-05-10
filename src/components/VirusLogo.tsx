import React from 'react';

interface Props { size?: number }

const VirusLogo: React.FC<Props> = ({ size = 40 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} aria-label="Hantavirus particle logo" role="img">
    <circle cx="50" cy="50" r="47" fill="none" stroke="#fc8181" strokeWidth="0.6" opacity="0.35"/>
    <circle cx="50" cy="50" r="32" fill="#7b1d1d" stroke="#c53030" strokeWidth="1.5"/>
    <circle cx="50" cy="50" r="28" fill="#c53030"/>

    {[0,30,60,90,120,150,180,210,240,270,300,330].map(angle => (
      <ellipse key={angle} cx="50" cy="14" rx="3.2" ry="6"
        fill="#e53e3e" stroke="#742a2a" strokeWidth="0.8"
        transform={`rotate(${angle} 50 50)`}
      />
    ))}

    <path d="M36 46 Q44 37 52 45 Q60 53 50 58" stroke="#fed7d7" strokeWidth="2"   fill="none" strokeLinecap="round" opacity="0.85"/>
    <path d="M42 38 Q55 41 58 53"               stroke="#fbd5d5" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75"/>
    <path d="M39 55 Q47 63 58 58"               stroke="#fbd5d5" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.65"/>

    <circle cx="44" cy="44" r="2.5" fill="#fff5f5" opacity="0.65"/>
    <circle cx="55" cy="42" r="2"   fill="#fff5f5" opacity="0.65"/>
    <circle cx="58" cy="52" r="2.5" fill="#fff5f5" opacity="0.65"/>
    <circle cx="46" cy="57" r="2"   fill="#fff5f5" opacity="0.65"/>
    <circle cx="50" cy="49" r="3"   fill="#fff5f5" opacity="0.75"/>
  </svg>
);

export default VirusLogo;
