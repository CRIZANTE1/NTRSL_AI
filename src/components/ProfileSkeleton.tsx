import React from 'react';
import { colors } from '../theme/colors';
import { Skeleton } from './ui/Skeleton';

export default function ProfileSkeleton() {
  return (
    <div className="flex-1 px-6 pt-12 pb-32">
      <div
        className="rounded-3xl p-8 shadow-sm border text-center mb-6"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4 border" style={{ background: colors.surfaceWarm }} />
        <Skeleton className="h-6 w-44 rounded mx-auto mb-2" />
        <Skeleton className="h-4 w-56 rounded mx-auto" />
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-4 border"
              style={{ background: colors.surfaceWarm, borderColor: colors.border }}
            >
              <Skeleton className="h-6 w-10 rounded mb-2 mx-auto" />
              <Skeleton className="h-3 w-16 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-5 shadow-sm border"
            style={{ background: colors.surface, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl border" style={{ background: colors.surfaceWarm }} />
                <div>
                  <Skeleton className="h-4 w-40 rounded mb-2" />
                  <Skeleton className="h-3 w-56 rounded" />
                </div>
              </div>
              <Skeleton className="w-6 h-6 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

