# 감정일기 (Emotion Diary)

한국어 감정일기 웹 애플리케이션입니다. 사용자들이 자신의 감정을 기록하고, 다른 사람들과 공유할 수 있는 플랫폼입니다.

## 주요 기능

### 🎨 새로운 레이아웃
- **왼쪽 (빨간색 영역)**: 개인 일기 작성 및 관리
- **오른쪽 (파란색 영역)**: 다른 사람들의 공개 일기 보기

### ✍️ 일기 작성
- 감정을 이모지나 텍스트로 표현
- 자유로운 텍스트로 감정 내용 작성
- **공개/비공개 설정**: 일기 작성 시 다른 사람들과 공유할지 선택 가능

### 🗑️ 일기 관리
- **일기 삭제**: 작성한 일기를 언제든지 삭제 가능
- **공개/비공개 토글**: 기존 일기의 공개 여부를 실시간으로 변경 가능
- **확인 대화상자**: 삭제 시 확인 대화상자로 실수 방지

### 👥 공개 일기 보기
- 다른 사용자들이 공개한 일기들을 실시간으로 확인
- **자신의 일기는 제외**: 로그인한 사용자의 일기는 공개 일기 목록에 표시되지 않음
- 익명으로 표시되어 개인정보 보호
- 최신 순으로 정렬되어 표시

### ❤️ 공감 기능
- **공감 버튼**: 다른 사람들의 공개 일기에 공감을 표현
- **하트 이모지**: 좋아요 상태에 따라 빨간 하트(❤️) 또는 흰 하트(🤍) 표시
- **공감 수 표시**: 각 일기마다 받은 공감의 수를 실시간으로 표시
- **토글 기능**: 이미 공감한 일기는 다시 클릭하면 공감 취소 가능

### 🔐 보안 기능
- Supabase 인증 시스템으로 안전한 로그인
- Row Level Security (RLS)로 데이터 보호
- 사용자는 자신의 일기만 수정/삭제 가능
- 공개 일기에만 공감 가능

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel

## 설치 및 실행

1. 저장소 클론
```bash
git clone <repository-url>
cd gol
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. 데이터베이스 설정
Supabase에서 `database_schema.sql` 파일의 내용을 실행하여 테이블과 정책을 설정합니다.

5. 개발 서버 실행
```bash
npm run dev
```

## 데이터베이스 스키마

### diary 테이블
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `emotion`: TEXT (감정 표현)
- `content`: TEXT (일기 내용)
- `created_at`: TIMESTAMP (생성 시간)
- `is_public`: BOOLEAN (공개 여부, 기본값: false)

### diary_likes 테이블
- `id`: UUID (Primary Key)
- `diary_id`: UUID (Foreign Key to diary)
- `user_id`: UUID (Foreign Key to auth.users)
- `created_at`: TIMESTAMP (생성 시간)
- UNIQUE(diary_id, user_id) - 중복 좋아요 방지

## 보안 정책

- 사용자는 자신의 일기만 읽기/쓰기/수정/삭제 가능
- 공개 일기는 모든 사용자가 읽기 가능
- 비공개 일기는 작성자만 읽기 가능
- 공개된 일기에만 공감 가능
- 사용자는 자신이 공감한 것만 취소 가능

## 라이센스

MIT License
