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