import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

interface AutoStyleRequest {
  // 섹션 배경 정보
  backgroundType: 'color' | 'gradient' | 'image'
  backgroundValue: string // hex color, gradient, or image base64
  // 현재 텍스트 엘리먼트들
  texts: { id: string; content: string; fontSize: number; role: 'title' | 'subtitle' | 'body' | 'label' | 'accent' }[]
  // 무드
  mood: string
}

interface StyleResult {
  id: string
  color: string
  fontWeight: number
  fontSize?: number
}

export async function POST(req: NextRequest) {
  try {
    const body: AutoStyleRequest = await req.json()
    const { backgroundType, backgroundValue, texts, mood } = body

    if (!texts?.length) {
      return NextResponse.json({ error: '텍스트가 없습니다.' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API 키가 없습니다.' }, { status: 500 })
    }

    // Gemini에게 배경 분석 + 최적 텍스트 색상 추천 요청
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

    // 이미지 배경인 경우 이미지도 전달
    if (backgroundType === 'image' && backgroundValue.startsWith('data:')) {
      const base64 = backgroundValue.split(',')[1]
      if (base64) {
        parts.push({ inlineData: { mimeType: 'image/png', data: base64 } })
      }
    }

    const textList = texts.map((t, i) => `${i + 1}. id="${t.id}" role="${t.role}" content="${t.content.slice(0, 30)}" fontSize=${t.fontSize}`).join('\n')

    parts.push({ text: `You are a Korean beauty product page designer. Analyze this section's background and recommend optimal text colors.

BACKGROUND:
- Type: ${backgroundType}
- Value: ${backgroundType === 'color' ? backgroundValue : backgroundType === 'gradient' ? backgroundValue : '(image provided)'}

DESIGN MOOD: ${mood}

CURRENT TEXT ELEMENTS:
${textList}

Rules:
- If background is DARK (black, dark gray, dark brown): use LIGHT text colors (#F5F0E8, #FFFFFF, #E8E0D0)
- If background is LIGHT (white, beige, cream): use DARK text colors (#1A1A1A, #3D2B1F, #333333)
- If background is an IMAGE: analyze the dominant color/brightness and choose contrasting text colors
- title: should be the most prominent (bold, largest contrast)
- subtitle: slightly muted version of title color
- body: muted color for readability
- label: accent color (teal, gold, green etc. matching the mood)
- accent: strong brand color

Respond with ONLY a JSON array (no markdown):
[
  { "id": "...", "color": "#HEXCOLOR", "fontWeight": 600 },
  ...
]` })

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: '분석 실패' }, { status: 500 })
    }

    const result = await res.json()
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    try {
      const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const styles: StyleResult[] = JSON.parse(cleaned)
      return NextResponse.json({ styles })
    } catch {
      // 파싱 실패 시 기본 스타일 추천
      const isDark = backgroundType === 'color' && isColorDark(backgroundValue)
      const defaultColor = isDark ? '#F5F0E8' : '#1A1A1A'
      const defaultMuted = isDark ? '#A89B8C' : '#888888'
      return NextResponse.json({
        styles: texts.map((t) => ({
          id: t.id,
          color: t.role === 'body' || t.role === 'label' ? defaultMuted : defaultColor,
          fontWeight: t.role === 'title' ? 600 : t.role === 'subtitle' ? 500 : 400,
        })),
      })
    }
  } catch (error) {
    console.error('[/api/auto-style]', error)
    return NextResponse.json({ error: '처리 실패' }, { status: 500 })
  }
}

function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '')
  if (c.length !== 6) return false
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}
