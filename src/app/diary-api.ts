import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types
export interface User {
  id: string;
  email: string;
  nickname: string;
  created_at: string;
  updated_at: string;
}

export interface Diary {
  id: string;
  user_id: string;
  title: string;
  content: string;
  date: string;
  is_public: boolean;
  emotion?: string;
  views: number;
  likes_count: number;
  comments_count: number;
  ai_interpretation: {
    dream_interpretation: string;
    story: string;
  };
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Comment {
  id: string;
  diary_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

// User 관련 함수들
export async function getUser({ user_id }: { user_id: string }): Promise<User | null> {
  const { data, error } = await supabase.functions.invoke('get-user', {
    body: { user_id }
  });
  
  if (error) {
    console.error('사용자 조회 오류:', error);
    return null;
  }
  return data?.user || null;
}

export async function updateUserProfile({ user_id, nickname }: { user_id: string, nickname: string }): Promise<User | null> {
  const { data, error } = await supabase.functions.invoke('update-user-profile', {
    body: { user_id, nickname }
  });
  
  if (error) throw error;
  return data?.user || null;
}

// Follow 관련 함수들
export async function followUser({ follower_id, following_id }: { follower_id: string, following_id: string }): Promise<boolean> {
  const { error } = await supabase.functions.invoke('follow-user', {
    body: { follower_id, following_id }
  });
  
  if (error) throw error;
  return true;
}

export async function unfollowUser({ follower_id, following_id }: { follower_id: string, following_id: string }): Promise<boolean> {
  const { error } = await supabase.functions.invoke('unfollow-user', {
    body: { follower_id, following_id }
  });
  
  if (error) throw error;
  return true;
}

export async function getFollowers({ user_id }: { user_id: string }): Promise<User[]> {
  const { data, error } = await supabase.functions.invoke('get-followers', {
    body: { user_id }
  });
  
  if (error) throw error;
  return data?.followers || [];
}

export async function getFollowing({ user_id }: { user_id: string }): Promise<User[]> {
  const { data, error } = await supabase.functions.invoke('get-following', {
    body: { user_id }
  });
  
  if (error) throw error;
  return data?.following || [];
}

export async function isFollowing({ follower_id, following_id }: { follower_id: string, following_id: string }): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('is-following', {
    body: { follower_id, following_id }
  });
  
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data?.is_following || false;
}

// Diary 관련 함수들
export async function getDiaries({ user_id }: { user_id: string }): Promise<Diary[]> {
  const { data, error } = await supabase.functions.invoke('get-diaries', {
    body: { user_id }
  });
  
  if (error) {
    console.error('일기 목록 호출 오류:', error);
    return [];
  }
  return data?.diaries || [];
}

export async function createDiary({ user_id, title, content, is_public, emotion }: { 
  user_id: string, 
  title: string, 
  content: string, 
  is_public: boolean,
  emotion?: string 
}): Promise<Diary> {
  const { data, error } = await supabase.functions.invoke('create-diary', {
    body: { user_id, title, content, is_public, emotion }
  });
  
  if (error) throw error;
  return data?.diary;
}

export async function updateDiary({ diary_id, user_id, title, content, is_public, emotion }: {
  diary_id: string,
  user_id: string,
  title: string,
  content: string,
  is_public: boolean,
  emotion?: string
}): Promise<Diary> {
  const { data, error } = await supabase.functions.invoke('update-diary', {
    body: { diary_id, user_id, title, content, is_public, emotion }
  });
  
  if (error) throw error;
  return data?.diary;
}

export async function deleteDiary({ diary_id, user_id }: { diary_id: string, user_id: string }): Promise<boolean> {
  const { error } = await supabase.functions.invoke('delete-diary', {
    body: { diary_id, user_id }
  });
  
  if (error) throw error;
  return true;
}

export async function getPublicDiaries({ user_id, filter = 'latest' }: { user_id: string, filter?: string }): Promise<Diary[]> {
  const { data, error } = await supabase.functions.invoke('get-public-diaries', {
    body: { user_id, filter }
  });
  
  if (error) throw error;
  return data?.diaries || [];
}

export async function getDiaryById({ diary_id }: { diary_id: string }): Promise<Diary | null> {
  const { data, error } = await supabase.functions.invoke('get-diary-by-id', {
    body: { diary_id }
  });
  
  if (error) {
    console.error('일기 조회 오류:', error);
    return null;
  }
  return data?.diary || null;
}

export async function incrementViews({ diary_id }: { diary_id: string }): Promise<void> {
  const { error } = await supabase.functions.invoke('increment-views', {
    body: { diary_id }
  });
  
  if (error) throw error;
}

// Like 관련 함수들
export async function likeDiary({ diary_id, user_id, like }: { diary_id: string, user_id: string, like: boolean }): Promise<boolean> {
  const { error } = await supabase.functions.invoke('like-diary', {
    body: { diary_id, user_id, like }
  });
  
  if (error) throw error;
  return true;
}

export async function getDiaryLikes({ diary_id, user_id }: { diary_id: string, user_id?: string }): Promise<{ like_count: number, is_liked: boolean }> {
  const { data, error } = await supabase.functions.invoke('get-diary-likes', {
    body: { diary_id, user_id }
  });
  
  if (error) throw error;
  return data;
}

// Comment 관련 함수들
export async function getComments({ diary_id }: { diary_id: string }): Promise<Comment[]> {
  const { data, error } = await supabase.functions.invoke('get-comments', {
    body: { diary_id }
  });
  
  if (error) throw error;
  return data?.comments || [];
}

export async function createComment({ diary_id, user_id, content }: { diary_id: string, user_id: string, content: string }): Promise<Comment> {
  const { data, error } = await supabase.functions.invoke('create-comment', {
    body: { diary_id, user_id, content }
  });
  
  if (error) throw error;
  return data?.comment;
}

export async function deleteComment({ comment_id, user_id }: { comment_id: string, user_id: string }): Promise<boolean> {
  const { error } = await supabase.functions.invoke('delete-comment', {
    body: { comment_id, user_id }
  });
  
  if (error) throw error;
  return true;
}

// AI 해몽/소설 생성 함수
export async function generateAIInterpretation({ diary_id, content }: { diary_id: string, content: string }): Promise<{ dream_interpretation: string, story: string }> {
  const { data, error } = await supabase.functions.invoke('generate-ai-interpretation', {
    body: { diary_id, content }
  });
  
  if (error) {
    console.error('AI 해석 생성 오류:', error);
    return { dream_interpretation: "AI 해석을 생성할 수 없습니다.", story: "AI 소설을 생성할 수 없습니다." };
  }
  
  return data?.result || { dream_interpretation: "", story: "" };
}

// 검색 함수
export async function searchDiaries({ query, user_id }: { query: string, user_id: string }): Promise<Diary[]> {
  const { data, error } = await supabase.functions.invoke('search-diaries', {
    body: { query, user_id }
  });
  
  if (error) throw error;
  return data?.diaries || [];
}