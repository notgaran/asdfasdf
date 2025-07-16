import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    const { content } = await req.json()
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: '일기 내용이 필요합니다' }),
        { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    // ChatGPT API 호출
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'API 키가 설정되지 않았습니다' }),
        { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '일기 내용을 분석해서 감정과 기분을 알려주세요.'
          },
          {
            role: 'user',
            content: `다음 일기를 분석해주세요: ${content}`
          }
        ],
        max_tokens: 200
      })
    })

    const data = await response.json()
    const analysis = data.choices[0].message.content

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: analysis 
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: '분석 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    )
  }
}) 