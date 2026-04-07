import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

interface GenerateImageRequest {
  productName: string
  category: string
  mood: string
  styles: string[]
  productImageBase64?: string // 제품 사진 (분석용)
}

// ── 1단계: Gemini로 제품 사진 분석 ──
async function analyzeProductImage(
  imageBase64: string,
  productName: string,
  category: string
): Promise<string> {
  if (!GEMINI_API_KEY || !imageBase64) {
    return `A ${category} product called "${productName}".`
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: 'image/png', data: imageBase64 } },
            { text: `이 제품 사진을 분석하여 영문으로 간결하게 설명해주세요.
다음 정보를 포함:
1. 제품 용기 형태 (bottle, tube, jar, pump, dropper 등)
2. 제품 색상 (용기 색상, 라벨 색상)
3. 전체 색감/톤 (warm, cool, pastel, dark 등)
4. 제품 카테고리 느낌 (luxury, clinical, natural, playful 등)
5. 추천 보조 색상 팔레트 (hex 코드 3개)

제품명: ${productName}
카테고리: ${category}

3~4문장으로 영문 설명만 출력하세요.` },
          ],
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
      }),
    })

    if (!res.ok) {
      console.log(`[Gemini Analysis] ${res.status}`)
      return `A ${category} product called "${productName}".`
    }

    const result = await res.json()
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    console.log(`[Product Analysis] ${text.slice(0, 200)}`)
    return text || `A ${category} product called "${productName}".`
  } catch (err) {
    console.log('[Gemini Analysis] error:', err)
    return `A ${category} product called "${productName}".`
  }
}

// ── 2단계: 분석 결과 기반 이미지 생성 프롬프트 ──
function buildPrompt(
  style: string,
  productAnalysis: string,
  productName: string,
  category: string,
  mood: string
): string {
  const moodMap: Record<string, string> = {
    premium: 'luxurious dark tones with gold accents, dramatic chiaroscuro lighting, deep blacks and warm golds, high-end editorial',
    clean: 'minimal white and soft blue tones, bright airy feeling, pure clinical clean aesthetic, lots of negative space',
    natural: 'warm earth tones, soft greens and beiges, organic botanical feeling, warm golden hour light, natural materials',
    impact: 'bold dramatic contrast, deep dark tones with vibrant red or neon accents, high energy, dynamic composition',
  }

  const moodDesc = moodMap[mood] || 'modern elegant'

  const stylePrompts: Record<string, string> = {
    texture: `Ultra close-up macro photography of a ${category} product texture being applied or spread. Based on this product: ${productAnalysis}. Show the actual texture consistency (gel, cream, liquid, serum) matching the product type. The color of the texture should match the product. Satisfying viscous texture fills the frame. Professional beauty editorial macro photography.`,

    ingredient: `Beautiful still-life arrangement of the KEY NATURAL INGREDIENTS used in this ${category} product: ${productAnalysis}. Arrange real botanical ingredients (herbs, flowers, fruit extracts, plant stems) that would be found in this type of product. Place them on a clean surface with glass petri dishes and small vials. Soft directional lighting. The color palette should complement the product colors.`,

    lifestyle: `Lifestyle flat-lay scene featuring a ${category} product. Based on this product: ${productAnalysis}. Arrange the scene with complementary items that match this product category: botanical elements, fabric textures, natural stones, or beauty tools. The color scheme must match the product's color palette. Morning light, editorial beauty photography style.`,

    banner: `Abstract artistic background that complements this product: ${productAnalysis}. Create a flowing, dreamy gradient or liquid texture background. Colors should be derived FROM the product's own color palette. Perfect as a background for text overlay. No objects, just pure mood, texture and color.`,

    hero_bg: `Soft gradient studio backdrop designed to showcase this product: ${productAnalysis}. The background colors should harmonize with the product's packaging colors. Subtle light effects, clean and sophisticated. Perfect for a hero product shot.`,
  }

  const stylePrompt = stylePrompts[style] || stylePrompts.texture

  return `${stylePrompt}

Overall mood: ${moodDesc}
Product: ${productName} (${category})

CRITICAL RULES:
- Colors MUST match or complement the actual product shown
- Ultra high quality, professional commercial photography
- ABSOLUTELY NO text, letters, numbers, logos, labels, or watermarks anywhere
- No product packaging or bottles in the image (except for lifestyle style)`
}

// ── DALL-E 이미지 생성 ──
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
        prompt: prompt.slice(0, 4000), // DALL-E prompt limit
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        response_format: 'b64_json',
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.log(`[DALL-E] ${res.status}: ${err.slice(0, 150)}`)
      return null
    }
    const result = await res.json()
    const b64 = result?.data?.[0]?.b64_json
    if (b64) return `data:image/png;base64,${b64}`
  } catch (err) {
    console.log('[DALL-E] error:', err)
  }
  return null
}

// ── Gemini 이미지 생성 (유료 플랜) ──
async function generateWithGemini(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null
  const models = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image']
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
        }),
      })
      if (!res.ok) continue
      const result = await res.json()
      for (const part of (result?.candidates?.[0]?.content?.parts || [])) {
        if (part.inlineData?.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`
        }
      }
    } catch { /* next model */ }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateImageRequest = await req.json()
    const { productName, category, mood, styles, productImageBase64 } = body

    if (!productName || !styles?.length) {
      return NextResponse.json({ error: '필수 입력값이 없습니다.' }, { status: 400 })
    }

    // 1단계: 제품 사진 분석 (Gemini Vision)
    console.log('[Image] 제품 사진 분석 중...')
    const productAnalysis = await analyzeProductImage(
      productImageBase64 || '',
      productName,
      category
    )
    console.log(`[Image] 분석 완료: ${productAnalysis.slice(0, 100)}...`)

    // 2단계: 분석 결과 기반 이미지 순차 생성
    const images: Record<string, string> = {}

    for (const style of styles) {
      const prompt = buildPrompt(style, productAnalysis, productName, category, mood)
      console.log(`[Image] ${style} 생성 시작...`)

      // Gemini → DALL-E 폴백
      const result = await generateWithGemini(prompt) || await generateWithDallE(prompt)

      if (result) {
        images[style] = result
        console.log(`[Image] ${style} ✓`)
      } else {
        console.log(`[Image] ${style} ✗ 실패`)
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
