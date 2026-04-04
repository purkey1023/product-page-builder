'use client'

import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { arrayMove } from '@dnd-kit/sortable'
import type { Project, Section, SectionContent, SectionStyle } from '@/types'

// ──────────────────────────────────────
// 상태 + 액션 타입
// ──────────────────────────────────────
interface EditorState {
  project: Project | null
  selectedSectionId: string | null
  isGenerating: boolean
  isSaving: boolean
  isDirty: boolean
}

interface EditorActions {
  setProject: (project: Project) => void
  selectSection: (id: string | null) => void
  updateContent: (sectionId: string, patch: Partial<SectionContent>) => void
  updateStyle: (sectionId: string, patch: Partial<SectionStyle>) => void
  reorderSections: (activeId: string, overId: string) => void
  toggleVisibility: (sectionId: string) => void
  setGenerating: (v: boolean) => void
  setSaving: (v: boolean) => void
  markClean: () => void
  // Getter (컴포넌트 외부 또는 콜백 내부에서 사용)
  getSelectedSection: () => Section | null
  getVisibleSections: () => Section[]
}

export type EditorStore = EditorState & EditorActions

// ──────────────────────────────────────
// Zustand 스토어
// ──────────────────────────────────────
export const useEditorStore = create<EditorStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      project: null,
      selectedSectionId: null,
      isGenerating: false,
      isSaving: false,
      isDirty: false,

      setProject: (project) =>
        set({ project, isDirty: false, selectedSectionId: null }),

      selectSection: (id) => set({ selectedSectionId: id }),

      updateContent: (sectionId, patch) =>
        set((state) => {
          if (!state.project) return {}
          return {
            isDirty: true,
            project: {
              ...state.project,
              sections: state.project.sections.map((s) =>
                s.id === sectionId
                  ? { ...s, content: { ...s.content, ...patch } }
                  : s
              ),
            },
          }
        }),

      updateStyle: (sectionId, patch) =>
        set((state) => {
          if (!state.project) return {}
          return {
            isDirty: true,
            project: {
              ...state.project,
              sections: state.project.sections.map((s) =>
                s.id === sectionId
                  ? { ...s, style: { ...s.style, ...patch } }
                  : s
              ),
            },
          }
        }),

      reorderSections: (activeId, overId) =>
        set((state) => {
          if (!state.project) return {}
          const { sections } = state.project
          const from = sections.findIndex((s) => s.id === activeId)
          const to = sections.findIndex((s) => s.id === overId)
          if (from === -1 || to === -1) return {}
          const reordered = arrayMove(sections, from, to).map((s, i) => ({
            ...s,
            order: i,
          }))
          return {
            isDirty: true,
            project: { ...state.project, sections: reordered },
          }
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

      setGenerating: (v) => set({ isGenerating: v }),
      setSaving: (v) => set({ isSaving: v }),
      markClean: () => set({ isDirty: false }),

      getSelectedSection: () => {
        const { project, selectedSectionId } = get()
        if (!project || !selectedSectionId) return null
        return project.sections.find((s) => s.id === selectedSectionId) ?? null
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
// EditorLayout에서 마운트 시 1회 호출
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
