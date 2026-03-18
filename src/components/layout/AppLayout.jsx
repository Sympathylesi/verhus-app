import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export default function AppLayout({ lang, setLang }) {
  const now = new Date();
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(`${now.getFullYear()}-W${getISOWeek(now)}`);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        lang={lang} setLang={setLang}
        dark={dark} setDark={setDark}
        selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek}
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        sidebarOpen={sidebarOpen}
      />
      <Sidebar lang={lang} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <BottomNav lang={lang} />
      <main className="pt-16 pb-20 lg:pb-0 lg:pl-60 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Outlet context={{ lang, selectedWeek, setSelectedWeek }} />
        </div>
      </main>
    </div>
  );
}
