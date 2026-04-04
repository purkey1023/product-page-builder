'use client'

import { SectionWrapper, HighlightBadge, type SectionProps } from './shared'

export function BenefitsSection({ section, isSelected, onSelect }: SectionProps) {
  const { content, style } = section

  return (
    <SectionWrapper section={section} isSelected={isSelected} onSelect={onSelect} minHeight={280}>
      <HighlightBadge text={content.highlight} textColor={style.textColor} />

      <h2
        className="font-bold mb-2 whitespace-pre-wrap"
        style={{ color: style.textColor, fontSize: '22px' }}
      >
        {content.title}
      </h2>

      <p
        className="text-sm mb-6 whitespace-pre-wrap"
        style={{ color: style.textColor, opacity: 0.75 }}
      >
        {content.body}
      </p>

      {/* 장점 카드 */}
      <div className="flex flex-col gap-3">
        {content.items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: `${style.textColor}10`,
              border: `1px solid ${style.textColor}20`,
            }}
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: style.textColor, color: style.backgroundColor }}
            >
              {i + 1}
            </span>
            <span className="text-sm font-medium" style={{ color: style.textColor }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
