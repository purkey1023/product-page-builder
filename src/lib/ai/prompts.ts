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

[레이아웃 철칙 — 반드시 준수]
• 텍스트와 이미지는 절대 겹치면 안 됩니다. 텍스트 영역과 이미지 영역은 y축에서 완전히 분리하세요.
• 같은 수평 행(같은 y 범위)에 있는 elements는 x축에서 겹치면 안 됩니다.
  예: 좌측 element x:0 width:380 → 우측 element는 x:400 이상이어야 함.
• 모든 element는 반드시 x + width ≤ 780, x ≥ 0 을 만족해야 합니다.
• 적은 수의 큰 element가 많은 수의 작은 element보다 좋습니다. 섹션당 5~12개 elements가 적정합니다.
• elements 사이에 최소 20px 수직 여백(gap)을 확보하세요.
• 풀폭 텍스트는 좌우 padding 40px 적용: x:40, width:700.
• 가운데 정렬 이미지: x = (780 - imageWidth) / 2.
• 빈 공간 없이 촘촘하게 배치하되, 겹침은 절대 금지.
• shape(배경 rect 등)와 그 위의 텍스트는 예외적으로 겹칠 수 있음 (배경+전경 관계).

[LAYOUT GRID — 섹션별 안전 영역 가이드]
각 섹션에서 텍스트와 이미지를 배치할 때 아래 y-zone을 참고하세요.
zone 안에서만 해당 타입의 element를 배치합니다.

• hero (height: 1000-1200):
  - 텍스트 zone: y:40 ~ y:320 (브랜드라벨, 제목, 서브카피, 구분선, 배지)
  - 이미지 zone: y:340 ~ y:940 (제품 이미지, 키워드 배지 shape는 이미지 아래)
  - 하단 텍스트 zone: y:960 ~ y:1100 (감성 카피)

• philosophy (height: 600-750):
  - 전체 텍스트 zone: y:60 ~ y:650 (세로선 shape + 인용구 + 설명)

• benefits (height: 1400-1600):
  - 헤더 zone: y:40 ~ y:160 (라벨 + 제목 + 구분선)
  - 장점1 zone: y:180 ~ y:620 (좌 이미지 x:40 w:340 / 우 텍스트 x:420 w:320)
  - 장점2 zone: y:640 ~ y:1080 (좌 텍스트 x:40 w:320 / 우 이미지 x:420 w:340) ← 좌우 반전
  - 장점3 zone: y:1100 ~ y:1500 (풀폭 카드)

• ingredients (height: 1200-1400):
  - 헤더 zone: y:40 ~ y:160
  - 성분1 zone: y:180 ~ y:520 (좌 이미지 x:40 w:220 / 우 텍스트 x:300 w:440)
  - 성분2 zone: y:540 ~ y:880 (좌 텍스트 x:40 w:440 / 우 이미지 x:520 w:220)
  - 성분3 zone: y:900 ~ y:1300 (좌 이미지 x:40 w:220 / 우 텍스트 x:300 w:440)

• texture (height: 900-1100):
  - 이미지 zone: y:0 ~ y:500 (풀폭 이미지)
  - 텍스트 zone: y:520 ~ y:1000 (라벨 + 제목 + 설명 + 특성)

• proof (height: 800-950):
  - 헤더 zone: y:40 ~ y:160
  - 수치 그리드 zone: y:180 ~ y:500 (2x2 배열, 좌 x:40 w:340 / 우 x:420 w:340)
  - 하단 zone: y:520 ~ y:850

• howto (height: 1000-1200):
  - 헤더 zone: y:40 ~ y:160
  - Step1 zone: y:180 ~ y:480
  - Step2 zone: y:500 ~ y:800
  - Step3 zone: y:820 ~ y:1100

• banner (height: 600-700):
  - 이미지 zone: y:60 ~ y:400 (가운데 제품 이미지)
  - 텍스트 zone: y:420 ~ y:650 (카피 + 구분선)

• reviews (height: 900-1050):
  - 헤더 zone: y:40 ~ y:160
  - 리뷰1 zone: y:180 ~ y:440
  - 리뷰2 zone: y:460 ~ y:720
  - 리뷰3 zone: y:740 ~ y:980

• specs (height: 800-950):
  - 헤더 zone: y:40 ~ y:160
  - 콘텐츠 zone: y:180 ~ y:750 (좌 이미지 x:40 w:280 / 우 텍스트 x:360 w:380)
  - 하단 zone: y:770 ~ y:900

• cta (height: 500-600):
  - 이미지 zone: y:40 ~ y:280
  - 텍스트+버튼 zone: y:300 ~ y:550

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
[11개 섹션 — 모두 반드시 포함. 각 섹션마다 5~12개 elements. 적고 큰 것이 좋다]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. hero (height: 1000-1200)
   ⚠ 텍스트 zone(y:40~320)과 이미지 zone(y:340~940)을 절대 섞지 마세요.
   필수 elements:
   - [y:40~320] 영문 브랜드 라벨 (12px, x:40, width:700, 가운데, letterSpacing 5, Playfair Display)
   - [y:40~320] 한글 제품명 대제목 (42-48px, fontWeight 300, x:40, width:700, 가운데)
   - [y:40~320] 서브카피 1줄 (16px, muted 색상, x:40, width:700)
   - [y:40~320] 구분선 shape (line, x:340, width 100, height 2, accent 색)
   - [y:40~320] 평점 배지 (shape rect 배경 + text "★★★★★ 4.9 (N,NNN 리뷰)")
   - [y:340~940] 제품 이미지 src="product" (가운데, width 450-500, height 550)
   - [y:960~1100] 하단 감성 카피 (20-24px, fontWeight 300, x:40, width:700)

2. philosophy (height: 600-750)
   - 좌측 accent 세로선 (shape rect, x:60, width 4, height 120)
   - 인용구 텍스트 (22-26px, fontWeight 300, lineHeight 1.8, x:100, width:600, 2줄)
   - 출처 라벨 (13px, Playfair Display italic, x:100, width:600)
   - 브랜드 설명 본문 (15px, muted, x:40, width:700)
   - 장식 원형 (shape circle, accent 색, opacity 0.1)

3. benefits (height: 1400-1600)
   ⚠ 좌우 배치 시 좌측 x:40 w:340, 우측 x:420 w:320. 절대 x축 겹침 금지.
   - [y:40~160] "KEY BENEFITS" 영문 라벨 + 한글 제목 + 구분선
   - 장점 3개 (좌우 교차 레이아웃):
     ● [y:180~620] 장점1: 좌=이미지(src="generate:lifestyle", x:40, w:340, h:380) + 우=텍스트(x:420, w:320): 번호뱃지+제목(20px bold)+설명(15px, 3줄)
     ● [y:640~1080] 장점2: 좌=텍스트(x:40, w:320) + 우=이미지(src="generate:ingredient", x:420, w:340, h:380) ← 좌우 반전
     ● [y:1100~1500] 장점3: 풀폭 카드(shape rect x:40, w:700, borderRadius 20) + 번호뱃지 + 제목 + 설명
   - 핵심 소구 "${keyPoints[0]}", "${keyPoints[1]}", "${keyPoints[2]}" 기반 구체적 카피

4. ingredients (height: 1200-1400)
   ⚠ 이미지와 텍스트를 좌우로 분리. 같은 행에서 x축 겹침 금지.
   - [y:40~160] "KEY INGREDIENTS" 영문 라벨 + 한글 제목 + 구분선
   - 성분 3개, 좌우 교차:
     ● [y:180~520] 성분1: 좌=이미지(x:40, w:220, h:260) + 우=텍스트(x:300, w:440): 성분명+구분선+설명+수치뱃지
     ● [y:540~880] 성분2: 좌=텍스트(x:40, w:440) + 우=이미지(x:520, w:220, h:260) ← 반전
     ● [y:900~1300] 성분3: 좌=이미지(x:40, w:220, h:260) + 우=텍스트(x:300, w:440)

5. texture (height: 900-1100)
   ⚠ 이미지는 상단, 텍스트는 하단. y축에서 완전 분리.
   - [y:0~500] 풀폭 이미지 src="generate:texture" (x:0, width 780, height 500, objectFit "cover")
   - [y:520~1000] "TEXTURE" 영문 라벨 + 한글 제목 (28-32px) + 구분선
   - [y:520~1000] 텍스처 설명 본문 (16px, x:40, width:700, 가운데, 3줄)
   - [y:520~1000] 특성 3개 가로 배열 (각각 w:220, x:40/x:280/x:520 — 겹침 없이)

6. proof (height: 800-950)
   ⚠ 수치 그리드는 2x2 배치: 좌 x:40 w:340, 우 x:420 w:340. 겹침 금지.
   - [y:40~160] "CLINICAL RESULTS" 영문 라벨 + 한글 제목 + 구분선
   - [y:180~500] 수치 4개 그리드 (2x2):
     ● 상단좌(x:40, y:180, w:340) + 상단우(x:420, y:180, w:340)
     ● 하단좌(x:40, y:350, w:340) + 하단우(x:420, y:350, w:340)
     ● 각각 shape rect 배경(borderRadius 16) + 큰 숫자(36px, fontWeight 800, accent 색) + 설명(13px)
   - [y:520~700] 출처 텍스트 (11px, 가장 옅은 색)
   - [y:520~850] "BEFORE & AFTER" 라벨 + 카드 2개 (좌 x:40 w:340, 우 x:420 w:340)

7. howto (height: 1000-1200)
   ⚠ 각 Step 카드를 y축으로 완전 분리. 카드끼리 겹침 금지.
   - [y:40~160] "HOW TO USE" 영문 라벨 + 한글 제목 + 구분선
   - 3단계 카드 (각 카드 x:40, w:700):
     ● [y:180~480] Step1: 카드 배경(shape rect, borderRadius 16) + 번호뱃지 + "STEP 1" 라벨 + 제목 + 설명
     ● [y:500~800] Step2: 카드 배경 + 번호뱃지 + "STEP 2" 라벨 + 제목 + 설명
     ● [y:820~1100] Step3: 카드 배경 + 번호뱃지 + "STEP 3" 라벨 + 제목 + 설명
   - 하단 TIP 뱃지 (shape rect, borderRadius 30, accent 배경)

8. banner (height: 600-700)
   ⚠ 이미지 영역과 텍스트 영역 y축 분리.
   - 어두운 배경
   - [y:60~400] 제품 이미지 src="product" (x: 가운데, width 280, height 320)
   - [y:420~650] 감성 카피 (28px, fontWeight 300, 밝은 색, x:40, width:700)
   - [y:420~650] 구분선 + 서브카피
   - 장식 원형 (shape circle, opacity 0.08-0.1, 2개 — 배경 장식이므로 겹침 허용)

9. reviews (height: 900-1050)
   ⚠ 리뷰 카드 3개는 y축으로 완전 분리. 카드끼리 겹침 금지.
   - [y:40~160] "REAL REVIEWS" 영문 라벨 + 한글 제목 + 구분선
   - 리뷰 카드 3개 (각 카드 x:40, w:700, borderRadius 16):
     ● [y:180~440] 리뷰1: 카드 배경 + 별점(16px, 금색 #F59E0B) + 리뷰 내용(14px, 3줄) + 작성자(12px, muted)
     ● [y:460~720] 리뷰2: 동일 구조
     ● [y:740~980] 리뷰3: 동일 구조

10. specs (height: 800-950)
    ⚠ 좌측 이미지와 우측 텍스트 x축 겹침 금지.
    - [y:40~160] "PRODUCT INFO" 영문 라벨 + 한글 제목 + 구분선
    - [y:180~750] 좌: 제품 이미지 src="product" (x:40, w:280, h:400)
    - [y:180~750] 우: 스펙 테이블 (x:360, w:380 — shape rect 배경 + 항목 5개)
    - [y:770~900] 인증 뱃지 (x:40, width:700) + 주의사항 (11px)

11. cta (height: 500-600)
    ⚠ 이미지 영역과 텍스트+버튼 영역 y축 분리.
    - 어두운 배경
    - [y:40~280] 제품 이미지 src="product" (x: 가운데, width 200, height 220)
    - [y:300~550] CTA 제목 (30px, fontWeight 600, 밝은 색, x:40, width:700)
    - [y:300~550] 구분선 + 서브카피
    - [y:300~550] CTA 버튼 모양 (shape rect, borderRadius 26, accent 색, x: 가운데, width 300 + text "구매하러 가기 →" 흰색)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[출력 형식 — 반드시 이 구조의 JSON만 출력. 다른 텍스트 절대 금지]
{
  "sections": [
    {
      "type": "hero",
      "height": 1100,
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

[최종 검증 체크리스트 — 출력 전 반드시 확인]
✅ 모든 element에서 x + width ≤ 780, x ≥ 0 인가?
✅ 같은 섹션 내 텍스트와 이미지가 y축에서 겹치지 않는가? (shape 배경 제외)
✅ 같은 행의 좌우 element가 x축에서 겹치지 않는가?
✅ element 사이 최소 20px 수직 여백이 있는가?
✅ 각 섹션 height 내에 모든 element가 들어가는가? (element y + height ≤ section height)
✅ 섹션당 5~12개 elements인가? (불필요하게 많은 작은 element 금지)
위 항목 중 하나라도 위반하면 수정 후 출력하세요.`
}
