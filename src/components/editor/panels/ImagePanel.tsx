'use client'

import { useEditorStore } from '@/store/editorStore'
import type { Section, ImagePosition, ImageSizeType } from '@/types'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'

const POSITIONS: { value: ImagePosition; label: string }[] = [
  { value: 'center',     label: '중앙' },
  { value: 'top',        label: '상단' },
  { value: 'bottom',     label: '하단' },
  { value: 'left',       label: '왼쪽' },
  { value: 'right',      label: '오른쪽' },
  { value: 'background', label: '배경' },
]

const SIZES: { value: ImageSizeType; label: string }[] = [
  { value: 'sm',   label: '작게 (40%)' },
  { value: 'md',   label: '보통 (60%)' },
  { value: 'lg',   label: '크게 (80%)' },
  { value: 'full', label: '꽉 차게' },
]

interface ImagePanelProps {
  section: Section
}

export function ImagePanel({ section }: ImagePanelProps) {
  const updateContent = useEditorStore((s) => s.updateContent)
  const { imageConfig } = section.content

  const update = (patch: Partial<typeof imageConfig>) => {
    updateContent(section.id, {
      imageConfig: { ...imageConfig, ...patch },
    })
  }

  return (
    <div className="space-y-5">
      {/* 위치 */}
      <Field label="이미지 위치">
        <div className="grid grid-cols-3 gap-1">
          {POSITIONS.map(({ value, label }) => (
            <button
              key={value}
              className={cn(
                'py-1.5 rounded-lg text-xs font-medium border transition-all',
                imageConfig.position === value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              onClick={() => update({ position: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      {/* 크기 (배경 제외) */}
      {imageConfig.position !== 'background' && (
        <Field label="이미지 크기">
          <div className="grid grid-cols-2 gap-1">
            {SIZES.map(({ value, label }) => (
              <button
                key={value}
                className={cn(
                  'py-1.5 rounded-lg text-xs font-medium border transition-all',
                  imageConfig.size === value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                )}
                onClick={() => update({ size: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
      )}

      {/* 확대/축소 */}
      <Field label={`확대/축소 (${Math.round(imageConfig.scale * 100)}%)`}>
        <Slider
          min={50}
          max={200}
          step={5}
          value={[Math.round(imageConfig.scale * 100)]}
          onValueChange={(val) => {
            const v = Array.isArray(val) ? val[0] : val
            update({ scale: (v ?? 100) / 100 })
          }}
        />
      </Field>

      {/* X 위치 조정 */}
      <Field label={`좌우 이동 (${imageConfig.offsetX}px)`}>
        <Slider
          min={-150}
          max={150}
          step={5}
          value={[imageConfig.offsetX]}
          onValueChange={(val) => {
            const v = Array.isArray(val) ? val[0] : val
            update({ offsetX: v ?? 0 })
          }}
        />
      </Field>

      {/* Y 위치 조정 */}
      <Field label={`상하 이동 (${imageConfig.offsetY}px)`}>
        <Slider
          min={-150}
          max={150}
          step={5}
          value={[imageConfig.offsetY]}
          onValueChange={(val) => {
            const v = Array.isArray(val) ? val[0] : val
            update({ offsetY: v ?? 0 })
          }}
        />
      </Field>

      {/* 초기화 버튼 */}
      <button
        className="w-full text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 rounded-lg py-2 transition-colors"
        onClick={() => update({ scale: 1, offsetX: 0, offsetY: 0 })}
      >
        위치/크기 초기화
      </button>
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
