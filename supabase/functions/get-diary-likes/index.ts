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
    const { diary_id, user_id } = await req.json()

    if (!diary_id) {
      throw new Error('diary_id가 필요합니다.')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 전체 좋아요 수 조회
    const { data: likes, error: likesError } = await supabase
      .from('likes')
      .select('id')
      .eq('diary_id', diary_id)

    if (likesError) {
      throw likesError
    }

    let is_liked = false
    if (user_id) {
      // 사용자의 좋아요 여부 조회
      const { data: userLike } = await supabase
        .from('likes')
        .select('id')
        .eq('diary_id', diary_id)
        .eq('user_id', user_id)
        .single()

      is_liked = !!userLike
    }

    return new Response(
      JSON.stringify({
        like_count: likes?.length || 0,
        is_liked
      }),
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