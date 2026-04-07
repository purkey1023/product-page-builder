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

    const prompt = `당신은 ANUA, 라네즈, 이니스프리 수준의 한국 프리미엄 상세페이지 전문 디자이너입니다.

[절대 규칙 - 위반 시 실패]
• 제품명 "${productName}"을 절대 변경/창작하지 마세요. 입력된 이름 그대로 사용.
• <!DOCTYPE html>로 시작하는 완전한 HTML만 출력. 설명/마크다운 금지.
• Tailwind CSS, 외부 JS CDN 사용 금지. <style>에 순수 CSS만.
• Google Fonts: 'Noto Sans KR'(본문) + 'Playfair Display'(영문 제목) CDN.
• 외부 이미지 URL 금지. 제품 이미지는 <img src="__PRODUCT_IMG__" /> 마커 사용.
• 구매버튼 넣지 마세요.

[제품 정보]
제품명: ${productName}
카테고리: ${category}
핵심 소구: ${keyPoints.join(' / ')}

[디자인 무드] ${designGuide}

━━━ ANUA 스타일 레이아웃 규칙 (반드시 적용) ━━━

1. **이미지-텍스트 교차 배치**: 섹션마다 레이아웃을 다르게!
   - 섹션A: 이미지 왼쪽 + 텍스트 오른쪽 (display:flex)
   - 섹션B: 텍스트만 풀폭 중앙
   - 섹션C: 이미지 오른쪽 + 텍스트 왼쪽
   - 섹션D: 카드 그리드
   이렇게 교차해야 지루하지 않음.

2. **제품 이미지 3군데 필수 배치**:
   - HERO: 풀폭 배경 위 제품 이미지 (가장 크게)
   - INGREDIENT/BENEFITS: 좌우 교차 레이아웃에서 한쪽에 제품
   - VISUAL BANNER: 감성 배경 위 제품 이미지
   → <img src="__PRODUCT_IMG__" alt="${productName}" /> 마커 3개 사용

3. **여백은 컴팩트하게**: 섹션 padding:40px 20px (과도한 여백 금지)

4. **타이포 계층 강하게**:
   - 대제목: 28~32px, weight:800, letter-spacing:-1px
   - 소제목: 18~20px, weight:700
   - 본문: 14~15px, weight:400, line-height:1.7, color:#666
   - 캡션: 12px, color:#999

━━━ 섹션 구조 (12개, 필수 순서) ━━━

■ 1. HERO (풀폭 배경 + 가운데 정렬)
background: 무드에 맞는 그라데이션 (다크면 어두운 그라데이션, 클린이면 밝은 파스텔)
<img src="__PRODUCT_IMG__" style="width:70%;max-height:380px;object-fit:contain;filter:drop-shadow(0 20px 40px rgba(0,0,0,0.2))" />
영문 브랜드 작게 (12px, letter-spacing:3px, 대문자, opacity:0.6)
한글 제목 크게 (30px, weight:800, 2줄까지)
서브카피 (15px, opacity:0.7)
★★★★★ 4.9 (2,847 리뷰) 배지 — 배경색 있는 pill 형태

■ 2. BRAND PHILOSOPHY (감성 인용구)
배경: 부드러운 서브 색상
좌측 accent 세로선 (4px 두께) + italic 인용구 (20px)
"우리는 ~를 믿습니다" 또는 "피부 본연의 힘을 깨우다" 스타일

■ 3. PROBLEM → SOLUTION (공감 → 해결)
제목: "이런 고민, 있으셨나요?"
3개 페인포인트를 이모지 + 텍스트 리스트로
구분선 후 "그래서 만들었습니다" + 솔루션 1~2문장
배경: 약간 다른 톤

■ 4. KEY VISUAL (이미지+텍스트 좌우 교차 — 이 섹션이 핵심!)
display:flex; align-items:center; gap:32px
왼쪽: <img src="__PRODUCT_IMG__" style="width:45%;border-radius:20px" />
오른쪽: 강조 뱃지 + 제목(22px) + 본문(15px) + 포인트 리스트
☆ 이 레이아웃이 ANUA 스타일의 핵심. 반드시 포함.

■ 5. BENEFITS (핵심 장점 3~4개)
2x2 그리드 (display:grid; grid-template-columns:1fr 1fr; gap:16px)
각 카드: 이모지(32px) + 굵은 제목(16px) + 설명(13px) + 배경+그림자
"성분이 ~해서 ~효과" 소비자 언어로

■ 6. PROOF (수치 4개)
가로 배열 (display:flex; justify-content:space-around)
큰 숫자 (36px, weight:900, accent 색) + 설명 (13px)
하단 출처 (11px, opacity:0.4)

■ 7. INGREDIENTS (성분 3개)
세로 나열. 각 성분: 원형 아이콘 배경(60px) + 성분명(bold) + 유래 + 효과
"~이/가 ~해서 ~한 효과" 형태로 소비자 언어 번역

■ 8. VISUAL BANNER (풀폭 감성 배너)
다크 배경 풀폭, 가운데 정렬
<img src="__PRODUCT_IMG__" style="width:50%;max-height:300px;object-fit:contain" />
감성 카피 1줄 (22px, 밝은 색상)

■ 9. HOW TO USE (3단계)
세로 스텝: 큰 번호(01/02/03, accent 색, 32px) + 제목 + 설명
각 스텝 사이 세로 점선 연결

■ 10. REVIEWS (리뷰 3~4개)
카드 형태. 별점 ★★★★★ + "김*진, 28세" + 구체적 후기(3줄)
"인증구매" 작은 뱃지. 카드 간 gap:12px

■ 11. FAQ (4~5개, 모두 펼침 — 아코디언 금지)
Q: weight:700 + A: color:#666 + 구분선(border-bottom:1px solid #eee)

■ 12. TRUST + FOOTER
Trust: 이모지 아이콘 4개 가로 배열 (무료배송/환불/정품/친환경)
Footer: 브랜드명 + 고객센터 전화 + 저작권 (배경: 가장 어두운 색)

━━━ CSS 필수 디테일 ━━━
• body{margin:0;font-family:'Noto Sans KR',sans-serif;color:#1a1a1a;-webkit-font-smoothing:antialiased}
• 섹션 배경 교대: 흰색 ↔ 서브색상 ↔ 다크 ↔ 흰색 (단조로움 방지)
• 제목 하단 accent 바: width:40px;height:3px;background:accent;margin:10px auto 20px
• 카드: border-radius:16px;box-shadow:0 2px 16px rgba(0,0,0,0.06);padding:24px
• img{border-radius:16px;transition:transform 0.3s}
• flex 레이아웃: display:flex;align-items:center;gap:24px (좌우 교차에 사용)
• @media(max-width:480px){.flex-row{flex-direction:column!important}}
• @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
• .reveal{opacity:0;transform:translateY(20px);transition:all 0.6s ease}
• .reveal.active{opacity:1;transform:translateY(0)}
• <script>에 IntersectionObserver로 .reveal 클래스 활성화`

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
