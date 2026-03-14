import type { CardTheme } from '../../theme/types';

export type FontFamilyOption = 'sans' | 'serif' | 'mono';

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
  };
  style: {
    template_id: 1 | 2;
    theme_color: string;
    font_family: FontFamilyOption;
    orientation: 'horizontal' | 'vertical';
  };
  // 이미지 URL (Supabase Storage에 저장된 이미지의 URL)
  logo_url?: string | null;
  card_image_url?: string | null;
  // 고급 테마 엔진. NULL이면 legacy style 컬럼으로 렌더링.
  theme?: CardTheme | null;
};


