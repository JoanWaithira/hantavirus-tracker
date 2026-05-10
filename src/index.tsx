import React from 'react';
import ReactDOM from 'react-dom/client';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';
import App from './App';

// maplibre-gl v5: use setWorkerUrl() so the CSP worker loads correctly in CRA production builds
setWorkerUrl(`${process.env.PUBLIC_URL || ''}/maplibre-gl-csp-worker.js`);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
