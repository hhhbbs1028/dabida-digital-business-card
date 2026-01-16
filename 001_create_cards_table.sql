-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  headline TEXT,
  organization TEXT,
  email TEXT,
  phone TEXT,
  links JSONB DEFAULT '{}'::jsonb,
  style JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select only their own cards
CREATE POLICY "Users can select their own cards"
  ON cards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert only their own cards
CREATE POLICY "Users can insert their own cards"
  ON cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own cards
CREATE POLICY "Users can update their own cards"
  ON cards
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own cards
CREATE POLICY "Users can delete their own cards"
  ON cards
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row update
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

