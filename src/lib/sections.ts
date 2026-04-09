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
  hero: 1000,
  philosophy: 520,
  benefits: 1480,
  ingredients: 1180,
  texture: 920,
  proof: 580,
  howto: 880,
  banner: 600,
  reviews: 900,
  specs: 720,
  cta: 520,
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

  // 카드 배경 (리뷰 등에서 사용)
  const cardBg = (mood === 'premium' || mood === 'impact') ? '#1E1E1E' : '#FFFFFF'

  switch (type) {

    // ━━━━━━━━━━ HERO (1000px) ━━━━━━━━━━
    // 제품 사진이 주인공 — 깔끔한 타이포그래피
    case 'hero':
      els.push(makeText('PREMIUM SKINCARE', 0, 44, W, 22, { fontSize: 11, fontWeight: 400, color: p.textMuted, textAlign: 'center', letterSpacing: 8 }))
      els.push(makeText(pName, 0, 74, W, 80, { fontSize: 44, fontWeight: 300, color: p.text, textAlign: 'center', lineHeight: 1.2 }))
      els.push(makeText(kp1, 0, 174, W, 32, { fontSize: 15, fontWeight: 400, color: p.textMuted, textAlign: 'center' }))
      els.push(makeImage('product', 90, 220, 600, 600, { borderRadius: 0 }))
      els.push(makeShape('line', 310, 844, 160, 1, { backgroundColor: p.accent }))
      els.push(makeText(`${kp1}  ·  ${kp2}  ·  ${kp3}`, 0, 862, W, 28, { fontSize: 13, fontWeight: 400, color: p.textMuted, textAlign: 'center', letterSpacing: 1 }))
      els.push(makeText('★★★★★  4.9  |  리뷰 2,847개', 0, 904, W, 28, { fontSize: 13, fontWeight: 400, color: p.accent, textAlign: 'center' }))
      break

    // ━━━━━━━━━━ PHILOSOPHY (520px) ━━━━━━━━━━
    case 'philosophy':
      els.push(makeShape('rect', 60, 110, 4, 220, { backgroundColor: p.accent }))
      els.push(makeText('"우리는 피부 본연의 아름다움을\n되찾아주는 것을 믿습니다"', 90, 110, 640, 200, { fontSize: 22, fontWeight: 300, color: p.text, textAlign: 'left', lineHeight: 1.85 }))
      els.push(makeText('— Brand Philosophy', 90, 332, 300, 24, { fontSize: 12, fontWeight: 400, color: p.textMuted, textAlign: 'left', letterSpacing: 2, fontFamily: 'Playfair Display' }))
      els.push(makeText('자연에서 영감을 받아, 과학으로 완성합니다.\n순하지만 확실한 효과를 약속드립니다.', 90, 380, 610, 80, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.85 }))
      break

    // ━━━━━━━━━━ BENEFITS (1480px) ━━━━━━━━━━
    // 좌우 교차 풀블리드 이미지 — ANUA 스타일
    case 'benefits':
      els.push(makeText('KEY BENEFITS', 0, 46, W, 22, { fontSize: 11, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 6 }))
      els.push(makeText('이 제품이 특별한 이유', 0, 76, W, 52, { fontSize: 36, fontWeight: 700, color: p.text, textAlign: 'center' }))
      // 장점 1 — 좌 이미지(풀블리드) + 우 텍스트
      els.push(makeImage('generate:lifestyle', 0, 150, 370, 420, { borderRadius: 0, objectFit: 'cover' }))
      els.push(makeText('01', 410, 248, 50, 28, { fontSize: 13, fontWeight: 400, color: p.accent, textAlign: 'left', letterSpacing: 3 }))
      els.push(makeText(kp1, 410, 282, 340, 60, { fontSize: 24, fontWeight: 700, color: p.text, textAlign: 'left', lineHeight: 1.3 }))
      els.push(makeText('피부에 즉각적인 변화를 느낄 수 있습니다.\n가볍게 발라도 깊은 보습이 오래 지속됩니다.', 410, 358, 330, 100, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.9 }))
      // 장점 2 — 좌 텍스트 + 우 이미지(풀블리드)
      els.push(makeText('02', 40, 688, 50, 28, { fontSize: 13, fontWeight: 400, color: p.accent, textAlign: 'left', letterSpacing: 3 }))
      els.push(makeText(kp2, 40, 722, 340, 60, { fontSize: 24, fontWeight: 700, color: p.text, textAlign: 'left', lineHeight: 1.3 }))
      els.push(makeText('자연 유래 성분이 피부 깊숙이 스며들어\n건강한 피부 장벽을 형성합니다.', 40, 798, 330, 100, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.9 }))
      els.push(makeImage('generate:ingredient', 410, 590, 370, 420, { borderRadius: 0, objectFit: 'cover' }))
      // 장점 3 — 좌 이미지(풀블리드) + 우 텍스트
      els.push(makeImage('generate:lifestyle', 0, 1030, 370, 420, { borderRadius: 0, objectFit: 'cover' }))
      els.push(makeText('03', 410, 1128, 50, 28, { fontSize: 13, fontWeight: 400, color: p.accent, textAlign: 'left', letterSpacing: 3 }))
      els.push(makeText(kp3, 410, 1162, 340, 60, { fontSize: 24, fontWeight: 700, color: p.text, textAlign: 'left', lineHeight: 1.3 }))
      els.push(makeText('매일 사용할수록 피부 톤이 맑아지고\n탄력이 개선됩니다.', 410, 1238, 330, 100, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.9 }))
      break

    // ━━━━━━━━━━ INGREDIENTS (1180px) ━━━━━━━━━━
    case 'ingredients':
      els.push(makeText('KEY INGREDIENTS', 0, 46, W, 22, { fontSize: 11, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 6 }))
      els.push(makeText('엄선된 핵심 성분', 0, 76, W, 52, { fontSize: 36, fontWeight: 700, color: p.text, textAlign: 'center' }))
      // 성분 1 — 좌 이미지 + 우 텍스트
      els.push(makeImage('generate:ingredient', 60, 158, 260, 300, { borderRadius: 0, objectFit: 'cover' }))
      els.push(makeText('핵심 성분 01', 360, 178, 380, 34, { fontSize: 21, fontWeight: 700, color: p.text, textAlign: 'left' }))
      els.push(makeShape('line', 360, 222, 60, 2, { backgroundColor: p.accent }))
      els.push(makeText('피부 깊숙이 수분을 공급하여\n건조함 없이 촉촉한 피부를 유지합니다.\n자연 유래 성분 97.2%', 360, 238, 380, 160, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.85 }))
      // 성분 2 — 좌 텍스트 + 우 이미지
      els.push(makeText('핵심 성분 02', 40, 530, 280, 34, { fontSize: 21, fontWeight: 700, color: p.text, textAlign: 'left' }))
      els.push(makeShape('line', 40, 574, 60, 2, { backgroundColor: p.accent }))
      els.push(makeText('손상된 피부 장벽을 복구하고\n외부 자극으로부터 피부를 보호합니다.\n피부과 테스트 완료', 40, 590, 340, 160, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.85 }))
      els.push(makeImage('generate:texture', 420, 510, 260, 300, { borderRadius: 0, objectFit: 'cover' }))
      // 성분 3 — 좌 이미지 + 우 텍스트
      els.push(makeImage('generate:ingredient', 60, 878, 260, 300, { borderRadius: 0, objectFit: 'cover' }))
      els.push(makeText('핵심 성분 03', 360, 898, 380, 34, { fontSize: 21, fontWeight: 700, color: p.text, textAlign: 'left' }))
      els.push(makeShape('line', 360, 942, 60, 2, { backgroundColor: p.accent }))
      els.push(makeText('피부 톤을 균일하게 정돈하여\n맑고 투명한 피부결로 가꿔줍니다.\n임상 테스트 완료', 360, 958, 380, 160, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.85 }))
      break

    // ━━━━━━━━━━ TEXTURE (920px) ━━━━━━━━━━
    case 'texture':
      // 풀폭 텍스처 이미지 (섹션 상단 채움)
      els.push(makeImage('generate:texture', 0, 0, W, 540, { borderRadius: 0, objectFit: 'cover' }))
      // 텍스트 영역
      els.push(makeText('TEXTURE', 0, 592, W, 22, { fontSize: 11, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 6 }))
      els.push(makeText('부드럽게 스며드는 텍스처', 0, 622, W, 50, { fontSize: 30, fontWeight: 300, color: p.text, textAlign: 'center' }))
      els.push(makeShape('line', 310, 692, 160, 1, { backgroundColor: p.accent }))
      els.push(makeText('워터처럼 가볍게 스며들어\n끈적임 없이 촉촉함이 오래 지속됩니다.', 140, 712, 500, 90, { fontSize: 15, fontWeight: 400, color: p.textMuted, textAlign: 'center', lineHeight: 1.85 }))
      els.push(makeText('💧 수분감  ·  🌿 순한 제형  ·  ✨ 빠른 흡수', 0, 836, W, 30, { fontSize: 13, fontWeight: 500, color: p.text, textAlign: 'center' }))
      break

    // ━━━━━━━━━━ PROOF (580px) ━━━━━━━━━━
    // 컬러 박스 없이 — 큰 숫자가 스스로 말한다
    case 'proof': {
      els.push(makeText('CLINICAL RESULTS', 0, 44, W, 22, { fontSize: 11, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 6 }))
      els.push(makeText('숫자로 증명합니다', 0, 74, W, 52, { fontSize: 36, fontWeight: 700, color: p.text, textAlign: 'center' }))
      els.push(makeShape('line', 310, 146, 160, 1, { backgroundColor: p.accent }))
      const proofItems = [
        { num: '97.2%', label: '자연유래 성분', x: 40 },
        { num: '2주', label: '효과 체감', x: 227 },
        { num: '4.9', label: '평균 만족도', x: 414 },
        { num: '30만+', label: '누적 판매', x: 601 },
      ]
      proofItems.forEach((item) => {
        els.push(makeText(item.num, item.x, 190, 150, 70, { fontSize: 40, fontWeight: 800, color: p.accent, textAlign: 'center' }))
        els.push(makeText(item.label, item.x, 268, 150, 28, { fontSize: 13, fontWeight: 400, color: p.textMuted, textAlign: 'center' }))
      })
      els.push(makeText('* 자체 임상시험 결과 기준 (n=128, 2주 사용 후)', 0, 340, W, 24, { fontSize: 11, fontWeight: 400, color: p.textLight, textAlign: 'center' }))
      els.push(makeText(`"단 2주, ${pName}이(가) 달라진 피부를 약속합니다"`, 80, 390, 620, 40, { fontSize: 16, fontWeight: 300, color: p.text, textAlign: 'center', lineHeight: 1.6 }))
      break
    }

    // ━━━━━━━━━━ HOWTO (880px) ━━━━━━━━━━
    // 큰 숫자 타이포가 스텝을 구분 — 원형 버튼 없음
    case 'howto':
      els.push(makeText('HOW TO USE', 0, 44, W, 22, { fontSize: 11, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 6 }))
      els.push(makeText('사용 방법', 0, 74, W, 52, { fontSize: 36, fontWeight: 700, color: p.text, textAlign: 'center' }))
      els.push(makeShape('line', 310, 146, 160, 1, { backgroundColor: p.accent }))
      // Step 1
      els.push(makeText('01', 60, 178, 80, 70, { fontSize: 48, fontWeight: 100, color: p.textLight, textAlign: 'left' }))
      els.push(makeText('세안 후 토너로 피부를 정돈하세요', 150, 192, 570, 34, { fontSize: 20, fontWeight: 600, color: p.text, textAlign: 'left' }))
      els.push(makeText('깨끗이 세안한 후 토너를 사용하여\n피부결을 정돈하고 다음 단계를 준비합니다.', 150, 240, 570, 70, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.75 }))
      els.push(makeShape('line', 60, 336, 660, 1, { backgroundColor: p.textLight, opacity: 0.25 }))
      // Step 2
      els.push(makeText('02', 60, 366, 80, 70, { fontSize: 48, fontWeight: 100, color: p.textLight, textAlign: 'left' }))
      els.push(makeText('적당량을 덜어 얼굴에 펴바르세요', 150, 380, 570, 34, { fontSize: 20, fontWeight: 600, color: p.text, textAlign: 'left' }))
      els.push(makeText('1~2 펌프를 손에 덜어 이마, 볼, 턱 등\n얼굴 전체에 골고루 펴발라 줍니다.', 150, 428, 570, 70, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.75 }))
      els.push(makeShape('line', 60, 524, 660, 1, { backgroundColor: p.textLight, opacity: 0.25 }))
      // Step 3
      els.push(makeText('03', 60, 554, 80, 70, { fontSize: 48, fontWeight: 100, color: p.textLight, textAlign: 'left' }))
      els.push(makeText('가볍게 두드려 흡수시키세요', 150, 568, 570, 34, { fontSize: 20, fontWeight: 600, color: p.text, textAlign: 'left' }))
      els.push(makeText('손끝으로 가볍게 탭핑하여 흡수를 도와주세요.\n남은 양은 목과 데콜테까지 발라줍니다.', 150, 616, 570, 70, { fontSize: 14, fontWeight: 400, color: p.textMuted, textAlign: 'left', lineHeight: 1.75 }))
      // Tip
      els.push(makeShape('rect', 60, 748, 660, 60, { backgroundColor: p.accentBg, borderRadius: 16 }))
      els.push(makeText('💡 TIP: 아침·저녁 세안 후 매일 사용하면 더욱 효과적입니다', 80, 764, 620, 28, { fontSize: 13, fontWeight: 500, color: p.accent, textAlign: 'center' }))
      break

    // ━━━━━━━━━━ BANNER (600px) ━━━━━━━━━━
    case 'banner':
      els.push(makeImage('product', 240, 40, 300, 370, { borderRadius: 0 }))
      els.push(makeText('당신의 피부가 달라지는 순간', 0, 438, W, 50, { fontSize: 28, fontWeight: 300, color: '#F5F0E8', textAlign: 'center', letterSpacing: 1 }))
      els.push(makeShape('line', 310, 504, 160, 1, { backgroundColor: p.accent }))
      els.push(makeText('자연의 힘으로, 과학의 정밀함으로', 0, 524, W, 30, { fontSize: 15, fontWeight: 400, color: '#A89B8C', textAlign: 'center' }))
      break

    // ━━━━━━━━━━ REVIEWS (900px) ━━━━━━━━━━
    case 'reviews':
      els.push(makeText('REAL REVIEWS', 0, 44, W, 22, { fontSize: 11, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 6 }))
      els.push(makeText('실제 사용 후기', 0, 74, W, 52, { fontSize: 36, fontWeight: 700, color: p.text, textAlign: 'center' }))
      els.push(makeShape('line', 310, 146, 160, 1, { backgroundColor: p.accent }))
      // 리뷰 카드 1
      els.push(makeShape('rect', 60, 176, 660, 190, { backgroundColor: cardBg, borderRadius: 12 }))
      els.push(makeText('★★★★★', 90, 196, 200, 24, { fontSize: 15, fontWeight: 400, color: '#F59E0B', textAlign: 'left' }))
      els.push(makeText('"바르자마자 촉촉해지는게 느껴지고, 다음날 아침까지\n촉촉함이 유지돼요. 진짜 인생템 찾았습니다."', 90, 230, 570, 80, { fontSize: 14, fontWeight: 400, color: p.text, textAlign: 'left', lineHeight: 1.75 }))
      els.push(makeText('김*진, 28세  ·  인증구매', 90, 326, 300, 20, { fontSize: 12, fontWeight: 400, color: p.textMuted, textAlign: 'left' }))
      // 리뷰 카드 2
      els.push(makeShape('rect', 60, 396, 660, 190, { backgroundColor: cardBg, borderRadius: 12 }))
      els.push(makeText('★★★★★', 90, 416, 200, 24, { fontSize: 15, fontWeight: 400, color: '#F59E0B', textAlign: 'left' }))
      els.push(makeText('"민감성 피부인데 전혀 자극 없이 잘 맞아요.\n보습력도 좋고 벌써 세 번째 재구매 중이에요!"', 90, 450, 570, 80, { fontSize: 14, fontWeight: 400, color: p.text, textAlign: 'left', lineHeight: 1.75 }))
      els.push(makeText('이*수, 33세  ·  인증구매', 90, 546, 300, 20, { fontSize: 12, fontWeight: 400, color: p.textMuted, textAlign: 'left' }))
      // 리뷰 카드 3
      els.push(makeShape('rect', 60, 616, 660, 190, { backgroundColor: cardBg, borderRadius: 12 }))
      els.push(makeText('★★★★★', 90, 636, 200, 24, { fontSize: 15, fontWeight: 400, color: '#F59E0B', textAlign: 'left' }))
      els.push(makeText('"선물했는데 피부가 확 좋아졌다고 감동받았어요.\n가성비도 좋고 용량도 넉넉합니다."', 90, 670, 570, 80, { fontSize: 14, fontWeight: 400, color: p.text, textAlign: 'left', lineHeight: 1.75 }))
      els.push(makeText('박*은, 26세  ·  인증구매', 90, 766, 300, 20, { fontSize: 12, fontWeight: 400, color: p.textMuted, textAlign: 'left' }))
      break

    // ━━━━━━━━━━ SPECS (720px) ━━━━━━━━━━
    case 'specs': {
      els.push(makeText('PRODUCT INFO', 0, 44, W, 22, { fontSize: 11, fontWeight: 400, color: p.accent, textAlign: 'center', letterSpacing: 6 }))
      els.push(makeText('제품 정보', 0, 74, W, 52, { fontSize: 36, fontWeight: 700, color: p.text, textAlign: 'center' }))
      els.push(makeShape('line', 310, 146, 160, 1, { backgroundColor: p.accent }))
      els.push(makeImage('product', 40, 172, 270, 380, { borderRadius: 0 }))
      const specRows = [
        ['제품명', pName],
        ['용량', '000ml / 000g'],
        ['제조국', '대한민국'],
        ['사용기한', '제조일로부터 12개월'],
      ]
      specRows.forEach(([label, value], i) => {
        const y = 196 + i * 56
        els.push(makeText(label, 360, y, 100, 24, { fontSize: 12, fontWeight: 600, color: p.textMuted, textAlign: 'left' }))
        els.push(makeText(value, 468, y, 280, 24, { fontSize: 13, fontWeight: 400, color: p.text, textAlign: 'left' }))
        els.push(makeShape('line', 360, y + 36, 380, 1, { backgroundColor: p.textLight, opacity: 0.3 }))
      })
      els.push(makeText('🧪 피부과 테스트 완료  ·  🌿 비건  ·  🐰 크루얼티 프리', 0, 596, W, 24, { fontSize: 12, fontWeight: 400, color: p.textMuted, textAlign: 'center' }))
      els.push(makeText('※ 이상 반응 시 전문의와 상담하십시오.', 0, 640, W, 24, { fontSize: 11, fontWeight: 400, color: p.textLight, textAlign: 'center' }))
      break
    }

    // ━━━━━━━━━━ CTA (520px) ━━━━━━━━━━
    case 'cta':
      els.push(makeImage('product', 270, 20, 240, 290, { borderRadius: 0 }))
      els.push(makeText('지금 바로 만나보세요', 0, 330, W, 52, { fontSize: 32, fontWeight: 600, color: '#F5F0E8', textAlign: 'center' }))
      els.push(makeShape('line', 310, 398, 160, 1, { backgroundColor: p.accent }))
      els.push(makeText('더 건강하고 아름다운 피부를 위한 첫 걸음', 0, 418, W, 30, { fontSize: 14, fontWeight: 400, color: '#A89B8C', textAlign: 'center' }))
      els.push(makeShape('rect', 265, 470, 250, 48, { backgroundColor: p.accent, borderRadius: 24 }))
      els.push(makeText('구매하러 가기  →', 265, 482, 250, 24, { fontSize: 14, fontWeight: 600, color: '#FFFFFF', textAlign: 'center' }))
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
