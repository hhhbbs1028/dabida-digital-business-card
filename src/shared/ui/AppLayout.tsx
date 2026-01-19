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
  // 이니셜 생성 함수
  const getInitials = (name: string) => {
    if (!name) return '👤';
    const names = name.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-4">
            {profile?.name && (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-base font-semibold text-white shadow-md">
                {getInitials(profile.name)}
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {profile?.name || 'Dabida'}
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                {profile?.university && profile?.major
                  ? `${profile.university} · ${profile.major}`
                  : '디지털 명함 스튜디오'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <button
                  type="button"
                  onClick={onNewCard}
                  className="hidden items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-primary-700 md:inline-flex"
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

      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}

