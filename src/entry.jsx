import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './main.jsx';
const simulation = window.location.pathname === '/simulacao' || window.location.pathname === '/simulacao/';
createRoot(document.getElementById('root')).render(<App real={!simulation} />);
