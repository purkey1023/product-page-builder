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
async function buildPrompt(
  style: string,
  analysis: string,
  productName: string,
  category: string,
  mood: string,
  sectionContext?: string
): Promise<string> {
  // Gemini Imagen 최적화 공통 지시
  const TONE_GUIDE = `
[Lighting]: Soft studio lighting with large diffused softbox, or soft natural window sunlight. Warm color temperature (5500-6500K). NO harsh shadows.
[Background]: Light warm beige (#F5F0EB), soft cream (#FFF8F0), or clean white. NEVER dark or black backgrounds.
[Style]: High-end Korean beauty commercial photography. PEPTOIR, ANUA, Sulwhasoo advertisement quality.
[Composition]: Clean, balanced, with generous negative space. Product/subject is the clear focal point.
[Quality]: 4k resolution, highly detailed, professional lighting, commercial grade.
[Exposure]: Slightly bright (+0.3~0.7 EV). Skin and surfaces should glow softly with dewy luminosity.
[AVOID]: Dark backgrounds, dramatic shadows, cool blue tones, underexposed/moody looks, any text/logos/watermarks.`

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
Create a smooth, BRIGHT, warm gradient backdrop. Colors: warm cream (#FFF8F0) to soft beige (#F0E6DA) or light rose-beige. Subtle soft circular bokeh light effects. The overall tone must be BRIGHT and WARM.
Style: ${moodDesc}
${TONE_GUIDE}
CRITICAL: NO objects, NO text, NO products. Bright warm gradient background only.`,

    // ━━━ 섹션별 배경 이미지 스타일 (텍스트 오버레이용) ━━━
    'section-hero': `Premium beauty brand hero section background. Product: ${analysis}
A beautiful bright studio scene with the product bottle/tube centered, surrounded by soft light and subtle product-related elements (droplets, botanical hints). Leave CLEAR EMPTY SPACE at top 30% for text overlay and bottom 15% for badges. The product should be the focal point in the center-bottom area.
Style: ${moodDesc}
${TONE_GUIDE}
CRITICAL: NO text, NO logos. Product visible but leave space for text overlay at top.`,

    'section-philosophy': `Soft dreamy botanical background for a brand philosophy section. Product context: ${analysis}
Gentle out-of-focus botanical elements (leaves, petals, water) in warm neutral tones. Very soft and ethereal. The CENTER and LEFT side should be relatively EMPTY/LIGHT for text overlay. Elements concentrated on right edge and corners.
Style: ${moodDesc}
${TONE_GUIDE}
CRITICAL: NO text. Soft, blurry, dreamy. Most of the frame should be light/empty for text.`,

    'section-benefits': `Clean bright beauty section background with subtle visual interest. Product: ${analysis}
Soft gradient from warm cream to white, with very subtle abstract elements (light rays, soft circles, gentle curves) at the edges. The CENTER area must be CLEAR for text and smaller images to be placed on top. Professional Korean beauty brand style.
Style: ${moodDesc}
${TONE_GUIDE}
CRITICAL: NO text. Mostly clean/empty center. Decorative elements only at edges.`,

    'section-ingredients': `Natural ingredients beauty background. Product: ${analysis}
Arrange real botanical ingredients (fresh leaves, herbs, flower petals, water drops) around the EDGES of the frame. The CENTER should be EMPTY/LIGHT for text overlay. Ingredients should be blurred or at the periphery. Soft natural lighting, warm tones.
Style: ${moodDesc}
${TONE_GUIDE}
CRITICAL: NO text. Center must be clear. Ingredients at edges only.`,

    'section-proof': `Clean clinical beauty background for data/statistics section. Product: ${analysis}
Minimal clean background with subtle geometric patterns or soft gradient. Very light and professional. Think lab/clinical aesthetic but warm and inviting. Most of the frame should be EMPTY for numbers and text overlay.
Style: ${moodDesc}
${TONE_GUIDE}
CRITICAL: NO text, NO numbers. Clean, minimal, mostly empty for data overlay.`,

    'section-howto': `Soft warm beauty tutorial background. Product: ${analysis}
Gentle warm-toned background with subtle beauty elements (soft light, cream tones). Very clean and instructional feeling. MOST of the frame should be LIGHT/EMPTY for step-by-step text overlay. Subtle decorative elements at edges.
Style: ${moodDesc}
${TONE_GUIDE}
CRITICAL: NO text. Mostly empty, warm, inviting background for tutorial overlay.`,

    'section-reviews': `Warm cozy testimonial section background. Product: ${analysis}
Soft warm beige/cream gradient background with very subtle texture (paper-like or fabric-like). Feels warm, trustworthy, personal. MOST of the frame should be UNIFORM for review card overlays. Minimal visual elements.
Style: ${moodDesc}
${TONE_GUIDE}
CRITICAL: NO text. Uniform warm background, minimal decoration.`,

    'section-specs': `Clean product information background. Product: ${analysis}
Very clean, bright white or light gray background with subtle product-related elements at one edge. Professional, informational feel. LEFT side can have subtle product hints, RIGHT side must be CLEAR for specification text.
Style: ${moodDesc}
${TONE_GUIDE}
CRITICAL: NO text. Clean, informational, mostly empty.`,

    'section-cta': `Premium dark beauty CTA background. Product: ${analysis}
Rich, deep dark background (dark chocolate, charcoal, or deep navy) with subtle golden/warm light accents. Luxurious and inviting. CENTER should have space for product image and text. Elegant mood lighting.
Style: ${moodDesc}
${TONE_GUIDE}
CRITICAL: NO text. Dark, luxurious, with warm accent lighting.`,
  }

  // 컨텍스트가 있으면 Gemini로 맞춤 프롬프트 생성
  if (sectionContext && GEMINI_API_KEY) {
    const customPrompt = await buildContextualPrompt(sectionContext, analysis, productName, category, mood, style)
    if (customPrompt) return customPrompt
  }

  return prompts[style] || prompts.texture
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Gemini가 텍스트 컨텍스트 기반 맞춤 프롬프트 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function buildContextualPrompt(
  sectionContext: string,
  productAnalysis: string,
  productName: string,
  category: string,
  mood: string,
  style: string
): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are an expert Korean beauty product photographer. Your job is to write an IMAGE GENERATION PROMPT that perfectly matches the nearby text content.

PRODUCT: ${productName} (${category})
PRODUCT APPEARANCE: ${productAnalysis}
MOOD: ${mood}
REQUESTED STYLE: ${style}

SECTION TEXT CONTENT (this is what the image must represent):
${sectionContext}

Based on the section text above, write a detailed image generation prompt in English.

RULES:
1. The image MUST directly illustrate what the nearby text describes.
   - "보습" (moisturizing) → show water drops on dewy skin, moisture texture
   - "진정" (soothing) → show calming green botanical elements, cool tones
   - "탄력/탄탄" (firming) → show firm smooth skin, structured golden textures
   - "성분" (ingredients) → show actual botanical ingredients mentioned
   - "사용 방법" (how to use) → show hands applying product on face/skin
   - "리뷰/후기" → show a satisfied Korean woman with glowing skin
   - "장점/효과" → show before/after feeling, the specific benefit visually
2. LIGHTING: Bright, warm, soft (Korean beauty editorial style, like PEPTOIR/ANUA ads)
3. BACKGROUND: Light warm beige or white. NEVER dark.
4. NO text, logos, letters, watermarks in the image.
5. Photorealistic, Canon/Sony camera quality.

Output ONLY the image prompt (3-5 sentences). No explanation.` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
      }),
    })

    if (!res.ok) return null
    const result = await res.json()
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (text && text.length > 30) {
      console.log(`[Contextual Prompt] ${text.slice(0, 150)}...`)
      return text
    }
  } catch (err) {
    console.log('[Contextual Prompt] error:', err)
  }
  return null
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
      const prompt = await buildPrompt(style, analysis, productName, category, mood, sectionContext)
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
