'use client'

import { useEditorStore } from '@/store/editorStore'
import type { Section } from '@/types'

const LIST_SECTION_TYPES = ['benefits', 'features', 'target', 'howto']

interface TextPanelProps {
  section: Section
}

export function TextPanel({ section }: TextPanelProps) {
  const updateContent = useEditorStore((s) => s.updateContent)
  const hasItems = LIST_SECTION_TYPES.includes(section.type)

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...section.content.items]
    newItems[index] = value
    updateContent(section.id, { items: newItems })
  }

  const handleAddItem = () => {
    updateContent(section.id, { items: [...section.content.items, ''] })
  }

  const handleRemoveItem = (index: number) => {
    const newItems = section.content.items.filter((_, i) => i !== index)
    updateContent(section.id, { items: newItems })
  }

  return (
    <div className="space-y-4">
      {/* 제목 */}
      <Field label="제목">
        <textarea
          className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 leading-relaxed"
          rows={2}
          value={section.content.title}
          onChange={(e) => updateContent(section.id, { title: e.target.value })}
          placeholder="섹션 제목"
        />
      </Field>

      {/* 본문 */}
      <Field label="본문">
        <textarea
          className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 leading-relaxed"
          rows={3}
          value={section.content.body}
          onChange={(e) => updateContent(section.id, { body: e.target.value })}
          placeholder="본문 텍스트"
        />
      </Field>

      {/* 강조 문구 */}
      <Field label="강조 문구">
        <input
          type="text"
          className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={section.content.highlight}
          onChange={(e) => updateContent(section.id, { highlight: e.target.value })}
          placeholder="배지 / 강조 키워드"
        />
      </Field>

      {/* 항목 리스트 (장점, 특징, 대상, 방법) */}
      {hasItems && (
        <Field label="항목 목록">
          <div className="space-y-2">
            {section.content.items.map((item, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <span className="text-xs text-gray-400 w-4 text-center flex-shrink-0">
                  {i + 1}
                </span>
                <input
                  type="text"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  value={item}
                  onChange={(e) => handleItemChange(i, e.target.value)}
                  placeholder={`항목 ${i + 1}`}
                />
                <button
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  onClick={() => handleRemoveItem(i)}
                  title="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
            {section.content.items.length < 6 && (
              <button
                className="w-full text-xs text-gray-400 hover:text-blue-500 border border-dashed border-gray-200 hover:border-blue-300 rounded-lg py-2 transition-colors"
                onClick={handleAddItem}
              >
                + 항목 추가
              </button>
            )}
          </div>
        </Field>
      )}
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
