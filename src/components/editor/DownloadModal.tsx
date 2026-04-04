'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { downloadSection, downloadFullPage } from '@/lib/download'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DownloadModalProps {
  open: boolean
  onClose: () => void
  sectionRefs: React.MutableRefObject<Map<string, HTMLElement>>
}

export function DownloadModal({ open, onClose, sectionRefs }: DownloadModalProps) {
  const project = useEditorStore((s) => s.project)
  const getVisibleSections = useEditorStore((s) => s.getVisibleSections)
  const [mode, setMode] = useState<'full' | 'individual'>('full')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDownloading, setIsDownloading] = useState(false)
  const [progress, setProgress] = useState('')

  if (!project) return null

  const visibleSections = getVisibleSections()

  // 모달 열릴 때 전체 선택
  const handleOpenChange = (open: boolean) => {
    if (open) setSelectedIds(new Set(visibleSections.map((s) => s.id)))
    else onClose()
  }

  const toggleSection = (id: string) => {
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelectedIds(next)
  }

  const selectAll = () => setSelectedIds(new Set(visibleSections.map((s) => s.id)))
  const deselectAll = () => setSelectedIds(new Set())

  const handleDownload = async () => {
    const targetSections = visibleSections.filter((s) => selectedIds.has(s.id))
    const elements = targetSections
      .map((s) => sectionRefs.current.get(s.id))
      .filter((el): el is HTMLElement => !!el)

    if (elements.length === 0) return

    setIsDownloading(true)
    try {
      if (mode === 'full') {
        setProgress('전체 페이지 합성 중...')
        await downloadFullPage(elements, project.name)
      } else {
        for (let i = 0; i < targetSections.length; i++) {
          const section = targetSections[i]
          const el = sectionRefs.current.get(section.id)
          if (!el) continue
          setProgress(`다운로드 중... (${i + 1}/${targetSections.length}) ${section.label}`)
          await downloadSection(el, section.label)
          // 브라우저 팝업 차단 방지
          await new Promise((r) => setTimeout(r, 400))
        }
      }
    } finally {
      setIsDownloading(false)
      setProgress('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">다운로드</DialogTitle>
        </DialogHeader>

        {/* 모드 선택 */}
        <div className="flex gap-2">
          <ModeButton active={mode === 'full'} onClick={() => setMode('full')}>
            전체 페이지 (1파일)
          </ModeButton>
          <ModeButton active={mode === 'individual'} onClick={() => setMode('individual')}>
            섹션별 개별 파일
          </ModeButton>
        </div>

        {/* 섹션 선택 */}
        <div>
          <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>{selectedIds.size}개 선택</span>
            <div className="flex gap-2">
              <button className="hover:text-blue-600" onClick={selectAll}>전체 선택</button>
              <span>·</span>
              <button className="hover:text-red-500" onClick={deselectAll}>전체 해제</button>
            </div>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {visibleSections.map((section) => (
              <label
                key={section.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(section.id)}
                  onChange={() => toggleSection(section.id)}
                  className="rounded accent-blue-500"
                />
                <span className="text-sm">{section.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 다운로드 버튼 */}
        <button
          onClick={handleDownload}
          disabled={selectedIds.size === 0 || isDownloading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isDownloading ? (
            <span className="text-xs">{progress}</span>
          ) : (
            <>
              <Download size={15} />
              PNG 다운로드 ({selectedIds.size}개)
            </>
          )}
        </button>
      </DialogContent>
    </Dialog>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
        active
          ? 'bg-blue-50 border-blue-400 text-blue-700'
          : 'border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
