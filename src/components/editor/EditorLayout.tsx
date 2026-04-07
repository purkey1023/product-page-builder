'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore, subscribeAutoSave } from '@/store/editorStore'
import { saveProject } from '@/lib/supabase/projects'
import { SectionList } from './SectionList'
import { Canvas } from './Canvas'
import { PropertyPanel } from './PropertyPanel'
import { EditorHeader } from './EditorHeader'
import type { Project } from '@/types'

interface EditorLayoutProps {
  project: Project
}

export function EditorLayout({ project }: EditorLayoutProps) {
  const setProject = useEditorStore((s) => s.setProject)
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const unsubRef = useRef<(() => void) | null>(null)

  // 초기 프로젝트 로드
  useEffect(() => {
    setProject(project)
  }, [project.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 자동 저장 구독
  useEffect(() => {
    unsubRef.current = subscribeAutoSave(async (p) => {
      await saveProject(p)
    })
    return () => {
      unsubRef.current?.()
    }
  }, [])

  // 키보드 단축키
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      const store = useEditorStore.getState()

      // Ctrl+S 저장
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!store.project || store.isSaving) return
        store.setSaving(true)
        try {
          await saveProject(store.project)
          store.markClean()
        } finally {
          store.setSaving(false)
        }
        return
      }

      // Ctrl+Z 실행 취소
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        store.undo()
        return
      }

      // Ctrl+Shift+Z 다시 실행
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        store.redo()
        return
      }

      // Ctrl+Y 다시 실행 (대체 단축키)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault()
        store.redo()
        return
      }

      // 텍스트 편집 중에는 다른 단축키 무시
      if (store.editingTextId) return

      // Delete/Backspace 요소 삭제
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (store.selectedElementId && store.selectedSectionId) {
          e.preventDefault()
          store.removeElement(store.selectedSectionId, store.selectedElementId)
        }
        return
      }

      // Ctrl+D 복제
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        if (store.selectedElementId && store.selectedSectionId) {
          store.duplicateElement(store.selectedSectionId, store.selectedElementId)
        } else if (store.selectedSectionId && !store.selectedElementId) {
          store.duplicateSection(store.selectedSectionId)
        }
        return
      }

      // Escape 선택 해제
      if (e.key === 'Escape') {
        store.deselectAll()
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <EditorHeader sectionRefs={sectionRefs} />

      <div className="flex flex-1 min-h-0">
        {/* 좌측: 섹션 목록 */}
        <aside className="w-[220px] flex-shrink-0 border-r bg-white overflow-y-auto">
          <SectionList />
        </aside>

        {/* 중앙: 캔버스 */}
        <Canvas sectionRefs={sectionRefs} />

        {/* 우측: 속성 패널 */}
        <aside className="w-[300px] flex-shrink-0 border-l bg-white overflow-y-auto">
          <PropertyPanel />
        </aside>
      </div>
    </div>
  )
}
