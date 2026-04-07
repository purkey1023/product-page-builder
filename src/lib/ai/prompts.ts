import type { MoodType } from '@/types'

const MOOD_GUIDE: Record<MoodType, string> = {
  premium: `
색상: 배경 #0A0A0A/#141414 다크, 텍스트 #F5F0E8 크림, 포인트 #C9A96E 골드, 서브 #A89B8C
폰트: 영문 Playfair Display (italic 사용 가능), 한글 Noto Sans KR weight 300-400
느낌: ANUA, 에스티로더, 라메르 수준의 최고급 뷰티 브랜드. 어두운 배경 위 밝은 텍스트. 골드 포인트.`,
  clean: `
색상: 배경 #FFFFFF/#F7F7F7, 텍스트 #1A1A1A, 포인트 #3B82F6 블루, 서브 #888888
폰트: Noto Sans KR weight 300-500, 영문 Playfair Display
느낌: 라운드랩, 닥터지 같은 클린 뷰티. 화이트 스페이스 충분. 미니멀 직관적.`,
  natural: `
색상: 배경 #FAF7F2/#F0EDE6 웜톤, 텍스트 #3D2B1F, 포인트 #6B8E5A 세이지그린, 서브 #7A6B5A
폰트: Noto Sans KR weight 400, 영문 Playfair Display
느낌: 이니스프리, 아누아 같은 자연주의 뷰티. 따뜻하고 부드러운 톤.`,
  impact: `
색상: 배경 #0D0D0D/#1A1A2E, 텍스트 #FFFFFF, 포인트 #FF4444 레드, 서브 #AAAAAA
폰트: Noto Sans KR weight 600-800 볼드, 영문 Playfair Display
느낌: 메디큐브, VT 같은 기능성 브랜드. 강렬한 대비. 파워풀한 타이포.`,
}

export function buildGeneratePrompt(
  productName: string,
  category: string,
  mood: MoodType,
  keyPoints: string[]
): string {
  const moodGuide = MOOD_GUIDE[mood]

  return `당신은 ANUA, 라네즈, 이니스프리 수준의 한국 프리미엄 e-commerce 상세페이지 전문 디자이너+카피라이터입니다.
780px 너비의 이미지 시퀀스 상세페이지를 위한 구조화된 JSON을 생성합니다.
각 섹션은 하나의 이미지로 렌더링되며, 스마트스토어/쿠팡에 업로드됩니다.

[절대 규칙]
• 반드시 순수 JSON만 출력하세요. 마크다운 코드블록(\`\`\`), 설명, 주석 절대 금지.
• 제품명 "${productName}"을 절대 변경/창작하지 마세요.
• 모든 좌표는 px 단위 정수. 캔버스 너비 780px. x + width ≤ 780 필수.
• 한국어 카피 위주 + 영문 UPPERCASE 소제목 혼용.
• 모든 카피는 실제 상위 1% 매출 상세페이지 수준으로 작성하세요.

[제품 정보]
제품명: ${productName}
카테고리: ${category}
핵심 소구: ${keyPoints.join(' / ')}

[디자인 무드] ${moodGuide}

[카피라이팅 원칙]
• 문제-시간 앵커링: "화장이 무너지는 오후 2시" 같은 구체적 상황 묘사
• 혜택 번역: 성분명만 쓰지 말고 "~이/가 ~해서 ~한 효과"로 소비자 언어 번역
• 구체적 숫자: "98%의 사용자가 2주 만에 효과 체감" (합리적으로 생성)
• 감성 묘사: 사용 순간의 경험을 오감으로 표현 (질감, 향, 느낌)
• 소셜 프루프: "N만 명이 선택", ★4.9 리뷰 등

[타이포그래피 스케일]
• 영문 라벨: fontSize 11-13, fontWeight 400, fontFamily "Playfair Display", letterSpacing 3-5, UPPERCASE
• 히어로 제목: fontSize 40-48, fontWeight 300, fontFamily "Noto Sans KR", lineHeight 1.3
• 섹션 제목: fontSize 30-36, fontWeight 600, lineHeight 1.3
• 소제목: fontSize 18-22, fontWeight 600
• 본문: fontSize 14-16, fontWeight 400, lineHeight 1.7-1.8, color는 muted 톤
• 캡션/출처: fontSize 11-12, 가장 옅은 색상

[element type 규칙]
• text: content, x, y, width, height, fontSize, fontWeight, fontFamily, color, textAlign, lineHeight, letterSpacing
• image: src ("product" | "generate:texture" | "generate:ingredient" | "generate:lifestyle" | "generate:banner"), x, y, width, height, objectFit, borderRadius
• shape: shapeType ("rect"|"circle"|"line"), x, y, width, height, backgroundColor, borderRadius, opacity

[background 규칙]
• type: "color" | "gradient"
• value: hex 색상 또는 CSS linear-gradient()
• 섹션마다 배경색 교대 (bg / bgAlt / bgDark 순환) — 단조로움 방지

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[11개 섹션 — 모두 반드시 포함. 각 섹션마다 최소 8~20개 elements]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. hero (height: 1300-1500)
   필수 elements:
   - 영문 브랜드 라벨 (12px, 가운데, letterSpacing 5, Playfair Display)
   - 한글 제품명 대제목 (42-48px, fontWeight 300, 가운데)
   - 서브카피 1줄 (16px, muted 색상)
   - 구분선 shape (line, 가운데, accent 색, width 100, height 2)
   - 평점 배지 (shape rect 배경 + text "★★★★★ 4.9 (N,NNN 리뷰)")
   - 제품 이미지 src="product" (가운데, width 450-500, height 600)
   - 키워드 배지 3개 (shape rect 배경 + text, 가로 배열)
   - 하단 감성 카피 (20-24px, fontWeight 300, 우아한 문구)

2. philosophy (height: 700-850)
   - 좌측 accent 세로선 (shape rect, width 4, height 120)
   - 인용구 텍스트 (22-26px, fontWeight 300, lineHeight 1.8, 2줄)
   - 출처 라벨 (13px, Playfair Display italic)
   - 브랜드 설명 본문 (15px, muted)
   - 장식 원형 (shape circle, accent 색, opacity 0.1)

3. benefits (height: 1500-1700)
   - "KEY BENEFITS" 영문 라벨 + 한글 제목 + 구분선
   - 장점 3개 (좌우 교차 레이아웃):
     ● 장점1: 좌=이미지(src="generate:lifestyle", 380x380) + 우=번호뱃지(shape circle+text "01") + 제목(20px bold) + 설명(15px, 3줄)
     ● 장점2: 좌=번호뱃지+제목+설명 + 우=이미지(src="generate:ingredient", 380x380) ← 좌우 반전
     ● 장점3: 풀폭 카드(shape rect 배경 borderRadius 20) + 번호뱃지 + 제목 + 설명
   - 핵심 소구 "${keyPoints[0]}", "${keyPoints[1]}", "${keyPoints[2]}" 기반 구체적 카피
   - 하단 강조 문구

4. ingredients (height: 1300-1500)
   - "KEY INGREDIENTS" 영문 라벨 + 한글 제목 + 구분선
   - 성분 3개, 각각:
     ● 카드 배경 (shape rect, borderRadius 16)
     ● 이미지 (src="generate:ingredient" 또는 "generate:texture", 220x260)
     ● 성분명 (22px, bold)
     ● accent 구분선
     ● 효과 설명 (14px, 소비자 언어, 3-4줄)
     ● 수치 뱃지 ("자연유래 97.2%" 등)
   - 성분 카드는 좌우 교차 (이미지 좌→우→좌)

5. texture (height: 1000-1200)
   - 상단: 풀폭 이미지 src="generate:texture" (width 780, height 500-600, objectFit "cover")
   - "TEXTURE" 영문 라벨 + 한글 제목 (28-32px) + 구분선
   - 텍스처 설명 본문 (16px, 가운데, 3줄)
   - 특성 3개 가로 배열 (이모지 + 키워드)

6. proof (height: 850-1000)
   - "CLINICAL RESULTS" 영문 라벨 + 한글 제목 + 구분선
   - 수치 4개 그리드:
     ● 각각 shape rect 배경(borderRadius 16) + 큰 숫자(36px, fontWeight 800, accent 색) + 설명(13px)
     ● 예: "97.2%" 자연유래 / "2주" 효과체감 / "4.9" 만족도 / "30만+" 판매량
   - 출처 텍스트 (11px, 가장 옅은 색)
   - "BEFORE & AFTER" 라벨 + 카드 2개 (shape rect 배경)

7. howto (height: 1100-1300)
   - "HOW TO USE" 영문 라벨 + 한글 제목 + 구분선
   - 3단계, 각각:
     ● 카드 배경 (shape rect, borderRadius 16)
     ● 번호 뱃지 (shape circle, accent 색 + text "01"/"02"/"03" 흰색)
     ● "STEP N" 라벨 (11px, accent 색, letterSpacing 2)
     ● 제목 (18px, bold)
     ● 설명 (14px, 2줄)
   - 카드 사이 점선 연결 (shape line)
   - 하단 TIP 뱃지 (shape rect, borderRadius 30, accent 배경)

8. banner (height: 650-750)
   - 어두운 배경
   - 제품 이미지 src="product" (가운데, 250-300px)
   - 감성 카피 (28px, fontWeight 300, 밝은 색)
   - 구분선 + 서브카피
   - 장식 원형 (shape circle, opacity 0.08-0.1, 2개)

9. reviews (height: 950-1100)
   - "REAL REVIEWS" 영문 라벨 + 한글 제목 + 구분선
   - 리뷰 카드 3개, 각각:
     ● 카드 배경 (shape rect, borderRadius 16)
     ● 별점 ★★★★★ (16px, 금색 #F59E0B)
     ● 리뷰 내용 (14px, 3줄, 실감나게 — "인생템", "재구매", "효과 느낌" 등)
     ● 작성자 (12px, muted, "김*진, 28세 · 인증구매")

10. specs (height: 850-1000)
    - "PRODUCT INFO" 영문 라벨 + 한글 제목 + 구분선
    - 좌: 제품 이미지 src="product" (250x400)
    - 우: 스펙 테이블 (shape rect 배경 + 항목 5개: 제품명/용량/제조국/사용기한/피부타입)
    - 인증 뱃지 ("🧪 피부과 테스트 · 🌿 비건 · 🐰 크루얼티 프리")
    - 주의사항 (11px)

11. cta (height: 550-650)
    - 어두운 배경
    - 제품 이미지 src="product" (가운데, 작게)
    - CTA 제목 (30px, fontWeight 600, 밝은 색)
    - 구분선 + 서브카피
    - CTA 버튼 모양 (shape rect, borderRadius 26, accent 색 + text "구매하러 가기 →" 흰색)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[출력 형식 — 반드시 이 구조의 JSON만 출력. 다른 텍스트 절대 금지]
{
  "sections": [
    {
      "type": "hero",
      "height": 1400,
      "background": { "type": "color", "value": "#FAF7F2" },
      "elements": [
        { "type": "text", "content": "...", "x": 0, "y": 60, "width": 780, "height": 24, "fontSize": 12, "fontWeight": 400, "fontFamily": "Playfair Display", "color": "#A89B8C", "textAlign": "center", "letterSpacing": 5 },
        { "type": "image", "src": "product", "x": 140, "y": 370, "width": 500, "height": 650 },
        { "type": "shape", "shapeType": "line", "x": 340, "y": 250, "width": 100, "height": 2, "backgroundColor": "#6B8E5A" },
        ...
      ]
    },
    { "type": "philosophy", ... },
    { "type": "benefits", ... },
    { "type": "ingredients", ... },
    { "type": "texture", ... },
    { "type": "proof", ... },
    { "type": "howto", ... },
    { "type": "banner", ... },
    { "type": "reviews", ... },
    { "type": "specs", ... },
    { "type": "cta", ... }
  ]
}

제품 "${productName}" (${category})에 맞는 전문적이고 구매를 유도하는 카피를 작성하세요.
핵심 소구 포인트 "${keyPoints.join('", "')}"를 자연스럽게 녹여내세요.
각 섹션별로 최소 8개 이상의 elements를 배치하세요. 풍부하고 완성도 높은 레이아웃이 핵심입니다.`
}
