# 프로덕션 배포 가이드

## Vercel 배포

### 1. Vercel CLI 설치
```bash
npm install -g vercel
```

### 2. 프로젝트 배포
```bash
vercel
```

### 3. 환경 변수 설정
Vercel Dashboard에서 다음 환경 변수를 설정하세요:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

### 4. 도메인 설정
1. Vercel Dashboard에서 프로젝트 선택
2. Settings > Domains에서 커스텀 도메인 추가
3. Supabase Authentication 설정에서 Redirect URLs 업데이트

## Supabase 프로덕션 설정

### 1. 프로덕션 환경 변수
Supabase Dashboard에서 Edge Functions의 환경 변수를 프로덕션 값으로 업데이트:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. 인증 설정 업데이트
1. Authentication > Settings
2. Site URL을 프로덕션 도메인으로 변경
3. Redirect URLs에 프로덕션 URL 추가

### 3. RLS 정책 확인
모든 테이블의 RLS 정책이 프로덕션 환경에서 올바르게 작동하는지 확인

## 성능 최적화

### 1. 이미지 최적화
- Next.js Image 컴포넌트 사용
- WebP 포맷 사용

### 2. 번들 최적화
```bash
npm run build
```
빌드 결과를 확인하고 번들 크기 최적화

### 3. 캐싱 설정
- Vercel에서 자동 캐싱 활용
- Supabase 쿼리 최적화

## 모니터링

### 1. Vercel Analytics
- Vercel Dashboard에서 Analytics 활성화
- 사용자 행동 분석

### 2. Supabase 모니터링
- Database > Logs에서 쿼리 성능 확인
- Edge Functions 로그 확인

### 3. 에러 추적
- Sentry 또는 Vercel Analytics 활용
- 사용자 피드백 수집

## 보안 체크리스트

- [ ] 환경 변수가 올바르게 설정됨
- [ ] RLS 정책이 모든 테이블에 적용됨
- [ ] API 키가 안전하게 관리됨
- [ ] HTTPS가 활성화됨
- [ ] CORS 설정이 올바름
- [ ] 인증 토큰이 안전하게 처리됨

## 백업 및 복구

### 1. 데이터베이스 백업
```bash
# Supabase CLI를 사용한 백업
supabase db dump --db-url your_database_url > backup.sql
```

### 2. 환경 변수 백업
- 모든 환경 변수를 안전한 곳에 백업
- 팀원들과 공유 가능한 방법 사용

### 3. 코드 백업
- GitHub 등 버전 관리 시스템 활용
- 정기적인 커밋과 태그 생성

## 문제 해결

### 배포 실패
1. 빌드 로그 확인
2. 환경 변수 설정 확인
3. 의존성 문제 확인

### 런타임 오류
1. Vercel Function 로그 확인
2. Supabase 로그 확인
3. 브라우저 콘솔 확인

### 성능 문제
1. 번들 크기 분석
2. 데이터베이스 쿼리 최적화
3. 캐싱 전략 검토 