"use client";
import { useEffect, useState, useMemo, useRef } from "react";
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
import { Heart, Eye, MessageCircle, Search, Plus, Edit, Trash, UserMinus, Share2 } from 'lucide-react';
import { useRouter } from "next/navigation";
import type { Comment } from './diary-api';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [allPublicDiaries, setAllPublicDiaries] = useState<Diary[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'latest' | 'likes' | 'views' | 'comments' | 'following'>('latest');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<Diary | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'interpretation' | 'story'>('original');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDiary, setEditDiary] = useState<Diary | null>(null);
  const router = useRouter();
  const [likedDiaryIds, setLikedDiaryIds] = useState<string[]>([]);
  // 팔로잉 유저별 팔로워/팔로잉 수 상태
  const [followingStats, setFollowingStats] = useState<Record<string, { followers: number, following: number }>>({});

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

  // 공개 일기 전체를 한 번만 받아오기
  useEffect(() => {
    if (!session) return;
    const fetchAllPublicDiaries = async () => {
      try {
        const diaries = await getPublicDiaries({ user_id: session.user.id, filter: 'latest' });
        setAllPublicDiaries(diaries);
      } catch (error) {
        setAllPublicDiaries([]);
      }
    };
    fetchAllPublicDiaries();
  }, [session]);

  // publicDiaries는 useMemo로 필터/검색/정렬해서 보여줌
  const publicDiaries = useMemo(() => {
    let list = [...allPublicDiaries];
    if (filter === 'following') {
      const followingIds = following.map(f => f.id);
      list = list.filter(d => followingIds.includes(d.user_id));
    }
    if (searchQuery.trim()) {
      list = list.filter(d =>
        d.title.includes(searchQuery) || d.content.includes(searchQuery)
      );
    }
    // 정렬
    if (filter === 'latest' || filter === 'following') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (filter === 'likes') {
      list.sort((a, b) => b.likes_count - a.likes_count);
    } else if (filter === 'views') {
      list.sort((a, b) => b.views - a.views);
    } else if (filter === 'comments') {
      list.sort((a, b) => b.comments_count - a.comments_count);
    }
    // id+user_id 조합으로 중복 제거
    return Array.from(new Map(list.map(d => [d.id + '-' + d.user_id, d])).values());
  }, [allPublicDiaries, filter, following, searchQuery]);

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

  // 로그인 후 내가 좋아요 누른 게시글 id 목록 가져오기
  useEffect(() => {
    if (!session) return;
    const fetchLikedDiaries = async () => {
      // 전체 공개 일기 id만 추출
      const ids = allPublicDiaries.map(d => d.id);
      // 병렬로 getDiaryLikes 호출
      const results = await Promise.all(
        ids.map(id => getDiaryLikes({ diary_id: id, user_id: session.user.id }))
      );
      const likedIds = ids.filter((id, idx) => results[idx]?.is_liked);
      setLikedDiaryIds(likedIds);
    };
    if (allPublicDiaries.length > 0) fetchLikedDiaries();
  }, [session, allPublicDiaries]);

  // 팔로잉 유저별 팔로워/팔로잉 수 가져오기
  useEffect(() => {
    if (following.length === 0) return;
    const fetchStats = async () => {
      const stats: Record<string, { followers: number, following: number }> = {};
      await Promise.all(following.map(async (user) => {
        const [f1, f2] = await Promise.all([
          getFollowers({ user_id: user.id }),
          getFollowing({ user_id: user.id })
        ]);
        stats[user.id] = { followers: f1.length, following: f2.length };
      }));
      setFollowingStats(stats);
    };
    fetchStats();
  }, [following]);

  // 검색 처리 (이제 프론트에서만 처리)
  const handleSearch = () => {
    // 상태만 바꿔주면 publicDiaries가 자동 갱신됨
    setSearchQuery(searchQuery);
  };

  // 좋아요/삭제 등에서 allPublicDiaries 갱신 필요
  const refreshAllPublicDiaries = async () => {
    if (!session) return;
    try {
      const diaries = await getPublicDiaries({ user_id: session.user.id, filter: 'latest' });
      setAllPublicDiaries(diaries);
    } catch (error) {
      setAllPublicDiaries([]);
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

  // 좋아요 처리 (optimistic update)
  const handleLike = async (diaryId: string, isLiked: boolean) => {
    if (!session) return;
    // optimistic update
    setLikedDiaryIds(prev =>
      isLiked ? prev.filter(id => id !== diaryId) : [...prev, diaryId]
    );
    try {
      await likeDiary({ diary_id: diaryId, user_id: session.user.id, like: !isLiked });
      await refreshAllPublicDiaries();
    } catch (error) {
      // 롤백
      setLikedDiaryIds(prev =>
        isLiked ? [...prev, diaryId] : prev.filter(id => id !== diaryId)
      );
      setError("좋아요 처리 중 오류가 발생했습니다.");
    }
  };

  // 일기 삭제
  const handleDelete = async (diaryId: string) => {
    if (!confirm("정말로 이 일기를 삭제하시겠습니까?")) return;
    if (!session?.user?.id) return;
    try {
      await deleteDiary({ diary_id: diaryId, user_id: session.user.id });
      setDiaries(prev => prev.filter(diary => diary.id !== diaryId));
      await refreshAllPublicDiaries();
    } catch (error) {
      setError("일기 삭제 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (!session) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const diaryId = params.get('diary');
    if (diaryId && !showDiaryModal) {
      getDiaryById({ diary_id: diaryId }).then(diary => {
        if (diary) {
          setSelectedDiary(diary);
          setShowDiaryModal(true);
        }
      });
    }
    // eslint-disable-next-line
  }, [session]);

  if (!session) return <Login />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 text-gray-800">
      <div className="max-w-7xl mx-auto p-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-purple-600">DreamInside</h1>
              <p className="text-sm md:text-base text-gray-600">꿈을 기록하고 AI와 함께 해석해보세요</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-left sm:text-right">
                <div className="font-semibold text-gray-800">{user?.nickname || '사용자'}</div>
                <div className="text-xs sm:text-sm text-gray-500">{user?.email}</div>
                <div className="text-xs text-gray-400">
                  팔로워 {followers.length} • 팔로잉 {following.length}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  className="bg-purple-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm md:text-base"
                  onClick={() => setShowWriteModal(true)}
                >
                  <Plus className="w-4 h-4 inline mr-1 md:mr-2" />
                  <span className="hidden sm:inline">꿈 기록하기</span>
                  <span className="sm:hidden">기록</span>
                </button>
                <button
                  className="text-gray-500 hover:text-gray-700 transition-colors px-2 py-2 text-sm"
                  onClick={async () => { await supabase.auth.signOut(); }}
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3단 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* 왼쪽: 내 일기 목록 */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">내 꿈 일기</h2>
            {loading ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            ) : diaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm md:text-base">
                아직 기록된 꿈이 없습니다.
                <br />
                <button
                  className="text-purple-600 hover:text-purple-700 mt-2 text-sm md:text-base"
                  onClick={() => setShowWriteModal(true)}
                >
                  첫 꿈을 기록해보세요
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto">
                {diaries.map((diary) => (
                  <div key={diary.id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800 truncate text-sm md:text-base">{diary.title}</h3>
                      <div className="flex items-center space-x-1 md:space-x-2">
                        <button
                          className="text-gray-400 hover:text-purple-600 transition-colors p-1"
                          onClick={() => {
                            setSelectedDiary(diary);
                            setShowDiaryModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {diary.user?.id === user?.id && (
                          <button
                            className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                            onClick={() => {
                              setEditDiary(diary);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          onClick={() => handleDelete(diary.id)}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs md:text-sm text-gray-500 space-y-1 sm:space-y-0">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3 h-3 md:w-4 md:h-4" />
                          <span>{diary.views}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Heart className="w-3 h-3 md:w-4 md:h-4" />
                          <span>{diary.likes_count}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
                          <span>{diary.comments_count}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2">
                        <span>{new Date(diary.created_at).toLocaleDateString()}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${diary.is_public
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                          }`}>
                          {diary.is_public ? '공개' : '비공개'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 중앙: 팔로워 목록 */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">팔로잉</h2>
            {following.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm md:text-base">
                아직 팔로우한 사용자가 없습니다.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto">
                {/* 팔로잉 목록 렌더링 시 이름(닉네임) 오름차순 정렬 */}
                {[...following].sort((a, b) => a.nickname.localeCompare(b.nickname)).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm md:text-base">
                          {user.nickname.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 text-sm md:text-base">{user.nickname}</div>
                        <div className="text-xs text-gray-500">
                          팔로워 {followingStats[user.id]?.followers ?? '-'} • 팔로잉 {followingStats[user.id]?.following ?? '-'}
                        </div>
                      </div>
                    </div>
                    <button
                      className="text-red-600 hover:text-red-700 transition-colors p-1"
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
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">전체 꿈 일기</h2>
              <div className="flex items-center space-x-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-xs md:text-sm"
                >
                  <option value="latest">최신순</option>
                  <option value="likes">좋아요순</option>
                  <option value="views">조회순</option>
                  <option value="comments">댓글순</option>
                  <option value="following">팔로잉</option>
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
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-xs md:text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="bg-purple-600 text-white px-2 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {publicDiaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm md:text-base">
                공개된 꿈 일기가 없습니다.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] md:max-h-[400px] overflow-y-auto">
                {publicDiaries.map((diary) => (
                  <div key={diary.id + '-' + diary.user_id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedDiary(diary);
                      setShowDiaryModal(true);
                      router.push(`/?diary=${diary.id}`);
                    }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold text-xs md:text-sm">
                            {diary.user?.nickname?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800 text-sm md:text-base">{diary.user?.nickname}</span>
                        {diary.user?.id !== user?.id && (
                          <button
                            className="ml-1 px-1 py-1 text-xs border border-purple-200 rounded text-purple-600 hover:text-purple-800 hover:bg-purple-50 transition-colors"
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
                      <button
                        className="text-gray-400 hover:text-purple-600 transition-colors p-1"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const url = `${window.location.origin}?diary=${diary.id}`;
                          try {
                            await navigator.clipboard.writeText(url);
                            alert('링크가 복사되었습니다!');
                          } catch {
                            // fallback
                            const temp = document.createElement('input');
                            temp.value = url;
                            document.body.appendChild(temp);
                            temp.select();
                            document.execCommand('copy');
                            document.body.removeChild(temp);
                            alert('링크가 복사되었습니다!');
                          }
                        }}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-medium text-gray-800 mb-2 text-sm md:text-base">{diary.title}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs md:text-sm text-gray-500 space-y-1 sm:space-y-0">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-3 h-3 md:w-4 md:h-4" />
                          <span>{diary.views}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleLike(diary.id, likedDiaryIds.includes(diary.id));
                            }}
                            className={`focus:outline-none ${likedDiaryIds.includes(diary.id) ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                          >
                            <Heart className={`w-3 h-3 md:w-4 md:h-4 ${likedDiaryIds.includes(diary.id) ? 'fill-current' : ''}`} />
                          </button>
                          <span>{diary.likes_count}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
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
              await refreshAllPublicDiaries();
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
              await refreshAllPublicDiaries();
              setShowEditModal(false);
              setEditDiary(null);
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
              router.push("/"); // 모달 닫을 때 홈으로 URL 복원
            }}
            session={session}
            onLike={handleLike}
            likedDiaryIds={likedDiaryIds}
            setLikedDiaryIds={setLikedDiaryIds}
            following={following}
            handleFollow={handleFollow}
            setFollowing={setFollowing}
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
    <div className="fixed inset-0 bg-black bg-opacity-30 modal-backdrop flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">꿈 일기 작성</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 md:h-32 resize-none text-sm md:text-base"
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
              공개로 설정
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

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || aiGenerating}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm md:text-base"
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
      // 글 내용이 바뀐 경우에만 AI 해석 생성
      if (content.trim() !== diary.content) {
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
      }
      onSuccess(updatedDiary);
    } catch (error: any) {
      setError(error.message || "일기 수정 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 modal-backdrop flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800">꿈 일기 수정</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">꿈 내용 *</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 md:h-32 resize-none text-sm md:text-base" required />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="isPublicEdit" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" />
            <label htmlFor="isPublicEdit" className="text-sm text-gray-700">공개로 설정</label>
          </div>
          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}
          {aiGenerating && <div className="text-purple-600 text-sm bg-purple-50 p-3 rounded-lg border border-purple-200">🤖 AI가 꿈을 해석하고 소설을 생성하고 있습니다...</div>}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm md:text-base">취소</button>
            <button type="submit" disabled={loading || aiGenerating} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm md:text-base">{loading ? "저장 중..." : aiGenerating ? "AI 생성 중..." : "저장"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 일기 상세 모달 컴포넌트
function DiaryDetailModal({ diary, onClose, session, onLike, likedDiaryIds, setLikedDiaryIds, following, handleFollow, setFollowing }: {
  diary: Diary;
  onClose: () => void;
  session: Session;
  onLike: (diaryId: string, isLiked: boolean) => void;
  likedDiaryIds: string[];
  setLikedDiaryIds: React.Dispatch<React.SetStateAction<string[]>>;
  following: User[];
  handleFollow: (targetUserId: string, isFollowing: boolean) => Promise<void>;
  setFollowing: React.Dispatch<React.SetStateAction<User[]>>;
}) {
  const [activeTab, setActiveTab] = useState<'original' | 'interpretation' | 'story'>('original');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(diary.likes_count);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const hasIncremented = useRef(false);
  const [diaryData, setDiaryData] = useState(diary);

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
    if (diary.user_id === session.user.id) return;
    hasIncremented.current = false; // 모달 열릴 때마다 리셋

    const timer = setTimeout(() => {
      if (!hasIncremented.current) {
        hasIncremented.current = true;
        incrementViews({ diary_id: diary.id }).then(() => {
          getDiaryById({ diary_id: diary.id }).then(updated => {
            if (updated) setLikeCount(updated.likes_count);
          });
        });
      }
    }, 0);

    return () => {
      clearTimeout(timer);
      hasIncremented.current = false;
    };
  }, [diary.id, diary.user_id, session.user.id]);

  // 좋아요 상태 서버에서 받아오기
  useEffect(() => {
    let mounted = true;
    getDiaryLikes({ diary_id: diary.id, user_id: session.user.id }).then(res => {
      if (mounted) {
        setIsLiked(res.is_liked);
        setLikeCount(res.like_count);
      }
    });
    return () => { mounted = false; };
  }, [diary.id, session.user.id]);

  // 기존 diary 대신 diaryData로 렌더링
  useEffect(() => { setDiaryData(diary); }, [diary]);

  // AI 해몽/소설 polling
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    // 해몽/소설 탭이고, 아직 생성 안됐으면 polling 시작
    if ((activeTab === 'interpretation' && !diaryData.ai_interpretation.dream_interpretation) ||
        (activeTab === 'story' && !diaryData.ai_interpretation.story)) {
      interval = setInterval(async () => {
        const updated = await getDiaryById({ diary_id: diaryData.id });
        if (updated) {
          setDiaryData(updated);
          // 생성 완료되면 polling 중단
          if ((activeTab === 'interpretation' && updated.ai_interpretation.dream_interpretation) ||
              (activeTab === 'story' && updated.ai_interpretation.story)) {
            if (interval) clearInterval(interval);
          }
        }
      }, 2000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [activeTab, diaryData]);

  const handleLike = () => {
    onLike(diary.id, isLiked);
    setIsLiked(!isLiked);
    // diaryData.likes_count도 즉시 반영
    setDiaryData(prev => ({
      ...prev,
      likes_count: prev.likes_count + (isLiked ? -1 : 1)
    }));
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
    <div className="fixed inset-0 bg-black bg-opacity-30 modal-backdrop flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold text-sm md:text-base">
                {diary.user?.nickname?.charAt(0).toUpperCase()}
              </span>
            </div>

            <div>
              <div className="font-medium text-gray-800 flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0">
                <span className="text-sm md:text-base">{diary.user?.nickname}</span>
                {diary.user?.id !== session.user.id && (
                  <button
                    className="px-2 py-1 text-xs border border-purple-200 rounded text-purple-600 hover:text-purple-800 hover:bg-purple-50 transition-colors"
                    onClick={async () => {
                      const isAlreadyFollowing = following.some(f => f.id === diary.user?.id);
                      if (diary.user?.id) {
                        await handleFollow(diary.user.id, isAlreadyFollowing);
                        const followingData = await getFollowing({ user_id: session.user.id });
                        setFollowing(followingData);
                      }
                    }}
                  >
                    {following.some(f => f.id === diary.user?.id) ? "언팔로우" : "팔로우"}
                  </button>
                )}
              </div>
              <div className="text-xs md:text-sm text-gray-500">{new Date(diary.created_at).toLocaleDateString()}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
            ✕
          </button>
        </div>

        <h2 className="text-lg md:text-2xl font-bold text-gray-800 mb-4">{diaryData.title}</h2>

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
              className={`px-2 md:px-4 py-2 font-medium text-sm md:text-base ${activeTab === tab.key
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
              <p className="text-gray-700 whitespace-pre-wrap text-sm md:text-base">{diaryData.content}</p>
            </div>
          )}
          {activeTab === 'interpretation' && (
            <div className="prose max-w-none">
              <p className="text-gray-700 text-sm md:text-base">
                {diaryData.ai_interpretation.dream_interpretation || "AI 해몽이 아직 생성되지 않았습니다."}
              </p>
            </div>
          )}
          {activeTab === 'story' && (
            <div className="prose max-w-none">
              <p className="text-gray-700 text-sm md:text-base">
                {diaryData.ai_interpretation.story || "AI 소설이 아직 생성되지 않았습니다."}
              </p>
            </div>
          )}
        </div>

        {/* 댓글 섹션 */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-4">댓글 ({comments.length})</h3>

          {/* 댓글 작성 */}
          <form onSubmit={handleCommentSubmit} className="mb-4">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm md:text-base"
                disabled={commentLoading}
              />
              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm md:text-base"
              >
                {commentLoading ? "작성 중..." : "작성"}
              </button>
            </div>
          </form>

          {/* 댓글 목록 - 스크롤 */}
          {commentsLoading ? (
            <div className="text-center py-4 text-gray-500 text-sm md:text-base">댓글을 불러오는 중...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm md:text-base">아직 댓글이 없습니다.</div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200 mt-4 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${isLiked
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-red-600'
                }`}
            >
              <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{diaryData.likes_count}</span>
            </button>
            <div className="flex items-center space-x-2 text-gray-500">
              <Eye className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm md:text-base">{diaryData.views}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm md:text-base">{diaryData.comments_count}</span>
            </div>
          </div>
          <button
            className="text-gray-500 hover:text-gray-700 p-1"
            onClick={async () => {
              const url = `${window.location.origin}?diary=${diary.id}`;
              try {
                await navigator.clipboard.writeText(url);
                alert('링크가 복사되었습니다!');
              } catch {
                // fallback
                const temp = document.createElement('input');
                temp.value = url;
                document.body.appendChild(temp);
                temp.select();
                document.execCommand('copy');
                document.body.removeChild(temp);
                alert('링크가 복사되었습니다!');
              }
            }}
          >
            <Share2 className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
