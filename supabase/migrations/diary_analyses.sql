-- 일기 분석 결과 저장 테이블
CREATE TABLE IF NOT EXISTS diary_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  diary_id UUID NOT NULL UNIQUE,
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- diary_id에 unique 인덱스 보장
CREATE UNIQUE INDEX IF NOT EXISTS idx_diary_analyses_diary_id ON diary_analyses(diary_id); 