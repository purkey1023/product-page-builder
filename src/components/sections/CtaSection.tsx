'use client'

import { SectionWrapper, ProductImage, BackgroundImage, type SectionProps } from './shared'

export function CtaSection({ section, productImageUrl, isSelected, onSelect }: SectionProps) {
  const { content, style } = section

  return (
    <SectionWrapper section={section} isSelected={isSelected} onSelect={onSelect} minHeight={320}>
      <BackgroundImage imageUrl={productImageUrl} config={content.imageConfig} />

      <div className="relative z-10 flex flex-col items-center">
        {content.imageConfig.position !== 'background' && (
          <ProductImage imageUrl={productImageUrl} config={content.imageConfig} />
        )}

        <h2
          className="font-bold mb-3 whitespace-pre-wrap"
          style={{ color: style.textColor, fontSize: '24px', lineHeight: 1.3 }}
        >
          {content.title}
        </h2>

        <p
          className="text-sm mb-6 whitespace-pre-wrap"
          style={{ color: style.textColor, opacity: 0.8 }}
        >
          {content.body}
        </p>

        {/* CTA 버튼 (시각적 요소, 다운로드용) */}
        {content.highlight && (
          <div
            className="px-8 py-3 rounded-full font-bold text-sm"
            style={{
              backgroundColor: style.textColor,
              color: style.backgroundColor,
            }}
          >
            {content.highlight}
          </div>
        )}
      </div>
    </SectionWrapper>
  )
}
