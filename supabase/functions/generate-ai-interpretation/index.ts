import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { diary_id, content } = await req.json()

    if (!diary_id || !content) {
      throw new Error('diary_id와 content가 필요합니다.')
    }

    // OpenAI API 호출
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `당신은 꿈 해몽 전문가이자 창작 소설가입니다. 
            사용자의 꿈을 분석하여 해몽과 소설을 생성해주세요.
            
            해몽: 꿈의 심리학적 의미와 상징을 설명
            소설: 꿈을 바탕으로 한 창작 소설 (500자 내외)
            
            한국어로 답변해주세요.`
          },
          {
            role: 'user',
            content: `다음 꿈을 해몽하고 소설로 창작해주세요:
            
            꿈 내용: ${content}
            
            다음 형식으로 답변해주세요:
            
            [해몽]
            (꿈의 심리학적 해석)
            
            [소설]
            (꿈을 바탕으로 한 창작 소설)`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API 호출 실패')
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0].message.content

    // 해몽과 소설 분리
    const interpretationMatch = aiResponse.match(/\[해몽\](.*?)(?=\[소설\]|$)/s)
    const storyMatch = aiResponse.match(/\[소설\](.*?)$/s)

    const dream_interpretation = interpretationMatch ? interpretationMatch[1].trim() : "AI 해몽을 생성할 수 없습니다."
    const story = storyMatch ? storyMatch[1].trim() : "AI 소설을 생성할 수 없습니다."

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 일기의 AI 해석 결과 업데이트
    const { error: updateError } = await supabase
      .from('diary')
      .update({
        ai_interpretation: {
          dream_interpretation,
          story
        }
      })
      .eq('id', diary_id)

    if (updateError) {
      console.error('일기 업데이트 오류:', updateError)
    }

    return new Response(
      JSON.stringify({
        result: {
          dream_interpretation,
          story
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('오류:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
}) 