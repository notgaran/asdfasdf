"use client";
import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowVerificationMessage(false);
    
    let result;
    if (isSignUp) {
      // 회원가입 시도
      result = await supabase.auth.signUp({ 
        email: email.trim(), 
        password,
        options: {
          data: {
            nickname: nickname.trim()
          }
        }
      });
      console.log("Signup result:", result); // 디버깅용 로그
      
      // 회원가입 시도 시 무조건 이메일 인증 안내
      if (result.data.user) {
        setShowVerificationMessage(true);
        setEmail("");
        setPassword("");
        setNickname("");
      }
    } else {
      result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      console.log("Login result:", result); // 디버깅용 로그
      
      if (result.error) {
        // 로그인 오류 메시지 한국어로 변환
        if (result.error.message.includes("Invalid login credentials")) {
          setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        } else if (result.error.message.includes("Email not confirmed")) {
          setError("이메일 인증이 필요합니다. 이메일을 확인해주세요.");
        } else {
          setError(result.error.message);
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-600 mb-2">DreamInside</h1>
          <p className="text-gray-600">꿈을 기록하고 AI와 함께 해석해보세요</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            {isSignUp ? "회원가입" : "로그인"}
          </h2>
          
          {showVerificationMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              ✅ 이메일을 확인해주세요! 가입되지 않은 이메일이라면 인증 링크가 전송됩니다.
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="text"
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
                minLength={2}
                maxLength={20}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
              minLength={6}
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
          </button>
          
          <div className="text-center">
            <button
              type="button"
              className="text-purple-600 hover:text-purple-700 underline text-sm"
              onClick={() => {
                setIsSignUp((v) => !v);
                setError("");
                setShowVerificationMessage(false);
                setEmail("");
                setPassword("");
                setNickname("");
              }}
            >
              {isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
            </button>
          </div>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>꿈을 기록하고 AI와 함께 해석해보세요</p>
          <p className="mt-2">• 꿈 일기 작성 및 관리</p>
          <p>• AI 기반 해몽 및 소설 생성</p>
          <p>• 소셜 기능으로 다른 사용자와 소통</p>
        </div>
      </div>
    </div>
  );
} 