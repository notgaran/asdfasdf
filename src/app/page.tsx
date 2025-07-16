"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Login from "./login";
import type { Session } from '@supabase/supabase-js';

interface Diary {
  id: string;
  emotion: string;
  content: string;
  created_at: string;
  is_public: boolean;
  like_count?: number;
  is_liked?: boolean;
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [emotion, setEmotion] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [publicDiaries, setPublicDiaries] = useState<Diary[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);

  // 로그인 상태 관리
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 개인 일기 목록 불러오기 (공감 수 포함)
  useEffect(() => {
    if (!session) return;
    const fetchDiaries = async () => {
      setLoading(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("diary")
          .select("id, emotion, content, created_at, is_public")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });
        
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        
        // 각 일기에 대해 좋아요 수를 별도로 가져오기
        const diariesWithLikes = await Promise.all(
          (data || []).map(async (diary) => {
            const { count: likeCount } = await supabase
              .from("diary_likes")
              .select("*", { count: "exact", head: true })
              .eq("diary_id", diary.id);
            
            return {
              ...diary,
              like_count: likeCount || 0
            };
          })
        );
        
        setDiaries(diariesWithLikes);
        
        // 총 공감 수 계산
        const total = diariesWithLikes.reduce((sum, diary) => sum + (diary.like_count || 0), 0);
        setTotalLikes(total);
        
      } catch (error) {
        console.error("Error fetching personal diaries:", error);
        setError("일기를 불러오는 중 오류가 발생했습니다.");
      }
      setLoading(false);
    };
    fetchDiaries();
  }, [session]);

  // 공개 일기 목록 불러오기 (좋아요 수와 사용자의 좋아요 여부 포함)
  useEffect(() => {
    const fetchPublicDiaries = async () => {
      try {
        // 먼저 공개 일기들을 가져오기 (자신의 일기 제외)
        let query = supabase
          .from("diary")
          .select("id, emotion, content, created_at, is_public")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .limit(20);
        
        // 로그인한 사용자의 경우 자신의 일기 제외
        if (session) {
          query = query.neq("user_id", session.user.id);
        }
        
        const { data: diaries, error: diariesError } = await query;
        
        if (diariesError) {
          console.error("Error fetching diaries:", diariesError);
          return;
        }
        
        if (!diaries || diaries.length === 0) {
          setPublicDiaries([]);
          return;
        }
        
        // 각 일기에 대해 좋아요 수를 별도로 가져오기
        const diariesWithLikes = await Promise.all(
          diaries.map(async (diary) => {
            // 좋아요 수 가져오기
            const { count: likeCount } = await supabase
              .from("diary_likes")
              .select("*", { count: "exact", head: true })
              .eq("diary_id", diary.id);
            
            // 로그인한 사용자의 좋아요 여부 확인
            let isLiked = false;
            if (session) {
              const { data: likeData } = await supabase
                .from("diary_likes")
                .select("id")
                .eq("diary_id", diary.id)
                .eq("user_id", session.user.id)
                .single();
              isLiked = !!likeData;
            }
            
            return {
              ...diary,
              like_count: likeCount || 0,
              is_liked: isLiked
            };
          })
        );
        
        setPublicDiaries(diariesWithLikes);
        
      } catch (error) {
        console.error("Error in fetchPublicDiaries:", error);
      }
    };
    fetchPublicDiaries();
  }, [session]);

  // 일기 작성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emotion || !content) return;
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.from("diary").insert({
        user_id: session?.user.id,
        emotion,
        content,
        is_public: isPublic,
      });
      if (error) setError(error.message);
      setEmotion("");
      setContent("");
      setIsPublic(false);
      
      // 새로고침
      const { data } = await supabase
        .from("diary")
        .select("id, emotion, content, created_at, is_public")
        .eq("user_id", session?.user.id)
        .order("created_at", { ascending: false });
      
      // 각 일기에 대해 좋아요 수를 별도로 가져오기
      const diariesWithLikes = await Promise.all(
        (data || []).map(async (diary) => {
          const { count: likeCount } = await supabase
            .from("diary_likes")
            .select("*", { count: "exact", head: true })
            .eq("diary_id", diary.id);
          
          return {
            ...diary,
            like_count: likeCount || 0
          };
        })
      );
      
      setDiaries(diariesWithLikes);
      
      // 총 공감 수 업데이트
      const total = diariesWithLikes.reduce((sum, diary) => sum + (diary.like_count || 0), 0);
      setTotalLikes(total);
      
    } catch (error) {
      console.error("Error submitting diary:", error);
      setError("일기 저장 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  // 일기 삭제
  const handleDelete = async (diaryId: string) => {
    if (!confirm("정말로 이 일기를 삭제하시겠습니까?")) return;
    
    try {
      const { error } = await supabase
        .from("diary")
        .delete()
        .eq("id", diaryId)
        .eq("user_id", session?.user.id);
      
      if (error) {
        setError("일기 삭제 중 오류가 발생했습니다.");
        return;
      }
      
      // 목록에서 삭제된 일기 제거
      setDiaries(prev => prev.filter(diary => diary.id !== diaryId));
      
      // 총 공감 수 재계산
      const updatedDiaries = diaries.filter(diary => diary.id !== diaryId);
      const total = updatedDiaries.reduce((sum, diary) => sum + (diary.like_count || 0), 0);
      setTotalLikes(total);
      
    } catch (error) {
      console.error("Error deleting diary:", error);
      setError("일기 삭제 중 오류가 발생했습니다.");
    }
  };

  // 공개/비공개 토글
  const handleTogglePrivacy = async (diaryId: string, currentPrivacy: boolean) => {
    try {
      const { error } = await supabase
        .from("diary")
        .update({ is_public: !currentPrivacy })
        .eq("id", diaryId)
        .eq("user_id", session?.user.id);
      
      if (error) {
        setError("공개 설정 변경 중 오류가 발생했습니다.");
        return;
      }
      
      // 목록에서 해당 일기 업데이트
      setDiaries(prev => prev.map(diary => 
        diary.id === diaryId 
          ? { ...diary, is_public: !currentPrivacy }
          : diary
      ));
      
    } catch (error) {
      console.error("Error toggling privacy:", error);
      setError("공개 설정 변경 중 오류가 발생했습니다.");
    }
  };

  // 공감 버튼 클릭 처리
  const handleLike = async (diaryId: string, isLiked: boolean) => {
    if (!session) return;
    
    if (isLiked) {
      // 좋아요 취소
      const { error } = await supabase
        .from("diary_likes")
        .delete()
        .eq("diary_id", diaryId)
        .eq("user_id", session.user.id);
      
      if (!error) {
        setPublicDiaries(prev => prev.map(diary => 
          diary.id === diaryId 
            ? { ...diary, is_liked: false, like_count: (diary.like_count || 0) - 1 }
            : diary
        ));
      }
    } else {
      // 좋아요 추가
      const { error } = await supabase
        .from("diary_likes")
        .insert({
          diary_id: diaryId,
          user_id: session.user.id
        });
      
      if (!error) {
        setPublicDiaries(prev => prev.map(diary => 
          diary.id === diaryId 
            ? { ...diary, is_liked: true, like_count: (diary.like_count || 0) + 1 }
            : diary
        ));
      }
    }
  };

  if (!session) return <Login />;

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">감정일기</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽: 개인 일기 작성 및 관리 */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-white">내 일기 작성</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-gray-200">오늘의 감정</label>
                <input
                  type="text"
                  placeholder="😊 😢 😡 등 이모지 또는 텍스트"
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 font-medium text-gray-200">내용</label>
                <textarea
                  placeholder="오늘의 감정을 자유롭게 적어보세요."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-200">
                  다른 사람들과 공유하기
                </label>
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {loading ? "저장 중..." : "일기 저장"}
              </button>
            </form>

            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">내 감정일기</h3>
                <div className="text-sm text-gray-300">
                  총 받은 공감: <span className="font-semibold text-red-400">❤️ {totalLikes}</span>
                </div>
              </div>
              {loading && <div className="text-gray-400">불러오는 중...</div>}
              {diaries.length === 0 && !loading && (
                <div className="text-gray-400">작성한 일기가 없습니다.</div>
              )}
              <div className="space-y-3">
                {diaries.map((d) => (
                  <div key={d.id} className="bg-gray-700 p-3 rounded border border-gray-600">
                    <div className="text-2xl mb-1">{d.emotion}</div>
                    <div className="mb-2 whitespace-pre-line text-sm text-gray-200">{d.content}</div>
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span>{new Date(d.created_at).toLocaleString()}</span>
                        <button
                          onClick={() => handleTogglePrivacy(d.id, d.is_public)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            d.is_public 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                          }`}
                        >
                          {d.is_public ? '공개' : '비공개'}
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        {d.is_public && (
                          <div className="flex items-center space-x-1 text-red-400">
                            <span>❤️</span>
                            <span className="font-medium">{d.like_count || 0}</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-900/20"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 다른 사람들의 공개 일기 */}
          <div className="bg-gray-800 rounded-lg shadow-md p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-white">다른 사람들의 일기</h2>
            {publicDiaries.length === 0 ? (
              <div className="text-gray-400">아직 공개된 일기가 없습니다.</div>
            ) : (
              <div className="space-y-4">
                {publicDiaries.map((d) => (
                  <div key={d.id} className="bg-blue-900/30 p-4 rounded border-l-4 border-blue-500 border border-gray-600">
                    <div className="text-2xl mb-2">{d.emotion}</div>
                    <div className="mb-3 whitespace-pre-line text-gray-200">{d.content}</div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-400">
                        <div>{new Date(d.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleLike(d.id, d.is_liked || false)}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                            d.is_liked 
                              ? 'bg-red-600 text-white hover:bg-red-700' 
                              : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                          }`}
                          disabled={!session}
                        >
                          <span className="text-lg">
                            {d.is_liked ? '❤️' : '🤍'}
                          </span>
                          <span>{d.like_count || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            className="text-sm text-gray-400 underline hover:text-gray-300"
            onClick={async () => {
              await supabase.auth.signOut();
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </main>
  );
}
