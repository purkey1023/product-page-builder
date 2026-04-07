'use client'

import { useEditorStore } from '@/store/editorStore'
import type { SectionElement } from '@/types'

interface PositionPanelProps {
  element: SectionElement
  sectionId: string
}

export function PositionPanel({ element, sectionId }: PositionPanelProps) {
  const updateElement = useEditorStore((s) => s.updateElement)

  const fields = [
    { label: 'X', key: 'x', value: element.x },
    { label: 'Y', key: 'y', value: element.y },
    { label: 'W', key: 'width', value: element.width },
    { label: 'H', key: 'height', value: element.height },
  ]

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">위치 / 크기</p>
      <div className="grid grid-cols-2 gap-2">
        {fields.map((f) => (
          <div key={f.key} className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-400 w-4">{f.label}</span>
            <input
              type="number"
              value={Math.round(f.value)}
              onChange={(e) =>
                updateElement(sectionId, element.id, { [f.key]: Number(e.target.value) })
              }
              className="flex-1 border rounded px-2 py-1 text-xs w-0"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-400 w-12">투명도</span>
        <input
          type="range"
          value={element.opacity * 100}
          onChange={(e) =>
            updateElement(sectionId, element.id, { opacity: Number(e.target.value) / 100 })
          }
          className="flex-1"
          min={0}
          max={100}
        />
        <span className="text-xs text-gray-400 w-8 text-right">{Math.round(element.opacity * 100)}%</span>
      </div>
    </div>
  )
}
