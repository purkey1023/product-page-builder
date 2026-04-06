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
  imageCount?: number;
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

  const ref = compressAnalysis(analysis);

  const prompt = `당신은 연 매출 100억 이상 브랜드의 상품 상세페이지를 제작하는 최고급 웹 디자이너입니다.
올리브영, 무신사, 29CM, 라네즈 공식몰 수준의 프리미엄 상세페이지를 만듭니다.

[상품명] ${product.name}
[가격] ${product.price}
[한줄] ${product.shortDescription}
[특징] ${product.features.filter(f => f.trim()).join(" / ")}
[상세] ${product.detailDescription.slice(0, 300)}
[타겟] ${product.targetAudience}
[톤] ${toneStyle}
[레퍼런스] ${ref}

━━━ 필수 출력 형식 ━━━
• <!DOCTYPE html>로 시작하는 완전한 HTML 파일 1개만 출력
• 마크다운 코드블록(\`\`\`) 절대 사용하지 마세요
• 구매버튼/결제 UI 넣지 마세요

━━━ 핵심 디자인 규칙 (반드시 지켜야 함) ━━━

1. **Tailwind 사용 금지**. 모든 스타일은 <style> 태그에 순수 CSS로 작성.
2. Google Fonts CDN으로 'Noto Sans KR'(본문) + 'Playfair Display'(제목) 로드.
3. <style>에 CSS 변수 선언:
   :root { --bg:#ffffff; --bg2:#f8f7f4; --dark:#1a1a2e; --accent:#c9a96e; --text:#1a1a1a; --muted:#888; --heading:'Playfair Display',serif; --body:'Noto Sans KR',sans-serif; --radius:16px; }
4. body { font-family:var(--body); color:var(--text); margin:0; line-height:1.7; }
5. 섹션마다 padding: 80px 20px; max-width: 800px; margin: 0 auto;
6. 이미지 자리에 <img src="__PRODUCT_IMG__" /> 넣기 (2군데: HERO + VISUAL 섹션)
7. 이미지 없는 섹션의 시각적 요소: CSS gradient 배경의 div 사용
8. 스크롤 애니메이션: IntersectionObserver로 .reveal 클래스 토글

━━━ 섹션 구조 (순서 반드시 지킬 것) ━━━

■ HERO
큰 상품 이미지(<img src="__PRODUCT_IMG__" style="width:100%;max-height:480px;object-fit:contain" />)
대형 헤드라인 (font-size:2.8rem, font-family:var(--heading), font-weight:700, letter-spacing:-1px)
서브카피 (font-size:1.1rem, color:var(--muted))
별점 ★★★★★ 4.9 (1,247 리뷰) 뱃지 (배경:#FFF8E7, 색:#D4A017, border-radius:30px)
가격 표시 (font-size:2rem, font-weight:800)

■ BRAND STORY
"우리는 왜 이 제품을 만들었는가" 감성 스토리텔링
큰 인용구 스타일 (font-size:1.5rem, font-style:italic, border-left:4px solid var(--accent))
브랜드 철학 2~3문장

■ PROBLEM → SOLUTION
"이런 고민, 있으셨나요?" 섹션 타이틀
3개 페인포인트 카드 (아이콘 + 제목 + 설명)
"그래서 만들었습니다" 솔루션 선언
카드: background:white, border-radius:var(--radius), box-shadow:0 4px 20px rgba(0,0,0,0.06), padding:32px

■ KEY BENEFITS
4개 혜택 2x2 그리드 (display:grid; grid-template-columns:1fr 1fr; gap:24px)
각 카드: 큰 아이콘/이모지(font-size:2.5rem) + 굵은 제목 + "성분이 ~해서 ~효과" 설명
카드 hover:transform:translateY(-4px) 효과

■ PROOF (임상 수치)
4개 수치 가로 배열 (display:flex, justify-content:center, gap:40px)
각 수치: 큰 숫자(font-size:3rem, font-weight:900, color:var(--accent)) + 설명 + 출처

■ INGREDIENTS
3개 핵심 성분, 원형 아이콘 배경(width:80px,height:80px,border-radius:50%,background:var(--bg2))
성분명(굵게) + 유래 + 소비자 언어 효과 설명

■ VISUAL BANNER
풀폭 배경(background:var(--dark), color:white, padding:100px 20px, text-align:center)
<img src="__PRODUCT_IMG__" /> 또는 감성 카피 (font-size:2rem, font-family:var(--heading))

■ HOW TO USE
3단계 (큰 숫자 01/02/03 + 제목 + 설명)
세로 타임라인 또는 가로 스텝 UI

■ REVIEWS
4개 리뷰 카드 (별점 ★★★★★ + 이름(김*진, 28세) + 구체적 후기 + "인증구매" 뱃지)
카드 배경:white, 그림자, border-radius

■ COMPARISON TABLE
5개 항목 비교표 (일반 제품 vs 우리 제품)
우리 제품 컬럼 하이라이트(background:rgba(201,169,110,0.1))
✓ / ✗ 아이콘 사용

■ FAQ
5개 Q&A 모두 펼쳐진 상태 (아코디언 금지)
Q: font-weight:700 + A: color:var(--muted) + 구분선(border-bottom)

■ TRUST BADGES
아이콘 5개 가로 배열 (무료배송/환불보장/정품인증/테스트완료/친환경)

■ FOOTER
브랜드명 + 고객센터 + 정책 링크 + 저작권

━━━ CSS 디자인 디테일 (고급 퀄리티 핵심) ━━━
• 섹션 교대 배경: 흰색(var(--bg))과 크림(var(--bg2)) 교대 사용
• 제목 아래 accent 라인: width:60px; height:3px; background:var(--accent); margin:16px auto 32px;
• 카드 호버 효과: transition:all 0.3s; &:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.1)}
• 부드러운 그라데이션 배경: linear-gradient(135deg, #f8f7f4 0%, #ffffff 100%)
• 넉넉한 여백: 섹션 간 padding 80~120px, 요소 간 gap 24~40px
• 세련된 타이포: 제목은 var(--heading), letter-spacing:-0.5px~-1px
• 텍스트 색상 계층: 제목 var(--text), 본문 #444, 보조 var(--muted)
• 반응형: @media(max-width:768px) 그리드→1열, 폰트 축소`;


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

  // ─── 이미지 삽입 (Claude가 마커를 안 쓸 수 있으므로 강제 삽입) ───
  const realImages = product.images.filter(img => img.startsWith("data:"));
  const svgPlaceholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' fill='%23f0f0f0'%3E%3Crect width='800' height='600'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='32' fill='%23ccc'%3EProduct Image%3C/text%3E%3C/svg%3E`;

  if (realImages.length > 0) {
    // 방법 1: __PRODUCT_IMG__ 마커가 있으면 순서대로 교체
    let imgIndex = 0;
    html = html.replace(/__PRODUCT_IMG__/g, () => {
      const src = realImages[imgIndex % realImages.length];
      imgIndex++;
      return src;
    });

    // 방법 2: 마커가 하나도 없었으면 → 섹션 기반으로 강제 삽입
    if (imgIndex === 0) {
      const imgTag = (src: string) =>
        `<div style="text-align:center;padding:20px 0;"><img src="${src}" alt="${product.name}" style="width:100%;max-height:500px;object-fit:contain;border-radius:16px;" /></div>`;

      // HERO 섹션(첫 번째 section)에 메인 이미지 삽입
      const firstSectionMatch = html.match(/<section[^>]*>/i);
      if (firstSectionMatch) {
        const pos = html.indexOf(firstSectionMatch[0]) + firstSectionMatch[0].length;
        html = html.slice(0, pos) + imgTag(realImages[0]) + html.slice(pos);
      }

      // 2번째 이미지가 있으면 중간 섹션에 삽입
      if (realImages.length >= 2) {
        const sections = html.match(/<section[^>]*>/gi) || [];
        const midIdx = Math.floor(sections.length / 2);
        if (midIdx > 0 && sections[midIdx]) {
          let searchFrom = 0;
          for (let s = 0; s <= midIdx; s++) {
            searchFrom = html.indexOf(sections[s], searchFrom) + sections[s].length;
          }
          html = html.slice(0, searchFrom) + imgTag(realImages[1]) + html.slice(searchFrom);
        }
      }

      // 3번째 이미지: 3/4 지점 섹션
      if (realImages.length >= 3) {
        const sections = html.match(/<section[^>]*>/gi) || [];
        const threeQuarter = Math.floor(sections.length * 3 / 4);
        if (threeQuarter > 0 && sections[threeQuarter]) {
          let searchFrom = 0;
          for (let s = 0; s <= threeQuarter; s++) {
            searchFrom = html.indexOf(sections[s], searchFrom) + sections[s].length;
          }
          html = html.slice(0, searchFrom) + imgTag(realImages[2]) + html.slice(searchFrom);
        }
      }
    }
  } else {
    // 이미지 없음 → 마커만 SVG 플레이스홀더로 교체
    html = html.replace(/__PRODUCT_IMG__/g, svgPlaceholder);
  }

  return html;
}

export default getClient;
