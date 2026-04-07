'use client'

import { useState } from 'react'
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
import { GripVertical, Eye, EyeOff, Plus, Trash2, Copy } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { ALL_SECTION_TYPES, SECTION_LABELS } from '@/lib/sections'
import type { Section, SectionType } from '@/types'
import { cn } from '@/lib/utils'

export function SectionList() {
  const project = useEditorStore((s) => s.project)
  const selectedId = useEditorStore((s) => s.selectedSectionId)
  const reorderSections = useEditorStore((s) => s.reorderSections)
  const addSection = useEditorStore((s) => s.addSection)
  const [showAddMenu, setShowAddMenu] = useState(false)

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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1 flex-1">
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

      {/* 섹션 추가 버튼 */}
      <div className="relative mt-3 pt-3 border-t">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-500 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all"
        >
          <Plus size={13} /> 섹션 추가
        </button>

        {showAddMenu && (
          <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border rounded-lg shadow-lg py-1 z-50 max-h-[300px] overflow-y-auto">
            {ALL_SECTION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => {
                  addSection(type)
                  setShowAddMenu(false)
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 hover:text-blue-700 transition"
              >
                {SECTION_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>
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
  const removeSection = useEditorStore((s) => s.removeSection)
  const duplicateSection = useEditorStore((s) => s.duplicateSection)
  const project = useEditorStore((s) => s.project)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const canDelete = (project?.sections.length ?? 0) > 1

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

      {/* 액션 버튼 (hover 표시) */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="text-gray-300 hover:text-gray-600 p-0.5"
          onClick={(e) => {
            e.stopPropagation()
            duplicateSection(section.id)
          }}
          tabIndex={-1}
          title="복제"
        >
          <Copy size={12} />
        </button>
        <button
          className="text-gray-300 hover:text-gray-600 p-0.5"
          onClick={(e) => {
            e.stopPropagation()
            toggleVisibility(section.id)
          }}
          tabIndex={-1}
          title={section.isVisible ? '숨기기' : '표시'}
        >
          {section.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        {canDelete && (
          <button
            className="text-gray-300 hover:text-red-500 p-0.5"
            onClick={(e) => {
              e.stopPropagation()
              removeSection(section.id)
            }}
            tabIndex={-1}
            title="삭제"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
