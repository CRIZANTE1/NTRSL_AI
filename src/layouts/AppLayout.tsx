import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppBackground } from '../components/AppBackground';
import { HeaderApp } from '../components/HeaderApp';
import { BottomNav } from '../components/BottomNav';
import { MAIN_BOTTOM_PADDING_CLASS } from '../lib/layout';

export function AppLayout() {
  return (
    <AppBackground>
      <HeaderApp />
      <main className={`flex-1 px-6 min-w-0 w-full ${MAIN_BOTTOM_PADDING_CLASS}`}>
        <Outlet />
      </main>
      <BottomNav />
    </AppBackground>
  );
}
