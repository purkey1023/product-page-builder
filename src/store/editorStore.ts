'use client'

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { arrayMove } from '@dnd-kit/sortable'
import { v4 as uuidv4 } from 'uuid'
import type {
  Project,
  Section,
  SectionElement,
  SectionBackground,
  TextElement,
  ImageElement,
  ShapeElement,
  SectionType,
} from '@/types'
import { getDefaultSection } from '@/lib/sections'

// ──────────────────────────────────────
// 상태 + 액션 타입
// ──────────────────────────────────────
interface EditorState {
  project: Project | null
  selectedSectionId: string | null
  selectedElementId: string | null
  editingTextId: string | null
  isGenerating: boolean
  isSaving: boolean
  isDirty: boolean
}

interface EditorActions {
  // Project
  setProject: (project: Project) => void
  setSaving: (v: boolean) => void
  setGenerating: (v: boolean) => void
  markClean: () => void

  // Section actions
  selectSection: (id: string | null) => void
  addSection: (type: SectionType, afterId?: string) => void
  removeSection: (id: string) => void
  duplicateSection: (id: string) => void
  reorderSections: (activeId: string, overId: string) => void
  toggleVisibility: (sectionId: string) => void
  updateSectionBackground: (sectionId: string, bg: Partial<SectionBackground>) => void
  updateSectionHeight: (sectionId: string, height: number) => void

  // Element actions
  selectElement: (sectionId: string, elementId: string | null) => void
  deselectAll: () => void
  addElement: (sectionId: string, element: SectionElement) => void
  updateElement: (sectionId: string, elementId: string, patch: Partial<SectionElement>) => void
  removeElement: (sectionId: string, elementId: string) => void
  moveElement: (sectionId: string, elementId: string, x: number, y: number) => void
  resizeElement: (sectionId: string, elementId: string, w: number, h: number, x: number, y: number) => void
  duplicateElement: (sectionId: string, elementId: string) => void

  // Text editing
  startTextEditing: (elementId: string) => void
  stopTextEditing: () => void

  // Quick add helpers
  addTextElement: (sectionId: string) => void
  addImageElement: (sectionId: string, src: string) => void
  addShapeElement: (sectionId: string, shapeType: 'rect' | 'circle' | 'line' | 'badge') => void

  // Getters
  getSelectedSection: () => Section | null
  getSelectedElement: () => SectionElement | null
  getVisibleSections: () => Section[]
}

export type EditorStore = EditorState & EditorActions

// ──────────────────────────────────────
// Helper: 섹션 내 elements 업데이트
// ──────────────────────────────────────
function updateSectionElements(
  project: Project,
  sectionId: string,
  updater: (elements: SectionElement[]) => SectionElement[]
): Project {
  return {
    ...project,
    sections: project.sections.map((s) =>
      s.id === sectionId ? { ...s, elements: updater(s.elements) } : s
    ),
  }
}

// ──────────────────────────────────────
// Zustand 스토어
// ──────────────────────────────────────
export const useEditorStore = create<EditorStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      project: null,
      selectedSectionId: null,
      selectedElementId: null,
      editingTextId: null,
      isGenerating: false,
      isSaving: false,
      isDirty: false,

      // ── Project ──
      setProject: (project) =>
        set({ project, isDirty: false, selectedSectionId: null, selectedElementId: null, editingTextId: null }),

      setSaving: (v) => set({ isSaving: v }),
      setGenerating: (v) => set({ isGenerating: v }),
      markClean: () => set({ isDirty: false }),

      // ── Section actions ──
      selectSection: (id) =>
        set({ selectedSectionId: id, selectedElementId: null, editingTextId: null }),

      addSection: (type, afterId) =>
        set((state) => {
          if (!state.project) return {}
          const mood = state.project.product.mood
          const newSection = getDefaultSection(type, mood)
          const sections = [...state.project.sections]
          if (afterId) {
            const idx = sections.findIndex((s) => s.id === afterId)
            sections.splice(idx + 1, 0, newSection)
          } else {
            sections.push(newSection)
          }
          const reordered = sections.map((s, i) => ({ ...s, order: i }))
          return {
            isDirty: true,
            selectedSectionId: newSection.id,
            selectedElementId: null,
            project: { ...state.project, sections: reordered },
          }
        }),

      removeSection: (id) =>
        set((state) => {
          if (!state.project || state.project.sections.length <= 1) return {}
          const sections = state.project.sections
            .filter((s) => s.id !== id)
            .map((s, i) => ({ ...s, order: i }))
          return {
            isDirty: true,
            selectedSectionId: state.selectedSectionId === id ? null : state.selectedSectionId,
            selectedElementId: state.selectedSectionId === id ? null : state.selectedElementId,
            project: { ...state.project, sections },
          }
        }),

      duplicateSection: (id) =>
        set((state) => {
          if (!state.project) return {}
          const source = state.project.sections.find((s) => s.id === id)
          if (!source) return {}
          const newSection: Section = {
            ...JSON.parse(JSON.stringify(source)),
            id: uuidv4(),
            elements: source.elements.map((el) => ({ ...JSON.parse(JSON.stringify(el)), id: uuidv4() })),
          }
          const sections = [...state.project.sections]
          const idx = sections.findIndex((s) => s.id === id)
          sections.splice(idx + 1, 0, newSection)
          const reordered = sections.map((s, i) => ({ ...s, order: i }))
          return {
            isDirty: true,
            selectedSectionId: newSection.id,
            project: { ...state.project, sections: reordered },
          }
        }),

      reorderSections: (activeId, overId) =>
        set((state) => {
          if (!state.project) return {}
          const { sections } = state.project
          const from = sections.findIndex((s) => s.id === activeId)
          const to = sections.findIndex((s) => s.id === overId)
          if (from === -1 || to === -1) return {}
          const reordered = arrayMove(sections, from, to).map((s, i) => ({ ...s, order: i }))
          return { isDirty: true, project: { ...state.project, sections: reordered } }
        }),

      toggleVisibility: (sectionId) =>
        set((state) => {
          if (!state.project) return {}
          return {
            isDirty: true,
            project: {
              ...state.project,
              sections: state.project.sections.map((s) =>
                s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s
              ),
            },
          }
        }),

      updateSectionBackground: (sectionId, bg) =>
        set((state) => {
          if (!state.project) return {}
          return {
            isDirty: true,
            project: {
              ...state.project,
              sections: state.project.sections.map((s) =>
                s.id === sectionId ? { ...s, background: { ...s.background, ...bg } } : s
              ),
            },
          }
        }),

      updateSectionHeight: (sectionId, height) =>
        set((state) => {
          if (!state.project) return {}
          return {
            isDirty: true,
            project: {
              ...state.project,
              sections: state.project.sections.map((s) =>
                s.id === sectionId ? { ...s, height: Math.max(200, height) } : s
              ),
            },
          }
        }),

      // ── Element actions ──
      selectElement: (sectionId, elementId) =>
        set({ selectedSectionId: sectionId, selectedElementId: elementId, editingTextId: null }),

      deselectAll: () =>
        set({ selectedSectionId: null, selectedElementId: null, editingTextId: null }),

      addElement: (sectionId, element) =>
        set((state) => {
          if (!state.project) return {}
          return {
            isDirty: true,
            selectedSectionId: sectionId,
            selectedElementId: element.id,
            project: updateSectionElements(state.project, sectionId, (els) => [...els, element]),
          }
        }),

      updateElement: (sectionId, elementId, patch) =>
        set((state) => {
          if (!state.project) return {}
          return {
            isDirty: true,
            project: updateSectionElements(state.project, sectionId, (els) =>
              els.map((el) => (el.id === elementId ? { ...el, ...patch } as SectionElement : el))
            ),
          }
        }),

      removeElement: (sectionId, elementId) =>
        set((state) => {
          if (!state.project) return {}
          return {
            isDirty: true,
            selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId,
            project: updateSectionElements(state.project, sectionId, (els) =>
              els.filter((el) => el.id !== elementId)
            ),
          }
        }),

      moveElement: (sectionId, elementId, x, y) =>
        set((state) => {
          if (!state.project) return {}
          return {
            isDirty: true,
            project: updateSectionElements(state.project, sectionId, (els) =>
              els.map((el) => (el.id === elementId ? { ...el, x, y } : el))
            ),
          }
        }),

      resizeElement: (sectionId, elementId, w, h, x, y) =>
        set((state) => {
          if (!state.project) return {}
          return {
            isDirty: true,
            project: updateSectionElements(state.project, sectionId, (els) =>
              els.map((el) =>
                el.id === elementId ? { ...el, width: w, height: h, x, y } : el
              )
            ),
          }
        }),

      duplicateElement: (sectionId, elementId) =>
        set((state) => {
          if (!state.project) return {}
          const section = state.project.sections.find((s) => s.id === sectionId)
          const source = section?.elements.find((el) => el.id === elementId)
          if (!source) return {}
          const newEl: SectionElement = {
            ...JSON.parse(JSON.stringify(source)),
            id: uuidv4(),
            x: source.x + 20,
            y: source.y + 20,
          }
          return {
            isDirty: true,
            selectedElementId: newEl.id,
            project: updateSectionElements(state.project, sectionId, (els) => [...els, newEl]),
          }
        }),

      // ── Text editing ──
      startTextEditing: (elementId) => set({ editingTextId: elementId }),
      stopTextEditing: () => set({ editingTextId: null }),

      // ── Quick add helpers ──
      addTextElement: (sectionId) => {
        const el: TextElement = {
          id: uuidv4(),
          type: 'text',
          content: '텍스트를 입력하세요',
          x: 190,
          y: 100,
          width: 400,
          height: 60,
          fontSize: 24,
          fontWeight: 400,
          fontFamily: 'Noto Sans KR',
          color: '#333333',
          textAlign: 'center',
          lineHeight: 1.5,
          letterSpacing: 0,
          opacity: 1,
          rotation: 0,
          locked: false,
        }
        get().addElement(sectionId, el)
      },

      addImageElement: (sectionId, src) => {
        const el: ImageElement = {
          id: uuidv4(),
          type: 'image',
          src,
          x: 190,
          y: 100,
          width: 400,
          height: 400,
          objectFit: 'contain',
          borderRadius: 0,
          opacity: 1,
          rotation: 0,
          locked: false,
        }
        get().addElement(sectionId, el)
      },

      addShapeElement: (sectionId, shapeType) => {
        const el: ShapeElement = {
          id: uuidv4(),
          type: 'shape',
          shapeType,
          x: 240,
          y: 100,
          width: 300,
          height: shapeType === 'line' ? 4 : 300,
          backgroundColor: shapeType === 'line' ? '#CCCCCC' : '#F0F0F0',
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: shapeType === 'circle' ? 9999 : 0,
          opacity: 1,
          rotation: 0,
          locked: false,
        }
        get().addElement(sectionId, el)
      },

      // ── Getters ──
      getSelectedSection: () => {
        const { project, selectedSectionId } = get()
        if (!project || !selectedSectionId) return null
        return project.sections.find((s) => s.id === selectedSectionId) ?? null
      },

      getSelectedElement: () => {
        const { project, selectedSectionId, selectedElementId } = get()
        if (!project || !selectedSectionId || !selectedElementId) return null
        const section = project.sections.find((s) => s.id === selectedSectionId)
        return section?.elements.find((el) => el.id === selectedElementId) ?? null
      },

      getVisibleSections: () => {
        const { project } = get()
        if (!project) return []
        return [...project.sections]
          .filter((s) => s.isVisible)
          .sort((a, b) => a.order - b.order)
      },
    })),
    { name: 'editor' }
  )
)

// ──────────────────────────────────────
// 자동 저장 구독 (30초 debounce)
// ──────────────────────────────────────
export function subscribeAutoSave(
  onSave: (project: Project) => Promise<void>
): () => void {
  let timer: ReturnType<typeof setTimeout>

  const unsub = useEditorStore.subscribe(
    (state) => state.isDirty,
    (isDirty) => {
      if (!isDirty) return
      clearTimeout(timer)
      timer = setTimeout(async () => {
        const { project, markClean, setSaving } = useEditorStore.getState()
        if (!project) return
        setSaving(true)
        try {
          await onSave(project)
          markClean()
        } catch (e) {
          console.error('[autoSave]', e)
        } finally {
          setSaving(false)
        }
      }, 30_000)
    }
  )

  return () => {
    clearTimeout(timer)
    unsub()
  }
}
