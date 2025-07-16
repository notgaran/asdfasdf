-- diary 테이블에 user_email 컬럼 추가 (없는 경우에만)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'diary' AND column_name = 'user_email') THEN
        ALTER TABLE diary ADD COLUMN user_email TEXT;
    END IF;
END $$;

-- 공감(좋아요) 테이블 생성
CREATE TABLE IF NOT EXISTS diary_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diary_id UUID REFERENCES diary(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(diary_id, user_id)
);

-- diary_likes 테이블에 RLS 활성화
ALTER TABLE diary_likes ENABLE ROW LEVEL SECURITY;

-- 사용자는 공개된 일기에만 좋아요를 할 수 있도록
CREATE POLICY "Users can like public diaries" ON diary_likes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM diary 
      WHERE diary.id = diary_likes.diary_id 
      AND diary.is_public = true
    )
  );

-- 사용자는 자신이 좋아요한 것만 삭제할 수 있도록
CREATE POLICY "Users can unlike their own likes" ON diary_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 모든 사용자가 좋아요 수를 볼 수 있도록
CREATE POLICY "Everyone can view likes" ON diary_likes
  FOR SELECT USING (true); 