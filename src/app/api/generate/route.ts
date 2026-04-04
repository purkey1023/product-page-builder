import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildGeneratePrompt } from '@/lib/ai/prompts'
import { buildSectionsFromGenerated } from '@/lib/sections'
import type { MoodType, GenerateApiResponse } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface GenerateRequest {
  productName: string
  category: string
  mood: MoodType
  keyPoints: [string, string, string]
  imageBase64?: string // 선택적 이미지 분석
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    const { productName, category, mood, keyPoints, imageBase64 } = body

    // 기본 유효성 검사
    if (!productName || !category || !mood || !keyPoints?.length) {
      return NextResponse.json({ error: '필수 입력값이 없습니다.' }, { status: 400 })
    }

    const userPrompt = buildGeneratePrompt({ productName, category, mood, keyPoints })

    // 이미지 있으면 vision 모드
    const messageContent: Anthropic.MessageParam['content'] = imageBase64
      ? [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: imageBase64 },
          },
          {
            type: 'text',
            text: userPrompt + '\n\n위 제품 이미지를 참고해 제품 특성에 맞는 카피를 작성하세요.',
          },
        ]
      : userPrompt

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system:
        '당신은 한국 이커머스 상세페이지 전문 카피라이터입니다. 반드시 순수 JSON만 출력하고 설명, 마크다운, 코드블록은 절대 포함하지 마세요.',
      messages: [{ role: 'user', content: messageContent }],
    })

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // JSON 블록 안전 추출 (AI가 ```json으로 감싸는 경우 처리)
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
