import puppeteer from "puppeteer";

export async function captureScreenshot(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    // 뷰포트 폭 축소: 1440→800 (이미지 토큰 ~70% 절감)
    await page.setViewport({ width: 800, height: 900 });
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // 레이지 로드 트리거
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight || totalHeight > 8000) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 100);
      });
    });

    await new Promise((r) => setTimeout(r, 800));

    // 최대 높이 3500px 제한 (Claude API 토큰 최소화)
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    const captureHeight = Math.min(bodyHeight, 3500);

    await page.setViewport({ width: 800, height: captureHeight });
    await new Promise((r) => setTimeout(r, 300));

    const screenshot = await page.screenshot({
      fullPage: false,
      type: "jpeg",
      quality: 35, // 35: 분석에 충분한 품질, 파일크기 최소
      encoding: "base64",
      clip: { x: 0, y: 0, width: 800, height: captureHeight },
    });

    return screenshot as string;
  } finally {
    await browser.close();
  }
}

export async function captureMultipleScreenshots(
  urls: string[]
): Promise<{ url: string; base64: string }[]> {
  const results: { url: string; base64: string }[] = [];

  for (const url of urls) {
    try {
      const base64 = await captureScreenshot(url);
      results.push({ url, base64 });
    } catch (error) {
      console.error(`Failed to capture ${url}:`, error);
      results.push({ url, base64: "" });
    }
  }

  return results.filter((r) => r.base64 !== "");
}
