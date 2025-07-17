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
    const { diary_id, user_id, like } = await req.json()

    if (!diary_id || !user_id) {
      throw new Error('diary_id와 user_id가 필요합니다.')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (like) {
      // 좋아요 추가
      const { error } = await supabase
        .from('likes')
        .insert({ diary_id, user_id })

      if (error && !String(error.message).includes('duplicate key value')) {
        throw error
      }
    } else {
      // 좋아요 삭제
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('diary_id', diary_id)
        .eq('user_id', user_id)

      if (error) {
        throw error
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
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