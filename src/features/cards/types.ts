import type { CardThemeStorage } from '../../theme/types';

export type CardData = {
  id: string;
  display_name: string;
  headline: string;
  organization: string;
  email: string;
  phone: string;
  links: {
    instagram: string;
    github: string;
    website: string;
    linkedin: string;
    google_drive: string;
  };
  // 이미지 URL (Supabase Storage에 저장된 이미지의 URL)
  profile_url?: string | null;
  logo_url?: string | null;
  card_image_url?: string | null;
  // 앞면 테마 (DB 저장 포맷). NULL이면 기본 테마로 렌더링.
  theme: CardThemeStorage | null;
  // 뒷면 테마. NULL이면 뒷면 없음.
  back_theme?: CardThemeStorage | null;
};
