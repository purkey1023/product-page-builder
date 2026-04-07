'use client'

import { useEditorStore } from '@/store/editorStore'
import type { Section } from '@/types'
import { cn } from '@/lib/utils'

const COLOR_PRESETS = [
  '#FFFFFF', '#F8F8F8', '#F5F5F5', '#FAF7F2', '#EEF4EE',
  '#F0EBE3', '#FBF8F3', '#E8EAED', '#1A1A1A', '#0A0A0A',
  '#0D0D0D', '#1A1A2E', '#C9A96E', '#5C7C5C', '#5BA4A4',
  '#3B82F6', '#6B8E5A', '#E8272A', '#FF4444', '#7C3AED',
]

interface StylePanelProps {
  section: Section
}

export function StylePanel({ section }: StylePanelProps) {
  const updateSectionBackground = useEditorStore((s) => s.updateSectionBackground)
  const updateSectionHeight = useEditorStore((s) => s.updateSectionHeight)
  const { background } = section

  return (
    <div className="space-y-5">
      {/* 배경 타입 */}
      <Field label="배경 타입">
        <div className="flex gap-1">
          {(['color', 'gradient', 'image'] as const).map((t) => (
            <button
              key={t}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                background.type === t
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              onClick={() => updateSectionBackground(section.id, { type: t })}
            >
              {t === 'color' ? '단색' : t === 'gradient' ? '그라데이션' : '이미지'}
            </button>
          ))}
        </div>
      </Field>

      {/* 배경 값 */}
      {background.type === 'color' && (
        <Field label="배경색">
          <ColorPicker
            value={background.value}
            onChange={(v) => updateSectionBackground(section.id, { value: v })}
          />
        </Field>
      )}

      {background.type === 'gradient' && (
        <Field label="그라데이션">
          <input
            type="text"
            className="w-full text-xs border rounded-lg px-2.5 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={background.value}
            onChange={(e) => updateSectionBackground(section.id, { value: e.target.value })}
            placeholder="linear-gradient(180deg, #FAF7F2 0%, #FFFFFF 100%)"
          />
          <div
            className="mt-2 w-full h-12 rounded-lg border"
            style={{ background: background.value }}
          />
        </Field>
      )}

      {background.type === 'image' && (
        <Field label="이미지 URL">
          <input
            type="text"
            className="w-full text-xs border rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={background.value}
            onChange={(e) => updateSectionBackground(section.id, { value: e.target.value })}
            placeholder="https://..."
          />
          {background.value && (
            <img
              src={background.value}
              alt=""
              className="mt-2 w-full h-20 object-cover rounded-lg border"
            />
          )}
        </Field>
      )}

      {/* 오버레이 (이미지 배경용) */}
      {background.type === 'image' && (
        <Field label="오버레이">
          <input
            type="text"
            className="w-full text-xs border rounded-lg px-2.5 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={background.overlay ?? ''}
            onChange={(e) => updateSectionBackground(section.id, { overlay: e.target.value })}
            placeholder="rgba(0,0,0,0.3)"
          />
        </Field>
      )}

      {/* 섹션 높이 */}
      <Field label={`섹션 높이 (${section.height}px)`}>
        <input
          type="number"
          value={section.height}
          onChange={(e) => updateSectionHeight(section.id, Number(e.target.value))}
          className="w-full text-xs border rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          min={200}
          max={2000}
          step={10}
        />
      </Field>
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <div
          className="w-8 h-8 rounded-md border border-gray-200 flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          className="flex-1 text-xs border rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
        <input
          type="color"
          className="w-8 h-8 rounded cursor-pointer border-0 p-0"
          value={value.startsWith('#') ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
