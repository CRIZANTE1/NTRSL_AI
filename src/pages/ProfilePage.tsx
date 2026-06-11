import React from 'react';
import { AppBackground } from '../components/AppBackground';
import ProfileScreen from '../components/ProfileScreen';
import { BottomNav } from '../components/BottomNav';

export default function ProfilePage() {
  return (
    <AppBackground>
      <ProfileScreen />
      <BottomNav />
    </AppBackground>
  );
}
