import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './enhance.css';
import './newyear.css';
import './newyear-components.css';
import './newyear-readers.css';
import { initEnhancements } from './enhance.js';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

initEnhancements();