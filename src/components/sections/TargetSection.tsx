'use client'

import { SectionWrapper, type SectionProps } from './shared'

const EMOJI_MAP = ['🙋', '✨', '💚', '🌿', '⭐']

export function TargetSection({ section, isSelected, onSelect }: SectionProps) {
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
        {content.items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ backgroundColor: `${style.textColor}12` }}
          >
            <span className="text-xl">{EMOJI_MAP[i % EMOJI_MAP.length]}</span>
            <span className="text-sm font-medium" style={{ color: style.textColor }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
