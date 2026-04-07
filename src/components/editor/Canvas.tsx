'use client'

import { useRef, useCallback, useMemo } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { CANVAS_WIDTH } from '@/types'
import { SectionCanvas } from './SectionCanvas'

interface CanvasProps {
  sectionRefs: React.MutableRefObject<Map<string, HTMLDivElement>>
}

export function Canvas({ sectionRefs }: CanvasProps) {
  const project = useEditorStore((s) => s.project)
  const deselectAll = useEditorStore((s) => s.deselectAll)
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleSections = useMemo(() => {
    if (!project) return []
    return [...project.sections]
      .filter((s) => s.isVisible)
      .sort((a, b) => a.order - b.order)
  }, [project])

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === containerRef.current || e.target === e.currentTarget) {
        deselectAll()
      }
    },
    [deselectAll]
  )

  if (!project) return null

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-gray-200"
      style={{ minHeight: 0 }}
      onClick={handleBackgroundClick}
    >
      <div className="flex flex-col items-center py-6 min-h-full">
        {visibleSections.map((section) => (
          <SectionCanvas
            key={section.id}
            section={section}
            productImageUrl={project.product.imageUrl}
            onRegisterRef={(el) => {
              if (el) {
                sectionRefs.current.set(section.id, el)
              } else {
                sectionRefs.current.delete(section.id)
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}
