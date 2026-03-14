import { supabase } from '../../../shared/infrastructure/supabaseClient';
import type { User } from '@supabase/supabase-js';

export type Profile = {
  user_id: string;
  email: string | null;
  name: string | null;
  university: string | null;
  major: string | null;
  student_id: string | null;
  phone: string | null;
  sns: {
    instagram?: string | null;
    github?: string | null;
    website?: string | null;
  };
  skill_tags: string[];
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  network_visibility: 'public' | 'friends_only' | 'private';
  onboarding_step?: 'ONBOARDING' | 'AUTH' | 'PROFILE' | 'TEMPLATE' | 'DONE';
  selected_template_id?: number | null;
  selected_theme_color?: string | null;
  selected_font_family?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileInput = {
  email?: string;
  name?: string;
  university?: string;
  major?: string;
  student_id?: string;
  phone?: string;
  sns?: {
    instagram?: string;
    github?: string;
    website?: string;
  };
  skill_tags?: string[];
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  network_visibility?: 'public' | 'friends_only' | 'private';
  onboarding_step?: 'ONBOARDING' | 'AUTH' | 'PROFILE' | 'TEMPLATE' | 'DONE';
  selected_template_id?: number;
  selected_theme_color?: string;
  selected_font_family?: string;
};

async function getCurrentUser(): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('[profileApi] 사용자 확인 오류:', error);
    throw error;
  }

  if (!user) {
    throw new Error('로그인이 필요합니다.');
  }

  return user;
}

function normalizeProfile(row: any): Profile {
  return {
    user_id: row.user_id,
    email: row.email ?? null,
    name: row.name ?? null,
    university: row.university ?? null,
    major: row.major ?? null,
    student_id: row.student_id ?? null,
    phone: row.phone ?? null,
    sns: {
      instagram: row.sns?.instagram ?? null,
      github: row.sns?.github ?? null,
      website: row.sns?.website ?? null,
    },
    skill_tags: Array.isArray(row.skill_tags) ? row.skill_tags : [],
    display_name: row.display_name ?? null,
    bio: row.bio ?? null,
    avatar_url: row.avatar_url ?? null,
    network_visibility: row.network_visibility ?? 'public',
    onboarding_step: row.onboarding_step ?? null,
    selected_template_id: row.selected_template_id ?? null,
    selected_theme_color: row.selected_theme_color ?? null,
    selected_font_family: row.selected_font_family ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getMyProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();

  console.log('[profileApi] 프로필 조회:', user.id);
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, name, university, major, student_id, phone, sns, skill_tags, display_name, bio, avatar_url, network_visibility, onboarding_step, selected_template_id, selected_theme_color, selected_font_family, created_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[profileApi] 프로필 조회 오류:', error);
    throw error;
  }

  return data ? normalizeProfile(data) : null;
}

export async function upsertMyProfile(payload: ProfileInput): Promise<Profile> {
  const user = await getCurrentUser();

  const record: any = {
    user_id: user.id,
    email: payload.email ?? user.email ?? null,
    name: payload.name ?? null,
    university: payload.university ?? null,
    major: payload.major ?? null,
    student_id: payload.student_id ?? null,
    phone: payload.phone ?? null,
    sns: {
      instagram: payload.sns?.instagram ?? null,
      github: payload.sns?.github ?? null,
      website: payload.sns?.website ?? null,
    },
    skill_tags: payload.skill_tags ?? [],
    onboarding_step: payload.onboarding_step ?? undefined,
    selected_template_id: payload.selected_template_id ?? undefined,
    selected_theme_color: payload.selected_theme_color ?? undefined,
    selected_font_family: payload.selected_font_family ?? undefined,
  };

  if (payload.display_name !== undefined) record.display_name = payload.display_name;
  if (payload.bio !== undefined) record.bio = payload.bio;
  if (payload.avatar_url !== undefined) record.avatar_url = payload.avatar_url;
  if (payload.network_visibility !== undefined) record.network_visibility = payload.network_visibility;

  console.log('[profileApi] 프로필 저장:', user.id);
  const { data, error } = await supabase
    .from('profiles')
    .upsert(record, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    console.error('[profileApi] 프로필 저장 오류:', error);
    throw error;
  }

  return normalizeProfile(data);
}


