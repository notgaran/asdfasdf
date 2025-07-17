"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Login from "./login";
import type { Session } from '@supabase/supabase-js';
import { 
  getDiaries, 
  createDiary, 
  deleteDiary, 
  getPublicDiaries, 
  likeDiary, 
  getDiaryLikes,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  isFollowing,
  getUser,
  searchDiaries,
  getComments,
  createComment,
  deleteComment,
  type Diary,
  type User,
  generateAIInterpretation,
  incrementViews,
  getDiaryById,
  updateDiary
} from './diary-api';
import { Heart, Eye, MessageCircle, Search, Plus, Edit, Trash, UserPlus, UserMinus, Share2 } from 'lucide-react';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [publicDiaries, setPublicDiaries] = useState<Diary[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'latest' | 'likes' | 'views' | 'comments'>('latest');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'interpretation' | 'story'>('original');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDiary, setEditDiary] = useState<Diary | null>(null);

  // 로그인 상태 관리
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!data.user) {
        setSession(null);
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        setSession(sessionData.session);
      }
    };
    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 사용자 정보 로드
  useEffect(() => {
    if (!session) return;
    const loadUser = async () => {
      const userData = await getUser({ user_id: session.user.id });
      setUser(userData);
    };
    loadUser();
  }, [session]);

  // 개인 일기 목록 불러오기
  useEffect(() => {
    if (!session) return;
    const fetchDiaries = async () => {
      setLoading(true);
      setError("");
      try {
        const diaries = await getDiaries({ user_id: session.user.id });
        setDiaries(diaries);
      } catch (error) {
        setError("일기를 불러오는 중 오류가 발생했습니다.");
      }
      setLoading(false);
    };
    fetchDiaries();
  }, [session]);

  // 공개 일기 목록 불러오기
  useEffect(() => {
    if (!session) return;
    const fetchPublicDiaries = async () => {
      try {
        const diaries = await getPublicDiaries({ user_id: session.user.id, filter });
        setPublicDiaries(diaries);
      } catch (error) {
        setPublicDiaries([]);
      }
    };
    fetchPublicDiaries();
  }, [session, filter]);

  // 팔로워/팔로잉 목록 불러오기
  useEffect(() => {
    if (!session) return;
    const loadFollowData = async () => {
      try {
        const [followersData, followingData] = await Promise.all([
          getFollowers({ user_id: session.user.id }),
          getFollowing({ user_id: session.user.id })
        ]);
        setFollowers(followersData);
        setFollowing(followingData);
      } catch (error) {
        console.error('팔로우 데이터 로드 오류:', error);
      }
    };
    loadFollowData();
  }, [session]);

  // 검색 처리
  const handleSearch = async () => {
    if (!searchQuery.trim() || !session) return;
    try {
      const results = await searchDiaries({ query: searchQuery, user_id: session.user.id });
      setPublicDiaries(results);
    } catch (error) {
      setError("검색 중 오류가 발생했습니다.");
    }
  };

  // 팔로우/언팔로우 처리
  const handleFollow = async (targetUserId: string, isFollowing: boolean) => {
    if (!session) return;
    try {
      if (isFollowing) {
        await unfollowUser({ follower_id: session.user.id, following_id: targetUserId });
      } else {
        await followUser({ follower_id: session.user.id, following_id: targetUserId });
      }
      // 팔로잉 목록 새로고침
      const followingData = await getFollowing({ user_id: session.user.id });
      setFollowing(followingData);
    } catch (error) {
      setError("팔로우 처리 중 오류가 발생했습니다.");
    }
  };

  // 좋아요 처리
  const handleLike = async (diaryId: string, isLiked: boolean) => {
    if (!session) return;
    try {
      await likeDiary({ diary_id: diaryId, user_id: session.user.id, like: !isLiked });
      // 공개 일기 목록 새로고침
      const diaries = await getPublicDiaries({ user_id: session.user.id, filter });
      setPublicDiaries(diaries);
    } catch (error) {
      setError("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  // 일기 삭제
  const handleDelete = async (diaryId: string) => {
    if (!confirm("정말로 이 일기를 삭제하시겠습니까?")) return;
    try {
      await deleteDiary({ diary_id: diaryId, user_id: session?.user.id! });
      setDiaries(prev => prev.filter(diary => diary.id !== diaryId));
      // 전체 일기 새로고침
      if (session) {
        const diaries = await getPublicDiaries({ user_id: session.user.id, filter });
        setPublicDiaries(diaries);
      }
    } catch (error) {
      setError("일기 삭제 중 오류가 발생했습니다.");
    }
  };

  if (!session) return <Login />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 text-gray-800">
      <div className="max-w-7xl mx-auto p-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-purple-600">DreamInside</h1>
              <p className="text-gray-600">꿈을 기록하고 AI와 함께 해석해보세요</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="font-semibold text-gray-800">{user?.nickname || '사용자'}</div>
                <div className="text-sm text-gray-500">{user?.email}</div>
                <div className="text-xs text-gray-400">
                  팔로잉 {following.length} • 팔로워 {followers.length}
                </div>
              </div>
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                onClick={() => setShowWriteModal(true)}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                꿈 기록하기
              </button>
              <button
                className="text-gray-500 hover:text-gray-700 transition-colors"
                onClick={async () => { await supabase.auth.signOut(); }}
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>

        {/* 3단 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 내 일기 목록 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">내 꿈 일기</h2>
            {loading ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            ) : diaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                아직 기록된 꿈이 없습니다.
                <br />
                <button 
                  className="text-purple-600 hover:text-purple-700 mt-2"
                  onClick={() => setShowWriteModal(true)}
                >
                  첫 꿈을 기록해보세요
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {diaries.map((diary) => (
                  <div key={diary.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800 truncate">{diary.title}</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          className="text-gray-400 hover:text-purple-600 transition-colors"
                          onClick={() => {
                            setSelectedDiary(diary);
                            setShowDiaryModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {diary.user?.id === user?.id && (
                          <button
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                            onClick={() => {
                              setEditDiary(diary);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          onClick={() => handleDelete(diary.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{new Date(diary.created_at).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        diary.is_public 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {diary.is_public ? '공개' : '비공개'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 중앙: 팔로워 목록 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">팔로잉</h2>
            {following.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                아직 팔로우한 사용자가 없습니다.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {following.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">
                          {user.nickname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{user.nickname}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <button
                      className="text-red-600 hover:text-red-700 transition-colors"
                      onClick={() => handleFollow(user.id, true)}
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 오른쪽: 전체 일기 목록 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">전체 꿈 일기</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                >
                  <option value="latest">최신순</option>
                  <option value="likes">좋아요순</option>
                  <option value="views">조회순</option>
                  <option value="comments">댓글순</option>
                </select>
              </div>
            </div>

            {/* 검색 */}
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="꿈 일기 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {publicDiaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                공개된 꿈 일기가 없습니다.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {publicDiaries.map((diary) => (
                  <div key={diary.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                       onClick={() => {
                         setSelectedDiary(diary);
                         setShowDiaryModal(true);
                       }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold text-sm">
                            {diary.user?.nickname?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">{diary.user?.nickname}</span>
                        {diary.user?.id !== user?.id && (
                          <button
                            className="ml-1 px-2 py-1 text-xs border border-purple-200 rounded text-purple-600 hover:text-purple-800 hover:bg-purple-50 transition-colors"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const isAlreadyFollowing = following.some(f => f.id === diary.user?.id);
                              await handleFollow(diary.user!.id, isAlreadyFollowing);
                              const followingData = await getFollowing({ user_id: session.user.id });
                              setFollowing(followingData);
                            }}
                          >
                            {following.some(f => f.id === diary.user?.id) ? "언팔로우" : "팔로우"}
                          </button>
                        )}
                      </div>
                      <button className="text-gray-400 hover:text-purple-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-medium text-gray-800 mb-2">{diary.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{diary.views}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{diary.likes_count}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{diary.comments_count}</span>
                        </span>
                      </div>
                      <span>{new Date(diary.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 일기 작성 모달 */}
        {showWriteModal && (
          <WriteDiaryModal 
            onClose={() => setShowWriteModal(false)}
            onSuccess={async (newDiary) => {
              setDiaries(prev => [newDiary, ...prev]);
              if (session) {
                const diaries = await getPublicDiaries({ user_id: session.user.id, filter });
                setPublicDiaries(diaries);
              }
              setShowWriteModal(false);
            }}
            session={session}
          />
        )}

        {/* 일기 수정 모달 */}
        {showEditModal && editDiary && (
          <EditDiaryModal
            diary={editDiary}
            onClose={() => {
              setShowEditModal(false);
              setEditDiary(null);
            }}
            onSuccess={async (updatedDiary: Diary) => {
              setDiaries(prev => prev.map(diary => diary.id === updatedDiary.id ? updatedDiary : diary));
              if (session) {
                const diaries = await getPublicDiaries({ user_id: session.user.id, filter });
                setPublicDiaries(diaries);
              }
              setShowEditModal(false);
            }}
            session={session}
          />
        )}

        {/* 일기 상세 모달 */}
        {showDiaryModal && selectedDiary && (
          <DiaryDetailModal
            diary={selectedDiary}
            onClose={() => {
              setShowDiaryModal(false);
              setSelectedDiary(null);
            }}
            session={session}
            onLike={handleLike}
          />
        )}
      </div>
    </main>
  );
}

// 일기 작성 모달 컴포넌트
function WriteDiaryModal({ onClose, onSuccess, session }: {
  onClose: () => void;
  onSuccess: (diary: Diary) => void;
  session: Session;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    setLoading(true);
    setError("");
    try {
      const newDiary = await createDiary({
        user_id: session.user.id,
        title: title.trim(),
        content: content.trim(),
        is_public: isPublic,
      });
      
      // AI 해석 생성 시작
      setAiGenerating(true);
      try {
        await generateAIInterpretation({
          diary_id: newDiary.id,
          content: content.trim()
        });
      } catch (aiError) {
        console.error('AI 해석 생성 실패:', aiError);
      } finally {
        setAiGenerating(false);
      }
      
      onSuccess(newDiary);
    } catch (error: any) {
      setError(error.message || "일기 저장 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">꿈 일기 작성</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="꿈의 제목을 입력하세요"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              꿈 내용 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 resize-none"
              placeholder="꿈의 내용을 자세히 기록해보세요..."
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              공개로 설정 {isPublic && "(AI 해몽/소설 자동 생성)"}
            </label>
          </div>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          {aiGenerating && (
            <div className="text-purple-600 text-sm bg-purple-50 p-3 rounded-lg border border-purple-200">
              🤖 AI가 꿈을 해석하고 소설을 생성하고 있습니다...
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || aiGenerating}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? "저장 중..." : aiGenerating ? "AI 생성 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 일기 수정 모달 컴포넌트
function EditDiaryModal({ diary, onClose, onSuccess, session }: {
  diary: Diary;
  onClose: () => void;
  onSuccess: (updatedDiary: Diary) => void;
  session: Session;
}) {
  const [title, setTitle] = useState(diary.title);
  const [content, setContent] = useState(diary.content);
  const [isPublic, setIsPublic] = useState(diary.is_public);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    setError("");
    try {
      const updatedDiary = await updateDiary({
        diary_id: diary.id,
        user_id: session.user.id,
        title: title.trim(),
        content: content.trim(),
        is_public: isPublic,
      });
      // AI 해석 생성 (공개/비공개 상관없이)
      setAiGenerating(true);
      try {
        await generateAIInterpretation({
          diary_id: diary.id,
          content: content.trim()
        });
      } catch (aiError) {
        console.error('AI 해석 생성 실패:', aiError);
      } finally {
        setAiGenerating(false);
      }
      onSuccess(updatedDiary);
    } catch (error: any) {
      setError(error.message || "일기 수정 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">꿈 일기 수정</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">꿈 내용 *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 resize-none" required />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="isPublicEdit" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" />
            <label htmlFor="isPublicEdit" className="text-sm text-gray-700">공개로 설정</label>
          </div>
          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}
          {aiGenerating && <div className="text-purple-600 text-sm bg-purple-50 p-3 rounded-lg border border-purple-200">🤖 AI가 꿈을 해석하고 소설을 생성하고 있습니다...</div>}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">취소</button>
            <button type="submit" disabled={loading || aiGenerating} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">{loading ? "저장 중..." : aiGenerating ? "AI 생성 중..." : "저장"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 일기 상세 모달 컴포넌트
function DiaryDetailModal({ diary, onClose, session, onLike }: {
  diary: Diary;
  onClose: () => void;
  session: Session;
  onLike: (diaryId: string, isLiked: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<'original' | 'interpretation' | 'story'>('original');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(diary.likes_count);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // 댓글 로드
  useEffect(() => {
    const loadComments = async () => {
      setCommentsLoading(true);
      try {
        const commentsData = await getComments({ diary_id: diary.id });
        setComments(commentsData);
      } catch (error) {
        console.error('댓글 로드 실패:', error);
      }
      setCommentsLoading(false);
    };
    loadComments();
  }, [diary.id]);

  // 조회수 증가
  useEffect(() => {
    // 내 일기는 조회수 증가시키지 않음
    if (diary.user_id === session.user.id) return;
    
    // 조회한 일기 ID를 세션에 저장
    const viewedDiaries = sessionStorage.getItem('viewedDiaries') 
      ? JSON.parse(sessionStorage.getItem('viewedDiaries')!) 
      : [];

    // 이미 조회한 일기인지 확인
    if (viewedDiaries.includes(diary.id)) {
      return; // 이미 조회했으면 조회수 증가 안함
    }

    let isMounted = true;
    const updateViews = async () => {
      if (!isMounted) return;
      
      // 조회수 증가 후 세션에 저장
      await incrementViews({ diary_id: diary.id });
      viewedDiaries.push(diary.id);
      sessionStorage.setItem('viewedDiaries', JSON.stringify(viewedDiaries));
      
      const updated = await getDiaryById({ diary_id: diary.id });
      if (updated && isMounted) {
        setLikeCount(updated.likes_count);
      }
    };
    updateViews();
    
    return () => {
      isMounted = false;
    };
  }, [diary.id]);

  const handleLike = () => {
    onLike(diary.id, isLiked);
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setCommentLoading(true);
    try {
      const newCommentData = await createComment({
        diary_id: diary.id,
        user_id: session.user.id,
        content: newComment.trim()
      });
      setComments(prev => [...prev, newCommentData]);
      setNewComment("");
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    }
    setCommentLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment({ comment_id: commentId, user_id: session.user.id });
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold">
                {diary.user?.nickname?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-800">{diary.user?.nickname}</div>
              <div className="text-sm text-gray-500">{new Date(diary.created_at).toLocaleDateString()}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{diary.title}</h2>
        
        {/* 탭 */}
        <div className="flex border-b border-gray-200 mb-4">
          {[
            { key: 'original', label: '원문' },
            { key: 'interpretation', label: '해몽' },
            { key: 'story', label: '소설' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 font-medium ${
                activeTab === tab.key
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* 탭 내용 */}
        <div className="mb-6">
          {activeTab === 'original' && (
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{diary.content}</p>
            </div>
          )}
          {activeTab === 'interpretation' && (
            <div className="prose max-w-none">
              <p className="text-gray-700">
                {diary.ai_interpretation.dream_interpretation || "AI 해몽이 아직 생성되지 않았습니다."}
              </p>
            </div>
          )}
          {activeTab === 'story' && (
            <div className="prose max-w-none">
              <p className="text-gray-700">
                {diary.ai_interpretation.story || "AI 소설이 아직 생성되지 않았습니다."}
              </p>
            </div>
          )}
        </div>
        
        {/* 댓글 섹션 */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">댓글 ({comments.length})</h3>
          
          {/* 댓글 작성 */}
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                disabled={commentLoading}
              />
              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {commentLoading ? "작성 중..." : "작성"}
              </button>
            </div>
          </form>
          
          {/* 댓글 목록 */}
          {commentsLoading ? (
            <div className="text-center py-4 text-gray-500">댓글을 불러오는 중...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">아직 댓글이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-xs">
                          {comment.user?.nickname?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-sm text-gray-800">{comment.user?.nickname}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {comment.user_id === session.user.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 하단 액션 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>
            <div className="flex items-center space-x-2 text-gray-500">
              <Eye className="w-5 h-5" />
              <span>{diary.views}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <MessageCircle className="w-5 h-5" />
              <span>{diary.comments_count}</span>
            </div>
          </div>
          <button className="text-gray-500 hover:text-gray-700">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
