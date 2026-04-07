// ============================================================
// 핵심 타입 정의 - Element-based Canvas System
// ============================================================

// ──────────────────────────────────────
// 기본 타입
// ──────────────────────────────────────
export type MoodType = 'premium' | 'clean' | 'natural' | 'impact'

export type SectionType =
  | 'hero'
  | 'benefits'
  | 'ingredients'
  | 'texture'
  | 'howto'
  | 'specs'
  | 'reviews'
  | 'cta'

export type ElementType = 'text' | 'image' | 'shape'

// ──────────────────────────────────────
// Element 타입들
// ──────────────────────────────────────
interface BaseElement {
  id: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  opacity: number
  rotation: number
  locked: boolean
}

export interface TextElement extends BaseElement {
  type: 'text'
  content: string
  fontSize: number
  fontWeight: number
  fontFamily: string
  color: string
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing: number
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string // 'product' | supabase URL | 'generate:texture' etc.
  objectFit: 'contain' | 'cover' | 'fill'
  borderRadius: number
}

export interface ShapeElement extends BaseElement {
  type: 'shape'
  shapeType: 'rect' | 'circle' | 'line' | 'badge'
  backgroundColor: string
  borderColor: string
  borderWidth: number
  borderRadius: number
}

export type SectionElement = TextElement | ImageElement | ShapeElement

// ──────────────────────────────────────
// 섹션 배경
// ──────────────────────────────────────
export interface SectionBackground {
  type: 'color' | 'gradient' | 'image'
  value: string // hex color, CSS gradient, or image URL
  overlay?: string // optional rgba overlay for image backgrounds
}

// ──────────────────────────────────────
// 섹션
// ──────────────────────────────────────
export interface Section {
  id: string
  type: SectionType
  label: string
  order: number
  height: number
  background: SectionBackground
  elements: SectionElement[]
  isVisible: boolean
}

// ──────────────────────────────────────
// 제품 정보
// ──────────────────────────────────────
export interface ProductInfo {
  name: string
  category: string
  mood: MoodType
  keyPoints: [string, string, string]
  imageUrl: string
  imagePath: string
}

// ──────────────────────────────────────
// 프로젝트
// ──────────────────────────────────────
export interface Project {
  id: string
  userId: string
  name: string
  product: ProductInfo
  sections: Section[]
  createdAt: string
  updatedAt: string
}

// ──────────────────────────────────────
// 프로젝트 생성 입력
// ──────────────────────────────────────
export type CreateProjectInput = {
  name: string
  product: ProductInfo
  sections: Section[]
}

// ──────────────────────────────────────
// 위저드 폼 값
// ──────────────────────────────────────
export interface ProjectFormValues {
  productName: string
  category: string
  mood: MoodType
  keyPoint1: string
  keyPoint2: string
  keyPoint3: string
  imageFile: File | null
}

// ──────────────────────────────────────
// AI 응답 구조 (Claude JSON)
// ──────────────────────────────────────
export interface GeneratedElementData {
  type: ElementType
  content?: string
  src?: string
  shapeType?: string
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  fontWeight?: number
  fontFamily?: string
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  lineHeight?: number
  letterSpacing?: number
  objectFit?: 'contain' | 'cover' | 'fill'
  borderRadius?: number
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  opacity?: number
}

export interface GeneratedSectionData {
  type: SectionType
  height: number
  background: SectionBackground
  elements: GeneratedElementData[]
}

export interface GenerateApiResponse {
  sections: GeneratedSectionData[]
  error?: string
}

// ──────────────────────────────────────
// 캔버스 상수
// ──────────────────────────────────────
export const CANVAS_WIDTH = 780
