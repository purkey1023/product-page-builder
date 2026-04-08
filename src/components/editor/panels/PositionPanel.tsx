'use client'

import { ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { SectionElement } from '@/types'

interface PositionPanelProps {
  element: SectionElement
  sectionId: string
}

export function PositionPanel({ element, sectionId }: PositionPanelProps) {
  const updateElement = useEditorStore((s) => s.updateElement)
  const bringToFront = useEditorStore((s) => s.bringToFront)
  const sendToBack = useEditorStore((s) => s.sendToBack)
  const bringForward = useEditorStore((s) => s.bringForward)
  const sendBackward = useEditorStore((s) => s.sendBackward)

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

      {/* 투명도 */}
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

      {/* 레이어 순서 */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">레이어 순서</p>
        <div className="flex gap-1">
          <button
            onClick={() => sendToBack(sectionId, element.id)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 transition"
            title="맨 뒤로"
          >
            <ArrowDownToLine size={12} /> 맨 뒤
          </button>
          <button
            onClick={() => sendBackward(sectionId, element.id)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 transition"
            title="한 칸 뒤로"
          >
            <ArrowDown size={12} /> 뒤로
          </button>
          <button
            onClick={() => bringForward(sectionId, element.id)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 transition"
            title="한 칸 앞으로"
          >
            <ArrowUp size={12} /> 앞으로
          </button>
          <button
            onClick={() => bringToFront(sectionId, element.id)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-gray-200 hover:bg-gray-50 transition"
            title="맨 앞으로"
          >
            <ArrowUpToLine size={12} /> 맨 앞
          </button>
        </div>
      </div>
    </div>
  )
}
