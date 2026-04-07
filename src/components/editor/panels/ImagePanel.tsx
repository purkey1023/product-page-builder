'use client'

import { useEditorStore } from '@/store/editorStore'
import type { ImageElement } from '@/types'
import { cn } from '@/lib/utils'

interface ImagePanelProps {
  element: ImageElement
  sectionId: string
}

export function ImagePanel({ element, sectionId }: ImagePanelProps) {
  const updateElement = useEditorStore((s) => s.updateElement)

  const update = (patch: Partial<ImageElement>) => {
    updateElement(sectionId, element.id, patch)
  }

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">이미지 설정</p>

      {/* 이미지 소스 */}
      <Field label="이미지 소스">
        <div className="space-y-2">
          <div className="flex gap-1">
            <button
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                element.src === 'product'
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
                element.src !== 'product' && !element.src.startsWith('generate:')
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              onClick={() => {
                if (element.src === 'product' || element.src.startsWith('generate:')) {
                  update({ src: '' })
                }
              }}
            >
              URL 직접 입력
            </button>
          </div>
          {element.src !== 'product' && !element.src.startsWith('generate:') && (
            <input
              type="text"
              className="w-full text-xs border rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={element.src}
              onChange={(e) => update({ src: e.target.value })}
              placeholder="이미지 URL 입력"
            />
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
