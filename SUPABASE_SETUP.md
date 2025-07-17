# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트가 생성되면 Settings > API에서 다음 정보를 확인합니다:
   - Project URL
   - anon public key
   - service_role key (비공개)

## 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## 3. 데이터베이스 스키마 설정

1. Supabase Dashboard에서 SQL Editor로 이동
2. `database_schema.sql` 파일의 내용을 복사하여 실행
3. 모든 테이블과 정책이 생성되었는지 확인

## 4. Edge Functions 배포

### Supabase CLI 설치
```bash
npm install -g supabase
```

### 로그인
```bash
supabase login
```

### 프로젝트 링크
```bash
supabase link --project-ref your_project_ref
```

### Edge Function 배포
```bash
supabase functions deploy generate-ai-interpretation
```

## 5. 환경 변수 설정 (Edge Functions)

Supabase Dashboard에서:
1. Settings > Edge Functions로 이동
2. `generate-ai-interpretation` 함수 선택
3. 다음 환경 변수 추가:
   - `OPENAI_API_KEY`: OpenAI API 키
   - `SUPABASE_URL`: 프로젝트 URL
   - `SUPABASE_SERVICE_ROLE_KEY`: 서비스 롤 키

## 6. 인증 설정

1. Authentication > Settings에서 이메일 인증 활성화
2. Site URL을 `http://localhost:3000` (개발) 또는 실제 도메인으로 설정
3. Redirect URLs에 `http://localhost:3000` 추가

## 7. RLS 정책 확인

모든 테이블에 RLS가 활성화되어 있는지 확인:
- users
- diary
- follows
- comments
- likes

## 8. 테스트

1. 개발 서버 실행: `npm run dev`
2. 회원가입/로그인 테스트
3. 꿈 일기 작성 테스트
4. AI 해몽/소설 생성 테스트
5. 소셜 기능 테스트

## 문제 해결

### Edge Function 오류
- 환경 변수가 올바르게 설정되었는지 확인
- OpenAI API 키가 유효한지 확인

### 데이터베이스 오류
- RLS 정책이 올바르게 설정되었는지 확인
- 테이블 구조가 스키마와 일치하는지 확인

### 인증 오류
- Site URL과 Redirect URLs 설정 확인
- 이메일 인증이 활성화되었는지 확인 