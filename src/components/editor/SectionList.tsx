'use client'

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { Section } from '@/types'
import { cn } from '@/lib/utils'

export function SectionList() {
  const project = useEditorStore((s) => s.project)
  const selectedId = useEditorStore((s) => s.selectedSectionId)
  const reorderSections = useEditorStore((s) => s.reorderSections)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  if (!project) return null

  const sorted = [...project.sections].sort((a, b) => a.order - b.order)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) {
      reorderSections(String(active.id), String(over.id))
    }
  }

  return (
    <div className="p-3 h-full flex flex-col">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
        섹션 목록
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sorted.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {sorted.map((section) => (
              <SortableSectionItem
                key={section.id}
                section={section}
                isSelected={section.id === selectedId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableSectionItem({
  section,
  isSelected,
}: {
  section: Section
  isSelected: boolean
}) {
  const selectSection = useEditorStore((s) => s.selectSection)
  const toggleVisibility = useEditorStore((s) => s.toggleVisibility)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 'auto',
      }}
      className={cn(
        'flex items-center gap-1.5 px-2 py-2 rounded-lg cursor-pointer group',
        'border transition-all duration-100',
        isSelected
          ? 'bg-blue-50 border-blue-300 shadow-sm'
          : 'hover:bg-gray-50 border-transparent hover:border-gray-200',
        !section.isVisible && 'opacity-40'
      )}
      onClick={() => selectSection(section.id)}
    >
      {/* 드래그 핸들 */}
      <button
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <GripVertical size={13} />
      </button>

      <span
        className={cn(
          'flex-1 text-sm truncate',
          isSelected ? 'font-semibold text-blue-700' : 'font-medium text-gray-700'
        )}
      >
        {section.label}
      </span>

      {/* 표시/숨김 토글 */}
      <button
        className="text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          toggleVisibility(section.id)
        }}
        tabIndex={-1}
        title={section.isVisible ? '숨기기' : '표시'}
      >
        {section.isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
      </button>
    </div>
  )
}
