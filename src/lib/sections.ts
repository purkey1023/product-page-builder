import { v4 as uuidv4 } from 'uuid'
import type {
  Section,
  SectionType,
  SectionBackground,
  SectionElement,
  TextElement,
  ImageElement,
  ShapeElement,
  MoodType,
  GeneratedSectionData,
  GeneratedElementData,
  CANVAS_WIDTH,
} from '@/types'

// ──────────────────────────────────────
// 분위기별 팔레트
// ──────────────────────────────────────
export interface MoodPalette {
  bg: string
  bgAlt: string
  text: string
  textMuted: string
  accent: string
  accentBg: string
}

export const MOOD_PALETTES: Record<MoodType, MoodPalette> = {
  premium: {
    bg: '#0A0A0A', bgAlt: '#1A1A1A',
    text: '#F5F0E8', textMuted: '#CCBBAA',
    accent: '#C9A96E', accentBg: '#1E1A14',
  },
  clean: {
    bg: '#FFFFFF', bgAlt: '#F5F5F5',
    text: '#1A1A1A', textMuted: '#888888',
    accent: '#3B82F6', accentBg: '#EFF6FF',
  },
  natural: {
    bg: '#FAF7F2', bgAlt: '#EEF4EE',
    text: '#3D2B1F', textMuted: '#7A6B5A',
    accent: '#6B8E5A', accentBg: '#F0EBE3',
  },
  impact: {
    bg: '#0D0D0D', bgAlt: '#1A1A2E',
    text: '#FFFFFF', textMuted: '#AAAAAA',
    accent: '#FF4444', accentBg: '#1A0A0A',
  },
}

// ──────────────────────────────────────
// 섹션 표시 이름
// ──────────────────────────────────────
export const SECTION_LABELS: Record<SectionType, string> = {
  hero: '히어로',
  benefits: '핵심 장점',
  ingredients: '핵심 성분',
  texture: '텍스처',
  howto: '사용 방법',
  specs: '제품 정보',
  reviews: '리뷰',
  cta: 'CTA',
}

export const ALL_SECTION_TYPES: SectionType[] = [
  'hero', 'benefits', 'ingredients', 'texture', 'howto', 'specs', 'reviews', 'cta',
]

// ──────────────────────────────────────
// 섹션별 기본 높이
// ──────────────────────────────────────
const DEFAULT_HEIGHTS: Record<SectionType, number> = {
  hero: 1000,
  benefits: 900,
  ingredients: 850,
  texture: 700,
  howto: 800,
  specs: 600,
  reviews: 700,
  cta: 500,
}

// ──────────────────────────────────────
// 섹션별 기본 배경색 (무드별)
// ──────────────────────────────────────
function getDefaultBackground(type: SectionType, mood: MoodType): SectionBackground {
  const p = MOOD_PALETTES[mood]
  const altTypes: SectionType[] = ['benefits', 'howto', 'reviews']
  return {
    type: 'color',
    value: altTypes.includes(type) ? p.bgAlt : p.bg,
  }
}

// ──────────────────────────────────────
// 섹션별 기본 엘리먼트 생성
// ──────────────────────────────────────
function getDefaultElements(type: SectionType, mood: MoodType): SectionElement[] {
  const p = MOOD_PALETTES[mood]
  const els: SectionElement[] = []
  const W = 780 // CANVAS_WIDTH

  switch (type) {
    case 'hero':
      els.push(
        makeText('BRAND NAME', 0, 80, W, 30, { fontSize: 14, fontWeight: 300, color: p.textMuted, textAlign: 'center', letterSpacing: 4, fontFamily: 'Playfair Display' }),
        makeText('제품명을 입력하세요', 0, 130, W, 60, { fontSize: 42, fontWeight: 300, color: p.text, textAlign: 'center', fontFamily: 'Noto Sans KR' }),
        makeText('핵심 소구 한 줄', 0, 210, W, 30, { fontSize: 16, fontWeight: 400, color: p.textMuted, textAlign: 'center' }),
        makeImage('product', 190, 300, 400, 500),
        makeText('핵심 키워드', (W - 200) / 2, 850, 200, 40, { fontSize: 14, fontWeight: 500, color: p.accent, textAlign: 'center' }),
      )
      break

    case 'benefits':
      els.push(
        makeText('KEY BENEFITS', 0, 60, W, 30, { fontSize: 13, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 3 }),
        makeText('이 제품이 특별한 이유', 0, 100, W, 50, { fontSize: 32, fontWeight: 600, color: p.text, textAlign: 'center' }),
        makeShape('line', 340, 170, 100, 3, { backgroundColor: p.accent }),
        makeText('01\n첫 번째 장점\n장점에 대한 설명을 입력하세요', 60, 220, 300, 160, { fontSize: 16, fontWeight: 400, color: p.text, textAlign: 'left', lineHeight: 1.8 }),
        makeText('02\n두 번째 장점\n장점에 대한 설명을 입력하세요', 420, 220, 300, 160, { fontSize: 16, fontWeight: 400, color: p.text, textAlign: 'left', lineHeight: 1.8 }),
        makeText('03\n세 번째 장점\n장점에 대한 설명을 입력하세요', 60, 440, 300, 160, { fontSize: 16, fontWeight: 400, color: p.text, textAlign: 'left', lineHeight: 1.8 }),
      )
      break

    case 'ingredients':
      els.push(
        makeText('KEY INGREDIENTS', 0, 60, W, 30, { fontSize: 13, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 3 }),
        makeText('핵심 성분', 0, 100, W, 50, { fontSize: 32, fontWeight: 600, color: p.text, textAlign: 'center' }),
        makeImage('generate:ingredient', 60, 200, 300, 300),
        makeText('성분명\n\n성분에 대한 설명과 효과를 입력하세요. 피부에 어떤 도움이 되는지 자세히 설명합니다.', 420, 240, 300, 200, { fontSize: 16, fontWeight: 400, color: p.text, textAlign: 'left', lineHeight: 1.7 }),
      )
      break

    case 'texture':
      els.push(
        makeImage('generate:texture', 0, 0, W, 500),
        makeText('부드럽게 스며드는 텍스처', 0, 540, W, 50, { fontSize: 28, fontWeight: 300, color: p.text, textAlign: 'center' }),
        makeText('가볍고 촉촉한 사용감으로\n피부에 빠르게 흡수됩니다', 0, 600, W, 60, { fontSize: 16, fontWeight: 400, color: p.textMuted, textAlign: 'center', lineHeight: 1.6 }),
      )
      break

    case 'howto':
      els.push(
        makeText('HOW TO USE', 0, 60, W, 30, { fontSize: 13, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 3 }),
        makeText('사용 방법', 0, 100, W, 50, { fontSize: 32, fontWeight: 600, color: p.text, textAlign: 'center' }),
        makeText('STEP 01\n\n사용법 설명을 입력하세요', 60, 200, 200, 160, { fontSize: 16, fontWeight: 400, color: p.text, textAlign: 'center', lineHeight: 1.7 }),
        makeText('STEP 02\n\n사용법 설명을 입력하세요', 290, 200, 200, 160, { fontSize: 16, fontWeight: 400, color: p.text, textAlign: 'center', lineHeight: 1.7 }),
        makeText('STEP 03\n\n사용법 설명을 입력하세요', 520, 200, 200, 160, { fontSize: 16, fontWeight: 400, color: p.text, textAlign: 'center', lineHeight: 1.7 }),
      )
      break

    case 'specs':
      els.push(
        makeText('PRODUCT INFO', 0, 60, W, 30, { fontSize: 13, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 3 }),
        makeText('제품 정보', 0, 100, W, 50, { fontSize: 32, fontWeight: 600, color: p.text, textAlign: 'center' }),
        makeText('용량: 000ml\n제조국: 대한민국\n사용기한: 제조일로부터 00개월\n전성분: 정제수, ...', 140, 200, 500, 300, { fontSize: 16, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 2.0 }),
      )
      break

    case 'reviews':
      els.push(
        makeText('REVIEWS', 0, 60, W, 30, { fontSize: 13, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 3 }),
        makeText('실제 사용 후기', 0, 100, W, 50, { fontSize: 32, fontWeight: 600, color: p.text, textAlign: 'center' }),
        makeShape('rect', 60, 200, 300, 180, { backgroundColor: p.accentBg, borderRadius: 16 }),
        makeText('"정말 좋아요! 피부가 확실히\n달라졌어요."\n\n— 구매자 A', 80, 220, 260, 140, { fontSize: 15, fontWeight: 400, color: p.text, textAlign: 'left', lineHeight: 1.6 }),
        makeShape('rect', 420, 200, 300, 180, { backgroundColor: p.accentBg, borderRadius: 16 }),
        makeText('"보습력이 정말 뛰어나고\n향도 은은해서 좋습니다."\n\n— 구매자 B', 440, 220, 260, 140, { fontSize: 15, fontWeight: 400, color: p.text, textAlign: 'left', lineHeight: 1.6 }),
      )
      break

    case 'cta':
      els.push(
        makeImage('product', 240, 40, 300, 300),
        makeText('지금 바로 만나보세요', 0, 370, W, 50, { fontSize: 28, fontWeight: 600, color: p.text, textAlign: 'center' }),
        makeText('더 건강한 피부를 위한 첫 걸음', 0, 420, W, 30, { fontSize: 16, fontWeight: 400, color: p.textMuted, textAlign: 'center' }),
      )
      break
  }

  return els
}

// ──────────────────────────────────────
// Element factory helpers
// ──────────────────────────────────────
function makeText(
  content: string,
  x: number, y: number, width: number, height: number,
  opts: Partial<TextElement> = {}
): TextElement {
  return {
    id: uuidv4(),
    type: 'text',
    content,
    x, y, width, height,
    fontSize: 16,
    fontWeight: 400,
    fontFamily: 'Noto Sans KR',
    color: '#333333',
    textAlign: 'center',
    lineHeight: 1.5,
    letterSpacing: 0,
    opacity: 1,
    rotation: 0,
    locked: false,
    ...opts,
  }
}

function makeImage(
  src: string,
  x: number, y: number, width: number, height: number,
  opts: Partial<ImageElement> = {}
): ImageElement {
  return {
    id: uuidv4(),
    type: 'image',
    src,
    x, y, width, height,
    objectFit: 'contain',
    borderRadius: 0,
    opacity: 1,
    rotation: 0,
    locked: false,
    ...opts,
  }
}

function makeShape(
  shapeType: 'rect' | 'circle' | 'line' | 'badge',
  x: number, y: number, width: number, height: number,
  opts: Partial<ShapeElement> = {}
): ShapeElement {
  return {
    id: uuidv4(),
    type: 'shape',
    shapeType,
    x, y, width, height,
    backgroundColor: '#F0F0F0',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    opacity: 1,
    rotation: 0,
    locked: false,
    ...opts,
  }
}

// ──────────────────────────────────────
// 기본 섹션 생성
// ──────────────────────────────────────
export function getDefaultSection(type: SectionType, mood: MoodType): Section {
  return {
    id: uuidv4(),
    type,
    label: SECTION_LABELS[type],
    order: 0,
    height: DEFAULT_HEIGHTS[type],
    background: getDefaultBackground(type, mood),
    elements: getDefaultElements(type, mood),
    isVisible: true,
  }
}

// ──────────────────────────────────────
// AI 응답 → Section[] 변환
// ──────────────────────────────────────
export function buildSectionsFromGenerated(
  generated: GeneratedSectionData[],
  mood: MoodType
): Section[] {
  return generated.map((g, index) => ({
    id: uuidv4(),
    type: g.type,
    label: SECTION_LABELS[g.type] ?? g.type,
    order: index,
    height: g.height || DEFAULT_HEIGHTS[g.type] || 800,
    background: g.background || getDefaultBackground(g.type, mood),
    elements: (g.elements || []).map((e) => buildElement(e)),
    isVisible: true,
  }))
}

function buildElement(data: GeneratedElementData): SectionElement {
  const base = {
    id: uuidv4(),
    x: data.x ?? 0,
    y: data.y ?? 0,
    width: data.width ?? 300,
    height: data.height ?? 100,
    opacity: data.opacity ?? 1,
    rotation: 0,
    locked: false,
  }

  switch (data.type) {
    case 'text':
      return {
        ...base,
        type: 'text',
        content: data.content ?? '',
        fontSize: data.fontSize ?? 16,
        fontWeight: data.fontWeight ?? 400,
        fontFamily: data.fontFamily ?? 'Noto Sans KR',
        color: data.color ?? '#333333',
        textAlign: data.textAlign ?? 'center',
        lineHeight: data.lineHeight ?? 1.5,
        letterSpacing: data.letterSpacing ?? 0,
      } as TextElement

    case 'image':
      return {
        ...base,
        type: 'image',
        src: data.src ?? 'product',
        objectFit: data.objectFit ?? 'contain',
        borderRadius: data.borderRadius ?? 0,
      } as ImageElement

    case 'shape':
      return {
        ...base,
        type: 'shape',
        shapeType: (data.shapeType as ShapeElement['shapeType']) ?? 'rect',
        backgroundColor: data.backgroundColor ?? '#F0F0F0',
        borderColor: data.borderColor ?? 'transparent',
        borderWidth: data.borderWidth ?? 0,
        borderRadius: data.borderRadius ?? 0,
      } as ShapeElement

    default:
      return { ...base, type: 'text', content: '', fontSize: 16, fontWeight: 400, fontFamily: 'Noto Sans KR', color: '#333', textAlign: 'center', lineHeight: 1.5, letterSpacing: 0 } as TextElement
  }
}
