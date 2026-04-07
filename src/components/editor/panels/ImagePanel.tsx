'use client'

import { useRef, useState } from 'react'
import { Upload, Sparkles, Loader2, Scissors } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { ImageElement } from '@/types'
import { cn } from '@/lib/utils'

interface ImagePanelProps {
  element: ImageElement
  sectionId: string
}

export function ImagePanel({ element, sectionId }: ImagePanelProps) {
  const updateElement = useEditorStore((s) => s.updateElement)
  const project = useEditorStore((s) => s.project)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRemovingBg, setIsRemovingBg] = useState(false)

  const update = (patch: Partial<ImageElement>) => {
    updateElement(sectionId, element.id, patch)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update({ src: reader.result as string })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleAiGenerate = async (style?: string) => {
    if (!project || isGenerating) return
    const generateStyle = style || element.src.replace('generate:', '') || 'lifestyle'
    setIsGenerating(true)
    try {
      // 제품 이미지 URL → base64 변환 (AI 분석용)
      let productImageBase64 = ''
      if (project.product.imageUrl) {
        try {
          const imgRes = await fetch(project.product.imageUrl)
          const blob = await imgRes.blob()
          productImageBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve((reader.result as string).split(',')[1] || '')
            reader.readAsDataURL(blob)
          })
        } catch { /* 실패 시 분석 없이 진행 */ }
      }

      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: project.product.name,
          category: project.product.category,
          mood: project.product.mood,
          styles: [generateStyle],
          productImageBase64,
        }),
      })
      if (!res.ok) throw new Error('생성 실패')
      const data = await res.json()
      if (data.images?.[generateStyle]) {
        update({ src: data.images[generateStyle] })
      } else {
        alert('이미지 생성에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (err) {
      console.error('[AI Image]', err)
      alert('이미지 생성 실패. 다시 시도해주세요.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRemoveBg = async () => {
    if (isRemovingBg) return
    // 이미지 src를 base64로 변환
    let base64 = ''
    const src = element.src === 'product' ? project?.product.imageUrl || '' : element.src
    if (!src) return

    setIsRemovingBg(true)
    try {
      if (src.startsWith('data:')) {
        base64 = src.split(',')[1] || ''
      } else {
        const imgRes = await fetch(src)
        const blob = await imgRes.blob()
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(',')[1] || '')
          reader.readAsDataURL(blob)
        })
      }

      const res = await fetch('/api/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      })

      if (!res.ok) throw new Error('실패')
      const data = await res.json()
      if (data.image) {
        update({ src: data.image })
      } else {
        alert(data.error || '배경 제거에 실패했습니다.')
      }
    } catch (err) {
      console.error('[Remove BG]', err)
      alert('배경 제거 실패. 다시 시도해주세요.')
    } finally {
      setIsRemovingBg(false)
    }
  }

  const isLocalFile = element.src.startsWith('data:')
  const isProduct = element.src === 'product'
  const isGenerate = element.src.startsWith('generate:')
  const isUrl = !isProduct && !isGenerate && !isLocalFile && element.src.length > 0
  const hasImage = isLocalFile || isUrl || isProduct
  const canRemoveBg = hasImage && !isGenerate

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">이미지 설정</p>

      {/* 이미지 미리보기 */}
      {hasImage && !isProduct && (
        <div className="border rounded-lg overflow-hidden bg-gray-50">
          <img src={element.src} alt="" className="w-full h-32 object-contain" />
        </div>
      )}

      {/* 누끼 따기 */}
      {canRemoveBg && (
        <button
          onClick={handleRemoveBg}
          disabled={isRemovingBg}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-emerald-200 text-emerald-600 text-xs font-semibold hover:bg-emerald-50 disabled:opacity-50 transition-all"
        >
          {isRemovingBg ? (
            <><Loader2 size={14} className="animate-spin" /> 누끼 따는 중... (20~30초)</>
          ) : (
            <><Scissors size={14} /> 누끼 따기 (배경 제거)</>
          )}
        </button>
      )}

      {/* AI 이미지 생성 (generate: 마커일 때) */}
      {isGenerate && (
        <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50 space-y-3">
          <div className="text-center">
            <Sparkles size={20} className="mx-auto text-purple-500 mb-1" />
            <p className="text-xs font-semibold text-purple-700">AI 이미지 미생성</p>
            <p className="text-[10px] text-purple-400 mt-0.5">
              스타일: {element.src.replace('generate:', '')}
            </p>
          </div>
          <button
            onClick={() => handleAiGenerate()}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all"
          >
            {isGenerating ? (
              <><Loader2 size={14} className="animate-spin" /> 생성 중... (10~20초)</>
            ) : (
              <><Sparkles size={14} /> AI 이미지 생성</>
            )}
          </button>
        </div>
      )}

      {/* AI 이미지 생성 (이미 이미지가 있을 때도 재생성 가능) */}
      {!isGenerate && (
        <Field label="AI 이미지 생성">
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { style: 'texture', label: '텍스처' },
              { style: 'ingredient', label: '성분' },
              { style: 'lifestyle', label: '라이프스타일' },
              { style: 'banner', label: '배너' },
            ].map(({ style, label }) => (
              <button
                key={style}
                onClick={() => handleAiGenerate(style)}
                disabled={isGenerating}
                className="flex items-center justify-center gap-1 py-2 rounded-lg border border-purple-200 text-purple-600 text-xs font-medium hover:bg-purple-50 disabled:opacity-40 transition-all"
              >
                {isGenerating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {label}
              </button>
            ))}
          </div>
        </Field>
      )}

      {/* 로컬 파일 업로드 */}
      <Field label="직접 업로드">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all text-xs font-medium"
        >
          <Upload size={14} /> 로컬 이미지 업로드
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
      </Field>

      {/* 소스 타입 */}
      <Field label="이미지 소스">
        <div className="flex gap-1">
          <button
            className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all', isProduct ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}
            onClick={() => update({ src: 'product' })}
          >
            제품 사진
          </button>
          <button
            className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all', isUrl ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}
            onClick={() => { if (!isUrl) update({ src: '' }) }}
          >
            URL 입력
          </button>
        </div>
        {(isUrl || (!isProduct && !isGenerate && !isLocalFile)) && !isLocalFile && (
          <input
            type="text"
            className="w-full text-xs border rounded-lg px-2.5 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={isLocalFile ? '' : element.src}
            onChange={(e) => update({ src: e.target.value })}
            placeholder="https:// 이미지 URL"
          />
        )}
        {isLocalFile && <p className="text-xs text-green-600 mt-1">✓ 로컬 이미지 업로드됨</p>}
      </Field>

      {/* Object Fit */}
      <Field label="맞춤">
        <div className="flex gap-1">
          {(['contain', 'cover', 'fill'] as const).map((fit) => (
            <button
              key={fit}
              className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all', element.objectFit === fit ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}
              onClick={() => update({ objectFit: fit })}
            >
              {fit === 'contain' ? '비율 맞춤' : fit === 'cover' ? '채우기' : '늘리기'}
            </button>
          ))}
        </div>
      </Field>

      {/* Border Radius */}
      <Field label={`모서리 둥글기 (${element.borderRadius}px)`}>
        <input type="range" value={element.borderRadius} onChange={(e) => update({ borderRadius: Number(e.target.value) })} className="w-full" min={0} max={200} />
      </Field>

      {/* 투명도 */}
      <Field label={`투명도 (${Math.round(element.opacity * 100)}%)`}>
        <input type="range" value={element.opacity * 100} onChange={(e) => update({ opacity: Number(e.target.value) / 100 })} className="w-full" min={0} max={100} />
      </Field>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">{label}</label>
      {children}
    </div>
  )
}
