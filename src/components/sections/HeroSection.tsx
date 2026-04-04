'use client'

import { SectionWrapper, ProductImage, BackgroundImage, HighlightBadge, type SectionProps } from './shared'

export function HeroSection({ section, productImageUrl, isSelected, onSelect }: SectionProps) {
  const { content, style } = section
  const isImageTop = content.imageConfig.position === 'top'

  return (
    <SectionWrapper section={section} isSelected={isSelected} onSelect={onSelect} minHeight={440}>
      <BackgroundImage imageUrl={productImageUrl} config={content.imageConfig} />

      <div className="relative z-10 flex flex-col items-center">
        {/* 이미지 상단 배치 */}
        {isImageTop && (
          <ProductImage imageUrl={productImageUrl} config={content.imageConfig} />
        )}

        <HighlightBadge text={content.highlight} textColor={style.textColor} />

        <h1
          className="font-bold leading-tight mb-3 px-2 whitespace-pre-wrap"
          style={{ color: style.textColor, fontSize: '26px', lineHeight: 1.25 }}
        >
          {content.title}
        </h1>

        <p
          className="text-sm leading-relaxed mb-6 px-4 whitespace-pre-wrap"
          style={{ color: style.textColor, opacity: 0.75 }}
        >
          {content.body}
        </p>

        {/* 이미지 중앙/하단 배치 */}
        {!isImageTop && content.imageConfig.position !== 'background' && (
          <ProductImage imageUrl={productImageUrl} config={content.imageConfig} />
        )}
      </div>
    </SectionWrapper>
  )
}
