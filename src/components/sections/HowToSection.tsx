'use client'

import { SectionWrapper, type SectionProps } from './shared'

export function HowToSection({ section, isSelected, onSelect }: SectionProps) {
  const { content, style } = section

  return (
    <SectionWrapper section={section} isSelected={isSelected} onSelect={onSelect} minHeight={260}>
      <h2
        className="font-bold mb-2 whitespace-pre-wrap"
        style={{ color: style.textColor, fontSize: '22px' }}
      >
        {content.title}
      </h2>
      <p
        className="text-sm mb-6 whitespace-pre-wrap"
        style={{ color: style.textColor, opacity: 0.7 }}
      >
        {content.body}
      </p>

      <div className="flex flex-col gap-3">
        {content.items.map((step, i) => (
          <div key={i} className="flex items-start gap-4">
            {/* 단계 번호 */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
              style={{
                backgroundColor: style.textColor,
                color: style.backgroundColor,
              }}
            >
              {i + 1}
            </div>
            {/* 단계 내용 */}
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium" style={{ color: style.textColor }}>
                {step}
              </p>
            </div>
            {/* 연결선 (마지막 제외) */}
            {i < content.items.length - 1 && (
              <div
                className="absolute left-4 w-0.5 h-4"
                style={{ backgroundColor: `${style.textColor}20` }}
              />
            )}
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
