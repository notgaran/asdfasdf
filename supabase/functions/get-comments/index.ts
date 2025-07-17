import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { diary_id } = await req.json()

    if (!diary_id) {
      throw new Error('diary_id가 필요합니다.')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('diary_id', diary_id)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    // 사용자 정보 조회
    const userIds = [...new Set(data?.map(comment => comment.user_id) || [])]
    let usersMap = {}
    
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, nickname, created_at, updated_at')
        .in('id', userIds)
      
      if (usersError) {
        throw usersError
      }
      
      usersMap = users?.reduce((acc, user) => {
        acc[user.id] = user
        return acc
      }, {}) || {}
    }

    // 댓글 데이터에 사용자 정보 추가
    const commentsWithUsers = data?.map(comment => ({
      ...comment,
      user: usersMap[comment.user_id]
    })) || []

    return new Response(
      JSON.stringify({ comments: commentsWithUsers }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 