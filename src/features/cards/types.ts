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
};


