# 일기 분석 Edge Function

일기 내용을 ChatGPT로 분석하는 간단한 함수입니다.

## 배포

```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인 및 프로젝트 연결
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# 환경 변수 설정 (Supabase Dashboard에서)
# OPENAI_API_KEY = your-chatgpt-api-key

# 함수 배포
supabase functions deploy daily-analyze
```

## 사용법

```javascript
// 일기 내용 분석
const result = await analyzeDiary("오늘 친구와 만나서 정말 즐거웠다!")

// 결과: "이 일기는 긍정적인 감정을 담고 있습니다. 친구와의 만남이 즐거웠다는 내용으로 기쁨과 만족감이 느껴집니다..."
```

## API 호출

```javascript
const { data, error } = await supabase.functions.invoke('daily-analyze', {
  body: { content: "일기 내용" }
})
``` 