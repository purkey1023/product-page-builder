'use client'

import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { ImageElement } from '@/types'
import { cn } from '@/lib/utils'

interface ImagePanelProps {
  element: ImageElement
  sectionId: string
}

export function ImagePanel({ element, sectionId }: ImagePanelProps) {
  const updateElement = useEditorStore((s) => s.updateElement)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const update = (patch: Partial<ImageElement>) => {
    updateElement(sectionId, element.id, patch)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      update({ src: reader.result as string })
    }
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const isLocalFile = element.src.startsWith('data:')
  const isProduct = element.src === 'product'
  const isGenerate = element.src.startsWith('generate:')
  const isUrl = !isProduct && !isGenerate && !isLocalFile && element.src.length > 0

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">이미지 설정</p>

      {/* 이미지 미리보기 */}
      {(isLocalFile || isUrl) && (
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          <img
            src={element.src}
            alt=""
            className="w-full h-32 object-contain"
          />
        </div>
      )}

      {/* 이미지 소스 */}
      <Field label="이미지 소스">
        <div className="space-y-2">
          {/* 로컬 파일 업로드 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all text-xs font-medium"
          >
            <Upload size={14} />
            로컬 이미지 업로드
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* 소스 타입 버튼 */}
          <div className="flex gap-1">
            <button
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                isProduct
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              onClick={() => update({ src: 'product' })}
            >
              제품 사진
            </button>
            <button
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                isUrl
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              onClick={() => {
                if (!isUrl) update({ src: '' })
              }}
            >
              URL 입력
            </button>
          </div>

          {/* URL 입력 필드 */}
          {(isUrl || (!isProduct && !isGenerate && !isLocalFile)) && !isLocalFile && (
            <input
              type="text"
              className="w-full text-xs border rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={isLocalFile ? '' : element.src}
              onChange={(e) => update({ src: e.target.value })}
              placeholder="https:// 이미지 URL 입력"
            />
          )}

          {/* 현재 소스 상태 표시 */}
          {isLocalFile && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              ✓ 로컬 이미지 업로드됨
            </div>
          )}
          {isGenerate && (
            <div className="text-xs text-gray-400">
              AI 생성 이미지: {element.src.replace('generate:', '')}
            </div>
          )}
        </div>
      </Field>

      {/* Object Fit */}
      <Field label="맞춤">
        <div className="flex gap-1">
          {(['contain', 'cover', 'fill'] as const).map((fit) => (
            <button
              key={fit}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                element.objectFit === fit
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              onClick={() => update({ objectFit: fit })}
            >
              {fit === 'contain' ? '비율 맞춤' : fit === 'cover' ? '채우기' : '늘리기'}
            </button>
          ))}
        </div>
      </Field>

      {/* Border Radius */}
      <Field label={`모서리 둥글기 (${element.borderRadius}px)`}>
        <input
          type="range"
          value={element.borderRadius}
          onChange={(e) => update({ borderRadius: Number(e.target.value) })}
          className="w-full"
          min={0}
          max={200}
        />
      </Field>

      {/* 투명도 */}
      <Field label={`투명도 (${Math.round(element.opacity * 100)}%)`}>
        <input
          type="range"
          value={element.opacity * 100}
          onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
          className="w-full"
          min={0}
          max={100}
        />
      </Field>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
