import { NextRequest, NextResponse } from "next/server";
import { captureMultipleScreenshots } from "@/lib/screenshot";
import { analyzeReferences } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "URL 목록이 필요합니다." },
        { status: 400 }
      );
    }

    if (urls.length > 5) {
      return NextResponse.json(
        { error: "최대 5개의 URL만 분석할 수 있습니다." },
        { status: 400 }
      );
    }

    // Step 1: Capture screenshots
    const screenshots = await captureMultipleScreenshots(urls);

    if (screenshots.length === 0) {
      return NextResponse.json(
        { error: "스크린샷을 캡처하지 못했습니다. URL을 확인해주세요." },
        { status: 400 }
      );
    }

    // Step 2: Analyze with Claude Vision
    const analysis = await analyzeReferences(screenshots);

    // Return analysis + thumbnails (downsized for display)
    return NextResponse.json({
      analysis,
      thumbnails: screenshots.map((s) => ({
        url: s.url,
        preview: `data:image/png;base64,${s.base64.substring(0, 1000)}...`,
      })),
      capturedCount: screenshots.length,
      totalRequested: urls.length,
    });
  } catch (error: unknown) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
