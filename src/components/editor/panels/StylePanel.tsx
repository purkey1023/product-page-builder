'use client'

import { useEditorStore } from '@/store/editorStore'
import type { Section, TextAlign, PaddingSize } from '@/types'
import { cn } from '@/lib/utils'

// 분위기별 추천 색상 팔레트
const COLOR_PRESETS = [
  '#0A0A0A', '#1A1A1A', '#FFFFFF', '#F8F8F8', '#F5F5F5',
  '#F7F3ED', '#EEF4EE', '#FBF8F3', '#1A1A2E', '#0F3460',
  '#C9A96E', '#5C7C5C', '#E8272A', '#2563EB', '#7C3AED',
]

interface StylePanelProps {
  section: Section
}

export function StylePanel({ section }: StylePanelProps) {
  const updateStyle = useEditorStore((s) => s.updateStyle)

  return (
    <div className="space-y-5">
      {/* 배경색 */}
      <Field label="배경색">
        <ColorPicker
          value={section.style.backgroundColor}
          onChange={(v) => updateStyle(section.id, { backgroundColor: v })}
        />
      </Field>

      {/* 텍스트색 */}
      <Field label="텍스트 색상">
        <ColorPicker
          value={section.style.textColor}
          onChange={(v) => updateStyle(section.id, { textColor: v })}
        />
      </Field>

      {/* 텍스트 정렬 */}
      <Field label="텍스트 정렬">
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
            <button
              key={align}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                section.style.textAlign === align
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              onClick={() => updateStyle(section.id, { textAlign: align })}
            >
              {align === 'left' ? '왼쪽' : align === 'center' ? '가운데' : '오른쪽'}
            </button>
          ))}
        </div>
      </Field>

      {/* 여백 */}
      <Field label="내부 여백">
        <div className="flex gap-1">
          {(['sm', 'md', 'lg'] as PaddingSize[]).map((p) => (
            <button
              key={p}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                section.style.padding === p
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              onClick={() => updateStyle(section.id, { padding: p })}
            >
              {p === 'sm' ? '좁게' : p === 'md' ? '보통' : '넓게'}
            </button>
          ))}
        </div>
      </Field>
    </div>
  )
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      {/* 직접 입력 */}
      <div className="flex gap-2 items-center">
        <div
          className="w-8 h-8 rounded-md border border-gray-200 flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
        <input
          type="color"
          className="w-8 h-8 rounded cursor-pointer border-0 p-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          title="색상 선택"
        />
      </div>

      {/* 프리셋 팔레트 */}
      <div className="flex flex-wrap gap-1.5">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            className={cn(
              'w-6 h-6 rounded-md border-2 transition-transform hover:scale-110',
              value === color ? 'border-blue-500 scale-110' : 'border-transparent'
            )}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            title={color}
          />
        ))}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
