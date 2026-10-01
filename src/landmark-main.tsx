import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import LandmarkApp from './LandmarkApp';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container missing');

createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <LandmarkApp />
    </BrowserRouter>
  </React.StrictMode>
);
