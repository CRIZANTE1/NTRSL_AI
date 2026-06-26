import React from 'react';
import { NativeShellEffects } from './capacitor/NativeShellEffects';
import { OfflineSyncEffects } from './capacitor/OfflineSyncEffects';
import { PushNotificationsEffects } from './capacitor/PushNotificationsEffects';
import { BiometricLock } from './capacitor/BiometricLock';
import { NetworkBanner } from './components/NetworkBanner';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <>
      <NativeShellEffects />
      <OfflineSyncEffects />
      <PushNotificationsEffects />
      <NetworkBanner />
      <BiometricLock />
      <AppRoutes />
    </>
  );
}
