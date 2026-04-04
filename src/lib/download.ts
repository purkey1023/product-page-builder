import { toPng } from 'html-to-image'

const EXPORT_WIDTH = 1080

// ──────────────────────────────────────
// 섹션 1개 PNG 다운로드
// ──────────────────────────────────────
export async function downloadSection(
  element: HTMLElement,
  label: string
): Promise<void> {
  const scale = EXPORT_WIDTH / element.offsetWidth

  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    quality: 0.95,
    skipFonts: false,
    // 외부 이미지 CORS 문제 방지
    fetchRequestInit: { mode: 'cors' },
  })

  triggerDownload(dataUrl, `${label}.png`)
}

// ──────────────────────────────────────
// 전체 페이지 PNG 다운로드 (섹션 세로 합성)
// ──────────────────────────────────────
export async function downloadFullPage(
  elements: HTMLElement[],
  projectName: string
): Promise<void> {
  if (elements.length === 0) return

  const scale = EXPORT_WIDTH / elements[0].offsetWidth

  // 각 섹션 → PNG DataURL
  const dataUrls = await Promise.all(
    elements.map((el) =>
      toPng(el, {
        pixelRatio: scale,
        quality: 0.95,
        fetchRequestInit: { mode: 'cors' },
      })
    )
  )

  // Image 객체 로드
  const images = await Promise.all(
    dataUrls.map(
      (url) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = url
        })
    )
  )

  // Canvas에 세로 합성
  const totalHeight = images.reduce((sum, img) => sum + img.height, 0)
  const canvas = document.createElement('canvas')
  canvas.width = EXPORT_WIDTH
  canvas.height = totalHeight

  const ctx = canvas.getContext('2d')!
  let y = 0
  for (const img of images) {
    ctx.drawImage(img, 0, y, EXPORT_WIDTH, img.height)
    y += img.height
  }

  const finalUrl = canvas.toDataURL('image/png', 0.95)
  triggerDownload(finalUrl, `${projectName}_상세페이지.png`)
}

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.download = filename
  a.href = dataUrl
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
