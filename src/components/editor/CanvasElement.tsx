'use client'

import { useCallback, useMemo, useRef, useEffect } from 'react'
import { Rnd } from 'react-rnd'
import { useEditorStore } from '@/store/editorStore'
import type { SectionElement, TextElement, ImageElement, ShapeElement } from '@/types'

interface CanvasElementProps {
  element: SectionElement
  sectionId: string
  productImageUrl: string
  layerIndex: number
}

export function CanvasElement({ element, sectionId, productImageUrl, layerIndex }: CanvasElementProps) {
  const selectedElementId = useEditorStore((s) => s.selectedElementId)
  const editingTextId = useEditorStore((s) => s.editingTextId)
  const selectElement = useEditorStore((s) => s.selectElement)
  const moveElement = useEditorStore((s) => s.moveElement)
  const resizeElement = useEditorStore((s) => s.resizeElement)
  const startTextEditing = useEditorStore((s) => s.startTextEditing)
  const updateElement = useEditorStore((s) => s.updateElement)
  const stopTextEditing = useEditorStore((s) => s.stopTextEditing)

  const isSelected = selectedElementId === element.id
  const isEditing = editingTextId === element.id

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      selectElement(sectionId, element.id)
    },
    [sectionId, element.id, selectElement]
  )

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (element.type === 'text') {
        startTextEditing(element.id)
      }
    },
    [element.id, element.type, startTextEditing]
  )

  const handleDragStop = useCallback(
    (_e: unknown, d: { x: number; y: number }) => {
      moveElement(sectionId, element.id, Math.round(d.x), Math.round(d.y))
    },
    [sectionId, element.id, moveElement]
  )

  const handleResizeStop = useCallback(
    (_e: unknown, _dir: unknown, ref: HTMLElement, _delta: unknown, pos: { x: number; y: number }) => {
      resizeElement(
        sectionId,
        element.id,
        Math.round(ref.offsetWidth),
        Math.round(ref.offsetHeight),
        Math.round(pos.x),
        Math.round(pos.y)
      )
    },
    [sectionId, element.id, resizeElement]
  )

  // Resolve image src
  const resolvedSrc = useMemo(() => {
    if (element.type !== 'image') return ''
    const el = element as ImageElement
    if (el.src === 'product') return productImageUrl
    if (el.src.startsWith('generate:')) {
      // Placeholder for AI-generated images not yet loaded
      return ''
    }
    return el.src
  }, [element, productImageUrl])

  const renderContent = () => {
    switch (element.type) {
      case 'text': {
        const el = element as TextElement
        if (isEditing) {
          return (
            <div
              contentEditable
              suppressContentEditableWarning
              className="outline-none w-full h-full cursor-text"
              style={{
                fontSize: el.fontSize,
                fontWeight: el.fontWeight,
                fontFamily: el.fontFamily,
                color: el.color,
                textAlign: el.textAlign,
                lineHeight: el.lineHeight,
                letterSpacing: el.letterSpacing,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                opacity: el.opacity,
              }}
              onBlur={(e) => {
                const text = e.currentTarget.innerText
                updateElement(sectionId, element.id, { content: text })
                stopTextEditing()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.blur()
                }
              }}
              autoFocus
              dangerouslySetInnerHTML={{ __html: el.content.replace(/\n/g, '<br>') }}
            />
          )
        }
        return (
          <div
            className="w-full h-full pointer-events-none select-none"
            style={{
              fontSize: el.fontSize,
              fontWeight: el.fontWeight,
              fontFamily: el.fontFamily,
              color: el.color,
              textAlign: el.textAlign,
              lineHeight: el.lineHeight,
              letterSpacing: el.letterSpacing,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              opacity: el.opacity,
              overflow: 'hidden',
            }}
          >
            {el.content}
          </div>
        )
      }

      case 'image': {
        const el = element as ImageElement
        if (!resolvedSrc) {
          // AI 이미지 placeholder
          const isGenerateMarker = el.src.startsWith('generate:')
          return (
            <div
              className={`w-full h-full flex flex-col items-center justify-center gap-2 ${
                isGenerateMarker ? 'bg-purple-50 border-2 border-dashed border-purple-200' : 'bg-gray-100'
              }`}
              style={{ borderRadius: el.borderRadius, opacity: el.opacity }}
            >
              {isGenerateMarker ? (
                <>
                  <span className="text-purple-400 text-2xl">✨</span>
                  <span className="text-purple-500 text-xs font-medium">
                    AI 이미지 ({el.src.replace('generate:', '')})
                  </span>
                  <span className="text-purple-300 text-[10px]">
                    클릭 후 오른쪽 패널에서 생성
                  </span>
                </>
              ) : (
                <span className="text-gray-400 text-sm">이미지 없음</span>
              )}
            </div>
          )
        }
        return (
          <img
            src={resolvedSrc}
            alt=""
            className="pointer-events-none"
            crossOrigin="anonymous"
            style={{
              width: '100%',
              height: '100%',
              objectFit: el.objectFit,
              borderRadius: el.borderRadius,
              opacity: el.opacity,
              background: 'transparent',
            }}
          />
        )
      }

      case 'shape': {
        const el = element as ShapeElement
        return (
          <div
            className="w-full h-full pointer-events-none"
            style={{
              backgroundColor: el.backgroundColor,
              borderRadius: el.shapeType === 'circle' ? '50%' : el.borderRadius,
              border: el.borderWidth > 0 ? `${el.borderWidth}px solid ${el.borderColor}` : 'none',
              opacity: el.opacity,
            }}
          />
        )
      }
    }
  }

  const zIndex = isSelected ? 999 : layerIndex + 1
  const rndRef = useRef<Rnd>(null)

  // react-rnd DOM에 직접 z-index 적용
  useEffect(() => {
    const el = rndRef.current?.getSelfElement?.()
    if (el) el.style.zIndex = String(zIndex)
  }, [zIndex])

  return (
    <Rnd
      ref={rndRef}
      position={{ x: element.x, y: element.y }}
      size={{ width: element.width, height: element.height }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      bounds="parent"
      disableDragging={element.locked || isEditing}
      enableResizing={isSelected && !element.locked && !isEditing}
      minWidth={20}
      minHeight={10}
      style={{ zIndex, background: 'transparent' }}
      resizeHandleStyles={{
        topLeft: handleStyle,
        topRight: handleStyle,
        bottomLeft: handleStyle,
        bottomRight: handleStyle,
      }}
    >
      <div
        className={`w-full h-full ${
          isSelected && !isEditing ? 'outline outline-2 outline-blue-500 outline-offset-1' : ''
        } ${isEditing ? 'outline outline-2 outline-green-500 outline-offset-1' : ''}`}
        style={{ background: 'transparent' }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {renderContent()}
      </div>
    </Rnd>
  )
}

const handleStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  background: '#3B82F6',
  borderRadius: '50%',
  border: '1.5px solid white',
}
