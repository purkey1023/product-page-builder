import type { MoodType } from '@/types'

// ──────────────────────────────────────
// 무드별 디자인 가이드
// ──────────────────────────────────────
const MOOD_GUIDE: Record<MoodType, string> = {
  premium: `
색상: 배경 #0A0A0A/#1A1A1A 다크톤, 텍스트 #F5F0E8 크림, 포인트 #C9A96E 골드
폰트: 영문 Playfair Display, 본문 Noto Sans KR, weight 300-400
느낌: 고급스럽고 신뢰감, 넓은 여백, 세리프 제목, 어두운 배경 위 밝은 텍스트`,
  clean: `
색상: 배경 #FFFFFF/#F5F5F5, 텍스트 #1A1A1A, 포인트 #3B82F6 블루
폰트: Noto Sans KR, weight 300-500
느낌: 미니멀, 깔끔, 화이트 스페이스 충분, 직관적 레이아웃`,
  natural: `
색상: 배경 #FAF7F2/#EEF4EE 웜톤, 텍스트 #3D2B1F, 포인트 #6B8E5A 세이지그린
폰트: Noto Sans KR, 부드러운 weight 400
느낌: 자연스럽고 따뜻한, 둥근 모서리, 자연 소재 느낌`,
  impact: `
색상: 배경 #0D0D0D/#1A1A2E 다크, 텍스트 #FFFFFF, 포인트 #FF4444 레드
폰트: Noto Sans KR, weight 600-800 볼드
느낌: 강렬한 대비, 다이내믹, 눈에 띄는 타이포그래피`,
}

// ──────────────────────────────────────
// 구조화된 JSON 생성 프롬프트
// ──────────────────────────────────────
export function buildGeneratePrompt(
  productName: string,
  category: string,
  mood: MoodType,
  keyPoints: string[]
): string {
  const moodGuide = MOOD_GUIDE[mood]

  return `당신은 ANUA 스타일의 한국 프리미엄 상세페이지 전문 디자이너입니다.
780px 너비의 이미지 시퀀스 상세페이지를 위한 구조화된 JSON을 생성합니다.

[절대 규칙]
• JSON만 출력하세요. 마크다운 코드블록이나 설명 텍스트 금지.
• 제품명 "${productName}"을 절대 변경하지 마세요.
• 모든 x, y, width, height는 px 단위 정수입니다.
• 캔버스 너비는 780px입니다. 어떤 element도 x + width > 780 을 넘으면 안 됩니다.
• 텍스트는 한국어 위주, 영문 소제목(UPPERCASE)을 섞어 사용하세요.

[제품 정보]
제품명: ${productName}
카테고리: ${category}
핵심 소구: ${keyPoints.join(' / ')}

[디자인 무드] ${moodGuide}

[타이포그래피 스케일]
• 히어로 제목: fontSize 38-44, fontWeight 300, fontFamily "Noto Sans KR"
• 영문 라벨: fontSize 12-14, fontWeight 300-400, fontFamily "Playfair Display", letterSpacing 3-4
• 섹션 제목: fontSize 28-32, fontWeight 600
• 본문: fontSize 15-17, fontWeight 400, lineHeight 1.6-1.8
• 캡션: fontSize 12-13, 무드 색상의 muted 계열

[섹션 구성 — 반드시 8개 섹션 모두 포함]

1. hero (height: 950-1050)
   - 상단: 영문 브랜드 라벨 (14px, 가운데, letterSpacing 4)
   - 중앙: 제품명 한글 대제목 (38-44px, 가운데)
   - 서브카피 (16px, muted 색상)
   - 제품 이미지: src="product", 가운데 배치, 큰 사이즈 (width 350-420)
   - 하단: 핵심 키워드 배지 텍스트

2. benefits (height: 850-950)
   - "KEY BENEFITS" 영문 라벨
   - 핵심 장점 3개를 번호(01, 02, 03)와 함께 배치
   - 각 장점: 번호 + 제목(bold) + 설명(1-2문장)
   - 핵심 소구 "${keyPoints.join('", "')}" 기반으로 구체적 카피 작성

3. ingredients (height: 800-900)
   - 좌: 이미지 src="generate:ingredient" (300x300 정도)
   - 우: 성분명(bold) + 효과 설명
   - 소비자 언어로 "~이/가 ~해서 ~한 효과" 형태

4. texture (height: 650-750)
   - 상단: 풀폭 이미지 src="generate:texture" (width 780, height 450-500)
   - 하단: 텍스처 설명 텍스트 (가운데)

5. howto (height: 750-850)
   - "HOW TO USE" 라벨
   - STEP 01/02/03 3단계
   - 각 단계: 번호 + 설명, 가로 3열 배치 (x: 60/290/520, width: 200)

6. specs (height: 550-650)
   - "PRODUCT INFO" 라벨
   - 용량, 제조국, 사용기한, 전성분 정보 (카테고리에 맞게 적절히 생성)

7. reviews (height: 650-750)
   - "REVIEWS" 라벨
   - 리뷰 카드 2개 (shape rect 배경 + text)
   - 실제 느낌의 후기 작성

8. cta (height: 450-550)
   - 제품 이미지 src="product" (가운데, 작은 사이즈)
   - CTA 카피 (구매 유도 문구)

[element type 규칙]
• text: content, fontSize, fontWeight, fontFamily, color, textAlign, lineHeight, letterSpacing
• image: src ("product" | "generate:texture" | "generate:ingredient" | "generate:lifestyle")
• shape: shapeType ("rect"|"circle"|"line"), backgroundColor, borderRadius

[background 규칙]
• type: "color" | "gradient"
• value: hex 색상 또는 CSS linear-gradient 문자열
• 섹션마다 배경색을 교대로 변화시켜 단조로움을 방지하세요

[출력 형식 — 이 정확한 JSON 구조로 출력]
{
  "sections": [
    {
      "type": "hero",
      "height": 1000,
      "background": { "type": "color", "value": "#FAF7F2" },
      "elements": [
        {
          "type": "text",
          "content": "BRAND NAME",
          "x": 0, "y": 80, "width": 780, "height": 30,
          "fontSize": 14, "fontWeight": 300, "fontFamily": "Playfair Display",
          "color": "#999999", "textAlign": "center", "letterSpacing": 4
        },
        {
          "type": "image",
          "src": "product",
          "x": 190, "y": 300, "width": 400, "height": 500
        }
      ]
    }
  ]
}

제품 "${productName}" (${category})에 맞는 전문적이고 구매를 유도하는 카피를 작성하세요.
핵심 소구 포인트를 자연스럽게 녹여내세요.`
}
