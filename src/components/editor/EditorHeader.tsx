'use client'

import { useState } from 'react'
import { ArrowLeft, Download, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEditorStore } from '@/store/editorStore'
import { saveProject } from '@/lib/supabase/projects'
import { DownloadModal } from './DownloadModal'

interface EditorHeaderProps {
  sectionRefs: React.MutableRefObject<Map<string, HTMLElement>>
}

export function EditorHeader({ sectionRefs }: EditorHeaderProps) {
  const project = useEditorStore((s) => s.project)
  const isDirty = useEditorStore((s) => s.isDirty)
  const isSaving = useEditorStore((s) => s.isSaving)
  const setSaving = useEditorStore((s) => s.setSaving)
  const markClean = useEditorStore((s) => s.markClean)
  const [downloadOpen, setDownloadOpen] = useState(false)

  const handleManualSave = async () => {
    if (!project || isSaving) return
    setSaving(true)
    try {
      await saveProject(project)
      markClean()
    } catch (e) {
      console.error('[manualSave]', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <header className="h-12 flex items-center px-4 border-b bg-white gap-3 flex-shrink-0">
        {/* 뒤로가기 */}
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-700 transition-colors"
          title="프로젝트 목록으로"
        >
          <ArrowLeft size={18} />
        </Link>

        {/* 구분선 */}
        <div className="w-px h-5 bg-gray-200" />

        {/* 프로젝트명 */}
        <span className="text-sm font-semibold text-gray-800 flex-1 truncate">
          {project?.name ?? ''}
        </span>

        {/* 저장 상태 */}
        <span className="text-xs text-gray-400 flex-shrink-0">
          {isSaving ? (
            <span className="flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" /> 저장 중
            </span>
          ) : isDirty ? (
            '수정됨'
          ) : (
            '저장됨'
          )}
        </span>

        {/* 수동 저장 */}
        <button
          onClick={handleManualSave}
          disabled={!isDirty || isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="저장 (Ctrl+S)"
        >
          <Save size={13} />
          저장
        </button>

        {/* 다운로드 */}
        <button
          onClick={() => setDownloadOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Download size={13} />
          다운로드
        </button>
      </header>

      <DownloadModal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        sectionRefs={sectionRefs}
      />
    </>
  )
}
