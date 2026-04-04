// ============================================================
// 핵심 타입 정의
// ============================================================

export type MoodType = 'premium' | 'clean' | 'natural' | 'impact'

export type SectionType =
  | 'hero'
  | 'benefits'
  | 'features'
  | 'target'
  | 'howto'
  | 'cta'

export type ImagePosition =
  | 'center'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'background'

export type TextAlign = 'left' | 'center' | 'right'
export type PaddingSize = 'sm' | 'md' | 'lg'
export type ImageSizeType = 'sm' | 'md' | 'lg' | 'full'

// ──────────────────────────────────────
// 제품 이미지 설정
// ──────────────────────────────────────
export interface ImageConfig {
  position: ImagePosition
  size: ImageSizeType   // sm=40% / md=60% / lg=80% / full=100%
  scale: number         // 0.5 ~ 2.0
  offsetX: number       // px 단위, -200 ~ 200
  offsetY: number       // px 단위, -200 ~ 200
}

// ──────────────────────────────────────
// 섹션 콘텐츠 (AI 생성 + 사용자 편집)
// ──────────────────────────────────────
export interface SectionContent {
  title: string
  body: string
  highlight: string     // 강조 배지/태그 문구
  items: string[]       // 장점 목록, 사용 순서 등
  imageConfig: ImageConfig
}

// ──────────────────────────────────────
// 섹션 스타일
// ──────────────────────────────────────
export interface SectionStyle {
  backgroundColor: string  // hex
  textColor: string        // hex
  padding: PaddingSize
  textAlign: TextAlign
}

// ──────────────────────────────────────
// 섹션
// ──────────────────────────────────────
export interface Section {
  id: string
  type: SectionType
  label: string         // UI 표시용: "히어로", "핵심 장점" 등
  order: number
  content: SectionContent
  style: SectionStyle
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
  imageUrl: string      // Supabase Storage public URL
  imagePath: string     // Storage 경로 (삭제 시 사용)
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
  createdAt: string     // ISO string
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
// AI 응답 구조
// ──────────────────────────────────────
export interface GeneratedSection {
  type: SectionType
  title: string
  body: string
  highlight: string
  items: string[]
}

export interface GenerateApiResponse {
  sections: GeneratedSection[]
  error?: string
}
