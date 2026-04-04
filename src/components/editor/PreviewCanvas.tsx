'use client'

import { useRef, useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { SectionRenderer } from '@/components/sections/SectionRenderer'

interface PreviewCanvasProps {
  // ref map을 외부에서 받아 다운로드 시 활용
  sectionRefs: React.MutableRefObject<Map<string, HTMLElement>>
}

export function PreviewCanvas({ sectionRefs }: PreviewCanvasProps) {
  const project = useEditorStore((s) => s.project)
  const selectedId = useEditorStore((s) => s.selectedSectionId)
  const selectSection = useEditorStore((s) => s.selectSection)
  const getVisibleSections = useEditorStore((s) => s.getVisibleSections)

  const visibleSections = getVisibleSections()

  if (!project) return null

  return (
    // 모바일 상세페이지 비율 (390px 기준, 실제 이미지 저장은 1080px)
    <div className="w-[390px] shadow-2xl rounded-sm overflow-hidden">
      {visibleSections.map((section) => (
        <div
          key={section.id}
          ref={(el) => {
            if (el) sectionRefs.current.set(section.id, el)
            else sectionRefs.current.delete(section.id)
          }}
        >
          <SectionRenderer
            section={section}
            productImageUrl={project.product.imageUrl}
            isSelected={section.id === selectedId}
            onSelect={() =>
              selectSection(section.id === selectedId ? null : section.id)
            }
          />
        </div>
      ))}

      {visibleSections.length === 0 && (
        <div className="flex items-center justify-center h-60 text-gray-400 text-sm bg-gray-50">
          표시할 섹션이 없습니다
        </div>
      )}
    </div>
  )
}
