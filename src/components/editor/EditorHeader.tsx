'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, Download, Save, Loader2, Type, ImageIcon, Square, Plus, Upload, Palette } from 'lucide-react'
import Link from 'next/link'
import { useEditorStore } from '@/store/editorStore'
import { saveProject } from '@/lib/supabase/projects'
import { ExportModal } from './ExportModal'
import { ConceptModal } from './ConceptModal'

interface EditorHeaderProps {
  sectionRefs: React.MutableRefObject<Map<string, HTMLDivElement>>
}

export function EditorHeader({ sectionRefs }: EditorHeaderProps) {
  const project = useEditorStore((s) => s.project)
  const isDirty = useEditorStore((s) => s.isDirty)
  const isSaving = useEditorStore((s) => s.isSaving)
  const setSaving = useEditorStore((s) => s.setSaving)
  const markClean = useEditorStore((s) => s.markClean)
  const selectedSectionId = useEditorStore((s) => s.selectedSectionId)
  const addTextElement = useEditorStore((s) => s.addTextElement)
  const addImageElement = useEditorStore((s) => s.addImageElement)
  const addShapeElement = useEditorStore((s) => s.addShapeElement)
  const [exportOpen, setExportOpen] = useState(false)
  const [showShapeMenu, setShowShapeMenu] = useState(false)
  const [showImageMenu, setShowImageMenu] = useState(false)
  const [conceptOpen, setConceptOpen] = useState(false)
  const imageFileRef = useRef<HTMLInputElement>(null)

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

  const canAdd = !!selectedSectionId

  return (
    <>
      <header className="h-12 flex items-center px-4 border-b bg-white gap-2 flex-shrink-0">
        {/* 뒤로가기 + 프로젝트명 */}
        <Link href="/" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="w-px h-5 bg-gray-200" />
        <span className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
          {project?.name ?? ''}
        </span>

        {/* 저장 상태 */}
        <span className="text-xs text-gray-400 mr-2">
          {isSaving ? (
            <span className="flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> 저장 중</span>
          ) : isDirty ? '수정됨' : '저장됨'}
        </span>

        {/* 구분선 */}
        <div className="flex-1" />

        {/* Add 도구 (가운데) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => canAdd && addTextElement(selectedSectionId!)}
            disabled={!canAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="텍스트 추가"
          >
            <Type size={13} /> 텍스트
          </button>
          <div className="relative">
            <button
              onClick={() => canAdd && setShowImageMenu(!showImageMenu)}
              disabled={!canAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="이미지 추가"
            >
              <ImageIcon size={13} /> 이미지
            </button>
            {showImageMenu && canAdd && (
              <div className="absolute top-full mt-1 left-0 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                <button
                  onClick={() => { addImageElement(selectedSectionId!, 'product'); setShowImageMenu(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <ImageIcon size={12} /> 제품 사진
                </button>
                <button
                  onClick={() => { imageFileRef.current?.click(); setShowImageMenu(false) }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <Upload size={12} /> 로컬 파일 업로드
                </button>
              </div>
            )}
            <input
              ref={imageFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file || !selectedSectionId) return
                const reader = new FileReader()
                reader.onload = () => { addImageElement(selectedSectionId!, reader.result as string) }
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />
          </div>
          <div className="relative">
            <button
              onClick={() => {
                if (!canAdd) return
                setShowShapeMenu(!showShapeMenu)
              }}
              disabled={!canAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="도형 추가"
            >
              <Square size={13} /> 도형
            </button>
            {showShapeMenu && canAdd && (
              <div className="absolute top-full mt-1 left-0 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[100px]">
                {[
                  { type: 'rect' as const, label: '사각형' },
                  { type: 'circle' as const, label: '원형' },
                  { type: 'line' as const, label: '라인' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => {
                      addShapeElement(selectedSectionId!, item.type)
                      setShowShapeMenu(false)
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* 우측 액션 */}
        <button
          onClick={() => setConceptOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition-all"
          title="컨셉 변경"
        >
          <Palette size={13} /> 컨셉
        </button>
        <button
          onClick={handleManualSave}
          disabled={!isDirty || isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="저장 (Ctrl+S)"
        >
          <Save size={13} /> 저장
        </button>
        <button
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Download size={13} /> 내보내기
        </button>
      </header>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        sectionRefs={sectionRefs}
      />
      <ConceptModal
        open={conceptOpen}
        onClose={() => setConceptOpen(false)}
      />
    </>
  )
}
