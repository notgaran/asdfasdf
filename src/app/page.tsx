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
}

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [emotion, setEmotion] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [diaries, setDiaries] = useState<Diary[]>([]);

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

  // 일기 목록 불러오기
  useEffect(() => {
    if (!session) return;
    const fetchDiaries = async () => {
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("diary")
        .select("id, emotion, content, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (error) setError(error.message);
      else setDiaries(data || []);
      setLoading(false);
    };
    fetchDiaries();
  }, [session]);

  // 일기 작성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emotion || !content) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.from("diary").insert({
      user_id: session?.user.id,
      emotion,
      content,
    });
    if (error) setError(error.message);
    setEmotion("");
    setContent("");
    // 새로고침
    const { data } = await supabase
      .from("diary")
      .select("id, emotion, content, created_at")
      .eq("user_id", session?.user.id)
      .order("created_at", { ascending: false });
    setDiaries(data || []);
    setLoading(false);
  };

  if (!session) return <Login />;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-6">감정일기</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow-md w-full max-w-md mb-8"
      >
        <div className="mb-3">
          <label className="block mb-1 font-medium">오늘의 감정</label>
          <input
            type="text"
            placeholder="😊 😢 😡 등 이모지 또는 텍스트"
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">내용</label>
          <textarea
            placeholder="오늘의 감정을 자유롭게 적어보세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            rows={3}
            required
          />
        </div>
        {error && <div className="text-red-500 mb-3">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          disabled={loading}
        >
          {loading ? "저장 중..." : "일기 저장"}
        </button>
      </form>
      <section className="w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">내 감정일기</h2>
        {loading && <div>불러오는 중...</div>}
        {diaries.length === 0 && !loading && <div>작성한 일기가 없습니다.</div>}
        <ul className="space-y-4">
          {diaries.map((d) => (
            <li key={d.id} className="bg-white p-4 rounded shadow">
              <div className="text-2xl mb-1">{d.emotion}</div>
              <div className="mb-1 whitespace-pre-line">{d.content}</div>
              <div className="text-xs text-gray-400">
                {new Date(d.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <button
        className="mt-8 text-sm text-gray-500 underline"
        onClick={async () => {
          await supabase.auth.signOut();
        }}
      >
        로그아웃
      </button>
    </main>
  );
}
