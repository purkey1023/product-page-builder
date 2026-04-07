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
  texture: 'Extreme macro close-up of skincare/cosmetic product texture. Creamy, glossy, satisfying gel or cream texture being spread on clean surface. Soft diffused studio lighting. The texture fills 80% of the frame. Premium beauty editorial macro photography. Luxurious and clean aesthetic. No product packaging, no text.',
  ingredient: 'Beautiful still-life arrangement of natural botanical ingredients on clean surface. Fresh green leaves, flower petals, water droplets, glass vials with colorful plant extracts. Soft morning light with gentle shadows. Lab-meets-nature aesthetic. Professional cosmetic ingredient photography. No text, no labels.',
  lifestyle: 'Aspirational beauty lifestyle flat-lay scene. Skincare product bottle/tube surrounded by natural botanical elements, fresh flowers, smooth pebbles, on marble or light wood surface. Morning sunlight casting soft shadows. Clean, airy, editorial beauty photography. Organic and luxurious feel. No text.',
  banner: 'Abstract artistic beauty background. Flowing liquid silk or water in soft luxury tones. Dreamy gradient with subtle light effects. Elegant and sophisticated atmosphere. Perfect as background for text overlay. No objects, no product, pure mood and texture. No text.',
  hero_bg: 'Soft gradient studio background for premium beauty product photography. Subtle light rays or bokeh effects. Elegant and sophisticated color tones. Clean and uncluttered. Perfect backdrop for a product hero shot. No objects, no text.',
}

async function generateOneImage(
  productName: string,
  category: string,
  mood: string,
  style: string
): Promise<string> {
  const moodMap: Record<string, string> = {
    premium: 'luxurious dark tones with gold accents, dramatic chiaroscuro lighting, deep blacks and warm golds',
    clean: 'minimal white and soft blue tones, bright airy feeling, pure clinical clean aesthetic',
    natural: 'warm earth tones, soft greens and beiges, organic botanical feeling, warm golden light',
    impact: 'bold dramatic contrast, deep dark tones with vibrant red or neon accents, high energy',
  }

  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.texture
  const moodDesc = moodMap[mood] || 'modern elegant'
  const prompt = `Generate a high-quality image for a premium Korean beauty brand product page.

Style: ${stylePrompt}

Product context: ${productName} (${category})
Color mood: ${moodDesc}

Requirements:
- Ultra high quality, 4K resolution feel
- Professional commercial photography standard
- ABSOLUTELY NO text, letters, logos, labels, or watermarks
- Clean, premium, editorial quality`

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

  for (const part of parts) {
    if (part.inlineData?.data) {
      const mimeType = part.inlineData.mimeType || 'image/png'
      return `data:${mimeType};base64,${part.inlineData.data}`
    }
  }

  throw new Error(`이미지 미포함 (${style})`)
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

    // 순차 생성 (rate limit 고려, 퀄리티 우선)
    const images: Record<string, string> = {}

    for (const style of styles) {
      try {
        console.log(`[Gemini Image] ${style} 생성 시작...`)
        const dataUrl = await generateOneImage(productName, category, mood, style)
        images[style] = dataUrl
        console.log(`[Gemini Image] ${style} 생성 완료 ✓`)
        // Rate limit 간격 (2초)
        if (styles.indexOf(style) < styles.length - 1) {
          await new Promise(r => setTimeout(r, 2000))
        }
      } catch (err) {
        console.error(`[${style}] 실패:`, err instanceof Error ? err.message : err)
      }
    }

    return NextResponse.json({
      images,
      generated: Object.keys(images).length,
      requested: styles.length,
    })
  } catch (error) {
    console.error('[/api/generate-image]', error)
    const message = error instanceof Error ? error.message : '이미지 생성 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
