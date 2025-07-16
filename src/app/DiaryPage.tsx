"use client";

import React, { useState } from 'react';
import { analyzeDiary } from './diary-api';

export default function DiaryPage() {
  const [input, setInput] = useState('');
  const [diaries, setDiaries] = useState<string[]>([]);
  const [popup, setPopup] = useState<{ open: boolean; content: string; analysis: string | null }>({
    open: false,
    content: '',
    analysis: null,
  });
  const [loading, setLoading] = useState(false);

  // 글 작성
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setDiaries([input, ...diaries]);
      setInput('');
    }
  };

  // 글 클릭 → 감정분석
  const handleDiaryClick = async (content: string) => {
    setPopup({ open: true, content, analysis: null });
    setLoading(true);
    const result = await analyzeDiary(content);
    setPopup({ open: true, content, analysis: result });
    setLoading(false);
  };

  // 팝업 닫기
  const closePopup = () => setPopup({ open: false, content: '', analysis: null });

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>일기 작성</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="오늘의 일기를 입력하세요"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>저장</button>
      </form>

      <ul style={{ marginTop: 32, padding: 0, listStyle: 'none' }}>
        {diaries.map((d, i) => (
          <li
            key={i}
            onClick={() => handleDiaryClick(d)}
            style={{
              background: '#f9f9f9',
              marginBottom: 12,
              padding: 16,
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: '0 1px 4px #0001'
            }}
          >
            {d}
          </li>
        ))}
      </ul>

      {/* 감정분석 팝업 */}
      {popup.open && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', padding: 32, borderRadius: 12, minWidth: 320, maxWidth: '80vw', boxShadow: '0 4px 24px #0002', textAlign: 'center'
          }}>
            <h3>감정 분석 결과</h3>
            <div style={{ margin: '16px 0', color: '#333' }}>
              <b>원문:</b>
              <div style={{ margin: '8px 0 16px', color: '#666' }}>{popup.content}</div>
              <b>분석:</b>
              <div style={{ margin: '8px 0', minHeight: 40 }}>
                {loading ? '분석 중...' : popup.analysis}
              </div>
            </div>
            <button onClick={closePopup} style={{ marginTop: 12, padding: '8px 24px' }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
} 