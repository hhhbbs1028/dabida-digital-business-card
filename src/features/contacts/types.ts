import type { CardThemeStorage } from '../../theme/types';

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
  theme?: CardThemeStorage | null;
  profile_url?: string | null;
  logo_url?: string | null;
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

