import { createContext, useContext } from 'react';

export const DaoContext = createContext(null);

export function useDao() {
  const context = useContext(DaoContext);
  if (!context) {
    throw new Error('useDao must be used within DaoProvider');
  }

  return context;
}