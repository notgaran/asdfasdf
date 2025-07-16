-- 데이터베이스 상태 확인을 위한 디버그 스크립트

-- 1. diary 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'diary';

-- 2. 현재 diary 데이터 확인
SELECT id, emotion, content, created_at, is_public, user_id 
FROM diary 
ORDER BY created_at DESC;

-- 3. 공개된 일기만 확인
SELECT id, emotion, content, created_at, is_public, user_id 
FROM diary 
WHERE is_public = true 
ORDER BY created_at DESC;

-- 4. diary_likes 테이블 구조 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'diary_likes';

-- 5. 현재 좋아요 데이터 확인
SELECT * FROM diary_likes;

-- 6. RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('diary', 'diary_likes');

-- 7. 공개 일기와 좋아요 수 함께 확인
SELECT 
  d.id,
  d.emotion,
  d.content,
  d.created_at,
  d.is_public,
  COUNT(dl.id) as like_count
FROM diary d
LEFT JOIN diary_likes dl ON d.id = dl.diary_id
WHERE d.is_public = true
GROUP BY d.id, d.emotion, d.content, d.created_at, d.is_public
ORDER BY d.created_at DESC; 