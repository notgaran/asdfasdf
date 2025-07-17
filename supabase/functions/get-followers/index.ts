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
    const { user_id } = await req.json()

    if (!user_id) {
      throw new Error('user_id가 필요합니다.')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower_id
      `)
      .eq('following_id', user_id)

    if (error) {
      throw error
    }

    // 팔로워들의 ID 목록
    const followerIds = data?.map(item => item.follower_id) || []
    
    if (followerIds.length === 0) {
      return new Response(
        JSON.stringify({ followers: [] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // 사용자 정보 조회
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nickname, created_at, updated_at')
      .in('id', followerIds)

    if (usersError) {
      throw usersError
    }

    const followers = users || []

    return new Response(
      JSON.stringify({ followers }),
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