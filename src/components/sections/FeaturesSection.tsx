'use client'

import { SectionWrapper, ProductImage, HighlightBadge, type SectionProps } from './shared'

export function FeaturesSection({ section, productImageUrl, isSelected, onSelect }: SectionProps) {
  const { content, style } = section
  const isLeft = content.imageConfig.position === 'left'
  const isRight = content.imageConfig.position === 'right'
  const isSide = isLeft || isRight

  return (
    <SectionWrapper section={section} isSelected={isSelected} onSelect={onSelect} minHeight={300}>
      {isSide ? (
        // 이미지 좌/우 배치
        <div className={`flex gap-4 items-center ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className="w-2/5 flex-shrink-0">
            <ProductImage imageUrl={productImageUrl} config={content.imageConfig} />
          </div>
          <div className="flex-1">
            <FeaturesContent content={content} style={style} />
          </div>
        </div>
      ) : (
        // 이미지 상/하/중앙 배치
        <div className="flex flex-col items-center">
          {content.imageConfig.position === 'top' && (
            <ProductImage imageUrl={productImageUrl} config={content.imageConfig} />
          )}
          <FeaturesContent content={content} style={style} />
          {content.imageConfig.position !== 'top' && content.imageConfig.position !== 'background' && (
            <ProductImage imageUrl={productImageUrl} config={content.imageConfig} />
          )}
        </div>
      )}
    </SectionWrapper>
  )
}

function FeaturesContent({
  content,
  style,
}: {
  content: ReturnType<typeof Object.values>[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style: any
}) {
  return (
    <div>
      <HighlightBadge text={content.highlight} textColor={style.textColor} />
      <h2
        className="font-bold mb-2 whitespace-pre-wrap"
        style={{ color: style.textColor, fontSize: '20px' }}
      >
        {content.title}
      </h2>
      <p
        className="text-sm mb-4 leading-relaxed whitespace-pre-wrap"
        style={{ color: style.textColor, opacity: 0.8 }}
      >
        {content.body}
      </p>
      <ul className="space-y-2">
        {content.items.map((item: string, i: number) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: style.textColor }}>
            <span style={{ color: style.textColor, opacity: 0.5 }}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
