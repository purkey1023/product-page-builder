import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { html } = await req.json();
    if (!html) return NextResponse.json({ error: "html required" }, { status: 400 });

    // Dynamic import to avoid issues in edge runtime
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    // 2x 해상도 (Figma에서 선명하게)
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    // HTML 세팅 (Google Fonts 로딩 대기)
    await page.setContent(html, { waitUntil: "networkidle2", timeout: 30000 });

    // 페이지 전체 높이 측정
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const clampedHeight = Math.min(bodyHeight, 25000); // 최대 25000px

    await page.setViewport({ width: 1440, height: clampedHeight, deviceScaleFactor: 2 });

    const screenshot = await page.screenshot({
      fullPage: false,
      type: "png",
      clip: { x: 0, y: 0, width: 1440, height: clampedHeight },
    });

    await browser.close();

    return new NextResponse(screenshot as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="product-page-figma.png"',
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("export-png error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PNG 생성 실패" },
      { status: 500 }
    );
  }
}
