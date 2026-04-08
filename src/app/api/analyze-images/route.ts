import { NextRequest, NextResponse } from 'next/server'
import type { ImageCategory } from '@/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

interface AnalyzeRequest {
  images: { id: string; base64: string }[]
  productName: string
  category: string
}

interface AnalyzedImage {
  id: string
  category: ImageCategory
  suggestedSection: string
  analysis: string
}

const SECTION_MAP: Record<ImageCategory, string[]> = {
  product: ['hero', 'specs', 'cta'],
  model: ['hero', 'benefits', 'lifestyle'],
  texture: ['texture', 'ingredients'],
  ingredient: ['ingredients', 'benefits'],
  lifestyle: ['benefits', 'philosophy'],
  detail: ['proof', 'howto'],
  background: ['banner', 'cta', 'hero'],
}

async function analyzeOneImage(
  base64: string,
  productName: string,
  category: string
): Promise<{ category: ImageCategory; analysis: string }> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64 } },
          { text: `Classify this image for a Korean beauty/cosmetic e-commerce product detail page.
Product: ${productName} (${category})

Respond with ONLY a JSON object (no markdown):
{
  "category": "<one of: product, model, texture, ingredient, lifestyle, detail, background>",
  "analysis": "<1 sentence description in English>"
}

Categories:
- product: Product bottle/container on clean background (누끼/cutout)
- model: Person (Korean woman) using or holding product, beauty portrait
- texture: Close-up of product texture, cream/gel/serum on skin or surface
- ingredient: Natural ingredients, botanicals, lab setting, raw materials
- lifestyle: Flat-lay, lifestyle scene, product with accessories/nature elements
- detail: Close-up of product details, label, cap, dropper mechanism
- background: Abstract gradient, bokeh, blurred backdrop, mood image` },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
    }),
  })

  if (!res.ok) {
    return { category: 'lifestyle', analysis: 'Could not analyze image' }
  }

  const result = await res.json()
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''

  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleaned)
    const validCategories: ImageCategory[] = ['product', 'model', 'texture', 'ingredient', 'lifestyle', 'detail', 'background']
    const cat = validCategories.includes(parsed.category) ? parsed.category : 'lifestyle'
    return { category: cat, analysis: parsed.analysis || '' }
  } catch {
    return { category: 'lifestyle', analysis: text.slice(0, 100) }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json()
    const { images, productName, category } = body

    if (!images?.length || !productName) {
      return NextResponse.json({ error: '필수 입력값이 없습니다.' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    // 순차 분석 (rate limit)
    const analyzed: AnalyzedImage[] = []
    const usedSections = new Set<string>()

    for (const img of images) {
      console.log(`[Analyze] ${img.id} 분석 중...`)
      const result = await analyzeOneImage(img.base64, productName, category)

      // 추천 섹션 결정 (중복 방지)
      const candidates = SECTION_MAP[result.category] || ['benefits']
      const suggestedSection = candidates.find(s => !usedSections.has(s)) || candidates[0]
      usedSections.add(suggestedSection)

      analyzed.push({
        id: img.id,
        category: result.category,
        suggestedSection,
        analysis: result.analysis,
      })

      console.log(`[Analyze] ${img.id} → ${result.category} → ${suggestedSection}`)

      // Rate limit
      if (images.indexOf(img) < images.length - 1) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    return NextResponse.json({ images: analyzed })
  } catch (error) {
    console.error('[/api/analyze-images]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : '분석 실패' }, { status: 500 })
  }
}
