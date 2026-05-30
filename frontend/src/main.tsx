import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OmegaLogApp } from './pages/OmegaLogApp';
import './styles/app.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <OmegaLogApp />
  </StrictMode>,
);
