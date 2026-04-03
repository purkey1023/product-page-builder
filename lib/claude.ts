import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

/* ─── API Key (2중 폴백) ─── */
function getApiKey(): string {
  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") {
    try {
      const envPath = path.resolve(process.cwd(), ".env.local");
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
      if (match) { apiKey = match[1].trim(); process.env.ANTHROPIC_API_KEY = apiKey; }
    } catch { /* ignore */ }
  }
  if (!apiKey || apiKey === "your-api-key-here") {
    throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
  }
  return apiKey;
}
function getClient() { return new Anthropic({ apiKey: getApiKey() }); }

/* ─── RPM 보호 ─── */
let lastRequestTime = 0;
async function waitForRateLimit() {
  const now = Date.now();
  const gap = now - lastRequestTime;
  if (lastRequestTime > 0 && gap < 5000) {
    await new Promise(r => setTimeout(r, 5000 - gap));
  }
  lastRequestTime = Date.now();
}

/* ─── 재시도 (rate limit 감지 시) ─── */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, baseDelay = 65000): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await waitForRateLimit();
      return await fn();
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const isRate = e?.status === 429 ||
        (err instanceof Error && (err.message.includes("rate_limit") || err.message.includes("rate limit")));
      if (isRate && attempt < maxRetries) {
        // x-should-retry:false인 경우에도 65초 후 재시도 (분 단위 윈도우 초기화 대기)
        const wait = baseDelay * (attempt + 1);
        console.log(`[Rate Limit] ${Math.round(wait / 1000)}초 대기 후 재시도 (${attempt + 1}/${maxRetries})...`);
        lastRequestTime = 0;
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
  throw new Error("재시도 횟수 초과");
}

/* ─── 타입 ─── */
export interface AnalysisResult {
  sections: { type: string; description: string; order: number }[];
  colorPalette: { primary: string; secondary: string; accent: string; background: string; text: string; gradient1: string; gradient2: string };
  typography: { headingStyle: string; bodyStyle: string; tone: string };
  layoutPattern: string;
  copyStyle: string;
  overallImpression: string;
  designDetails: { spacing: string; borderRadius: string; shadowStyle: string; animationStyle: string; imageStyle: string };
}

export interface ProductInfo {
  name: string; price: string; shortDescription: string;
  features: string[]; detailDescription: string;
  targetAudience: string;
  tone: "premium" | "casual" | "trustworthy" | "trendy";
  images: string[];
}

/* ─── 분석 결과 압축 (토큰 절약) ─── */
function compressAnalysis(a: AnalysisResult): string {
  return JSON.stringify({
    colors: a.colorPalette,
    tone: a.typography.tone.slice(0, 60),
    layout: a.layoutPattern.slice(0, 100),
    copy: a.copyStyle.slice(0, 80),
    design: { radius: a.designDetails.borderRadius.slice(0, 40), shadow: a.designDetails.shadowStyle.slice(0, 40) },
  });
}

/* ─── 레퍼런스 분석 ─── */
export async function analyzeReferences(screenshots: { url: string; base64: string }[]): Promise<AnalysisResult> {
  const content: Anthropic.Messages.ContentBlockParam[] = [];
  for (const s of screenshots) {
    content.push({ type: "text", text: `URL: ${s.url}` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: s.base64 } });
  }
  content.push({
    type: "text",
    text: `위 상품페이지를 분석하세요. JSON만 반환하세요:
{"sections":[{"type":"","description":"(60자)","order":1}],"colorPalette":{"primary":"#hex","secondary":"#hex","accent":"#hex","background":"#hex","text":"#hex","gradient1":"#hex","gradient2":"#hex"},"typography":{"headingStyle":"(50자)","bodyStyle":"(50자)","tone":"(50자)"},"layoutPattern":"(80자)","copyStyle":"(60자)","overallImpression":"(60자)","designDetails":{"spacing":"(40자)","borderRadius":"(30자)","shadowStyle":"(30자)","animationStyle":"(40자)","imageStyle":"(40자)"}}`
  });

  const res = await withRetry(() =>
    getClient().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content }],
    })
  );
  const text = res.content[0].type === "text" ? res.content[0].text : "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("분석 결과 파싱 실패");
  return JSON.parse(m[0]);
}

/* ─── 상품페이지 생성 ─── */
export async function generateProductPage(analysis: AnalysisResult, product: ProductInfo): Promise<string> {
  const toneStyle = {
    premium: "화이트 베이스, 골드 포인트, 고급스러운 세리프 폰트, 넓은 여백",
    casual: "파스텔 컬러, 둥근 모서리, 친근한 말투, 생동감 있는 레이아웃",
    trustworthy: "블루/네이비 포인트, 인증 마크 강조, 데이터/수치 중심, 깔끔한 그리드",
    trendy: "강렬한 컬러 대비, 볼드 타이포, 다이내믹 레이아웃, 밀레니얼 감성",
  }[product.tone];

  const images = (() => {
    const safe = product.images.filter(i => !i.startsWith("data:"));
    if (safe.length) return safe.map((u, i) => `img${i + 1}: ${u}`).join(", ");
    return "이미지 자리에는 외부 URL 사용 금지. 대신 인라인 SVG 그라데이션 배경 사용. 예: <div style='width:100%;aspect-ratio:1;background:linear-gradient(135deg,#f5f5f5,#e0e0e0);display:flex;align-items:center;justify-content:center;border-radius:var(--radius-card);'><svg width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='#ccc' stroke-width='1'><rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='M21 15l-5-5L5 21'/></svg></div>";
  })();

  const ref = compressAnalysis(analysis);

  // ★ 한국 이커머스 CRO 리서치 기반 (올리브영/무신사/라네즈/설화수/쿠팡 패턴 분석)
  // 카피 공식: 문제 공감 → 수치 증거 → 감성 스토리텔링 → 신뢰 → CTA
  // 한국 불확실성 회피 지수 85 → 상세 정보 필수, 리뷰 97.2% 확인
  const prompt = `당신은 올리브영·무신사·29CM·마켓컬리 수준의 한국 상세페이지 전문가입니다.
"팔리는 페이지"를 만듭니다. 구매 버튼은 넣지 마세요 (상세페이지 이미지용).

[레퍼런스] ${ref}
[상품명] ${product.name} [가격] ${product.price}
[설명] ${product.shortDescription}
[특징] ${product.features.filter(f => f.trim()).join(" · ")}
[상세] ${product.detailDescription.slice(0, 200)}
[타겟] ${product.targetAudience}
[디자인] ${toneStyle}
[이미지] ${images}

━━━ 한국형 전환율 극대화 섹션 구조 ━━━

① HERO: 흰 배경, 상품 이미지(대형) + 강렬한 헤드라인(소비자 욕망/고민을 자극). 별점 ★4.9 + 리뷰수 뱃지. 한 줄 서브카피. "N만 명이 선택한" 소셜 프루프 작게.

② BRAND STORY: 브랜드 철학 또는 제품 탄생 배경. 감성적 인용구 스타일. "솔직히 말하면, 이 제품을 만든 이유는..." 같은 진정성 카피.

③ PROBLEM → SOLUTION: "이런 고민, 있으셨나요?" 고객 페인포인트 3가지(아이콘+텍스트) 나열 → "그래서 만들었습니다" 솔루션 선언. 공감 우선.

④ KEY BENEFITS: 핵심 장점 4개. SVG 아이콘 + 굵은 제목 + 성분→효과 번역("히알루론산이 피부 속 수분을 끌어당겨 하루종일 촉촉"). 카드형 그리드.

⑤ PROOF IN NUMBERS: 임상/실험 결과 수치 4개 크게 표시("수분 47%↑", "만족도 98%", "재구매율 89%"). font-size:3rem+. 출처 작게 표기. 카운트업 애니메이션.

⑥ INGREDIENT/TECH: 핵심 성분 3가지. 원형 아이콘 + 성분명 + 유래 + "왜 효과적인지" 소비자 언어로 설명. 고급감.

⑦ VISUAL STORY: 풀폭 감성 배너. 제품 사용 장면 이미지 + 감성 카피 한 줄. 또는 Before→After 비주얼.

⑧ HOW TO USE: 사용법 3단계. 타임라인/넘버링 UI. 아이콘+제목+설명. "딱 이것만 하세요".

⑨ REAL REVIEWS: 실제 후기 4개. 별점★★★★★ + 구매자 이니셜(김*진 28세) + 구체적 사용 경험("2주 써봤는데 정말 다릅니다") + 인증구매 뱃지.

⑩ COMPARISON: 기존 제품 vs 우리 제품 비교표. 5항목. 체크/X 아이콘. 우리 컬럼 하이라이트.

⑪ FAQ: 5개 질문/답변 모두 펼쳐진 상태로 표시. 아코디언/토글/+버튼 사용 금지. 질문(굵은 글씨) + 바로 아래 답변 형태. 깔끔한 구분선.

⑫ TRUST BADGES: 무료배송 · 환불보장 · 정품인증 · 테스트완료 · 친환경패키지. 아이콘 그리드 가로배열.

⑬ FOOTER: 브랜드명, 고객센터, 정책 링크, 저작권.

━━━ 카피라이팅 규칙 ━━━
• 문제-시간 앵커링: "화장이 무너지는 오후 2시" 같은 구체적 상황 묘사
• 혜택 번역: 성분명만 쓰지 말고 "~해서 ~한 효과" 로 번역
• 구체적 숫자: "98%의 사용자가 2주 만에 효과를 느꼈습니다"
• 감성적 묘사: 제품 사용 순간의 경험을 감각적으로 표현
• 핵심 메시지 1개: 전체 페이지가 하나의 메시지를 강화하도록
• 구매 버튼, 결제 관련 UI 절대 넣지 마세요 (상세페이지 이미지 전용)

━━━ 디자인 코드 규칙 ━━━
• Google Fonts: Noto Sans KR + Playfair Display CDN
• Tailwind CSS CDN
• <style>에 :root CSS 변수 필수:
  --bg-main:#ffffff; --bg-dark:#1a1a2e; --bg-section:#f8f8f6;
  --color-primary:#1a1a2e; --color-accent:#c9a96e;
  --color-text:#1a1a1a; --color-text-muted:#6b6b6b;
  --font-heading:'Playfair Display',serif; --font-body:'Noto Sans KR',sans-serif;
  --radius-card:16px;
• @keyframes fadeInUp, slideInLeft 등 스크롤 애니메이션
• .animate-on-scroll{opacity:0;transform:translateY(30px);transition:all 0.7s ease}
• <script>에 IntersectionObserver JS (FAQ는 펼침 상태, 아코디언 금지)
• 섹션 여백: py-20~py-32 (padding:80px 0~120px 0)
• 반응형: 모바일 퍼스트, max-w-6xl mx-auto px-4
• 모든 스타일에 var() CSS 변수 사용
• 외부 이미지 URL 절대 사용 금지 (placehold.co, unsplash, via.placeholder 등). 이미지 자리는 인라인 SVG 그라데이션 플레이스홀더만 사용.
• 아코디언/펼치기/접기/+ 버튼 절대 금지. 모든 콘텐츠는 펼친 상태로 표시.
• 마크다운 코드블록 절대 금지
• <!DOCTYPE html>로 시작하는 완전한 HTML 파일만 출력

━━━ 스마트스토어 상세이미지 기준 ━━━
• 각 섹션을 <section data-slice="1">, <section data-slice="2"> ... 형태로 data-slice 속성 부여
• 각 섹션 너비 860px 고정 (스마트스토어 상세이미지 기준), max-width:860px, margin:0 auto
• 섹션 간 여백 최소화 (각 섹션이 독립 이미지로 슬라이스됨을 고려)
• 배경색은 반드시 섹션 내부에 포함 (투명 배경 금지)`;

  const res = await withRetry(() =>
    getClient().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 12000,
      messages: [{ role: "user", content: prompt }],
    })
  );

  let html = res.content[0].type === "text" ? res.content[0].text : "";
  html = html.replace(/```html\s*/gi, "").replace(/```\s*/g, "");

  const docMatch = html.match(/<!DOCTYPE html>[\s\S]*/i);
  if (docMatch) html = docMatch[0];

  // HTML이 잘린 경우: 최소 컨텍스트로 continuation (토큰 절약)
  if (!html.includes("</html>")) {
    // 마지막 500자만 컨텍스트로 사용 (continuation 토큰 최소화)
    const tail = html.slice(-500);
    const contRes = await withRetry(() =>
      getClient().messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 5000,
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: `...${tail}` },
          { role: "user", content: "계속해서 </body></html>까지 완성해주세요. HTML 코드만 반환하세요." },
        ],
      })
    );
    const cont = contRes.content[0].type === "text" ? contRes.content[0].text : "";
    html = html + cont.replace(/```html\s*/gi, "").replace(/```\s*/g, "");
  }

  // 최후 수단: 여전히 잘려있으면 강제로 닫기
  if (!html.includes("</html>")) {
    if (!html.includes("</body>")) html += "\n</body>";
    html += "\n</html>";
  }

  return html;
}

export default getClient;
