import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") {
    throw new Error(
      "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요."
    );
  }
  return new Anthropic({ apiKey });
}

export interface AnalysisResult {
  sections: {
    type: string;
    description: string;
    order: number;
  }[];
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingStyle: string;
    bodyStyle: string;
    tone: string;
  };
  layoutPattern: string;
  copyStyle: string;
  overallImpression: string;
}

export interface ProductInfo {
  name: string;
  price: string;
  shortDescription: string;
  features: string[];
  detailDescription: string;
  targetAudience: string;
  tone: "premium" | "casual" | "trustworthy" | "trendy";
  images: string[];
}

export async function analyzeReferences(
  screenshots: { url: string; base64: string }[]
): Promise<AnalysisResult> {
  const imageContent: Anthropic.Messages.ContentBlockParam[] = [];

  for (const shot of screenshots) {
    imageContent.push({
      type: "text",
      text: `Reference page: ${shot.url}`,
    });
    imageContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: shot.base64,
      },
    });
  }

  imageContent.push({
    type: "text",
    text: `위 레퍼런스 상품페이지들을 분석해서 다음 JSON 형식으로 결과를 반환해주세요.
반드시 유효한 JSON만 반환하고, 다른 텍스트는 포함하지 마세요.

{
  "sections": [
    { "type": "섹션 타입(hero/features/benefits/testimonials/cta/gallery/specs/faq 등)", "description": "설명", "order": 순서번호 }
  ],
  "colorPalette": {
    "primary": "#hex색상",
    "secondary": "#hex색상",
    "accent": "#hex색상",
    "background": "#hex색상",
    "text": "#hex색상"
  },
  "typography": {
    "headingStyle": "헤딩 스타일 설명",
    "bodyStyle": "본문 스타일 설명",
    "tone": "톤앤매너 설명"
  },
  "layoutPattern": "전체 레이아웃 패턴 설명",
  "copyStyle": "카피라이팅 스타일 설명",
  "overallImpression": "전체적인 인상 및 디자인 방향성"
}`,
  });

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: imageContent,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse analysis result");
  return JSON.parse(jsonMatch[0]);
}

export async function generateProductPage(
  analysis: AnalysisResult,
  product: ProductInfo
): Promise<string> {
  const toneMap = {
    premium: "고급스럽고 세련된",
    casual: "친근하고 캐주얼한",
    trustworthy: "신뢰감 있고 전문적인",
    trendy: "트렌디하고 감각적인",
  };

  const prompt = `당신은 전문 웹 디자이너입니다. 아래 레퍼런스 분석 결과와 상품 정보를 바탕으로 상품 상세 페이지의 완전한 HTML을 생성해주세요.

## 레퍼런스 분석 결과
${JSON.stringify(analysis, null, 2)}

## 상품 정보
- 상품명: ${product.name}
- 가격: ${product.price}
- 한줄 설명: ${product.shortDescription}
- 특징/장점: ${product.features.join(", ")}
- 상세 설명: ${product.detailDescription}
- 타겟 고객: ${product.targetAudience}
- 톤앤매너: ${toneMap[product.tone]}

## 이미지
${product.images.length > 0 ? product.images.map((img, i) => `이미지 ${i + 1}: ${img}`).join("\n") : "플레이스홀더 이미지를 사용해주세요 (https://placehold.co/800x600/EEE/999?text=Product+Image)"}

## 요구사항
1. Tailwind CSS CDN을 사용한 완전한 단일 HTML 파일
2. 레퍼런스 분석의 섹션 구조, 컬러 팔레트, 타이포그래피를 충실히 반영
3. 반응형 디자인 (모바일/데스크톱)
4. 한국어로 작성
5. 세련되고 전문적인 디자인
6. 각 섹션 사이에 적절한 여백과 구분
7. CTA 버튼은 눈에 잘 띄게
8. 이미지가 있으면 해당 이미지를 사용하고, 없으면 플레이스홀더 사용

HTML 코드만 반환하세요. \`\`\`html 같은 마크다운 코드블록은 사용하지 마세요.
<!DOCTYPE html>로 시작하는 완전한 HTML을 반환하세요.`;

  const response = await getClient().messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const htmlMatch = text.match(/<!DOCTYPE html>[\s\S]*/i);
  if (htmlMatch) return htmlMatch[0];

  const htmlTagMatch = text.match(/<html[\s\S]*<\/html>/i);
  if (htmlTagMatch) return `<!DOCTYPE html>\n${htmlTagMatch[0]}`;

  return text;
}

export default getClient;
