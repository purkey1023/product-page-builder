import { toPng } from 'html-to-image'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { CANVAS_WIDTH } from '@/types'

// ──────────────────────────────────────
// 섹션 1개 → PNG DataURL
// ──────────────────────────────────────
async function captureSection(element: HTMLDivElement): Promise<string> {
  // Ensure fonts are loaded
  await document.fonts.ready

  return toPng(element, {
    width: CANVAS_WIDTH,
    height: element.offsetHeight,
    pixelRatio: 1, // 780px 정확한 출력
    quality: 0.95,
    skipFonts: false,
    fetchRequestInit: { mode: 'cors' },
  })
}

// ──────────────────────────────────────
// 전체 섹션 → ZIP 다운로드
// ──────────────────────────────────────
export async function exportAsZip(
  sectionRefs: Map<string, HTMLDivElement>,
  sectionOrder: { id: string; label: string }[],
  projectName: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip()
  const total = sectionOrder.length

  for (let i = 0; i < total; i++) {
    const { id, label } = sectionOrder[i]
    const el = sectionRefs.get(id)
    if (!el) continue

    onProgress?.(i + 1, total)

    const dataUrl = await captureSection(el)
    // dataUrl → base64 blob
    const base64 = dataUrl.split(',')[1]
    const num = String(i + 1).padStart(2, '0')
    zip.file(`${num}_${label}.png`, base64, { base64: true })
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `${projectName}_이미지.zip`)
}

// ──────────────────────────────────────
// 전체 세로 합성 PNG 다운로드
// ──────────────────────────────────────
export async function exportAsMergedImage(
  sectionRefs: Map<string, HTMLDivElement>,
  sectionOrder: { id: string; label: string }[],
  projectName: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const total = sectionOrder.length
  const images: HTMLImageElement[] = []

  for (let i = 0; i < total; i++) {
    const { id } = sectionOrder[i]
    const el = sectionRefs.get(id)
    if (!el) continue

    onProgress?.(i + 1, total)

    const dataUrl = await captureSection(el)
    const img = await loadImage(dataUrl)
    images.push(img)
  }

  if (images.length === 0) return

  const totalHeight = images.reduce((sum, img) => sum + img.height, 0)
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = totalHeight

  const ctx = canvas.getContext('2d')!
  let y = 0
  for (const img of images) {
    ctx.drawImage(img, 0, y, CANVAS_WIDTH, img.height)
    y += img.height
  }

  canvas.toBlob((blob) => {
    if (blob) saveAs(blob, `${projectName}_상세페이지.png`)
  }, 'image/png')
}

// ──────────────────────────────────────
// 개별 섹션 다운로드
// ──────────────────────────────────────
export async function exportSingleSection(
  element: HTMLDivElement,
  filename: string
): Promise<void> {
  const dataUrl = await captureSection(element)
  const base64 = dataUrl.split(',')[1]
  const byteArr = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const blob = new Blob([byteArr], { type: 'image/png' })
  saveAs(blob, filename)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
