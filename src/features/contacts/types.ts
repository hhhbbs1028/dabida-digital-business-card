import type { CardData } from '../cards/types';

export type ReceivedCardSnapshot = {
  display_name?: string;
  headline?: string;
  organization?: string;
  email?: string;
  phone?: string;
  links?: {
    instagram?: string;
    github?: string;
    website?: string;
  };
  style?: {
    template_id?: number;
    theme_color?: string;
    font_family?: string;
    orientation?: string;
  };
};

export type ReceivedCard = {
  id: string;
  owner_id: string;
  source_card_id: string | null;
  snapshot: ReceivedCardSnapshot;
  tags: string[];
  folder_id: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type ReceivedCardInput = {
  source_card_id?: string | null;
  snapshot: ReceivedCardSnapshot;
  tags?: string[];
  folder_id?: string | null;
  memo?: string | null;
};

export type ReceivedCardUpdate = {
  tags?: string[];
  folder_id?: string | null;
  memo?: string | null;
};

export type Folder = {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
};

export type FolderInput = {
  name: string;
};

