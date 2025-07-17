# DreamInside 🌙

꿈을 기록하고 AI와 함께 해석해보는 감성적인 플랫폼입니다.

## 📝 프로젝트 개요

DreamInside는 사용자가 꿈 일기를 작성하고, AI가 이를 바탕으로 해몽과 소설을 생성해주는 웹 애플리케이션입니다. 소셜 기능을 통해 다른 사용자들과 꿈을 공유하고 소통할 수 있습니다.

### 주요 기능

- **꿈 일기 작성**: 제목과 내용을 포함한 꿈 일기 작성
- **AI 해몽/소설 생성**: GPT 기반 AI가 꿈을 해석하고 소설로 창작
- **소셜 기능**: 팔로우/언팔로우, 좋아요, 댓글
- **공개/비공개 설정**: 꿈 일기의 공개 범위 설정
- **검색 및 필터링**: 꿈 일기 검색 및 정렬 기능

## 🛠 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: OpenAI GPT API (해몽/소설 생성)

## 🚀 시작하기

### 필수 요구사항

- Node.js 18+ 
- Supabase 계정
- OpenAI API 키

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone <repository-url>
   cd dreaminside
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   
   `.env.local` 파일을 생성하고 다음 변수들을 설정하세요:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **데이터베이스 설정**
   
   Supabase에서 `database_schema.sql` 파일의 내용을 실행하여 테이블을 생성하세요.

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

6. **브라우저에서 확인**
   
   [http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인하세요.

## 📊 데이터베이스 구조

### 주요 테이블

- **users**: 사용자 정보 (닉네임, 이메일)
- **diary**: 꿈 일기 (제목, 내용, AI 해석 결과)
- **follows**: 팔로우 관계
- **likes**: 좋아요 정보
- **comments**: 댓글 정보

### RLS (Row Level Security)

모든 테이블에 RLS가 적용되어 데이터 보안을 보장합니다.

## 🎨 UI/UX 특징

- **파스텔 톤**: 차분하고 감성적인 색상 팔레트
- **반응형 디자인**: 모바일과 데스크톱 모두 지원
- **3단 레이아웃**: 내 일기, 팔로잉, 전체 일기 목록
- **모달 기반 상호작용**: 일기 작성 및 상세 보기

## 🔧 주요 기능 설명

### 1. 꿈 일기 작성
- 제목 필수 입력
- 공개/비공개 선택 가능
- 최초 등록 시 AI 해몽/소설 자동 생성

### 2. 일기 상세 페이지
- 원문/해몽/소설 탭 전환
- 좋아요, 댓글, 공유 기능
- 작성자 정보 및 팔로우 버튼

### 3. 소셜 기능
- 팔로우/언팔로우
- 좋아요/댓글
- 검색 및 필터링

## 🚀 배포

### Vercel 배포

1. **Vercel CLI 설치**
   ```bash
   npm i -g vercel
   ```

2. **배포**
   ```bash
   vercel
   ```

3. **환경 변수 설정**
   
   Vercel 대시보드에서 환경 변수를 설정하세요.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**DreamInside** - 꿈을 기록하고 AI와 함께 해석해보세요 🌙✨
