"use client";
import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      result = await supabase.auth.signUp({ email: email.trim(), password });
      console.log("Signup result:", result); // 디버깅용 로그
      
      // 회원가입 시도 시 무조건 이메일 인증 안내
      if (result.data.user) {
        setShowVerificationMessage(true);
        setEmail("");
        setPassword("");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form
        onSubmit={handleAuth}
        className="bg-gray-800 p-8 rounded shadow-md w-full max-w-sm border border-gray-700"
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-white">
          {isSignUp ? "회원가입" : "로그인"}
        </h1>
        
        {showVerificationMessage && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-600 rounded text-green-300 text-sm">
            ✅ 이메일을 확인해주세요! 가입되지 않은 이메일이라면 인증 링크가 전송됩니다.
          </div>
        )}
        
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 px-3 py-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
        {error && <div className="text-red-400 mb-3">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          {loading ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
        </button>
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-blue-400 underline hover:text-blue-300"
            onClick={() => {
              setIsSignUp((v) => !v);
              setError("");
              setShowVerificationMessage(false);
            }}
          >
            {isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
          </button>
        </div>
      </form>
    </div>
  );
} 