import { NextRequest, NextResponse } from 'next/server'
import { buildGeneratePrompt } from '@/lib/ai/prompts'
import { buildSectionsFromGenerated } from '@/lib/sections'
import type { MoodType, GenerateApiResponse } from '@/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

interface GenerateRequest {
  productName: string
  category: string
  mood: MoodType
  keyPoints: [string, string, string]
  imageBase64?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    const { productName, category, mood, keyPoints, imageBase64 } = body

    if (!productName || !category || !mood || !keyPoints?.length) {
      return NextResponse.json({ error: '필수 입력값이 없습니다.' }, { status: 400 })
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    const userPrompt = buildGeneratePrompt({ productName, category, mood, keyPoints })
    const systemPrompt = '당신은 한국 이커머스 상세페이지 전문 카피라이터입니다. 반드시 순수 JSON만 출력하고 설명, 마크다운, 코드블록은 절대 포함하지 마세요.'

    // Gemini API 요청
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

    if (imageBase64) {
      parts.push({
        inlineData: { mimeType: 'image/png', data: imageBase64 },
      })
      parts.push({
        text: userPrompt + '\n\n위 제품 이미지를 참고해 제품 특성에 맞는 카피를 작성하세요.',
      })
    } else {
      parts.push({ text: userPrompt })
    }

    const geminiBody = {
      contents: [{ role: 'user', parts }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('[Gemini API Error]', response.status, errBody)
      return NextResponse.json(
        { error: `AI API 오류 (${response.status})` },
        { status: 500 }
      )
    }

    const geminiResult = await response.json()
    const rawText = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || ''

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[generate] 파싱 실패. raw:', rawText)
      return NextResponse.json({ error: 'AI 응답 파싱 실패' }, { status: 500 })
    }

    const generated: GenerateApiResponse = JSON.parse(jsonMatch[0])
    const sections = buildSectionsFromGenerated(generated.sections, mood)

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('[/api/generate]', error)
    const message = error instanceof Error ? error.message : '생성 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
