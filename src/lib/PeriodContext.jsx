import React, { createContext, useContext, useState } from 'react';

// periodMode: 'week' | 'range' | 'all'
// appMode: 'current' | 'historical'
const PeriodContext = createContext();

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

const now = new Date();
const DEFAULT_WEEK = `${now.getFullYear()}-W${getISOWeek(now)}`;

export function PeriodProvider({ children }) {
  const [appMode, setAppMode] = useState('current'); // 'current' | 'historical'
  const [periodMode, setPeriodMode] = useState('week'); // 'week' | 'range' | 'all'
  const [selectedWeek, setSelectedWeek] = useState(DEFAULT_WEEK);
  const [dateRange, setDateRange] = useState({
    from: `${now.getFullYear()}-01-01`,
    to: new Date().toISOString().slice(0, 10),
  });

  return (
    <PeriodContext.Provider value={{
      appMode, setAppMode,
      periodMode, setPeriodMode,
      selectedWeek, setSelectedWeek,
      dateRange, setDateRange,
    }}>
      {children}
    </PeriodContext.Provider>
  );
}

export const usePeriod = () => {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error('usePeriod must be used within PeriodProvider');
  return ctx;
};
