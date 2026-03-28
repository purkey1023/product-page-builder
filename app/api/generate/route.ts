import { NextRequest, NextResponse } from "next/server";
import { generateProductPage, AnalysisResult, ProductInfo } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const { analysis, product } = (await request.json()) as {
      analysis: AnalysisResult;
      product: ProductInfo;
    };

    if (!analysis || !product) {
      return NextResponse.json(
        { error: "분석 결과와 상품 정보가 필요합니다." },
        { status: 400 }
      );
    }

    if (!product.name || !product.shortDescription) {
      return NextResponse.json(
        { error: "상품명과 한줄 설명은 필수입니다." },
        { status: 400 }
      );
    }

    const html = await generateProductPage(analysis, product);

    return NextResponse.json({ html });
  } catch (error: unknown) {
    console.error("Generation error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "페이지 생성 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
