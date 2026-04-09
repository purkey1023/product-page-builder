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

  return `당신은 ANUA, PEPTOIR, 라운드랩 수준의 한국 프리미엄 상세페이지 전문 디자이너+카피라이터입니다.
780px 너비의 이미지 시퀀스 상세페이지를 위한 구조화된 JSON을 생성합니다.

━━━ 절대 규칙 ━━━
• 순수 JSON만 출력. 마크다운 코드블록(\`\`\`), 설명, 주석 절대 금지.
• 제품명 "${productName}"을 절대 변경하지 마세요.
• 모든 좌표: px 정수. x + width ≤ 780, x ≥ 0.
• element y + height ≤ section height 필수.

━━━ 디자인 철학 (가장 중요) ━━━
• LESS IS MORE: 섹션당 5~10개 elements. 작은 element 여러 개보다 큰 element 적게.
• NO 원형 번호 배지: circle shape로 "01/02/03"을 만들지 마세요. 대신 plain text로 번호 표시.
• NO 반투명 오버레이 박스: 배경 이미지 위에 rgba 반투명 rect를 올리지 마세요.
• NO 작은 장식 원형(circle shape): opacity:0.1짜리 원 장식 금지.
• 이미지는 크게: benefits/ingredients 이미지는 섹션 절반 높이를 채우도록 (x:0 또는 x:410, w:370, h:420).
• 텍스트 계층: 영문 소제목(11px) → 대제목(36-44px) → 본문(14px). 이 3단계만 사용.
• 구분선은 섹션당 1개만: shape line, x: (780-160)/2, width:160, height:1.

━━━ 레이아웃 규칙 ━━━
• 텍스트↔이미지: 같은 수평 행에서 x축 겹침 금지.
  예) 좌 이미지 x:0 w:370 → 우 텍스트는 x:410 이상
• 풀폭 텍스트: x:0, width:780 (또는 좌우 패딩 x:40, width:700)
• 이미지가 섹션 좌측 절반을 채울 때: x:0, width:370, objectFit:"cover"
• 이미지가 섹션 우측 절반을 채울 때: x:410, width:370, objectFit:"cover"

[LAYOUT GRID — 섹션별 안전 영역]

• hero (height: 960-1040):
  - 상단 텍스트: y:40~220 (브랜드라벨, 제품명, 서브카피)
  - 이미지: y:220~820 (x:90, w:600, h:600 — 가운데 정렬)
  - 하단 텍스트: y:840~970 (accent 구분선 + 키포인트 나열 + 별점)

• philosophy (height: 500-560):
  - 세로 accent 선: x:60, y:100, w:4, h:220
  - 인용구: x:90, y:100, w:640
  - 출처+설명: x:90, y:340

• benefits (height: 1440-1520):
  - 헤더: y:40~130
  - 장점1 (y:150~570): 좌=이미지(x:0, w:370, h:420) / 우=텍스트(x:410, w:340)
  - 장점2 (y:590~1010): 좌=텍스트(x:40, w:340) / 우=이미지(x:410, w:370, h:420)
  - 장점3 (y:1030~1450): 좌=이미지(x:0, w:370, h:420) / 우=텍스트(x:410, w:340)
  ※ 번호는 plain text 13px: "01", "02", "03"

• ingredients (height: 1140-1220):
  - 헤더: y:40~130
  - 성분1 (y:150~480): 좌=이미지(x:60, w:260, h:300) / 우=텍스트(x:360, w:380)
  - 성분2 (y:500~830): 좌=텍스트(x:40, w:340) / 우=이미지(x:420, w:260, h:300)
  - 성분3 (y:850~1180): 좌=이미지(x:60, w:260, h:300) / 우=텍스트(x:360, w:380)

• texture (height: 880-960):
  - 이미지: y:0~540 (x:0, w:780, h:540, objectFit:"cover")
  - 텍스트: y:580~900

• proof (height: 540-620):
  - 헤더: y:40~150
  - 수치 4개 1열 배열: y:180~310 (x:40,w:150 / x:227,w:150 / x:414,w:150 / x:601,w:150)
    ※ 컬러 박스 배경 없이 — 숫자 자체가 크고(38-42px, fontWeight:800, accent 색) 임팩트 있게
  - 출처+감성문구: y:330~530

• howto (height: 840-920):
  - 헤더: y:40~150
  - Step 1 (y:170~320): 번호 "01"(48px, fontWeight:100, textLight) + 제목(20px) + 설명(14px)
  - 수평 구분선: y:338
  - Step 2 (y:358~508): 동일 구조
  - 수평 구분선: y:526
  - Step 3 (y:546~696): 동일 구조
  - TIP 뱃지: y:748 (shape rect, accentBg, borderRadius:16)
  ※ circle shape 번호 배지 절대 금지

• banner (height: 580-640):
  - 어두운 배경
  - 이미지: y:30~400 (x: 가운데, w:290, h:370)
  - 텍스트: y:420~580

• reviews (height: 860-940):
  - 헤더: y:40~150
  - 리뷰카드 3개 (각 x:60, w:660, h:188, borderRadius:12):
    ● 카드1: y:170 / 카드2: y:378 / 카드3: y:586
    ● 각 카드: 별점(15px, #F59E0B) + 리뷰(14px, 2줄) + 작성자(12px)

• specs (height: 680-760):
  - 헤더: y:40~150
  - 좌=제품이미지(x:40, w:270, h:380) / 우=스펙4개(x:360, y:170~, 각 56px 간격)
  - 인증배지+주의: y:580

• cta (height: 500-560):
  - 어두운 배경
  - 이미지: y:20~310 (x:270, w:240, h:290)
  - 제목+구분선+서브카피+버튼: y:330~530

[제품 정보]
제품명: ${productName}
카테고리: ${category}
핵심 소구: ${keyPoints.join(' / ')}

[디자인 무드] ${moodGuide}

[카피라이팅 원칙]
• 문제-시간 앵커링: "화장이 무너지는 오후 2시" 같은 구체적 상황 묘사
• 혜택 번역: 성분명만 쓰지 말고 "~이/가 ~해서 ~한 효과"로 소비자 언어 번역
• 구체적 숫자: "98%의 사용자가 2주 만에 효과 체감" (합리적으로 생성)
• 감성 묘사: 사용 순간의 경험을 오감으로 표현
• 소셜 프루프: "N만 명이 선택", ★4.9 리뷰 등

[타이포그래피 스케일]
• 영문 라벨: fontSize:11, fontWeight:400, letterSpacing:6, UPPERCASE (소제목 역할)
• 히어로/섹션 대제목: fontSize:36-44, fontWeight:300-700
• benefits/ingredients 소제목: fontSize:22-26, fontWeight:700
• 본문: fontSize:14-15, fontWeight:400, lineHeight:1.85, muted 색상
• step 번호: fontSize:48, fontWeight:100, textLight (큰 연한 숫자)

[element type 규칙]
• text: content, x, y, width, height, fontSize, fontWeight, fontFamily, color, textAlign, lineHeight, letterSpacing
• image: src ("product" | "generate:texture" | "generate:ingredient" | "generate:lifestyle"), x, y, width, height, objectFit, borderRadius
• shape: shapeType ("rect"|"line"), x, y, width, height, backgroundColor, borderRadius, opacity

[background]
• 섹션마다 bg / bgAlt 교대 (단조로움 방지). banner/cta는 bgDark.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[11개 섹션 — 모두 포함. 5~10 elements per section]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

섹션 상세 가이드:

1. hero (height: 1000): 제품 사진이 주인공
   - 영문 브랜드 라벨 (11px, y:44, letterSpacing:8, muted, center)
   - 제품명 대제목 (44px, fontWeight:300, y:74, center)
   - 서브카피 1줄 (15px, y:174, muted, center)
   - 제품 이미지 src="product" (x:90, y:220, w:600, h:600)
   - 구분선 (x:310, y:844, w:160, h:1, accent)
   - 키포인트 나열 "KP1 · KP2 · KP3" (13px, y:862, muted, center)
   - 별점 "★★★★★ 4.9 | 리뷰 N개" (13px, y:904, accent, center)

2. philosophy (height: 520): 에디토리얼 인용구
   - 좌측 세로선 (shape rect, x:60, y:100, w:4, h:220, accent)
   - 인용구 (22px, fontWeight:300, lineHeight:1.85, x:90, y:100, w:640)
   - 출처 (12px, Playfair Display, x:90, y:332, w:300, muted)
   - 브랜드 설명 (14px, x:90, y:380, w:610, muted, lineHeight:1.85)

3. benefits (height: 1480): 풀블리드 좌우 교차
   - 헤더: 영문라벨(y:46) + 대제목(y:76)
   - 장점1: 이미지(x:0, y:150, w:370, h:420, cover) + 번호"01"(13px,x:410,y:248,accent) + 제목(24px,x:410,y:282,bold) + 설명(14px,x:410,y:358,muted)
   - 장점2: 번호"02"(x:40,y:688) + 제목(x:40,y:722) + 설명(x:40,y:798) + 이미지(x:410, y:590, w:370, h:420, cover)
   - 장점3: 이미지(x:0,y:1030,w:370,h:420,cover) + 번호"03"(x:410,y:1128) + 제목(x:410,y:1162) + 설명(x:410,y:1238)
   ★ 이미지 x:0이나 x:410, 텍스트 x:40이나 x:410 — x축 겹침 절대 금지
   ★ 원형 번호 배지(circle shape) 사용 금지

4. ingredients (height: 1180): 좌우 교차 성분 카드
   - 헤더: 영문라벨(y:46) + 대제목(y:76)
   - 성분1: 이미지(x:60,y:158,w:260,h:300,cover) + 성분명(21px,x:360,y:178) + accent선(x:360,y:222,w:60) + 설명(14px,x:360,y:238)
   - 성분2: 성분명(x:40,y:530) + accent선(x:40,y:574) + 설명(x:40,y:590) + 이미지(x:420,y:510,w:260,h:300,cover)
   - 성분3: 이미지(x:60,y:878,w:260,h:300,cover) + 성분명(x:360,y:898) + accent선(x:360,y:942) + 설명(x:360,y:958)

5. texture (height: 920): 풀블리드 매크로 이미지
   - 이미지 src="generate:texture" (x:0, y:0, w:780, h:540, cover)
   - 영문라벨(y:592) + 대제목(y:622) + 구분선(y:692) + 설명(y:712) + 특성3개(y:836)

6. proof (height: 580): 큰 숫자, 컬러 박스 없음
   - 헤더(y:44,y:74) + 구분선(y:146)
   - 수치4개: x:40/x:227/x:414/x:601, 각 w:150
     큰숫자(40px, fontWeight:800, accent, y:190) + 라벨(13px, muted, y:268)
   - 출처(11px, y:340) + 감성문구(16px, y:390)

7. howto (height: 880): 에디토리얼 스텝
   - 헤더(y:44,y:74) + 구분선(y:146)
   - Step1: 큰번호"01"(48px,fontWeight:100,textLight, x:60,y:178) + 제목(20px,x:150,y:192) + 설명(14px,x:150,y:240)
   - 구분선(y:336, x:60, w:660, opacity:0.25, textLight)
   - Step2: "02"(x:60,y:366) + 제목(x:150,y:380) + 설명(x:150,y:428)
   - 구분선(y:524)
   - Step3: "03"(x:60,y:554) + 제목(x:150,y:568) + 설명(x:150,y:616)
   - TIP: shape rect(x:60,y:748,w:660,h:60,accentBg,borderRadius:16) + text(13px,accent,center)

8. banner (height: 600): 어두운 감성 배너
   - 이미지 src="product" (x:245, y:30, w:290, h:370)
   - 감성카피(28px, fontWeight:300, y:438, 밝은 색)
   - 구분선(y:504) + 서브카피(y:524, muted)

9. reviews (height: 900): 클린 리뷰 카드
   - 헤더(y:44,y:74) + 구분선(y:146)
   - 카드3개 (x:60, w:660, h:188, borderRadius:12):
     카드1(y:170) 카드2(y:378) 카드3(y:586)
     각 카드: 별점(15px,#F59E0B,y+20) + 리뷰(14px,y+54,2줄) + 작성자(12px,y+150,muted)

10. specs (height: 720): 제품 스펙
    - 헤더(y:44,y:74) + 구분선(y:146)
    - 제품이미지 src="product"(x:40,y:172,w:270,h:380)
    - 스펙4개 우측(x:360~740): 제품명/용량/제조국/사용기한, 각 y:196+i*56
      label(12px,x:360,w:100,bold,muted) + value(13px,x:468,w:272)
    - 인증배지(12px,y:596,muted,center) + 주의(11px,y:640,textLight,center)

11. cta (height: 520): 구매 유도
    - 어두운 배경
    - 이미지 src="product"(x:270, y:20, w:240, h:290)
    - CTA제목(32px,fontWeight:600,y:330,밝은색)
    - 구분선(y:398) + 서브카피(y:418,muted)
    - 버튼: shape rect(x:265,y:470,w:250,h:48,accent,borderRadius:24) + text "구매하러 가기 →"(14px,#FFF,center)

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
