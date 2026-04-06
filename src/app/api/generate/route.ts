import { NextRequest, NextResponse } from 'next/server'
import type { MoodType } from '@/types'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

interface GenerateRequest {
  productName: string
  category: string
  mood: MoodType
  keyPoints: [string, string, string]
  imageBase64?: string
}

const MOOD_DESIGN: Record<string, string> = {
  premium: '배경: #0a0a0a~#1a1a2e 다크톤, 포인트: #c9a96e 골드, 텍스트: 밝은 크림색, 세리프 폰트, 넓은 여백, 고급스러운 그라데이션',
  clean: '배경: #ffffff 화이트, 포인트: #3b82f6 블루, 텍스트: #1a1a1a, 산세리프 폰트, 미니멀 레이아웃, 깔끔한 카드',
  natural: '배경: #faf8f5 웜베이지, 포인트: #6b8e5a 그린, 텍스트: #3d3d3d, 부드러운 라운드, 자연 감성 일러스트',
  impact: '배경: #111 다크, 포인트: #ff4444 레드 또는 #00c471 그린, 텍스트: 화이트, 볼드 타이포, 다이내믹 각도',
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

    const designGuide = MOOD_DESIGN[mood] || MOOD_DESIGN.clean

    const prompt = `당신은 연매출 100억 이상 한국 브랜드의 상세페이지를 제작하는 최고급 웹 디자이너 겸 카피라이터입니다.

아래 제품 정보로 **완전한 HTML 파일 1개**를 생성하세요.

━━━ 제품 정보 ━━━
제품명: ${productName}
카테고리: ${category}
핵심 소구: ${keyPoints.join(' / ')}

━━━ 디자인 무드 ━━━
${designGuide}

━━━ 반드시 지켜야 할 규칙 ━━━
1. <!DOCTYPE html>로 시작하는 완전한 HTML만 출력. 설명이나 마크다운 절대 금지.
2. Tailwind CSS, 외부 JS CDN 사용 금지. 모든 스타일은 <style> 태그에 순수 CSS.
3. Google Fonts CDN: 'Noto Sans KR' + 'Pretendard' 또는 'Playfair Display' 로드.
4. 모바일 최적화: max-width:480px, margin:0 auto, 각 섹션 width:100%.
5. 구매 버튼 넣지 마세요 (이미지용 상세페이지).
6. 이미지 자리에 <img src="__PRODUCT_IMG__" /> 마커 사용 (2~3군데 배치).
7. 외부 이미지 URL 절대 금지. 이미지 없는 데코는 CSS gradient/SVG로 처리.

━━━ 섹션 구조 (필수 순서) ━━━

■ HERO (풀폭, 임팩트 있게)
- 분위기에 맞는 배경색/그라데이션
- 제품 이미지 <img src="__PRODUCT_IMG__" style="width:80%;max-height:400px;object-fit:contain" />
- 강렬한 헤드라인 (font-size:28px~36px, font-weight:800)
- 감성적 서브카피
- ★4.9 별점 배지 + 리뷰수

■ BRAND STORY (감성 배너)
- 브랜드 철학 또는 탄생 스토리
- 큰 인용구 스타일 (font-size:20px, italic, 좌측 accent 라인)

■ PROBLEM → SOLUTION
- "이런 고민 있으셨나요?" + 3개 페인포인트
- "그래서 만들었습니다" 솔루션 선언
- 카드형 레이아웃, 아이콘/이모지 활용

■ KEY BENEFITS (핵심 장점 4개)
- 2x2 그리드 카드
- 각 카드: 큰 이모지 + 굵은 제목 + "성분이 ~해서 ~효과" 설명
- hover시 약간 올라가는 효과 (transform:translateY(-2px))

■ PROOF IN NUMBERS (수치 증거)
- 4개 수치 가로 배열 (font-size:32px~48px, font-weight:900, accent 색상)
- "수분 47%↑", "만족도 98%", "재구매율 89%" 등
- 하단에 작은 출처 표기

■ INGREDIENTS (핵심 성분 3개)
- 원형 배경 아이콘 + 성분명 + 효과 설명
- 소비자 언어로 번역 ("히알루론산이 수분을 끌어당겨 하루종일 촉촉")

■ VISUAL BANNER (풀폭 감성)
- 다크/컬러 배경 풀폭 배너
- 제품 이미지 <img src="__PRODUCT_IMG__" /> + 감성 카피 한 줄

■ HOW TO USE (3단계)
- 큰 번호(01/02/03) + 제목 + 설명
- 세로 타임라인 UI

■ REVIEWS (리뷰 4개)
- ★★★★★ + 이름(김*진, 28세) + 구체적 후기
- "인증구매" 뱃지, 카드 레이아웃

■ FAQ (5개, 모두 펼침)
- Q: 굵은 글씨 / A: 일반 글씨 + 구분선

■ TRUST BADGES
- 무료배송, 환불보장, 정품인증, 친환경 아이콘 가로 배열

■ FOOTER
- 브랜드명 + 고객센터 + 저작권

━━━ CSS 디자인 디테일 (이것이 퀄리티를 결정) ━━━
• 섹션 교대 배경: 메인/서브 색상 교대
• 제목 아래 accent 라인: width:50px; height:3px; background:accent; margin:12px auto 24px;
• 카드: border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.08); padding:28px;
• 부드러운 그라데이션: linear-gradient(180deg, color1, color2)
• 넉넉한 여백: 섹션 padding:60px 24px, 요소 간 gap:20px~32px
• 세련된 타이포: letter-spacing:-0.5px, line-height:1.5
• 텍스트 색상 계층: 제목/본문/보조 3단계
• @keyframes fadeInUp 스크롤 애니메이션 + IntersectionObserver
• 반응형 @media(max-width:480px) 대응`

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

    if (imageBase64) {
      parts.push({ inlineData: { mimeType: 'image/png', data: imageBase64 } })
      parts.push({ text: prompt + '\n\n위 제품 이미지의 색감과 분위기를 참고해서 디자인 색상과 분위기를 맞춰주세요.' })
    } else {
      parts.push({ text: prompt })
    }

    const geminiBody = {
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 32000,
      },
    }

    let html = ''

    // 1차: Gemini 시도
    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    })

    if (geminiRes.ok) {
      const result = await geminiRes.json()
      html = result?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      console.log('[Gemini] 성공, 크기:', html.length)
    } else {
      // 2차: Anthropic fallback
      console.log('[Gemini] 실패 (' + geminiRes.status + '), Anthropic fallback...')
      const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
      if (ANTHROPIC_KEY) {
        const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 12000,
            messages: [{ role: 'user', content: prompt }],
          }),
        })
        if (anthropicRes.ok) {
          const aResult = await anthropicRes.json()
          html = aResult?.content?.[0]?.text || ''
          console.log('[Anthropic] fallback 성공, 크기:', html.length)
        } else {
          const errBody = await anthropicRes.text()
          console.error('[Anthropic fallback Error]', anthropicRes.status, errBody)
          return NextResponse.json({ error: `AI 생성 실패 (Gemini: ${geminiRes.status}, Anthropic: ${anthropicRes.status})` }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: `AI 오류 (${geminiRes.status}) - Gemini 속도 제한. 잠시 후 다시 시도하세요.` }, { status: 500 })
      }
    }

    // 마크다운 코드블록 제거
    html = html.replace(/```html\s*/gi, '').replace(/```\s*/g, '')

    // DOCTYPE부터 추출
    const docMatch = html.match(/<!DOCTYPE html>[\s\S]*/i)
    if (docMatch) html = docMatch[0]

    // 닫히지 않은 HTML 처리
    if (!html.includes('</html>')) {
      if (!html.includes('</body>')) html += '\n</body>'
      html += '\n</html>'
    }

    return NextResponse.json({ html })
  } catch (error) {
    console.error('[/api/generate]', error)
    const message = error instanceof Error ? error.message : '생성 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
