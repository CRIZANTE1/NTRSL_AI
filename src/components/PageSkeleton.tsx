import React from 'react';
import { colors } from '../theme/colors';
import { Skeleton } from './ui/Skeleton';

export function PageSkeleton({ variant = 'auth' }: { variant?: 'auth' | 'default' }) {
  return (
    <div className="min-h-screen" style={{ background: colors.background }}>
      <div className="w-full max-w-md mx-auto px-6 pt-10 pb-24">
        <div className="mb-8">
          <Skeleton className="h-8 w-44 rounded" />
          <Skeleton className="h-4 w-64 rounded mt-3" />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border p-5" style={{ background: colors.surface, borderColor: colors.border }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl border" style={{ background: colors.surfaceWarm }} />
                <div>
                  <Skeleton className="h-4 w-40 rounded mb-2" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
              <Skeleton className="h-7 w-16 rounded-full border" style={{ background: colors.surfaceWarm }} />
            </div>
            <div className="mt-4">
              <Skeleton className="h-10 w-full rounded-xl border" style={{ background: colors.surfaceWarm }} />
            </div>
          </div>

          <div className="rounded-2xl border p-5" style={{ background: colors.surface, borderColor: colors.border }}>
            <Skeleton className="h-4 w-36 rounded mb-3" />
            <Skeleton className="h-3 w-full rounded mb-2" />
            <Skeleton className="h-3 w-5/6 rounded mb-2" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>

          {variant === 'default' && (
            <div className="rounded-2xl border p-5" style={{ background: colors.surface, borderColor: colors.border }}>
              <Skeleton className="h-4 w-28 rounded mb-3" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-14 rounded-2xl border" style={{ background: colors.surfaceWarm }} />
                <Skeleton className="h-14 rounded-2xl border" style={{ background: colors.surfaceWarm }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

