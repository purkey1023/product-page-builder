import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

interface GenerateImageRequest {
  productName: string
  category: string
  mood: string
  styles: string[]
  productImageBase64?: string
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1단계: Gemini Vision으로 제품 사진 분석
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function analyzeProductImage(
  imageBase64: string,
  productName: string,
  category: string
): Promise<string> {
  if (!GEMINI_API_KEY || !imageBase64) {
    return `A Korean ${category} product called "${productName}". Glass bottle with dropper, premium minimal design.`
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
            { text: `Analyze this product photo in detail for image generation purposes. Describe in English:

1. CONTAINER: Exact type (glass dropper bottle, pump bottle, tube, jar, ampoule, etc.), shape, size
2. PRODUCT COLOR: The actual color of the product INSIDE (clear, golden, milky white, green, pink, etc.)
3. PACKAGING COLOR: Colors of the bottle/container/label/cap
4. TEXTURE APPEARANCE: How the product looks (transparent liquid, opaque cream, gel with bubbles, thick paste, etc.)
5. BRAND AESTHETIC: Overall style (luxury gold, clinical white, natural green, modern minimal, etc.)
6. COLOR PALETTE: 5 hex color codes that represent this product's overall palette

Product: ${productName} (${category})

Output 4-5 detailed sentences. Be extremely specific about colors and textures.` },
          ],
        }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
      }),
    })

    if (!res.ok) return `Korean ${category} product "${productName}".`

    const result = await res.json()
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    console.log(`[Analysis] ${text.slice(0, 200)}`)
    return text || `Korean ${category} product "${productName}".`
  } catch {
    return `Korean ${category} product "${productName}".`
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2단계: 한국 뷰티 에디토리얼 수준 프롬프트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildPrompt(
  style: string,
  analysis: string,
  productName: string,
  category: string,
  mood: string
): string {
  const moodStyle: Record<string, string> = {
    premium: 'Luxurious, warm golden tones, Sulwhasoo/Whoo advertisement quality, dark rich backdrop with golden light',
    clean: 'Pure minimal white aesthetic, bright airy soft light, Laneige/Dr.Jart+ style, clinical precision',
    natural: 'Warm botanical earth tones, ANUA/Innisfree style, natural morning light, organic feeling',
    impact: 'Bold dramatic high-contrast, dramatic shadows, VT/Medicube style, vivid saturated colors',
  }

  const moodDesc = moodStyle[mood] || moodStyle.natural

  const prompts: Record<string, string> = {
    texture: `Ultra-photorealistic extreme macro close-up of ${category} product texture on the back of a Korean woman's hand. Product details: ${analysis}

The texture should EXACTLY match the product (if serum: transparent glossy liquid drop, if cream: thick white/beige cream, if toner: light watery transparent liquid, if gel: clear gel with visible bubbles). Show the actual product being applied/spread on clean smooth skin.

Shot with Canon EOS R5, RF 100mm f/2.8L Macro lens, f/4, ISO 100. Professional studio softbox lighting from above-left creating subtle highlights on the texture. Shallow depth of field focusing on the texture detail. Korean skincare brand editorial quality.

Style: ${moodDesc}

CRITICAL: Absolutely NO text, numbers, letters, logos, watermarks, or product packaging in the image. Pure texture on skin only.`,

    ingredient: `Extreme macro close-up inside a glass container of ${category} liquid/serum/essence. Product: ${analysis}

Show the actual product liquid with visible details: micro-bubbles suspended in the liquid, light refracting through transparent/translucent solution, the exact color matching the product (golden, clear, milky, etc.). Shot from very close, the glass container edge may be slightly visible at frame edges.

Photographed with Phase One IQ4 150MP, Schneider 120mm Macro, f/5.6. Backlit with warm softbox creating beautiful light transmission through the liquid. Ultra-sharp focus on the bubbles and liquid structure. Beauty editorial commercial quality.

Style: ${moodDesc}

CRITICAL: NO text, numbers, letters, logos, or labels visible. Pure liquid macro only.`,

    lifestyle: `Professional Korean beauty advertisement photo. An elegant Korean woman in her late 20s with flawless dewy glass skin is shown applying/holding a ${category} product near her face. Product context: ${analysis}

She has natural minimal Korean makeup (gradient lips, subtle eye makeup, dewy highlight on cheekbones). Her expression is serene and confident. The product (dropper/pump/tube matching the actual product) is being used naturally.

Shot with Sony A7R V, 85mm f/1.4 GM lens, natural window light mixed with fill light. Soft creamy bokeh background in warm neutral tones. Korean beauty brand campaign quality (ANUA, Sulwhasoo, Laneige level).

Style: ${moodDesc}

CRITICAL: The woman should look like a real Korean person, not AI-generated. NO text or logos. The product shown should match the description but have NO readable text on labels.`,

    banner: `Abstract flowing liquid beauty texture art. Product: ${analysis}

Create a mesmerizing wave/flow of the product liquid (matching the actual product color - golden serum, clear gel, white cream, etc.) flowing diagonally across the frame against a clean background. The liquid should have visible micro-bubbles, internal refraction, and glossy surface tension. Dynamic flowing movement frozen in time.

Shot with Hasselblad H6D-400c, 120mm macro, high-speed flash freezing the liquid motion. Professional beauty advertisement. The background should be soft gradient (white to light neutral).

Style: ${moodDesc}

CRITICAL: NO text, logos, or product packaging. Pure abstract liquid art only.`,

    hero_bg: `Soft gradient studio background for Korean premium beauty product photography. Product context: ${analysis}

Create a smooth, elegant gradient backdrop that complements this product's color palette. Soft circular bokeh light effects and subtle warm/cool light interplay. The gradient should transition from the product's main color tone to a softer neutral. Premium beauty brand studio setup quality.

Style: ${moodDesc}

CRITICAL: NO objects, NO text, NO products. Just pure gradient background with subtle light effects.`,
  }

  return prompts[style] || prompts.texture
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 이미지 생성: gpt-image-1 → DALL-E 3 HD 폴백
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generateImage(prompt: string): Promise<string | null> {
  if (!OPENAI_API_KEY) return null

  // 1차: gpt-image-1 (최신, 최고 퀄리티)
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt.slice(0, 8000),
        n: 1,
        size: '1024x1024',
        quality: 'high',
      }),
    })

    if (res.ok) {
      const result = await res.json()
      const b64 = result?.data?.[0]?.b64_json
      if (b64) {
        console.log('[gpt-image-1] 성공 ✓')
        return `data:image/png;base64,${b64}`
      }
    } else {
      console.log(`[gpt-image-1] ${res.status}, DALL-E 3 폴백...`)
    }
  } catch (err) {
    console.log('[gpt-image-1] error, fallback to DALL-E 3')
  }

  // 2차: DALL-E 3 HD
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.slice(0, 4000),
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        response_format: 'b64_json',
      }),
    })

    if (res.ok) {
      const result = await res.json()
      const b64 = result?.data?.[0]?.b64_json
      if (b64) {
        console.log('[DALL-E 3 HD] 성공 ✓')
        return `data:image/png;base64,${b64}`
      }
    } else {
      const err = await res.text()
      console.log(`[DALL-E 3] ${res.status}: ${err.slice(0, 100)}`)
    }
  } catch (err) {
    console.log('[DALL-E 3] error:', err)
  }

  return null
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Route
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export async function POST(req: NextRequest) {
  try {
    const body: GenerateImageRequest = await req.json()
    const { productName, category, mood, styles, productImageBase64 } = body

    if (!productName || !styles?.length) {
      return NextResponse.json({ error: '필수 입력값이 없습니다.' }, { status: 400 })
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    // 1단계: 제품 사진 분석
    console.log('[Image] 제품 사진 분석 중...')
    const analysis = await analyzeProductImage(productImageBase64 || '', productName, category)

    // 2단계: 스타일별 이미지 순차 생성
    const images: Record<string, string> = {}

    for (const style of styles) {
      const prompt = buildPrompt(style, analysis, productName, category, mood)
      console.log(`[Image] ${style} 생성 중...`)

      const result = await generateImage(prompt)
      if (result) {
        images[style] = result
        console.log(`[Image] ${style} ✓ 완료`)
      } else {
        console.log(`[Image] ${style} ✗ 실패`)
      }

      // Rate limit 간격
      if (styles.indexOf(style) < styles.length - 1) {
        await new Promise(r => setTimeout(r, 2000))
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
