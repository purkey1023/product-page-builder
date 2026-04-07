import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

// Gemini 이미지 모델 우선순위
const GEMINI_IMAGE_MODELS = [
  'gemini-3.1-flash-image-preview',
  'gemini-2.5-flash-image',
]

interface GenerateImageRequest {
  productName: string
  category: string
  mood: string
  styles: string[]
}

const STYLE_PROMPTS: Record<string, string> = {
  texture: 'Extreme macro close-up of skincare product texture. Creamy glossy gel or cream being spread on clean surface. Soft diffused studio lighting. Premium beauty editorial macro photography. No text, no labels.',
  ingredient: 'Beautiful still-life of natural botanical ingredients. Fresh green leaves, flower petals, water droplets, glass vials with plant extracts on clean surface. Soft morning light. Lab-meets-nature aesthetic. No text.',
  lifestyle: 'Aspirational beauty lifestyle flat-lay. Skincare product surrounded by botanical elements, fresh flowers, smooth pebbles on marble surface. Morning sunlight, soft shadows. Clean editorial beauty photography. No text.',
  banner: 'Abstract artistic beauty background. Flowing liquid silk or water in soft luxury tones. Dreamy gradient with subtle light effects. Elegant atmosphere. Perfect for text overlay. No objects, no text.',
  hero_bg: 'Soft gradient studio background for premium beauty product. Subtle light rays or bokeh effects. Elegant sophisticated color tones. Clean and uncluttered. No objects, no text.',
}

// ── Gemini 이미지 생성 ──
async function generateWithGemini(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null

  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.log(`[Gemini ${model}] ${res.status}: ${errText.slice(0, 150)}`)
        continue // 다음 모델 시도
      }

      const result = await res.json()
      const parts = result?.candidates?.[0]?.content?.parts || []
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png'
          console.log(`[Gemini ${model}] 이미지 생성 성공 ✓`)
          return `data:${mimeType};base64,${part.inlineData.data}`
        }
      }
    } catch (err) {
      console.log(`[Gemini ${model}] 에러:`, err)
    }
  }
  return null
}

// ── DALL-E 이미지 생성 (폴백) ──
async function generateWithDallE(prompt: string): Promise<string | null> {
  if (!OPENAI_API_KEY) return null

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
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

    if (!res.ok) {
      console.log(`[DALL-E] ${res.status}`)
      return null
    }

    const result = await res.json()
    const b64 = result?.data?.[0]?.b64_json
    if (b64) {
      console.log(`[DALL-E] 이미지 생성 성공 ✓`)
      return `data:image/png;base64,${b64}`
    }
  } catch (err) {
    console.log('[DALL-E] 에러:', err)
  }
  return null
}

// ── 통합 이미지 생성 (Gemini → DALL-E 폴백) ──
async function generateOneImage(
  productName: string,
  category: string,
  mood: string,
  style: string
): Promise<string | null> {
  const moodMap: Record<string, string> = {
    premium: 'luxurious dark tones with gold accents, dramatic lighting',
    clean: 'minimal white and soft blue, bright airy, pure clean aesthetic',
    natural: 'warm earth tones, soft greens and beiges, botanical feeling',
    impact: 'bold dramatic contrast, deep dark with vibrant accents',
  }

  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.texture
  const moodDesc = moodMap[mood] || 'modern elegant'
  const prompt = `${stylePrompt} Product type: ${productName} (${category}). Color mood: ${moodDesc}. Ultra high quality, professional commercial photography. ABSOLUTELY NO text, letters, logos, watermarks.`

  // 1차: Gemini
  const geminiResult = await generateWithGemini(`Generate an image: ${prompt}`)
  if (geminiResult) return geminiResult

  // 2차: DALL-E
  const dalleResult = await generateWithDallE(prompt)
  if (dalleResult) return dalleResult

  return null
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateImageRequest = await req.json()
    const { productName, category, mood, styles } = body

    if (!productName || !styles?.length) {
      return NextResponse.json({ error: '필수 입력값이 없습니다.' }, { status: 400 })
    }

    if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
      return NextResponse.json({ error: 'AI 이미지 API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    const images: Record<string, string> = {}

    for (const style of styles) {
      console.log(`[Image] ${style} 생성 시작...`)
      const result = await generateOneImage(productName, category, mood, style)
      if (result) {
        images[style] = result
      }
      // Rate limit 간격
      if (styles.indexOf(style) < styles.length - 1) {
        await new Promise(r => setTimeout(r, 1500))
      }
    }

    return NextResponse.json({
      images,
      generated: Object.keys(images).length,
      requested: styles.length,
    })
  } catch (error) {
    console.error('[/api/generate-image]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : '이미지 생성 실패' }, { status: 500 })
  }
}
