import type { Profile } from '../../profile/api/profileApi';
import { getMyProfile, upsertMyProfile } from '../../profile/api/profileApi';
import { supabase } from '../../../shared/infrastructure/supabaseClient';

export type OnboardingStep = 'ONBOARDING' | 'AUTH' | 'PROFILE' | 'TEMPLATE' | 'DONE';

const stepOrder: Record<OnboardingStep, number> = {
  ONBOARDING: 0,
  AUTH: 1,
  PROFILE: 2,
  TEMPLATE: 3,
  DONE: 4,
};

export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  const nameOk = (profile.name ?? '').trim().length > 0;
  return nameOk;
}

export function isTemplateSelected(profile: Profile | null): boolean {
  return !!profile?.selected_template_id;
}

export async function ensureProfileRow(): Promise<Profile> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  const existing = await getMyProfile();
  if (existing) {
    return existing;
  }

  return upsertMyProfile({
    email: user.email ?? undefined,
    onboarding_step: 'PROFILE',
  });
}

export async function maybeAdvanceOnboardingStep(
  profile: Profile,
  target: OnboardingStep,
): Promise<Profile> {
  const current = profile.onboarding_step ?? 'ONBOARDING';
  if (stepOrder[current] >= stepOrder[target]) {
    return profile;
  }

  return upsertMyProfile({ onboarding_step: target });
}

export async function resolveNextRoute(): Promise<{
  userExists: boolean;
  profile: Profile | null;
  nextRoute: string;
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { userExists: false, profile: null, nextRoute: '/login' };
  }

  const profile = await ensureProfileRow();
  const step = profile.onboarding_step ?? 'PROFILE';

  if (step === 'ONBOARDING') {
    return { userExists: true, profile, nextRoute: '/onboarding' };
  }

  if (step === 'AUTH') {
    return { userExists: true, profile, nextRoute: '/login' };
  }

  if (step === 'PROFILE' || !isProfileComplete(profile)) {
    return { userExists: true, profile, nextRoute: '/profile-setup' };
  }

  if (step === 'TEMPLATE' || !isTemplateSelected(profile)) {
    return { userExists: true, profile, nextRoute: '/template' };
  }

  if (step === 'DONE') {
    return { userExists: true, profile, nextRoute: '/studio' };
  }

  return { userExists: true, profile, nextRoute: '/studio' };
}


