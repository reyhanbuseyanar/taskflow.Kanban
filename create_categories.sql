CREATE TABLE IF NOT EXISTS dashboard_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT DEFAULT 'Layout',
  color TEXT DEFAULT '#6366f1',
  position FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE dashboard_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own categories" ON dashboard_categories;
CREATE POLICY "Users can manage their own categories" ON dashboard_categories FOR ALL USING (auth.uid() = user_id);

