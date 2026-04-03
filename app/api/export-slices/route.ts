import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { html, format = "jpeg" } = await req.json();
    if (!html) return NextResponse.json({ error: "html required" }, { status: 400 });

    const imgFormat = format === "png" ? "png" : "jpeg";

    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
      ],
    });

    const page = await browser.newPage();
    // 스마트스토어 기준: 860px 너비
    await page.setViewport({ width: 860, height: 900, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle2", timeout: 30000 });

    // data-slice 속성이 있는 섹션들 찾기, 없으면 body 직계 자식 섹션들
    const sliceRects = await page.evaluate(() => {
      let sections = Array.from(document.querySelectorAll("[data-slice]"));
      if (sections.length === 0) {
        sections = Array.from(
          document.querySelectorAll("body > section, body > div > section, main > section")
        ).filter(
          (el) => el.tagName !== "SCRIPT" && el.tagName !== "STYLE"
        );
      }
      // 마지막 수단: body 직계 div
      if (sections.length === 0) {
        sections = Array.from(document.querySelectorAll("body > div")).filter(
          (el) => el.tagName !== "SCRIPT" && el.tagName !== "STYLE" && !el.id.startsWith("__")
        );
      }
      return sections.map((el, i) => {
        const rect = el.getBoundingClientRect();
        return {
          index: i,
          x: 0,
          y: rect.top + window.scrollY,
          width: 860,
          height: Math.ceil(rect.height),
        };
      });
    });

    if (sliceRects.length === 0) {
      await browser.close();
      return NextResponse.json({ error: "슬라이스할 섹션이 없습니다" }, { status: 400 });
    }

    // 전체 높이로 뷰포트 재조정
    const totalHeight = Math.max(
      ...sliceRects.map((r: { y: number; height: number }) => r.y + r.height),
      900
    );
    await page.setViewport({
      width: 860,
      height: Math.min(totalHeight, 30000),
      deviceScaleFactor: 2,
    });
    await new Promise((r) => setTimeout(r, 500));

    // 각 섹션 스크린샷 촬영
    const sliceBuffers: { name: string; data: Buffer }[] = [];

    for (const rect of sliceRects) {
      if (rect.height < 10) continue; // 너무 작은 섹션 무시

      const screenshot = await page.screenshot({
        fullPage: false,
        type: imgFormat,
        quality: imgFormat === "jpeg" ? 95 : undefined,
        clip: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: Math.min(rect.height, 5000), // 스마트스토어 최대 높이 제한
        },
      });

      const idx = String(rect.index + 1).padStart(2, "0");
      const ext = imgFormat === "jpeg" ? "jpg" : "png";
      sliceBuffers.push({
        name: `slice_${idx}.${ext}`,
        data: Buffer.from(screenshot),
      });
    }

    await browser.close();

    // ZIP 파일 생성 (간단한 ZIP 구현)
    const zipBuffer = createSimpleZip(sliceBuffers);

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="smartstore-slices-${imgFormat}.zip"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("export-slices error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "슬라이스 생성 실패" },
      { status: 500 }
    );
  }
}

// 간단한 ZIP 파일 생성 (외부 라이브러리 없이)
function createSimpleZip(files: { name: string; data: Buffer }[]): Buffer {
  const localFiles: Buffer[] = [];
  const centralDir: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, "utf-8");
    const crc = crc32(file.data);

    // Local file header
    const local = Buffer.alloc(30 + nameBuffer.length);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(0, 8); // compression (none)
    local.writeUInt16LE(0, 10); // mod time
    local.writeUInt16LE(0, 12); // mod date
    local.writeUInt32LE(crc, 14); // crc32
    local.writeUInt32LE(file.data.length, 18); // compressed size
    local.writeUInt32LE(file.data.length, 22); // uncompressed size
    local.writeUInt16LE(nameBuffer.length, 26); // name length
    local.writeUInt16LE(0, 28); // extra length
    nameBuffer.copy(local, 30);
    localFiles.push(local, file.data);

    // Central directory entry
    const central = Buffer.alloc(46 + nameBuffer.length);
    central.writeUInt32LE(0x02014b50, 0); // signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(0, 10); // compression
    central.writeUInt16LE(0, 12); // mod time
    central.writeUInt16LE(0, 14); // mod date
    central.writeUInt32LE(crc, 16); // crc32
    central.writeUInt32LE(file.data.length, 20); // compressed size
    central.writeUInt32LE(file.data.length, 24); // uncompressed size
    central.writeUInt16LE(nameBuffer.length, 28); // name length
    central.writeUInt16LE(0, 30); // extra length
    central.writeUInt16LE(0, 32); // comment length
    central.writeUInt16LE(0, 34); // disk number
    central.writeUInt16LE(0, 36); // internal attr
    central.writeUInt32LE(0, 38); // external attr
    central.writeUInt32LE(offset, 42); // local header offset
    nameBuffer.copy(central, 46);
    centralDir.push(central);

    offset += local.length + file.data.length;
  }

  const centralSize = centralDir.reduce((s, b) => s + b.length, 0);

  // End of central directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // central dir disk
  eocd.writeUInt16LE(files.length, 8); // entries on disk
  eocd.writeUInt16LE(files.length, 10); // total entries
  eocd.writeUInt32LE(centralSize, 12); // central dir size
  eocd.writeUInt32LE(offset, 16); // central dir offset
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localFiles, ...centralDir, eocd]);
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
