-- Community Core Tables
-- 커뮤니티 기능을 위한 테이블 및 RLS 정책

-- 1. profiles 테이블에 커뮤니티 필드 추가
-- (기존 profiles 테이블이 있다고 가정하고, 커뮤니티용 필드만 추가)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 커뮤니티 탐색을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name) WHERE display_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_university ON profiles(university) WHERE university IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_major ON profiles(major) WHERE major IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_skill_tags ON profiles USING GIN(skill_tags) WHERE skill_tags IS NOT NULL;

-- SELECT: 로그인 유저는 모두 조회 가능 (커뮤니티 탐색 목적)
CREATE POLICY "Community: Users can view all profiles"
  ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 2. connections 테이블 (네트워크/파도타기용)
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'received_card',  -- 'received_card', 'chat', 'follow' 등
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(owner_id, target_user_id, source)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_connections_owner_id ON connections(owner_id);
CREATE INDEX IF NOT EXISTS idx_connections_target_user_id ON connections(target_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_source ON connections(source);

-- RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- SELECT/INSERT/DELETE: owner_id만 접근 가능
CREATE POLICY "Users can manage their own connections"
  ON connections
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 3. posts 테이블 (게시판)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);

-- RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- SELECT: 로그인 유저 모두 조회 가능
CREATE POLICY "Users can view all posts"
  ON posts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT/UPDATE/DELETE: 작성자만
CREATE POLICY "Users can manage their own posts"
  ON posts
  FOR ALL
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- updated_at 트리거
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. chats 테이블 (1:1 DM)
-- conversations: 대화방
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- conversation_members: 대화방 멤버
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_id ON conversation_members(conversation_id);

-- messages: 메시지
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- RLS for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- conversations는 멤버만 조회 가능 (conversation_members를 통해)
CREATE POLICY "Users can view conversations they are members of"
  ON conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_members.conversation_id = conversations.id
      AND conversation_members.user_id = auth.uid()
    )
  );

-- RLS for conversation_members
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversation members of their conversations"
  ON conversation_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add themselves to conversations"
  ON conversation_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- messages는 해당 대화방 멤버만 조회/작성 가능
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_members.conversation_id = messages.conversation_id
      AND conversation_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_members.conversation_id = messages.conversation_id
      AND conversation_members.user_id = auth.uid()
    )
  );

-- conversations updated_at 트리거 (메시지가 추가될 때마다 업데이트)
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_updated_at_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

