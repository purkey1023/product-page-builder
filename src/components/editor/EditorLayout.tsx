'use client'

import { useEffect, useRef } from 'react'
import { useEditorStore, subscribeAutoSave } from '@/store/editorStore'
import { saveProject } from '@/lib/supabase/projects'
import { SectionList } from './SectionList'
import { PreviewCanvas } from './PreviewCanvas'
import { PropertyPanel } from './PropertyPanel'
import { EditorHeader } from './EditorHeader'
import type { Project } from '@/types'

interface EditorLayoutProps {
  project: Project
}

export function EditorLayout({ project }: EditorLayoutProps) {
  const setProject = useEditorStore((s) => s.setProject)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())
  const unsubRef = useRef<(() => void) | null>(null)

  // 초기 프로젝트 로드
  useEffect(() => {
    setProject(project)
  }, [project.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // 자동 저장 구독 (마운트 시 1회)
  useEffect(() => {
    unsubRef.current = subscribeAutoSave(async (p) => {
      await saveProject(p)
    })
    return () => {
      unsubRef.current?.()
    }
  }, [])

  // Ctrl+S 단축키 저장
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        const { project: p, isSaving, setSaving, markClean } = useEditorStore.getState()
        if (!p || isSaving) return
        setSaving(true)
        try {
          await saveProject(p)
          markClean()
        } finally {
          setSaving(false)
        }
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

        {/* 중앙: 미리보기 */}
        <main className="flex-1 overflow-auto bg-[#E8EAED] flex items-start justify-center py-8 px-4">
          <PreviewCanvas sectionRefs={sectionRefs} />
        </main>

        {/* 우측: 속성 편집 */}
        <aside className="w-[300px] flex-shrink-0 border-l bg-white overflow-y-auto">
          <PropertyPanel />
        </aside>
      </div>
    </div>
  )
}
