import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { MoodType, GeneratedSectionData } from '@/types'
import { buildGeneratePrompt } from '@/lib/ai/prompts'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

interface GenerateRequest {
  productName: string
  category: string
  mood: MoodType
  keyPoints: [string, string, string]
}

function parseJSON(raw: string): { sections: GeneratedSectionData[] } | null {
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  cleaned = cleaned.slice(start, end + 1)
  try {
    const parsed = JSON.parse(cleaned)
    if (parsed.sections && Array.isArray(parsed.sections)) return parsed
    return null
  } catch {
    return null
  }
}

async function generateWithClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY 없음')
  const client = new Anthropic({ apiKey: ANTHROPIC_KEY })
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = message.content.find((b) => b.type === 'text')
  return textBlock?.text ?? ''
}

async function generateWithGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY 없음')
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32000,
        responseMimeType: 'application/json',
      },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}`)
  const result = await res.json()
  return result?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    const { productName, category, mood, keyPoints } = body

    if (!productName || !category || !mood || !keyPoints?.length) {
      return NextResponse.json({ error: '필수 입력값이 없습니다.' }, { status: 400 })
    }

    const prompt = buildGeneratePrompt(productName, category, mood, keyPoints)
    let raw = ''
    let provider = ''

    // 1차: Gemini (JSON 모드 지원, 큰 출력)
    try {
      raw = await generateWithGemini(prompt)
      provider = 'Gemini'
      console.log(`[Gemini] 성공, 크기: ${raw.length}`)
    } catch (err) {
      console.log(`[Gemini] 실패:`, err)
      // 2차: Claude 폴백
      try {
        raw = await generateWithClaude(prompt)
        provider = 'Claude'
        console.log(`[Claude] fallback 성공, 크기: ${raw.length}`)
      } catch (err2) {
        console.error('[Claude fallback]', err2)
        return NextResponse.json({ error: 'AI 생성 실패. 잠시 후 다시 시도하세요.' }, { status: 500 })
      }
    }

    let parsed = parseJSON(raw)

    // 파싱 실패 시 1회 재시도
    if (!parsed) {
      console.log(`[${provider}] JSON 파싱 실패, 재시도...`)
      try {
        raw = GEMINI_API_KEY ? await generateWithGemini(prompt) : await generateWithClaude(prompt)
        parsed = parseJSON(raw)
      } catch { /* ignore */ }
    }

    if (!parsed) {
      return NextResponse.json({ error: 'AI 응답 파싱 실패. 다시 시도해주세요.' }, { status: 500 })
    }

    // 11개 섹션 모두 있는지 검증
    console.log(`[${provider}] ${parsed.sections.length}개 섹션 생성, 총 elements: ${parsed.sections.reduce((s, sec) => s + (sec.elements?.length || 0), 0)}개`)

    return NextResponse.json({ sections: parsed.sections, provider })
  } catch (error) {
    console.error('[/api/generate]', error)
    const message = error instanceof Error ? error.message : '생성 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
