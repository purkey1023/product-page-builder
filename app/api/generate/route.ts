import { NextRequest } from "next/server";
import { generateProductPage, AnalysisResult, ProductInfo } from "@/lib/claude";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const { analysis, product } = (await request.json()) as {
    analysis: AnalysisResult;
    product: ProductInfo;
  };

  if (!analysis || !product) {
    return new Response(
      JSON.stringify({ error: "분석 결과와 상품 정보가 필요합니다." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!product.name || !product.shortDescription) {
    return new Response(
      JSON.stringify({ error: "상품명과 한줄 설명은 필수입니다." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // SSE 스트림: 생성 중 연결 유지 + 타임아웃 방지
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // keepalive: 25초마다 ping (Railway 프록시 타임아웃 방지)
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch { /* 이미 닫힘 */ }
      }, 25000);

      try {
        send({ status: "generating", message: "페이지 생성 중..." });
        const html = await generateProductPage(analysis, product);
        send({ status: "done", html });
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "페이지 생성 중 오류가 발생했습니다.";
        send({ status: "error", error: message });
      } finally {
        clearInterval(keepAlive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // nginx buffering 비활성화
    },
  });
}
