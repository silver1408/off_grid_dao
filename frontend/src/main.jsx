import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { DaoProvider } from './context/DaoContext';
import './styles/theme.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DaoProvider>
      <App />
    </DaoProvider>
  </StrictMode>,
);
