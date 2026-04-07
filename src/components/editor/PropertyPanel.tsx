'use client'

import { useEditorStore } from '@/store/editorStore'
import { TextPanel } from './panels/TextPanel'
import { StylePanel } from './panels/StylePanel'
import { ImagePanel } from './panels/ImagePanel'
import { PositionPanel } from './panels/PositionPanel'

export function PropertyPanel() {
  const selectedSection = useEditorStore((s) => s.getSelectedSection())
  const selectedElement = useEditorStore((s) => s.getSelectedElement())
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId)

  // 아무것도 선택되지 않은 상태
  if (!selectedSection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm p-6 text-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
          <span className="text-lg">👈</span>
        </div>
        <p className="font-medium text-gray-500">섹션을 선택하세요</p>
        <p className="text-xs text-gray-400">좌측 목록이나 캔버스를 클릭하세요</p>
      </div>
    )
  }

  // 섹션만 선택 (엘리먼트 선택 X) → 배경 편집
  if (!selectedElement) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b bg-gray-50/80 flex-shrink-0">
          <p className="text-sm font-semibold text-gray-800">{selectedSection.label}</p>
          <p className="text-xs text-gray-400 mt-0.5">섹션 배경 편집</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <StylePanel section={selectedSection} />
        </div>
      </div>
    )
  }

  // 엘리먼트 선택됨 → 타입별 패널
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b bg-gray-50/80 flex-shrink-0">
        <p className="text-sm font-semibold text-gray-800">
          {selectedElement.type === 'text' ? '텍스트' : selectedElement.type === 'image' ? '이미지' : '도형'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">속성 편집</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* 위치/크기 패널 (공통) */}
        <div className="p-4 border-b">
          <PositionPanel
            element={selectedElement}
            sectionId={selectedSectionId!}
          />
        </div>

        {/* 타입별 패널 */}
        <div className="p-4">
          {selectedElement.type === 'text' && (
            <TextPanel element={selectedElement} sectionId={selectedSectionId!} />
          )}
          {selectedElement.type === 'image' && (
            <ImagePanel element={selectedElement} sectionId={selectedSectionId!} />
          )}
          {selectedElement.type === 'shape' && (
            <ShapePanel element={selectedElement as import('@/types').ShapeElement} sectionId={selectedSectionId!} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── 도형 패널 (간단하므로 인라인) ──
function ShapePanel({ element, sectionId }: { element: import('@/types').ShapeElement; sectionId: string }) {
  const updateElement = useEditorStore((s) => s.updateElement)
  const el = element

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">도형 스타일</p>

      <div>
        <label className="text-xs text-gray-600 mb-1 block">배경색</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={el.backgroundColor}
            onChange={(e) => updateElement(sectionId, el.id, { backgroundColor: e.target.value })}
            className="w-8 h-8 rounded border cursor-pointer"
          />
          <input
            type="text"
            value={el.backgroundColor}
            onChange={(e) => updateElement(sectionId, el.id, { backgroundColor: e.target.value })}
            className="flex-1 border rounded px-2 py-1 text-xs"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-600 mb-1 block">테두리</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={el.borderColor === 'transparent' ? '#000000' : el.borderColor}
            onChange={(e) => updateElement(sectionId, el.id, { borderColor: e.target.value })}
            className="w-8 h-8 rounded border cursor-pointer"
          />
          <input
            type="number"
            value={el.borderWidth}
            onChange={(e) => updateElement(sectionId, el.id, { borderWidth: Number(e.target.value) })}
            className="w-16 border rounded px-2 py-1 text-xs"
            min={0}
            max={20}
          />
          <span className="text-xs text-gray-400">px</span>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-600 mb-1 block">모서리 둥글기</label>
        <input
          type="range"
          value={el.borderRadius}
          onChange={(e) => updateElement(sectionId, el.id, { borderRadius: Number(e.target.value) })}
          className="w-full"
          min={0}
          max={200}
        />
        <span className="text-xs text-gray-400">{el.borderRadius}px</span>
      </div>

      <div>
        <label className="text-xs text-gray-600 mb-1 block">투명도</label>
        <input
          type="range"
          value={el.opacity * 100}
          onChange={(e) => updateElement(sectionId, el.id, { opacity: Number(e.target.value) / 100 })}
          className="w-full"
          min={0}
          max={100}
        />
        <span className="text-xs text-gray-400">{Math.round(el.opacity * 100)}%</span>
      </div>
    </div>
  )
}
