import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRouter from './routes/AppRouter';
import './styles/globals.scss';

const element = document.getElementById('root');
if (!element) throw new Error('Root element not found');

createRoot(element).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
);
