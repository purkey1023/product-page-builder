'use client'

import { useState } from 'react'
import { Download, Loader2, FileArchive, ImageIcon } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { exportAsZip, exportAsMergedImage } from '@/lib/download'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ExportModalProps {
  open: boolean
  onClose: () => void
  sectionRefs: React.MutableRefObject<Map<string, HTMLDivElement>>
}

export function ExportModal({ open, onClose, sectionRefs }: ExportModalProps) {
  const project = useEditorStore((s) => s.project)
  const getVisibleSections = useEditorStore((s) => s.getVisibleSections)
  const [mode, setMode] = useState<'zip' | 'merged'>('zip')
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  if (!project) return null

  const visibleSections = getVisibleSections()

  const handleExport = async () => {
    if (visibleSections.length === 0) return

    setIsExporting(true)
    const sectionOrder = visibleSections.map((s) => ({ id: s.id, label: s.label }))
    const onProgress = (current: number, total: number) => setProgress({ current, total })

    try {
      if (mode === 'zip') {
        await exportAsZip(sectionRefs.current, sectionOrder, project.name, onProgress)
      } else {
        await exportAsMergedImage(sectionRefs.current, sectionOrder, project.name, onProgress)
      }
    } catch (err) {
      console.error('[Export]', err)
      alert('내보내기 실패. 다시 시도해주세요.')
    } finally {
      setIsExporting(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">이미지 내보내기</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-gray-500">
          780px 너비의 PNG 이미지로 내보냅니다. 스마트스토어, 쿠팡 등에 바로 업로드할 수 있습니다.
        </p>

        {/* 모드 선택 */}
        <div className="flex gap-2 mt-2">
          <ModeButton
            active={mode === 'zip'}
            onClick={() => setMode('zip')}
            icon={<FileArchive size={16} />}
            title="ZIP 파일"
            desc="섹션별 개별 이미지"
          />
          <ModeButton
            active={mode === 'merged'}
            onClick={() => setMode('merged')}
            icon={<ImageIcon size={16} />}
            title="합성 이미지"
            desc="1장으로 합치기"
          />
        </div>

        {/* 섹션 미리보기 */}
        <div className="mt-2 text-xs text-gray-500">
          <span>{visibleSections.length}개 섹션 포함:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {visibleSections.map((s) => (
              <span key={s.id} className="px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* 내보내기 버튼 */}
        <button
          onClick={handleExport}
          disabled={isExporting || visibleSections.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-2"
        >
          {isExporting ? (
            <span className="flex items-center gap-2 text-xs">
              <Loader2 size={14} className="animate-spin" />
              처리 중... ({progress.current}/{progress.total})
            </span>
          ) : (
            <>
              <Download size={15} />
              {mode === 'zip' ? 'ZIP 다운로드' : 'PNG 다운로드'}
              <span className="text-xs opacity-80">({visibleSections.length}개 섹션)</span>
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
  icon,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <button
      className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border-2 transition-all ${
        active
          ? 'bg-blue-50 border-blue-400 text-blue-700'
          : 'border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="text-xs font-semibold">{title}</span>
      <span className="text-[10px] text-gray-400">{desc}</span>
    </button>
  )
}
