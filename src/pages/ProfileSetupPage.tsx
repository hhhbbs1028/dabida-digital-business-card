import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileForm } from '../components/ProfileForm';
import { useAuth } from '../hooks/useAuth';
import { ensureProfileRow, isProfileComplete, maybeAdvanceOnboardingStep } from '../lib/onboardingFlow';
import type { Profile } from '../lib/profileApi';

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState(null as Profile | null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      if (!user) return;
      const p = await ensureProfileRow();
      if (!ignore) {
        setProfile(p);
        setLoadingProfile(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (profile && isProfileComplete(profile)) {
      navigate('/template');
    }
  }, [loading, user, profile, navigate]);

  if (loading || loadingProfile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-500">
        프로필을 준비하는 중입니다...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <ProfileForm
          userEmail={user?.email ?? ''}
          initialProfile={profile}
          isOnboarding
          onSaved={async (saved) => {
            const updated = await maybeAdvanceOnboardingStep(saved, 'TEMPLATE');
            setProfile(updated);
            navigate('/template');
          }}
        />
      </div>
    </div>
  );
}


