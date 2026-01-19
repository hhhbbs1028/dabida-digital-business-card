import React from 'react';
import type { Profile } from '../../features/profile/api/profileApi';
import type { User } from '@supabase/supabase-js';
import { SignOutButton } from '../../features/auth/components/AuthButtons';

type Props = {
  user: User;
  profile: Profile | null;
  onNewCard: () => void;
  children: React.ReactNode;
};

export function AppLayout({ user, profile, onNewCard, children }: Props) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Dabida · 디지털 명함 스튜디오
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {profile?.name && (
                <span className="font-medium">{profile.name}</span>
              )}
              {profile?.university && (
                <span className="ml-2 text-slate-400">· {profile.university}</span>
              )}
              {profile?.major && (
                <span className="ml-2 text-slate-400">· {profile.major}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <button
                  type="button"
                  onClick={onNewCard}
                  className="hidden items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 md:inline-flex"
                >
                  <span className="text-base leading-none">＋</span>
                  새 명함 만들기
                </button>
              </>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}

