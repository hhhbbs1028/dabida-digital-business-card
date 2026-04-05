import React from 'react';
import type { Profile } from '../../features/profile/api/profileApi';
import type { User } from '@supabase/supabase-js';

type Props = {
  user: User;
  profile: Profile | null;
  onNewCard: () => void;
  children: React.ReactNode;
};

export function AppLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-bg-gray">
      <main
        className="mx-auto max-w-6xl overflow-x-hidden px-5 pb-6 md:px-4 md:py-8"
        style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}
      >
        {children}
      </main>
    </div>
  );
}

