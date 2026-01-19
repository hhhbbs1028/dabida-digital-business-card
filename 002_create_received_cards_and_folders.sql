-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on owner_id for better query performance
CREATE INDEX IF NOT EXISTS idx_folders_owner_id ON folders(owner_id);

-- Enable Row Level Security for folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select only their own folders
CREATE POLICY "Users can select their own folders"
  ON folders
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: Users can insert only their own folders
CREATE POLICY "Users can insert their own folders"
  ON folders
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update only their own folders
CREATE POLICY "Users can update their own folders"
  ON folders
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can delete only their own folders
CREATE POLICY "Users can delete their own folders"
  ON folders
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Create received_cards table
CREATE TABLE IF NOT EXISTS received_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_received_cards_owner_id ON received_cards(owner_id);
CREATE INDEX IF NOT EXISTS idx_received_cards_folder_id ON received_cards(folder_id);
CREATE INDEX IF NOT EXISTS idx_received_cards_source_card_id ON received_cards(source_card_id);
CREATE INDEX IF NOT EXISTS idx_received_cards_tags ON received_cards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_received_cards_snapshot ON received_cards USING GIN(snapshot);

-- Enable Row Level Security for received_cards
ALTER TABLE received_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select only their own received cards
CREATE POLICY "Users can select their own received cards"
  ON received_cards
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Policy: Users can insert only their own received cards
CREATE POLICY "Users can insert their own received cards"
  ON received_cards
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can update only their own received cards
CREATE POLICY "Users can update their own received cards"
  ON received_cards
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy: Users can delete only their own received cards
CREATE POLICY "Users can delete their own received cards"
  ON received_cards
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Create trigger to automatically update updated_at on received_cards
CREATE TRIGGER update_received_cards_updated_at
  BEFORE UPDATE ON received_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

