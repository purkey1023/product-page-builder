'use client'

import type { MoodType } from '@/types'
import { cn } from '@/lib/utils'

const MOODS: {
  value: MoodType
  label: string
  description: string
  emoji: string
  preview: string // 미리보기 색상
}[] = [
  {
    value: 'premium',
    label: '프리미엄',
    description: '고급스럽고 신뢰감 있는',
    emoji: '✨',
    preview: '#0A0A0A',
  },
  {
    value: 'clean',
    label: '클린/미니멀',
    description: '깔끔하고 직관적인',
    emoji: '⬜',
    preview: '#F8F8F8',
  },
  {
    value: 'natural',
    label: '내추럴',
    description: '따뜻하고 자연스러운',
    emoji: '🌿',
    preview: '#F7F3ED',
  },
  {
    value: 'impact',
    label: '임팩트',
    description: '강렬하고 눈에 띄는',
    emoji: '⚡',
    preview: '#0D0D0D',
  },
]

interface MoodSelectorProps {
  value: MoodType
  onChange: (v: MoodType) => void
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          type="button"
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
            value === mood.value
              ? 'border-blue-500 bg-blue-50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          )}
          onClick={() => onChange(mood.value)}
        >
          {/* 색상 프리뷰 */}
          <div
            className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-base"
            style={{ backgroundColor: mood.preview }}
          >
            {mood.emoji}
          </div>
          <div>
            <p className={cn(
              'text-sm font-semibold',
              value === mood.value ? 'text-blue-700' : 'text-gray-800'
            )}>
              {mood.label}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">{mood.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
