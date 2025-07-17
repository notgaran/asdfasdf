-- DreamInside 데이터베이스 스키마

-- Users 테이블 (auth.users 확장)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users 테이블에 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 수정할 수 있도록
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Diary 테이블 (기존 테이블 수정)
CREATE TABLE IF NOT EXISTS diary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  is_public BOOLEAN DEFAULT false,
  emotion TEXT,
  views INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  ai_interpretation JSONB DEFAULT '{"dream_interpretation": "", "story": ""}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Diary 테이블에 RLS 활성화
ALTER TABLE diary ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 일기를 CRUD할 수 있도록
CREATE POLICY "Users can CRUD own diaries" ON diary FOR ALL USING (auth.uid() = user_id);
-- 모든 사용자는 공개된 일기를 볼 수 있도록
CREATE POLICY "Everyone can view public diaries" ON diary FOR SELECT USING (is_public = true);

-- Follow 테이블
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Follow 테이블에 RLS 활성화
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 사용자는 팔로우/언팔로우할 수 있도록
CREATE POLICY "Users can follow/unfollow" ON follows FOR ALL USING (auth.uid() = follower_id);
-- 모든 사용자가 팔로우 관계를 볼 수 있도록
CREATE POLICY "Everyone can view follows" ON follows FOR SELECT USING (true);

-- Comments 테이블
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diary_id UUID REFERENCES diary(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments 테이블에 RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 사용자는 댓글을 작성/수정/삭제할 수 있도록
CREATE POLICY "Users can CRUD own comments" ON comments FOR ALL USING (auth.uid() = user_id);
-- 모든 사용자가 공개 일기의 댓글을 볼 수 있도록
CREATE POLICY "Everyone can view public diary comments" ON comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM diary 
    WHERE diary.id = comments.diary_id 
    AND diary.is_public = true
  )
);

-- Likes 테이블 (기존 diary_likes 테이블 대체)
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diary_id UUID REFERENCES diary(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(diary_id, user_id)
);

-- Likes 테이블에 RLS 활성화
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 사용자는 공개된 일기에만 좋아요를 할 수 있도록
CREATE POLICY "Users can like public diaries" ON likes FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM diary 
    WHERE diary.id = likes.diary_id 
    AND diary.is_public = true
  )
);

-- 사용자는 자신이 좋아요한 것만 삭제할 수 있도록
CREATE POLICY "Users can unlike their own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- 모든 사용자가 좋아요를 볼 수 있도록
CREATE POLICY "Everyone can view likes" ON likes FOR SELECT USING (true);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_diary_user_id ON diary(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_public ON diary(is_public);
CREATE INDEX IF NOT EXISTS idx_diary_created_at ON diary(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_comments_diary_id ON comments(diary_id);
CREATE INDEX IF NOT EXISTS idx_likes_diary_id ON likes(diary_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- 트리거 함수: 사용자 생성 시 users 테이블에 자동 추가
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 좋아요 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_diary_likes_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE diary SET likes_count = likes_count + 1 WHERE id = NEW.diary_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE diary SET likes_count = likes_count - 1 WHERE id = OLD.diary_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 좋아요 수 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_diary_likes_count ON likes;
CREATE TRIGGER trigger_update_diary_likes_count
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW EXECUTE PROCEDURE update_diary_likes_count();

-- 댓글 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_diary_comments_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE diary SET comments_count = comments_count + 1 WHERE id = NEW.diary_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE diary SET comments_count = comments_count - 1 WHERE id = OLD.diary_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 댓글 수 업데이트 트리거
DROP TRIGGER IF EXISTS trigger_update_diary_comments_count ON comments;
CREATE TRIGGER trigger_update_diary_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE PROCEDURE update_diary_comments_count(); 