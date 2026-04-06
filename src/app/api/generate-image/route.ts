import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

interface GenerateImageRequest {
  productName: string
  category: string
  mood: string
  style: 'hero' | 'lifestyle' | 'ingredient' | 'texture'
}

const STYLE_PROMPTS: Record<string, string> = {
  hero: 'Clean white studio background, professional product photography, soft lighting, centered composition, high-end e-commerce style, minimalist, 4K quality',
  lifestyle: 'Beautiful lifestyle scene, product in natural setting, warm ambient lighting, aspirational mood, editorial photography style',
  ingredient: 'Close-up macro photography of natural ingredients, fresh and organic feel, droplets of water, botanical elements, clean background',
  texture: 'Abstract close-up texture shot, creamy/smooth/silky texture, satisfying visual, pastel tones, beauty product texture photography',
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateImageRequest = await req.json()
    const { productName, category, mood, style } = body

    if (!productName || !style) {
      return NextResponse.json({ error: '필수 입력값이 없습니다.' }, { status: 400 })
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    const moodMap: Record<string, string> = {
      premium: 'luxurious, elegant, gold accents',
      clean: 'minimal, pure, simple',
      natural: 'organic, warm, earthy tones',
      impact: 'bold, vibrant, dynamic',
    }

    const prompt = `${STYLE_PROMPTS[style] || STYLE_PROMPTS.hero}. Product: ${productName} (${category}). Mood: ${moodMap[mood] || 'modern'}. No text, no logos, no watermarks.`

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json',
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('[DALL-E Error]', response.status, errBody)
      return NextResponse.json(
        { error: `이미지 생성 실패 (${response.status})` },
        { status: 500 }
      )
    }

    const result = await response.json()
    const base64 = result?.data?.[0]?.b64_json || ''

    if (!base64) {
      return NextResponse.json({ error: '이미지 데이터가 없습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      imageBase64: `data:image/png;base64,${base64}`,
      revisedPrompt: result?.data?.[0]?.revised_prompt || '',
    })
  } catch (error) {
    console.error('[/api/generate-image]', error)
    const message = error instanceof Error ? error.message : '이미지 생성 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
