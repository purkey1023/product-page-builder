import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-exp'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`

interface GenerateImageRequest {
  productName: string
  category: string
  mood: string
  styles: string[]
}

const STYLE_PROMPTS: Record<string, string> = {
  hero: 'Elegant product photography on a gradient studio background with dramatic lighting and subtle reflection. The product bottle/tube/jar is the hero, shot slightly from below for a premium monumental feel. Soft bokeh lights in background. Ultra high-end beauty brand e-commerce style. 4K, photorealistic.',
  texture: 'Extreme macro close-up of skincare product texture being squeezed or spread. Creamy, glossy, satisfying texture with visible consistency. Soft diffused lighting. The texture fills 80% of the frame. Beauty editorial macro photography style. No product packaging visible.',
  lifestyle: 'Aspirational lifestyle flat-lay scene: the product surrounded by natural botanical elements (fresh leaves, flower petals, water droplets on marble surface). Morning sunlight casting soft shadows. Clean, airy, editorial beauty photography. Organic and luxurious feel.',
  ingredient: 'Scientific yet beautiful visualization of natural ingredients. Glass petri dishes and test tubes with colorful botanical extracts, fresh herbs, and molecular structure hints. Clean white lab-meets-nature aesthetic. Professional cosmetic ingredient photography.',
  banner: 'Wide cinematic beauty banner image. Dreamy gradient background (soft pastels or deep luxury tones). Abstract flowing silk or liquid gold/water elements. No product, just mood and atmosphere. Perfect for text overlay. Ultra-wide aspect ratio feel even in square crop.',
}

async function generateOneImage(productName: string, category: string, mood: string, style: string): Promise<string> {
  const moodMap: Record<string, string> = {
    premium: 'luxurious dark tones, gold and black, elegant',
    clean: 'minimal white and blue, pure, clinical clean',
    natural: 'warm earth tones, green botanical, organic',
    impact: 'bold contrast, neon accents, dynamic energy',
  }

  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.hero
  const prompt = `Generate an image: ${stylePrompt} Product type: ${productName} (${category}). Color mood: ${moodMap[mood] || 'modern elegant'}. IMPORTANT: No text, no letters, no logos, no labels, no watermarks anywhere in the image.`

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    console.error(`[Gemini Image ${style}]`, response.status, errBody.slice(0, 300))
    throw new Error(`이미지 생성 실패 (${style}: ${response.status})`)
  }

  const result = await response.json()
  const parts = result?.candidates?.[0]?.content?.parts || []

  // 이미지 파트 찾기
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType || 'image/png'
      return `data:${mimeType};base64,${part.inlineData.data}`
    }
  }

  throw new Error(`이미지가 응답에 포함되지 않았습니다 (${style})`)
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateImageRequest = await req.json()
    const { productName, category, mood, styles } = body

    if (!productName || !styles?.length) {
      return NextResponse.json({ error: '필수 입력값이 없습니다.' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    // 순차 생성 (Gemini 무료 티어 rate limit 고려)
    const stylesToGenerate = styles.slice(0, 4)
    const images: Record<string, string> = {}

    for (const style of stylesToGenerate) {
      try {
        const dataUrl = await generateOneImage(productName, category, mood, style)
        images[style] = dataUrl
        console.log(`[Gemini Image] ${style} 생성 완료`)
      } catch (err) {
        console.error(`[${style}] 실패:`, err instanceof Error ? err.message : err)
        // 실패해도 다음 이미지 계속 생성
      }
    }

    return NextResponse.json({
      images,
      generated: Object.keys(images).length,
      requested: stylesToGenerate.length,
    })
  } catch (error) {
    console.error('[/api/generate-image]', error)
    const message = error instanceof Error ? error.message : '이미지 생성 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
