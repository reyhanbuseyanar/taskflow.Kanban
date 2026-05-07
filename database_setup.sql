-- 1. Boards (Tahtalar) Tablosu
CREATE TABLE boards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Columns (Sütunlar) Tablosu
CREATE TABLE columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position FLOAT NOT NULL
);

-- 3. Tasks (Görev Kartları) Tablosu
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description_html TEXT,
  color TEXT DEFAULT '#ffffff',
  due_date TIMESTAMP WITH TIME ZONE,
  position FLOAT NOT NULL
);

-- 4. Checklists (Alt Görevler) Tablosu
CREATE TABLE checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  position FLOAT NOT NULL
);

-- Güvenlik İlkeleri (Row Level Security - RLS)
-- Mülakat için "Authenticated" (giriş yapmış) olan herkesin işlem yapabilmesini sağlayan kurallar:

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kullanıcılar kendi boardlarını görebilir" ON boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi boardlarını ekleyebilir" ON boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi boardlarını güncelleyebilir" ON boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi boardlarını silebilir" ON boards FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tüm giriş yapanlar sütunları görebilir" ON columns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Tüm giriş yapanlar sütun ekleyebilir" ON columns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Tüm giriş yapanlar sütun güncelleyebilir" ON columns FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Tüm giriş yapanlar sütun silebilir" ON columns FOR DELETE USING (auth.role() = 'authenticated');

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tüm giriş yapanlar kartları görebilir" ON tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Tüm giriş yapanlar kart ekleyebilir" ON tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Tüm giriş yapanlar kart güncelleyebilir" ON tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Tüm giriş yapanlar kart silebilir" ON tasks FOR DELETE USING (auth.role() = 'authenticated');

ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tüm giriş yapanlar checklistleri görebilir" ON checklists FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Tüm giriş yapanlar checklist ekleyebilir" ON checklists FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Tüm giriş yapanlar checklist güncelleyebilir" ON checklists FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Tüm giriş yapanlar checklist silebilir" ON checklists FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- 🆕 MİGRASYON: Yeni Özellikler İçin Ek Sütunlar
-- ============================================
-- Bu komutları Supabase SQL Editor'da çalıştırın:

-- Öncelik sütunu (none, low, medium, high)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'none';

-- Etiketler sütunu (JSON array formatında: '["bug","feature"]')
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS labels TEXT DEFAULT '[]';

-- DASHBOARD DRAG AND DROP İÇİN GEREKLİ SÜTUNLAR
ALTER TABLE boards ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'project';
ALTER TABLE boards ADD COLUMN IF NOT EXISTS position FLOAT DEFAULT 0;

-- ============================================
-- 🆕 PROFILES TABLOSU (Kullanıcı bilgileri)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  title TEXT DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes profilleri görebilir" ON profiles FOR SELECT USING (true);
CREATE POLICY "Kullanıcılar kendi profilini güncelleyebilir" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profil eklenebilir" ON profiles FOR INSERT WITH CHECK (true);

-- Auth trigger: Yeni kullanıcı kayıt olduğunda otomatik profil oluşturur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, title, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'title', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı auth.users tablosuna bağla
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 🆕 BOARD_MEMBERS TABLOSU (Tahta üyeleri)
-- ============================================
CREATE TABLE IF NOT EXISTS board_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(board_id, user_id)
);

ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Üyeler board_members görebilir" ON board_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Üyeler board_members ekleyebilir" ON board_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Üyeler board_members silebilir" ON board_members FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Üyeler board_members güncelleyebilir" ON board_members FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- 🆕 DASHBOARD_CATEGORIES TABLOSU (Dinamik Sütunlar)
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  position FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE dashboard_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kullanıcılar kendi kategorilerini görebilir" ON dashboard_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kategori ekleyebilir" ON dashboard_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kategori güncelleyebilir" ON dashboard_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kategori silebilir" ON dashboard_categories FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 🆕 ASSIGNEE (Sorumlu) SÜTUNU
-- ============================================
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
