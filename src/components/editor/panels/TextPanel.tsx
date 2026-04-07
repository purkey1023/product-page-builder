'use client'

import { useEditorStore } from '@/store/editorStore'
import type { TextElement } from '@/types'
import { cn } from '@/lib/utils'

interface TextPanelProps {
  element: TextElement
  sectionId: string
}

const FONT_FAMILIES = [
  'Noto Sans KR',
  'Playfair Display',
  'Pretendard',
  'sans-serif',
  'serif',
]

export function TextPanel({ element, sectionId }: TextPanelProps) {
  const updateElement = useEditorStore((s) => s.updateElement)

  const update = (patch: Partial<TextElement>) => {
    updateElement(sectionId, element.id, patch)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">텍스트 스타일</p>

      {/* 폰트 패밀리 */}
      <Field label="폰트">
        <select
          value={element.fontFamily}
          onChange={(e) => update({ fontFamily: e.target.value })}
          className="w-full text-xs border rounded-lg px-2 py-1.5 bg-white"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </Field>

      {/* 폰트 크기 + Weight */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="크기">
          <input
            type="number"
            value={element.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            className="w-full text-xs border rounded-lg px-2 py-1.5"
            min={8}
            max={120}
          />
        </Field>
        <Field label="굵기">
          <select
            value={element.fontWeight}
            onChange={(e) => update({ fontWeight: Number(e.target.value) })}
            className="w-full text-xs border rounded-lg px-2 py-1.5 bg-white"
          >
            {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* 색상 */}
      <Field label="색상">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={element.color}
            onChange={(e) => update({ color: e.target.value })}
            className="w-8 h-8 rounded border cursor-pointer"
          />
          <input
            type="text"
            value={element.color}
            onChange={(e) => update({ color: e.target.value })}
            className="flex-1 text-xs border rounded px-2 py-1.5 font-mono"
          />
        </div>
      </Field>

      {/* 정렬 */}
      <Field label="정렬">
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                element.textAlign === align
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              onClick={() => update({ textAlign: align })}
            >
              {align === 'left' ? '왼쪽' : align === 'center' ? '가운데' : '오른쪽'}
            </button>
          ))}
        </div>
      </Field>

      {/* Line Height + Letter Spacing */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="줄 간격">
          <input
            type="number"
            value={element.lineHeight}
            onChange={(e) => update({ lineHeight: Number(e.target.value) })}
            className="w-full text-xs border rounded-lg px-2 py-1.5"
            min={0.8}
            max={3}
            step={0.1}
          />
        </Field>
        <Field label="자간">
          <input
            type="number"
            value={element.letterSpacing}
            onChange={(e) => update({ letterSpacing: Number(e.target.value) })}
            className="w-full text-xs border rounded-lg px-2 py-1.5"
            min={-5}
            max={20}
            step={0.5}
          />
        </Field>
      </div>

      {/* 텍스트 내용 */}
      <Field label="내용">
        <textarea
          className="w-full text-sm border rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 leading-relaxed"
          rows={4}
          value={element.content}
          onChange={(e) => update({ content: e.target.value })}
          placeholder="텍스트 입력"
        />
      </Field>
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
