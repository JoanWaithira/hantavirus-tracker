import React from 'react';
import ReactDOM from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';
import App from './App';

// Use the standalone CSP worker so maplibre-gl works in CRA production builds on Railway
(maplibregl as any).workerUrl = `${process.env.PUBLIC_URL || ''}/maplibre-gl-csp-worker.js`;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
