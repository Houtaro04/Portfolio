import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PortfolioPage from './PortfolioPage';
import './styles.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <PortfolioPage />
  </StrictMode>
);
