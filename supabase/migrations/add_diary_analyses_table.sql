-- 일기 분석 결과를 저장하는 테이블 생성
CREATE TABLE IF NOT EXISTS diary_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diary_id UUID REFERENCES diary(id) ON DELETE CASCADE,
  emotion TEXT NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  keywords TEXT[] DEFAULT '{}',
  summary TEXT,
  suggestions TEXT[] DEFAULT '{}',
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- diary_analyses 테이블에 RLS 활성화
ALTER TABLE diary_analyses ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 일기 분석 결과만 볼 수 있도록
CREATE POLICY "Users can view their own diary analyses" ON diary_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM diary 
      WHERE diary.id = diary_analyses.diary_id 
      AND diary.user_id = auth.uid()
    )
  );

-- 서비스 역할은 분석 결과를 삽입할 수 있도록
CREATE POLICY "Service role can insert diary analyses" ON diary_analyses
  FOR INSERT WITH CHECK (true);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_diary_analyses_diary_id ON diary_analyses(diary_id);
CREATE INDEX IF NOT EXISTS idx_diary_analyses_analyzed_at ON diary_analyses(analyzed_at); 