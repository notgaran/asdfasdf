import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 일기 감정분석 함수 (diary_id와 content를 모두 받아야 함)
export async function analyzeDiary(diary_id: string, content: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('daily-analyze', {
    body: { diary_id, content }
  });
  if (error) {
    console.error('분석 함수 호출 오류:', error);
    return '분석에 실패했습니다.';
  }
  return data?.result ?? '분석 결과가 없습니다.';
}

// 일기 목록을 Edge Function을 통해 가져오는 함수
export async function getDiaries({ user_id }: { user_id: string }): Promise<any[]> {
  const { data, error } = await supabase.functions.invoke('get-diaries', {
    body: { user_id }
  });
  if (error) {
    console.error('일기 목록 호출 오류:', error);
    return [];
  }
  return data?.diaries ?? [];
}

// 일기 작성
export async function createDiary({ user_id, emotion, content, is_public }: { user_id: string, emotion: string, content: string, is_public: boolean }) {
  const { data, error } = await supabase.functions.invoke('create-diary', {
    body: { user_id, emotion, content, is_public }
  });
  if (error) throw error;
  return data?.diary;
}

// 일기 삭제
export async function deleteDiary({ diary_id, user_id }: { diary_id: string, user_id: string }) {
  const { data, error } = await supabase.functions.invoke('delete-diary', {
    body: { diary_id, user_id }
  });
  if (error) throw error;
  return data?.success;
}

// 공개/비공개 토글
export async function toggleDiaryPrivacy({ diary_id, user_id, is_public }: { diary_id: string, user_id: string, is_public: boolean }) {
  const { data, error } = await supabase.functions.invoke('toggle-privacy', {
    body: { diary_id, user_id, is_public }
  });
  if (error) throw error;
  return data?.success;
}

// 좋아요 추가/삭제 (중복 insert unique 에러 무시)
export async function likeDiary({ diary_id, user_id, like }: { diary_id: string, user_id: string, like: boolean }) {
  try {
    const { data, error } = await supabase.functions.invoke('like-diary', {
      body: { diary_id, user_id, like }
    });
    // unique constraint 에러는 무시(성공 처리)
    if (error && !String(error.message).includes('duplicate key value')) {
      throw error;
    }
    return true;
  } catch (err: any) {
    if (String(err.message).includes('duplicate key value')) {
      return true;
    }
    throw err;
  }
}

// 공개 일기 목록
export async function getPublicDiaries({ user_id }: { user_id: string }) {
  const { data, error } = await supabase.functions.invoke('get-public-diaries', {
    body: { user_id }
  });
  if (error) throw error;
  return data?.diaries ?? [];
}

// 좋아요 개수/상태 조회 (get-diary-likes 엣지 펑션)
export async function getDiaryLikes({ diary_id, user_id }: { diary_id: string, user_id?: string }) {
  const { data, error } = await supabase.functions.invoke('get-diary-likes', {
    body: { diary_id, user_id }
  });
  if (error) throw error;
  return data;
}