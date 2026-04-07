import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: '이미지가 필요합니다.' }, { status: 400 })
    }
    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    // 방법 1: gpt-image-1 edit API (배경 제거)
    try {
      const imageBuffer = Buffer.from(imageBase64, 'base64')
      const blob = new Blob([imageBuffer], { type: 'image/png' })

      const formData = new FormData()
      formData.append('model', 'gpt-image-1')
      formData.append('image[]', blob, 'product.png')
      formData.append('prompt', 'Remove the background completely. Keep ONLY the product with clean precise edges. Make the background fully transparent. Do not alter the product at all — keep exact same colors, shape, details, and lighting.')
      formData.append('background', 'transparent')
      formData.append('size', '1024x1024')

      const res = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: formData,
      })

      if (res.ok) {
        const result = await res.json()
        const b64 = result?.data?.[0]?.b64_json
        if (b64) {
          console.log('[Remove BG] gpt-image-1 edit 성공 ✓')
          return NextResponse.json({ image: `data:image/png;base64,${b64}` })
        }
      } else {
        const err = await res.text()
        console.log(`[Remove BG] edit ${res.status}: ${err.slice(0, 200)}`)
      }
    } catch (err) {
      console.log('[Remove BG] edit error:', err)
    }

    // 방법 2: Gemini로 제품 분석 → gpt-image-1로 투명 배경 재생성
    try {
      const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
      let productDesc = 'a skincare product'

      if (GEMINI_KEY) {
        const descRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [
                { inlineData: { mimeType: 'image/png', data: imageBase64 } },
                { text: 'Describe this product for image recreation: exact container type, shape, size, all colors, cap/dropper details, label layout. 3 sentences, English.' },
              ] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
            }),
          }
        )
        if (descRes.ok) {
          const r = await descRes.json()
          productDesc = r?.candidates?.[0]?.content?.parts?.[0]?.text || productDesc
        }
      }

      const regenRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: `Exact photorealistic recreation of: ${productDesc}. Product ONLY, centered, with TRANSPARENT background. Professional e-commerce product photography, clean sharp edges, studio lighting. The product must look identical to the original. NO text modifications, NO added elements.`,
          n: 1,
          size: '1024x1024',
          quality: 'high',
          background: 'transparent',
        }),
      })

      if (regenRes.ok) {
        const result = await regenRes.json()
        const b64 = result?.data?.[0]?.b64_json
        if (b64) {
          console.log('[Remove BG] regen transparent 성공 ✓')
          return NextResponse.json({ image: `data:image/png;base64,${b64}` })
        }
      }
    } catch (err) {
      console.log('[Remove BG] regen error:', err)
    }

    return NextResponse.json({ error: '배경 제거에 실패했습니다.' }, { status: 500 })
  } catch (error) {
    console.error('[/api/remove-bg]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : '처리 실패' }, { status: 500 })
  }
}
