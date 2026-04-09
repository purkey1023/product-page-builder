import { NextRequest, NextResponse } from 'next/server'
import type { ImageCategory } from '@/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

interface AnalyzeRequest {
  images: { id: string; base64: string }[]
  productName: string
  category: string
  // 섹션별 텍스트 컨텍스트 (이미지 매칭용)
  sectionTexts?: { sectionType: string; label: string; texts: string[] }[]
}

interface AnalyzedImage {
  id: string
  category: ImageCategory
  suggestedSection: string
  slotKey: string // 구체적 배치 위치 (예: "hero-product", "benefits-01", "ingredients-02")
  analysis: string
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json()
    const { images, productName, category, sectionTexts } = body

    if (!images?.length || !productName) {
      return NextResponse.json({ error: '필수 입력값이 없습니다.' }, { status: 400 })
    }
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    // 모든 이미지를 한번에 Gemini에게 보내서 전체 매칭
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

    // 이미지들 첨부
    for (const img of images) {
      parts.push({ inlineData: { mimeType: 'image/png', data: img.base64 } })
      parts.push({ text: `[IMAGE ID: ${img.id}]` })
    }

    // 섹션 텍스트 컨텍스트 구성
    let sectionContext = ''
    if (sectionTexts?.length) {
      sectionContext = sectionTexts.map(s =>
        `섹션: ${s.label} (${s.sectionType})\n텍스트: ${s.texts.join(' / ')}`
      ).join('\n\n')
    }

    // 전체 매칭 프롬프트
    parts.push({ text: `You are a Korean beauty product detail page designer.
You have ${images.length} images and a product page with sections.
Your job: assign each image to the BEST matching section based on the image content and section text.

PRODUCT: ${productName} (${category})

AVAILABLE SECTIONS AND THEIR TEXT CONTENT:
${sectionContext || `
- hero: 히어로 (제품명, 브랜드)
- benefits-01: 핵심 장점 1
- benefits-02: 핵심 장점 2
- ingredients-01: 핵심 성분 1
- ingredients-02: 핵심 성분 2
- ingredients-03: 핵심 성분 3
- texture-bg: 텍스처 배경
- banner-bg: 배너 배경
- specs-product: 제품 정보
- cta-product: CTA 제품
`}

MATCHING RULES:
1. PRODUCT CUTOUT (누끼/white background) → hero product, specs product, cta product
2. MODEL APPLYING PRODUCT / BEAUTY PORTRAIT → hero background, benefits section matching the text
3. TEXTURE MACRO (cream/serum on skin) → texture section, or benefits section about texture/moisture
4. INGREDIENTS (botanical/lab) → ingredients section matching the specific ingredient mentioned in text
5. LIFESTYLE (flat-lay, product with accessories) → benefits section or philosophy
6. ABSTRACT/GRADIENT → banner background, cta background

CRITICAL: Match each image to the section whose TEXT CONTENT best describes what the image shows.
- If the text says "탄력" (firming) → match with an image showing firm/smooth skin or golden serum
- If the text says "보습" (moisturizing) → match with an image showing water/moisture/dewy skin
- If the text says "성분" (ingredient) → match with botanical/ingredient image

Each image must be assigned to exactly ONE slot. No duplicates.

Respond with ONLY a JSON array (no markdown):
[
  { "id": "image_id", "category": "product|model|texture|ingredient|lifestyle|background", "suggestedSection": "hero|benefits|ingredients|texture|banner|specs|cta", "slotKey": "hero-product|benefits-01|ingredients-02|texture-bg|etc", "analysis": "1 sentence" },
  ...
]` })

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1000 },
      }),
    })

    if (!res.ok) {
      console.log(`[Analyze] Gemini ${res.status}`)
      return NextResponse.json({ error: '분석 실패' }, { status: 500 })
    }

    const result = await res.json()
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    try {
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const analyzed: AnalyzedImage[] = JSON.parse(cleaned)
      console.log('[Analyze] 매칭:', analyzed.map(a => `${a.id}→${a.slotKey}`).join(', '))
      return NextResponse.json({ images: analyzed })
    } catch {
      console.log('[Analyze] JSON 파싱 실패, 폴백')
      // 파싱 실패 시 순서대로 분배
      const slots = ['hero-product', 'benefits-01', 'benefits-02', 'ingredients-01', 'ingredients-02', 'ingredients-03', 'texture-bg', 'banner-bg', 'specs-product', 'cta-product']
      const fallback = images.map((img, i) => ({
        id: img.id,
        category: 'lifestyle' as ImageCategory,
        suggestedSection: slots[i % slots.length].split('-')[0],
        slotKey: slots[i % slots.length],
        analysis: 'fallback assignment',
      }))
      return NextResponse.json({ images: fallback })
    }
  } catch (error) {
    console.error('[/api/analyze-images]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : '분석 실패' }, { status: 500 })
  }
}
