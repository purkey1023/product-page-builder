import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

interface GenerateImageRequest {
  productName: string
  category: string
  mood: string
  styles: string[]
  productImageBase64?: string
  sectionContext?: string // 섹션 텍스트 컨텍스트 (제목, 설명 등)
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
  mood: string,
  sectionContext?: string
): string {
  // 공통 톤 지시: 밝고 따뜻한 한국 뷰티 화보 톤
  const TONE_GUIDE = `
LIGHTING & TONE (CRITICAL — apply to ALL images):
- Overall tone: BRIGHT, WARM, SOFT, AIRY — like a Korean beauty magazine editorial
- Lighting: Soft natural window light or large diffused softbox. NO harsh shadows. NO dark moody lighting.
- Color temperature: Warm (5500-6500K). Slightly warm beige/cream undertone throughout.
- Background: Light, bright — warm beige (#F5F0EB), soft cream (#FFF8F0), or clean white. NEVER dark or black.
- Exposure: Slightly bright/overexposed (+0.3~0.7 EV). Skin and surfaces should glow softly.
- Reference: PEPTOIR, ANUA, Sulwhasoo Korean beauty advertisement — always bright, clean, warm, inviting.
- AVOID: Dark backgrounds, dramatic shadows, cool blue tones, underexposed/moody looks.`

  const moodStyle: Record<string, string> = {
    premium: 'Warm luxurious golden-beige tones, bright soft lighting, Sulwhasoo/PEPTOIR style, cream/gold palette on light background',
    clean: 'Pure bright white aesthetic, airy soft diffused light, Laneige/Dr.Jart+ style, clean and luminous',
    natural: 'Warm bright botanical tones, ANUA/Innisfree style, golden morning light, soft beige background, organic warmth',
    impact: 'Bright vivid colors with energy, clean white background with bold accents, VT/Medicube style, high-key lighting',
  }

  const moodDesc = moodStyle[mood] || moodStyle.natural

  const prompts: Record<string, string> = {
    texture: `Ultra-photorealistic extreme macro close-up of ${category} product texture on the back of a Korean woman's hand. Product details: ${analysis}

The texture should EXACTLY match the product (if serum: transparent glossy liquid drop, if cream: thick white/beige cream, if toner: light watery transparent liquid, if gel: clear gel with visible bubbles). Show the actual product being applied/spread on clean, bright, smooth skin.

Shot with Canon EOS R5, RF 100mm f/2.8L Macro lens, f/4, ISO 100. BRIGHT soft diffused lighting from large window/softbox creating gentle highlights. The skin tone should be bright and luminous. Light warm beige or white background visible at edges. Shallow depth of field.

Style: ${moodDesc}
${TONE_GUIDE}

CRITICAL: Absolutely NO text, numbers, letters, logos, watermarks, or product packaging. Pure texture on bright skin only.`,

    ingredient: `Extreme macro close-up inside a glass container of ${category} liquid/serum/essence. Product: ${analysis}

Show the actual product liquid with visible details: micro-bubbles suspended in the liquid, light refracting through transparent/translucent solution, the exact color matching the product (golden, clear, milky, etc.). Shot from very close, the glass container edge may be slightly visible.

Photographed with Phase One IQ4 150MP, Schneider 120mm Macro, f/5.6. BRIGHT warm backlight creating beautiful golden light transmission through the liquid. The overall image should feel BRIGHT and luminous, like light shining through honey or champagne. Clean white/cream background.

Style: ${moodDesc}
${TONE_GUIDE}

CRITICAL: NO text, numbers, letters, logos, or labels visible. Pure bright liquid macro only.`,

    lifestyle: `Professional Korean beauty advertisement photo. An elegant Korean woman in her late 20s with flawless dewy glass skin holding a ${category} product near her face. Product context: ${analysis}

She has natural minimal Korean makeup (gradient lips, subtle eye makeup, dewy highlight on cheekbones). Her expression is serene and confident. She wears a simple white or cream top. The product is held naturally near her jawline/cheek.

Shot with Sony A7R V, 85mm f/1.4 GM lens. BRIGHT natural window light from the left, with a warm fill light. Soft creamy WARM BEIGE bokeh background (#E8DDD0 to #F5EDE3). The skin should GLOW with dewy luminosity. Overall bright, warm, inviting tone — like a PEPTOIR or ANUA campaign photo.

Style: ${moodDesc}
${TONE_GUIDE}

CRITICAL: The woman should look like a real Korean person. NO text or logos. Product should have NO readable text on labels.`,

    banner: `Abstract flowing liquid beauty texture art. Product: ${analysis}

Create a mesmerizing wave/flow of the product liquid (matching the actual product color - golden serum, clear gel, white cream, etc.) flowing diagonally across the frame against a BRIGHT CLEAN background. The liquid should have visible micro-bubbles, internal refraction, and glossy surface tension. Dynamic flowing movement frozen in time.

Shot with Hasselblad H6D-400c, 120mm macro, high-speed flash. The background MUST be bright — soft white (#FFFFFF) to warm cream (#FFF8F0) gradient. The liquid catches warm golden light. Overall feeling: luminous, clean, premium.

Style: ${moodDesc}
${TONE_GUIDE}

CRITICAL: NO text, logos, or product packaging. Pure abstract liquid art on BRIGHT background only.`,

    hero_bg: `Soft bright gradient studio background for Korean premium beauty product photography. Product context: ${analysis}

Create a smooth, BRIGHT, warm gradient backdrop. Colors: warm cream (#FFF8F0) to soft beige (#F0E6DA) or light rose-beige. Subtle soft circular bokeh light effects. The overall tone must be BRIGHT and WARM — like a Korean beauty brand studio backdrop.

Style: ${moodDesc}
${TONE_GUIDE}

CRITICAL: NO objects, NO text, NO products. Bright warm gradient background only.`,
  }

  let prompt = prompts[style] || prompts.texture

  // 섹션 텍스트 컨텍스트 주입 — 이미지가 섹션 내용과 매칭되도록
  if (sectionContext) {
    prompt += `\n\nIMPORTANT CONTEXT — This image is for a section with the following content. The image must visually match and complement this text:\n"${sectionContext}"\n\nMake sure the image's subject matter, colors, and mood align with the above description. For example, if the text mentions specific ingredients (heartleaf, hyaluronic acid, vitamin C, etc.), those ingredients should be visually represented. If it mentions "soothing" or "calming", use cool green/blue tones. If it mentions "firming" or "anti-aging", use golden/luxurious tones.`
  }

  return prompt
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
    const { productName, category, mood, styles, productImageBase64, sectionContext } = body

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
      const prompt = buildPrompt(style, analysis, productName, category, mood, sectionContext)
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
