import { v4 as uuidv4 } from 'uuid'
import type {
  Section,
  SectionType,
  SectionStyle,
  MoodType,
  GeneratedSection,
  ImageConfig,
} from '@/types'

// ──────────────────────────────────────
// 분위기별 섹션 스타일 맵
// ──────────────────────────────────────
export const MOOD_STYLES: Record<MoodType, Record<SectionType, SectionStyle>> = {
  premium: {
    hero:     { backgroundColor: '#0A0A0A', textColor: '#F5F0E8', padding: 'lg', textAlign: 'center' },
    benefits: { backgroundColor: '#1A1A1A', textColor: '#FFFFFF', padding: 'lg', textAlign: 'center' },
    features: { backgroundColor: '#111111', textColor: '#E8E0D0', padding: 'md', textAlign: 'left'   },
    target:   { backgroundColor: '#0A0A0A', textColor: '#CCBBAA', padding: 'md', textAlign: 'center' },
    howto:    { backgroundColor: '#1A1A1A', textColor: '#FFFFFF', padding: 'md', textAlign: 'left'   },
    cta:      { backgroundColor: '#C9A96E', textColor: '#000000', padding: 'lg', textAlign: 'center' },
  },
  clean: {
    hero:     { backgroundColor: '#FFFFFF', textColor: '#1A1A1A', padding: 'lg', textAlign: 'center' },
    benefits: { backgroundColor: '#F8F8F8', textColor: '#333333', padding: 'lg', textAlign: 'center' },
    features: { backgroundColor: '#FFFFFF', textColor: '#444444', padding: 'md', textAlign: 'left'   },
    target:   { backgroundColor: '#F5F5F5', textColor: '#333333', padding: 'md', textAlign: 'center' },
    howto:    { backgroundColor: '#FFFFFF', textColor: '#444444', padding: 'md', textAlign: 'left'   },
    cta:      { backgroundColor: '#1A1A1A', textColor: '#FFFFFF', padding: 'lg', textAlign: 'center' },
  },
  natural: {
    hero:     { backgroundColor: '#F7F3ED', textColor: '#3D2B1F', padding: 'lg', textAlign: 'center' },
    benefits: { backgroundColor: '#EEF4EE', textColor: '#2D4A2D', padding: 'lg', textAlign: 'center' },
    features: { backgroundColor: '#FBF8F3', textColor: '#4A3728', padding: 'md', textAlign: 'left'   },
    target:   { backgroundColor: '#F0EBE3', textColor: '#3D2B1F', padding: 'md', textAlign: 'center' },
    howto:    { backgroundColor: '#EEF4EE', textColor: '#2D4A2D', padding: 'md', textAlign: 'left'   },
    cta:      { backgroundColor: '#5C7C5C', textColor: '#FFFFFF', padding: 'lg', textAlign: 'center' },
  },
  impact: {
    hero:     { backgroundColor: '#0D0D0D', textColor: '#FFFFFF', padding: 'lg', textAlign: 'center' },
    benefits: { backgroundColor: '#1A1A2E', textColor: '#FFFFFF', padding: 'lg', textAlign: 'center' },
    features: { backgroundColor: '#16213E', textColor: '#E0E0E0', padding: 'md', textAlign: 'left'   },
    target:   { backgroundColor: '#0F3460', textColor: '#FFFFFF', padding: 'md', textAlign: 'center' },
    howto:    { backgroundColor: '#1A1A2E', textColor: '#FFFFFF', padding: 'md', textAlign: 'left'   },
    cta:      { backgroundColor: '#E8272A', textColor: '#FFFFFF', padding: 'lg', textAlign: 'center' },
  },
}

// ──────────────────────────────────────
// 섹션 표시 이름
// ──────────────────────────────────────
export const SECTION_LABELS: Record<SectionType, string> = {
  hero:     '히어로',
  benefits: '핵심 장점',
  features: '성분/기능',
  target:   '추천 대상',
  howto:    '사용 방법',
  cta:      'CTA',
}

// ──────────────────────────────────────
// 이미지가 포함될 섹션 타입
// ──────────────────────────────────────
const IMAGE_SECTIONS: SectionType[] = ['hero', 'features', 'cta']

const DEFAULT_IMAGE_CONFIG: ImageConfig = {
  position: 'center',
  size: 'md',
  scale: 1,
  offsetX: 0,
  offsetY: 0,
}

// ──────────────────────────────────────
// AI 응답 → Section[] 변환
// ──────────────────────────────────────
export function buildSectionsFromGenerated(
  generated: GeneratedSection[],
  mood: MoodType
): Section[] {
  return generated.map((g, index) => {
    const type = g.type as SectionType
    const style = MOOD_STYLES[mood][type] ?? MOOD_STYLES['clean'][type]
    const showImage = IMAGE_SECTIONS.includes(type)

    return {
      id: uuidv4(),
      type,
      label: SECTION_LABELS[type] ?? type,
      order: index,
      isVisible: true,
      content: {
        title: g.title ?? '',
        body: g.body ?? '',
        highlight: g.highlight ?? '',
        items: Array.isArray(g.items) ? g.items : [],
        imageConfig: showImage
          ? { ...DEFAULT_IMAGE_CONFIG, position: 'center', size: 'lg' }
          : { ...DEFAULT_IMAGE_CONFIG, size: 'sm' },
      },
      style,
    }
  })
}

// ──────────────────────────────────────
// 패딩 크기 → CSS 값 변환
// ──────────────────────────────────────
export function getPaddingStyle(padding: 'sm' | 'md' | 'lg'): string {
  const map = { sm: '24px 20px', md: '48px 24px', lg: '72px 28px' }
  return map[padding]
}

// ──────────────────────────────────────
// 이미지 크기 → 너비 비율 변환
// ──────────────────────────────────────
export function getImageWidthPercent(size: 'sm' | 'md' | 'lg' | 'full'): string {
  const map = { sm: '40%', md: '60%', lg: '80%', full: '100%' }
  return map[size]
}
