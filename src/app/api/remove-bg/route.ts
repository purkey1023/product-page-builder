import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

/**
 * 누끼 따기 (배경 제거)
 * gpt-image-1으로 배경 투명화 처리
 * 또는 DALL-E 3로 배경 제거된 이미지 재생성
 */
export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: '이미지가 필요합니다.' }, { status: 400 })
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    // gpt-image-1으로 배경 제거 (이미지 편집)
    const prompt = `Remove the background from this product image completely. Make the background pure transparent (alpha channel). Keep ONLY the product itself with clean, precise edges. Do not alter the product in any way - maintain exact colors, shape, lighting, and details. Output should have a perfectly clean transparent background suitable for e-commerce product listing.`

    // 방법 1: gpt-image-1 edit API
    try {
      // FormData로 이미지 전송
      const imageBuffer = Buffer.from(imageBase64, 'base64')
      const blob = new Blob([imageBuffer], { type: 'image/png' })

      const formData = new FormData()
      formData.append('model', 'gpt-image-1')
      formData.append('image[]', blob, 'product.png')
      formData.append('prompt', prompt)
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
        console.log(`[Remove BG] gpt-image-1 edit ${res.status}: ${err.slice(0, 150)}`)
      }
    } catch (err) {
      console.log('[Remove BG] gpt-image-1 edit error:', err)
    }

    // 방법 2: gpt-image-1 generate with description
    try {
      const descRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + (process.env.GEMINI_API_KEY || ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { inlineData: { mimeType: 'image/png', data: imageBase64 } },
            { text: 'Describe this product in extreme detail for image recreation: exact shape, colors, materials, proportions, lighting direction, label text/design. 3 sentences max, English only.' },
          ] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 200 },
        }),
      })

      let productDesc = 'a beauty product'
      if (descRes.ok) {
        const descResult = await descRes.json()
        productDesc = descResult?.candidates?.[0]?.content?.parts?.[0]?.text || productDesc
      }

      const regenRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt: `Photorealistic product shot of: ${productDesc}. Shot on pure white background (#FFFFFF). Product centered, professional e-commerce product photography, clean precise edges. The product should look IDENTICAL to the original. Studio lighting, no shadows on background. Absolutely NO text modifications.`,
          n: 1,
          size: '1024x1024',
          background: 'transparent',
        }),
      })

      if (regenRes.ok) {
        const result = await regenRes.json()
        const b64 = result?.data?.[0]?.b64_json
        if (b64) {
          console.log('[Remove BG] gpt-image-1 regen 성공 ✓')
          return NextResponse.json({ image: `data:image/png;base64,${b64}` })
        }
      }
    } catch (err) {
      console.log('[Remove BG] fallback error:', err)
    }

    return NextResponse.json({ error: '배경 제거에 실패했습니다.' }, { status: 500 })
  } catch (error) {
    console.error('[/api/remove-bg]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : '처리 실패' }, { status: 500 })
  }
}
