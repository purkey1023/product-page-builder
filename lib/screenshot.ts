import puppeteer from "puppeteer";

export async function captureScreenshot(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Scroll down to load lazy images
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight || totalHeight > 10000) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 100);
      });
    });

    await new Promise((r) => setTimeout(r, 1000));

    const screenshot = await page.screenshot({
      fullPage: true,
      type: "png",
      encoding: "base64",
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
