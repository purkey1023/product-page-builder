'use client'

import { useCallback, useRef, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { CANVAS_WIDTH } from '@/types'
import type { Section } from '@/types'
import { CanvasElement } from './CanvasElement'

interface SectionCanvasProps {
  section: Section
  productImageUrl: string
  onRegisterRef: (el: HTMLDivElement | null) => void
}

export function SectionCanvas({ section, productImageUrl, onRegisterRef }: SectionCanvasProps) {
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId)
  const selectSection = useEditorStore((s) => s.selectSection)
  const updateSectionHeight = useEditorStore((s) => s.updateSectionHeight)
  const isSelected = selectedSectionId === section.id

  const [isResizing, setIsResizing] = useState(false)
  const resizeStartY = useRef(0)
  const resizeStartHeight = useRef(0)

  const handleSectionClick = useCallback(
    (e: React.MouseEvent) => {
      // Only select section if clicking on the section background itself
      if ((e.target as HTMLElement).dataset.sectionBg === 'true') {
        selectSection(section.id)
      }
    },
    [section.id, selectSection]
  )

  // Section height resize via bottom handle
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsResizing(true)
      resizeStartY.current = e.clientY
      resizeStartHeight.current = section.height

      const handleMove = (me: MouseEvent) => {
        const delta = me.clientY - resizeStartY.current
        updateSectionHeight(section.id, resizeStartHeight.current + delta)
      }
      const handleUp = () => {
        setIsResizing(false)
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleUp)
      }
      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleUp)
    },
    [section.id, section.height, updateSectionHeight]
  )

  // Build background style
  const bgStyle: React.CSSProperties = {}
  if (section.background.type === 'color') {
    bgStyle.backgroundColor = section.background.value
  } else if (section.background.type === 'gradient') {
    bgStyle.background = section.background.value
  }
  // Image backgrounds handled via <img> below

  return (
    <div className="relative mb-1" style={{ width: CANVAS_WIDTH }}>
      {/* Section label */}
      <div className="absolute -left-28 top-2 text-xs text-gray-400 w-24 text-right truncate">
        {section.label}
      </div>

      {/* Main section canvas */}
      <div
        ref={onRegisterRef}
        data-section-bg="true"
        className={`relative overflow-hidden shadow-sm ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        style={{
          width: CANVAS_WIDTH,
          height: section.height,
          ...bgStyle,
        }}
        onClick={handleSectionClick}
      >
        {/* Image background */}
        {section.background.type === 'image' && (
          <>
            <img
              src={section.background.value}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              crossOrigin="anonymous"
            />
            {section.background.overlay && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: section.background.overlay }}
              />
            )}
          </>
        )}

        {/* Elements */}
        {section.elements.map((element, index) => (
          <CanvasElement
            key={element.id}
            element={element}
            sectionId={section.id}
            productImageUrl={productImageUrl}
            layerIndex={index}
          />
        ))}
      </div>

      {/* Height resize handle */}
      <div
        className={`h-3 cursor-row-resize flex items-center justify-center transition-colors ${
          isResizing ? 'bg-blue-100' : 'hover:bg-gray-100'
        }`}
        onMouseDown={handleResizeStart}
      >
        <div className="w-12 h-1 bg-gray-300 rounded-full" />
      </div>
    </div>
  )
}
