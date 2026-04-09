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
} from '@/types'

// ──────────────────────────────────────
// 분위기별 팔레트
// ──────────────────────────────────────
export interface MoodPalette {
  bg: string
  bgAlt: string
  bgDark: string
  text: string
  textMuted: string
  textLight: string
  accent: string
  accentBg: string
}

export const MOOD_PALETTES: Record<MoodType, MoodPalette> = {
  premium: {
    bg: '#0A0A0A', bgAlt: '#141414', bgDark: '#000000',
    text: '#F5F0E8', textMuted: '#A89B8C', textLight: '#CCBBAA',
    accent: '#C9A96E', accentBg: '#1E1A14',
  },
  clean: {
    bg: '#FFFFFF', bgAlt: '#F7F7F7', bgDark: '#1A1A1A',
    text: '#1A1A1A', textMuted: '#888888', textLight: '#BBBBBB',
    accent: '#3B82F6', accentBg: '#EFF6FF',
  },
  natural: {
    bg: '#FAF7F2', bgAlt: '#F0EDE6', bgDark: '#3D2B1F',
    text: '#3D2B1F', textMuted: '#7A6B5A', textLight: '#B8A99A',
    accent: '#6B8E5A', accentBg: '#EEF4EE',
  },
  impact: {
    bg: '#0D0D0D', bgAlt: '#1A1A2E', bgDark: '#000000',
    text: '#FFFFFF', textMuted: '#AAAAAA', textLight: '#666666',
    accent: '#FF4444', accentBg: '#1A0A0A',
  },
}

// ──────────────────────────────────────
// 섹션 표시 이름
// ──────────────────────────────────────
export const SECTION_LABELS: Record<SectionType, string> = {
  hero: '히어로',
  philosophy: '브랜드 철학',
  benefits: '핵심 장점',
  ingredients: '핵심 성분',
  texture: '텍스처',
  proof: '임상/수치',
  howto: '사용 방법',
  banner: '비주얼 배너',
  reviews: '리뷰',
  specs: '제품 정보',
  cta: 'CTA',
}

export const ALL_SECTION_TYPES: SectionType[] = [
  'hero', 'philosophy', 'benefits', 'ingredients', 'texture',
  'proof', 'howto', 'banner', 'reviews', 'specs', 'cta',
]

// ──────────────────────────────────────
// 섹션별 기본 높이 (ANUA 수준)
// ──────────────────────────────────────
const DEFAULT_HEIGHTS: Record<SectionType, number> = {
  hero: 1100,
  philosophy: 600,
  benefits: 1300,
  ingredients: 1100,
  texture: 900,
  proof: 700,
  howto: 1000,
  banner: 600,
  reviews: 900,
  specs: 750,
  cta: 500,
}

// ──────────────────────────────────────
// 기본 배경색
// ──────────────────────────────────────
function getDefaultBackground(type: SectionType, mood: MoodType): SectionBackground {
  const p = MOOD_PALETTES[mood]
  const altBg: SectionType[] = ['philosophy', 'ingredients', 'howto', 'reviews']
  const darkBg: SectionType[] = ['banner', 'cta']
  if (darkBg.includes(type)) return { type: 'color', value: p.bgDark }
  if (altBg.includes(type)) return { type: 'color', value: p.bgAlt }
  return { type: 'color', value: p.bg }
}

const W = 780

// ──────────────────────────────────────
// ANUA 수준 섹션별 기본 엘리먼트
// ──────────────────────────────────────
export interface ProductContext {
  name?: string
  category?: string
  keyPoints?: string[]
}

function getDefaultElements(type: SectionType, mood: MoodType, product?: ProductContext): SectionElement[] {
  const p = MOOD_PALETTES[mood]
  const pName = product?.name || '제품명을 입력하세요'
  const pCat = product?.category || '뷰티/스킨케어'
  const kp1 = product?.keyPoints?.[0] || '첫 번째 핵심 장점'
  const kp2 = product?.keyPoints?.[1] || '두 번째 핵심 장점'
  const kp3 = product?.keyPoints?.[2] || '세 번째 핵심 장점'
  const els: SectionElement[] = []

  switch (type) {

    // ━━━━━━━━━━ HERO (1100px) ━━━━━━━━━━
    case 'hero':
      // 텍스트 zone: y:40~280
      els.push(makeText('BRAND NAME', 40, 50, 700, 20, { fontSize: 12, fontWeight: 400, color: p.textMuted, textAlign: 'center', letterSpacing: 6, fontFamily: 'Playfair Display' }))
      els.push(makeText(pName, 40, 85, 700, 70, { fontSize: 40, fontWeight: 300, color: p.text, textAlign: 'center', lineHeight: 1.3 }))
      els.push(makeText(kp1, 40, 170, 700, 28, { fontSize: 15, fontWeight: 400, color: p.textMuted, textAlign: 'center' }))
      els.push(makeShape('line', 340, 215, 100, 2, { backgroundColor: p.accent }))
      els.push(makeShape('rect', 280, 235, 220, 32, { backgroundColor: p.accentBg, borderRadius: 16 }))
      els.push(makeText('★★★★★  4.9  (2,847 리뷰)', 280, 241, 220, 20, { fontSize: 11, fontWeight: 500, color: p.accent, textAlign: 'center' }))
      // 이미지 zone: y:300~880 (텍스트와 완전 분리)
      els.push(makeImage('product', 165, 300, 450, 580))
      // 키워드 zone: y:910~960
      els.push(makeShape('rect', 80, 910, 180, 40, { backgroundColor: p.accentBg, borderRadius: 20 }))
      els.push(makeText(`#${kp1}`, 80, 918, 180, 24, { fontSize: 12, fontWeight: 500, color: p.accent, textAlign: 'center' }))
      els.push(makeShape('rect', 300, 910, 180, 40, { backgroundColor: p.accentBg, borderRadius: 20 }))
      els.push(makeText(`#${kp2}`, 300, 918, 180, 24, { fontSize: 12, fontWeight: 500, color: p.accent, textAlign: 'center' }))
      els.push(makeShape('rect', 520, 910, 180, 40, { backgroundColor: p.accentBg, borderRadius: 20 }))
      els.push(makeText(`#${kp3}`, 520, 918, 180, 24, { fontSize: 12, fontWeight: 500, color: p.accent, textAlign: 'center' }))
      // 감성 카피: y:980
      els.push(makeText('피부 본연의 힘을 깨우다', 40, 980, 700, 40, { fontSize: 20, fontWeight: 300, color: p.textMuted, textAlign: 'center', letterSpacing: 2 }))
      break

    // ━━━━━━━━━━ PHILOSOPHY (800px) ━━━━━━━━━━
    case 'philosophy':
      // 좌측 accent 세로 바
      els.push(makeShape('rect', 100, 200, 4, 120, { backgroundColor: p.accent }))
      // 인용구
      els.push(makeText('"우리는 피부 본연의 아름다움을\n되찾아주는 것을 믿습니다"', 130, 200, 500, 120, { fontSize: 24, fontWeight: 300, color: p.text, textAlign: 'left', lineHeight: 1.8 }))
      // 작은 카피
      els.push(makeText('— Brand Philosophy', 130, 360, 300, 24, { fontSize: 13, fontWeight: 400, color: p.textMuted, textAlign: 'left', letterSpacing: 2, fontFamily: 'Playfair Display' }))
      // 브랜드 설명
      els.push(makeText('자연에서 영감을 받아, 과학으로 완성합니다.\n순하지만 확실한 효과를 약속합니다.', 130, 440, 520, 80, { fontSize: 15, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.8 }))
      // 장식 원형
      els.push(makeShape('circle', 620, 180, 80, 80, { backgroundColor: p.accentBg, borderRadius: 9999 }))
      break

    // ━━━━━━━━━━ BENEFITS (1600px) ━━━━━━━━━━
    case 'benefits':
      els.push(makeText('KEY BENEFITS', 0, 60, W, 24, { fontSize: 12, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 4 }))
      els.push(makeText('이 제품이 특별한 이유', 0, 95, W, 50, { fontSize: 34, fontWeight: 600, color: p.text, textAlign: 'center' }))
      els.push(makeShape('line', 340, 165, 100, 2, { backgroundColor: p.accent }))
      // 장점 1 - 좌 이미지(x:40~380) + 우 텍스트(x:420~740) — 완전 분리
      els.push(makeImage('generate:lifestyle', 40, 200, 340, 340, { borderRadius: 16, objectFit: 'cover' }))
      els.push(makeShape('circle', 420, 220, 40, 40, { backgroundColor: p.accent, borderRadius: 9999 }))
      els.push(makeText('01', 420, 228, 40, 24, { fontSize: 15, fontWeight: 700, color: '#FFFFFF', textAlign: 'center' }))
      els.push(makeText(kp1, 470, 224, 270, 28, { fontSize: 19, fontWeight: 600, color: p.text, textAlign: 'left' }))
      els.push(makeText('피부에 즉각적인 변화를 느낄 수 있습니다.\n가볍게 바르기만 해도 깊은 보습이\n오래도록 지속됩니다.', 420, 280, 320, 120, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.8 }))
      // 장점 2 - 좌 텍스트(x:40~380) + 우 이미지(x:400~740) — 좌우 반전
      els.push(makeShape('circle', 40, 600, 40, 40, { backgroundColor: p.accent, borderRadius: 9999 }))
      els.push(makeText('02', 40, 608, 40, 24, { fontSize: 15, fontWeight: 700, color: '#FFFFFF', textAlign: 'center' }))
      els.push(makeText(kp2, 90, 604, 270, 28, { fontSize: 19, fontWeight: 600, color: p.text, textAlign: 'left' }))
      els.push(makeText('자연 유래 성분이 피부 깊숙이 스며들어\n건강한 피부 장벽을 형성합니다.\n민감한 피부도 안심합니다.', 40, 660, 340, 120, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.8 }))
      els.push(makeImage('generate:ingredient', 400, 580, 340, 340, { borderRadius: 16, objectFit: 'cover' }))
      // 장점 3 - 풀폭 카드
      els.push(makeShape('rect', 40, 980, 700, 160, { backgroundColor: p.accentBg, borderRadius: 16 }))
      els.push(makeShape('circle', 70, 1010, 40, 40, { backgroundColor: p.accent, borderRadius: 9999 }))
      els.push(makeText('03', 70, 1018, 40, 24, { fontSize: 15, fontWeight: 700, color: '#FFFFFF', textAlign: 'center' }))
      els.push(makeText(kp3, 120, 1014, 400, 28, { fontSize: 19, fontWeight: 600, color: p.text, textAlign: 'left' }))
      els.push(makeText('매일 사용할수록 피부 톤이 맑아지고\n탄력이 개선됩니다.', 120, 1060, 580, 60, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.8 }))
      // 하단
      els.push(makeText('단 하나의 제품으로, 세 가지 효과를 한번에', 40, 1200, 700, 36, { fontSize: 17, fontWeight: 500, color: p.text, textAlign: 'center' }))
      break

    // ━━━━━━━━━━ INGREDIENTS (1400px) ━━━━━━━━━━
    case 'ingredients':
      els.push(makeText('KEY INGREDIENTS', 0, 60, W, 24, { fontSize: 12, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 4 }))
      els.push(makeText('엄선된 핵심 성분', 0, 95, W, 50, { fontSize: 34, fontWeight: 600, color: p.text, textAlign: 'center' }))
      els.push(makeShape('line', 340, 165, 100, 2, { backgroundColor: p.accent }))
      // 성분 1
      els.push(makeShape('rect', 60, 220, 660, 300, { backgroundColor: p.bg, borderRadius: 16 }))
      els.push(makeImage('generate:ingredient', 80, 240, 220, 260))
      els.push(makeText('핵심 성분 01', 330, 260, 360, 30, { fontSize: 22, fontWeight: 600, color: p.text, textAlign: 'left' }))
      els.push(makeShape('line', 330, 300, 60, 2, { backgroundColor: p.accent }))
      els.push(makeText('피부 깊숙이 수분을 공급하여\n건조함 없이 촉촉한 피부를 유지합니다.\n\n자연 유래 성분 97.2%', 330, 320, 360, 140, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.8 }))
      // 성분 2
      els.push(makeShape('rect', 60, 560, 660, 300, { backgroundColor: p.bg, borderRadius: 16 }))
      els.push(makeImage('generate:texture', 420, 580, 220, 260))
      els.push(makeText('핵심 성분 02', 100, 600, 300, 30, { fontSize: 22, fontWeight: 600, color: p.text, textAlign: 'left' }))
      els.push(makeShape('line', 100, 640, 60, 2, { backgroundColor: p.accent }))
      els.push(makeText('손상된 피부 장벽을 복구하고\n외부 자극으로부터 피부를 보호합니다.\n\n피부과 테스트 완료', 100, 660, 300, 140, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.8 }))
      // 성분 3
      els.push(makeShape('rect', 60, 900, 660, 300, { backgroundColor: p.bg, borderRadius: 16 }))
      els.push(makeImage('generate:lifestyle', 80, 920, 220, 260))
      els.push(makeText('핵심 성분 03', 330, 940, 360, 30, { fontSize: 22, fontWeight: 600, color: p.text, textAlign: 'left' }))
      els.push(makeShape('line', 330, 980, 60, 2, { backgroundColor: p.accent }))
      els.push(makeText('피부 톤을 균일하게 정돈하여\n맑고 투명한 피부결로 가꿔줍니다.\n\n임상 테스트 완료', 330, 1000, 360, 140, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.8 }))
      break

    // ━━━━━━━━━━ TEXTURE (1100px) ━━━━━━━━━━
    case 'texture':
      // 풀폭 텍스처 이미지
      els.push(makeImage('generate:texture', 0, 0, W, 600))
      // 텍스트 오버레이 영역
      els.push(makeShape('rect', 0, 600, W, 500, { backgroundColor: p.bg }))
      els.push(makeText('TEXTURE', 0, 640, W, 24, { fontSize: 12, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 4 }))
      els.push(makeText('부드럽게 스며드는 텍스처', 0, 680, W, 50, { fontSize: 30, fontWeight: 300, color: p.text, textAlign: 'center' }))
      els.push(makeShape('line', 340, 745, 100, 2, { backgroundColor: p.accent }))
      els.push(makeText('가볍고 산뜻한 워터 타입 제형이\n피부에 빠르게 흡수되어 끈적임 없이\n촉촉함이 오래 지속됩니다.', 140, 780, 500, 100, { fontSize: 16, fontWeight: 400, color: p.textMuted, textAlign: 'center', lineHeight: 1.8 }))
      // 특성 3개
      els.push(makeText('💧 수분감', 80, 940, 180, 30, { fontSize: 14, fontWeight: 500, color: p.text, textAlign: 'center' }))
      els.push(makeText('🌿 순한 제형', 300, 940, 180, 30, { fontSize: 14, fontWeight: 500, color: p.text, textAlign: 'center' }))
      els.push(makeText('✨ 빠른 흡수', 520, 940, 180, 30, { fontSize: 14, fontWeight: 500, color: p.text, textAlign: 'center' }))
      break

    // ━━━━━━━━━━ PROOF (900px) ━━━━━━━━━━
    case 'proof':
      els.push(makeText('CLINICAL RESULTS', 0, 60, W, 24, { fontSize: 12, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 4 }))
      els.push(makeText('숫자로 증명합니다', 0, 95, W, 50, { fontSize: 34, fontWeight: 600, color: p.text, textAlign: 'center' }))
      els.push(makeShape('line', 340, 165, 100, 2, { backgroundColor: p.accent }))
      // 수치 4개 그리드
      const proofItems = [
        { num: '97.2%', label: '자연유래 성분', x: 40 },
        { num: '2주', label: '효과 체감 기간', x: 230 },
        { num: '4.9', label: '평균 만족도', x: 420 },
        { num: '30만+', label: '누적 판매량', x: 590 },
      ]
      proofItems.forEach((item) => {
        els.push(makeShape('rect', item.x, 220, 160, 160, { backgroundColor: p.accentBg, borderRadius: 16 }))
        els.push(makeText(item.num, item.x, 250, 160, 50, { fontSize: 36, fontWeight: 800, color: p.accent, textAlign: 'center' }))
        els.push(makeText(item.label, item.x, 320, 160, 30, { fontSize: 13, fontWeight: 400, color: p.textMuted, textAlign: 'center' }))
      })
      // 출처
      els.push(makeText('* 자체 임상시험 결과 기준 (n=128, 2주 사용)', 0, 430, W, 24, { fontSize: 11, fontWeight: 400, color: p.textLight, textAlign: 'center' }))
      // Before/After 영역
      els.push(makeText('BEFORE & AFTER', 0, 510, W, 24, { fontSize: 12, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 4 }))
      els.push(makeShape('rect', 60, 560, 310, 260, { backgroundColor: p.bgAlt, borderRadius: 12 }))
      els.push(makeText('BEFORE', 60, 580, 310, 24, { fontSize: 11, fontWeight: 600, color: p.textMuted, textAlign: 'center', letterSpacing: 2 }))
      els.push(makeShape('rect', 410, 560, 310, 260, { backgroundColor: p.bgAlt, borderRadius: 12 }))
      els.push(makeText('AFTER', 410, 580, 310, 24, { fontSize: 11, fontWeight: 600, color: p.accent, textAlign: 'center', letterSpacing: 2 }))
      break

    // ━━━━━━━━━━ HOWTO (1200px) ━━━━━━━━━━
    case 'howto':
      els.push(makeText('HOW TO USE', 0, 60, W, 24, { fontSize: 12, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 4 }))
      els.push(makeText('사용 방법', 0, 95, W, 50, { fontSize: 34, fontWeight: 600, color: p.text, textAlign: 'center' }))
      els.push(makeShape('line', 340, 165, 100, 2, { backgroundColor: p.accent }))
      // Step 1
      els.push(makeShape('rect', 60, 220, 660, 240, { backgroundColor: p.bg, borderRadius: 16 }))
      els.push(makeShape('circle', 90, 250, 56, 56, { backgroundColor: p.accent, borderRadius: 9999 }))
      els.push(makeText('01', 90, 264, 56, 28, { fontSize: 20, fontWeight: 700, color: '#FFFFFF', textAlign: 'center' }))
      els.push(makeText('STEP 1', 170, 250, 200, 20, { fontSize: 11, fontWeight: 600, color: p.accent, textAlign: 'left', letterSpacing: 2 }))
      els.push(makeText('세안 후 토너로 피부를 정돈하세요', 170, 275, 500, 28, { fontSize: 18, fontWeight: 600, color: p.text, textAlign: 'left' }))
      els.push(makeText('깨끗이 세안한 후 토너를 사용하여\n피부결을 정돈하고 다음 단계를 준비합니다.', 170, 320, 500, 60, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.7 }))
      // 점선 연결
      els.push(makeShape('line', 117, 460, 2, 30, { backgroundColor: p.textLight }))
      // Step 2
      els.push(makeShape('rect', 60, 500, 660, 240, { backgroundColor: p.bg, borderRadius: 16 }))
      els.push(makeShape('circle', 90, 530, 56, 56, { backgroundColor: p.accent, borderRadius: 9999 }))
      els.push(makeText('02', 90, 544, 56, 28, { fontSize: 20, fontWeight: 700, color: '#FFFFFF', textAlign: 'center' }))
      els.push(makeText('STEP 2', 170, 530, 200, 20, { fontSize: 11, fontWeight: 600, color: p.accent, textAlign: 'left', letterSpacing: 2 }))
      els.push(makeText('적당량을 덜어 얼굴 전체에 펴바르세요', 170, 555, 500, 28, { fontSize: 18, fontWeight: 600, color: p.text, textAlign: 'left' }))
      els.push(makeText('1~2 펌프를 손에 덜어 이마, 볼, 턱 등\n얼굴 전체에 골고루 펴발라 줍니다.', 170, 600, 500, 60, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.7 }))
      // 점선 연결
      els.push(makeShape('line', 117, 740, 2, 30, { backgroundColor: p.textLight }))
      // Step 3
      els.push(makeShape('rect', 60, 780, 660, 240, { backgroundColor: p.bg, borderRadius: 16 }))
      els.push(makeShape('circle', 90, 810, 56, 56, { backgroundColor: p.accent, borderRadius: 9999 }))
      els.push(makeText('03', 90, 824, 56, 28, { fontSize: 20, fontWeight: 700, color: '#FFFFFF', textAlign: 'center' }))
      els.push(makeText('STEP 3', 170, 810, 200, 20, { fontSize: 11, fontWeight: 600, color: p.accent, textAlign: 'left', letterSpacing: 2 }))
      els.push(makeText('가볍게 두드려 흡수시키세요', 170, 835, 500, 28, { fontSize: 18, fontWeight: 600, color: p.text, textAlign: 'left' }))
      els.push(makeText('손끝으로 가볍게 탭핑하여 흡수를 도와주세요.\n남은 양은 목과 데콜테까지 발라줍니다.', 170, 880, 500, 60, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.7 }))
      // 팁
      els.push(makeShape('rect', 100, 1080, 580, 60, { backgroundColor: p.accentBg, borderRadius: 30 }))
      els.push(makeText('💡 TIP: 아침·저녁 세안 후 매일 사용하면 더욱 효과적입니다', 100, 1096, 580, 28, { fontSize: 13, fontWeight: 500, color: p.accent, textAlign: 'center' }))
      break

    // ━━━━━━━━━━ BANNER (700px) ━━━━━━━━━━
    case 'banner':
      els.push(makeImage('product', 240, 60, 300, 380))
      els.push(makeText('당신의 피부가 달라지는 순간', 0, 480, W, 50, { fontSize: 28, fontWeight: 300, color: '#F5F0E8', textAlign: 'center', letterSpacing: 1 }))
      els.push(makeShape('line', 340, 545, 100, 2, { backgroundColor: p.accent }))
      els.push(makeText('자연의 힘으로, 과학의 정밀함으로', 0, 570, W, 30, { fontSize: 15, fontWeight: 400, color: '#A89B8C', textAlign: 'center' }))
      // 장식 요소
      els.push(makeShape('circle', 60, 100, 60, 60, { backgroundColor: p.accent, borderRadius: 9999, opacity: 0.1 }))
      els.push(makeShape('circle', 660, 300, 80, 80, { backgroundColor: p.accent, borderRadius: 9999, opacity: 0.08 }))
      break

    // ━━━━━━━━━━ REVIEWS (1000px) ━━━━━━━━━━
    case 'reviews':
      els.push(makeText('REAL REVIEWS', 0, 60, W, 24, { fontSize: 12, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 4 }))
      els.push(makeText('실제 사용 후기', 0, 95, W, 50, { fontSize: 34, fontWeight: 600, color: p.text, textAlign: 'center' }))
      els.push(makeShape('line', 340, 165, 100, 2, { backgroundColor: p.accent }))
      // 리뷰 카드 1
      els.push(makeShape('rect', 60, 220, 660, 200, { backgroundColor: p.bg, borderRadius: 16 }))
      els.push(makeText('★★★★★', 90, 240, 200, 24, { fontSize: 16, fontWeight: 400, color: '#F59E0B', textAlign: 'left' }))
      els.push(makeText('"진짜 인생템 찾았어요! 바르자마자 촉촉해지는게\n느껴지고, 다음날 아침까지 촉촉함이 유지돼요.\n이제 다른 제품은 못 쓸 것 같아요."', 90, 275, 580, 80, { fontSize: 14, fontWeight: 400, color: p.text, textAlign: 'left', lineHeight: 1.7 }))
      els.push(makeText('김*진, 28세  ·  인증구매', 90, 370, 300, 20, { fontSize: 12, fontWeight: 400, color: p.textMuted, textAlign: 'left' }))
      // 리뷰 카드 2
      els.push(makeShape('rect', 60, 460, 660, 200, { backgroundColor: p.bg, borderRadius: 16 }))
      els.push(makeText('★★★★★', 90, 480, 200, 24, { fontSize: 16, fontWeight: 400, color: '#F59E0B', textAlign: 'left' }))
      els.push(makeText('"민감성 피부인데 전혀 자극 없이 잘 맞아요.\n보습력도 좋고 향도 은은해서 좋습니다.\n벌써 세 번째 재구매 중이에요!"', 90, 515, 580, 80, { fontSize: 14, fontWeight: 400, color: p.text, textAlign: 'left', lineHeight: 1.7 }))
      els.push(makeText('이*수, 33세  ·  인증구매', 90, 610, 300, 20, { fontSize: 12, fontWeight: 400, color: p.textMuted, textAlign: 'left' }))
      // 리뷰 카드 3
      els.push(makeShape('rect', 60, 700, 660, 200, { backgroundColor: p.bg, borderRadius: 16 }))
      els.push(makeText('★★★★☆', 90, 720, 200, 24, { fontSize: 16, fontWeight: 400, color: '#F59E0B', textAlign: 'left' }))
      els.push(makeText('"남자친구한테 선물했는데 피부가 확 좋아졌다고\n감동받았어요. 가성비도 좋고 용량도 넉넉해서\n오래 쓸 수 있어요."', 90, 755, 580, 80, { fontSize: 14, fontWeight: 400, color: p.text, textAlign: 'left', lineHeight: 1.7 }))
      els.push(makeText('박*은, 26세  ·  인증구매', 90, 850, 300, 20, { fontSize: 12, fontWeight: 400, color: p.textMuted, textAlign: 'left' }))
      break

    // ━━━━━━━━━━ SPECS (900px) ━━━━━━━━━━
    case 'specs':
      els.push(makeText('PRODUCT INFO', 0, 60, W, 24, { fontSize: 12, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 4 }))
      els.push(makeText('제품 정보', 0, 95, W, 50, { fontSize: 34, fontWeight: 600, color: p.text, textAlign: 'center' }))
      els.push(makeShape('line', 340, 165, 100, 2, { backgroundColor: p.accent }))
      // 이미지 + 스펙 테이블
      els.push(makeImage('product', 60, 220, 250, 400))
      els.push(makeShape('rect', 350, 220, 370, 400, { backgroundColor: p.bgAlt, borderRadius: 12 }))
      // 스펙 항목들
      const specs = [
        ['제품명', pName],
        ['용량', '000ml / 000g'],
        ['제조국', '대한민국'],
        ['사용기한', '제조일로부터 12개월'],
        ['피부타입', '모든 피부 타입'],
      ]
      specs.forEach(([label, value], i) => {
        const y = 250 + i * 55
        els.push(makeText(label, 370, y, 120, 24, { fontSize: 13, fontWeight: 600, color: p.textMuted, textAlign: 'left' }))
        els.push(makeText(value, 500, y, 200, 24, { fontSize: 14, fontWeight: 400, color: p.text, textAlign: 'left' }))
        if (i < specs.length - 1) {
          els.push(makeShape('line', 370, y + 38, 330, 1, { backgroundColor: p.textLight, opacity: 0.3 }))
        }
      })
      // 인증 배지
      els.push(makeText('🧪 피부과 테스트 완료  ·  🌿 비건  ·  🐰 크루얼티 프리', 0, 700, W, 24, { fontSize: 13, fontWeight: 400, color: p.textMuted, textAlign: 'center' }))
      // 주의사항
      els.push(makeText('※ 화장품 사용 시 또는 사용 후 직사광선에 의하여 사용부위가 붉은 반점, 부어오름 등의\n이상 증상이나 부작용이 있는 경우 전문의 등과 상담하십시오.', 80, 770, 620, 50, { fontSize: 11, fontWeight: 400, color: p.textLight, textAlign: 'center', lineHeight: 1.6 }))
      break

    // ━━━━━━━━━━ CTA (600px) ━━━━━━━━━━
    case 'cta':
      els.push(makeImage('product', 290, 40, 200, 260))
      els.push(makeText('지금 바로 만나보세요', 0, 330, W, 50, { fontSize: 30, fontWeight: 600, color: '#F5F0E8', textAlign: 'center' }))
      els.push(makeShape('line', 340, 390, 100, 2, { backgroundColor: p.accent }))
      els.push(makeText('더 건강하고 아름다운 피부를 위한 첫 걸음', 0, 410, W, 30, { fontSize: 15, fontWeight: 400, color: '#A89B8C', textAlign: 'center' }))
      // CTA 버튼 모양
      els.push(makeShape('rect', 260, 470, 260, 52, { backgroundColor: p.accent, borderRadius: 26 }))
      els.push(makeText('구매하러 가기 →', 260, 482, 260, 28, { fontSize: 15, fontWeight: 600, color: '#FFFFFF', textAlign: 'center' }))
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
    id: uuidv4(), type: 'text', content, x, y, width, height,
    fontSize: 16, fontWeight: 400, fontFamily: 'Noto Sans KR',
    color: '#333333', textAlign: 'center', lineHeight: 1.5, letterSpacing: 0,
    opacity: 1, rotation: 0, locked: false,
    ...opts,
  }
}

function makeImage(
  src: string,
  x: number, y: number, width: number, height: number,
  opts: Partial<ImageElement> = {}
): ImageElement {
  return {
    id: uuidv4(), type: 'image', src, x, y, width, height,
    objectFit: 'contain', borderRadius: 0, opacity: 1, rotation: 0, locked: false,
    ...opts,
  }
}

function makeShape(
  shapeType: 'rect' | 'circle' | 'line' | 'badge',
  x: number, y: number, width: number, height: number,
  opts: Partial<ShapeElement> = {}
): ShapeElement {
  return {
    id: uuidv4(), type: 'shape', shapeType, x, y, width, height,
    backgroundColor: '#F0F0F0', borderColor: 'transparent', borderWidth: 0, borderRadius: 0,
    opacity: 1, rotation: 0, locked: false,
    ...opts,
  }
}

// ──────────────────────────────────────
// 기본 섹션 생성
// ──────────────────────────────────────
export function getDefaultSection(type: SectionType, mood: MoodType, product?: ProductContext): Section {
  return {
    id: uuidv4(),
    type,
    label: SECTION_LABELS[type],
    order: 0,
    height: DEFAULT_HEIGHTS[type],
    background: getDefaultBackground(type, mood),
    elements: getDefaultElements(type, mood, product),
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
    x: data.x ?? 0, y: data.y ?? 0,
    width: data.width ?? 300, height: data.height ?? 100,
    opacity: data.opacity ?? 1, rotation: 0, locked: false,
  }
  switch (data.type) {
    case 'text':
      return { ...base, type: 'text', content: data.content ?? '', fontSize: data.fontSize ?? 16, fontWeight: data.fontWeight ?? 400, fontFamily: data.fontFamily ?? 'Noto Sans KR', color: data.color ?? '#333333', textAlign: data.textAlign ?? 'center', lineHeight: data.lineHeight ?? 1.5, letterSpacing: data.letterSpacing ?? 0 } as TextElement
    case 'image':
      return { ...base, type: 'image', src: data.src ?? 'product', objectFit: data.objectFit ?? 'contain', borderRadius: Math.min(data.borderRadius ?? 0, 30) } as ImageElement
    case 'shape':
      return { ...base, type: 'shape', shapeType: (data.shapeType as ShapeElement['shapeType']) ?? 'rect', backgroundColor: data.backgroundColor ?? '#F0F0F0', borderColor: data.borderColor ?? 'transparent', borderWidth: data.borderWidth ?? 0, borderRadius: data.borderRadius ?? 0 } as ShapeElement
    default:
      return { ...base, type: 'text', content: '', fontSize: 16, fontWeight: 400, fontFamily: 'Noto Sans KR', color: '#333', textAlign: 'center', lineHeight: 1.5, letterSpacing: 0 } as TextElement
  }
}
