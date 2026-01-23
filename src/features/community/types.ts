// Community feature types

// Profile (커뮤니티용 프로필)
export type CommunityProfile = {
  user_id: string;
  display_name: string | null;
  university: string | null;
  major: string | null;
  bio: string | null;
  avatar_url: string | null;
  skill_tags: string[];
  created_at?: string;
  updated_at?: string;
};

export type CommunityProfileInput = {
  display_name?: string | null;
  university?: string | null;
  major?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  skill_tags?: string[];
};

// Connection (네트워크 연결)
export type Connection = {
  id: string;
  owner_id: string;
  target_user_id: string;
  source: 'received_card' | 'chat' | 'follow';
  created_at: string;
};

// Post (게시글)
export type Post = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type PostInput = {
  title: string;
  content: string;
  tags?: string[];
};

export type PostUpdate = {
  title?: string;
  content?: string;
  tags?: string[];
};

// Chat (채팅)
export type Conversation = {
  id: string;
  created_at: string;
  updated_at: string;
};

export type ConversationMember = {
  conversation_id: string;
  user_id: string;
  joined_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type ConversationWithMembers = Conversation & {
  members: ConversationMember[];
  last_message?: Message | null;
};

// API 파라미터 타입
export type GetProfilesParams = {
  q?: string; // 검색어 (display_name, university, major, bio 부분검색)
  university?: string;
  major?: string;
  tags?: string[]; // skill_tags overlap
};

export type GetPostsParams = {
  tag?: string;
  q?: string; // title, content 검색
};

