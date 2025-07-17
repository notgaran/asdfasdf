#!/bin/bash

# DreamInside Edge Functions 배포 스크립트

echo "🚀 DreamInside Edge Functions 배포 시작..."

# 모든 Edge Function 배포
echo "📦 Edge Functions 배포 중..."

npx supabase functions deploy get-user
npx supabase functions deploy update-user-profile
npx supabase functions deploy get-diaries
npx supabase functions deploy create-diary
npx supabase functions deploy update-diary
npx supabase functions deploy delete-diary
npx supabase functions deploy get-public-diaries
npx supabase functions deploy get-diary-by-id
npx supabase functions deploy increment-views
npx supabase functions deploy like-diary
npx supabase functions deploy get-diary-likes
npx supabase functions deploy get-comments
npx supabase functions deploy create-comment
npx supabase functions deploy delete-comment
npx supabase functions deploy follow-user
npx supabase functions deploy unfollow-user
npx supabase functions deploy get-followers
npx supabase functions deploy get-following
npx supabase functions deploy is-following
npx supabase functions deploy search-diaries
npx supabase functions deploy generate-ai-interpretation

echo "✅ 모든 Edge Functions 배포 완료!"
echo ""
echo "📋 배포된 함수 목록:"
echo "- get-user"
echo "- update-user-profile"
echo "- get-diaries"
echo "- create-diary"
echo "- update-diary"
echo "- delete-diary"
echo "- get-public-diaries"
echo "- get-diary-by-id"
echo "- increment-views"
echo "- like-diary"
echo "- get-diary-likes"
echo "- get-comments"
echo "- create-comment"
echo "- delete-comment"
echo "- follow-user"
echo "- unfollow-user"
echo "- get-followers"
echo "- get-following"
echo "- is-following"
echo "- search-diaries"
echo "- generate-ai-interpretation"
echo ""
echo "🎉 DreamInside 플랫폼이 준비되었습니다!" 