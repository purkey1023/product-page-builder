'use client'

import { useRef, useState } from 'react'
import { Upload, Wand2, Loader2 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import type { Section, TextElement } from '@/types'
import { cn } from '@/lib/utils'

const COLOR_PRESETS = [
  '#FFFFFF', '#F8F8F8', '#F5F5F5', '#FAF7F2', '#EEF4EE',
  '#F0EBE3', '#FBF8F3', '#E8EAED', '#1A1A1A', '#0A0A0A',
  '#0D0D0D', '#1A1A2E', '#C9A96E', '#5C7C5C', '#5BA4A4',
  '#3B82F6', '#6B8E5A', '#E8272A', '#FF4444', '#7C3AED',
]

interface StylePanelProps {
  section: Section
}

export function StylePanel({ section }: StylePanelProps) {
  const updateSectionBackground = useEditorStore((s) => s.updateSectionBackground)
  const updateSectionHeight = useEditorStore((s) => s.updateSectionHeight)
  const updateElement = useEditorStore((s) => s.updateElement)
  const project = useEditorStore((s) => s.project)
  const bgFileRef = useRef<HTMLInputElement>(null)
  const [isAutoStyling, setIsAutoStyling] = useState(false)
  const { background } = section

  // 텍스트 자동 매칭 — 배경에 맞게 텍스트 색상/굵기 자동 조정
  const handleAutoStyle = async () => {
    if (isAutoStyling || !project) return
    setIsAutoStyling(true)
    try {
      const textEls = section.elements.filter((el) => el.type === 'text') as TextElement[]
      if (textEls.length === 0) { alert('이 섹션에 텍스트가 없습니다.'); return }

      // 텍스트 역할 자동 판단 (크기 기반)
      const texts = textEls.map((el) => ({
        id: el.id,
        content: el.content,
        fontSize: el.fontSize,
        role: el.fontSize >= 28 ? 'title' as const
          : el.fontSize >= 18 ? 'subtitle' as const
          : el.letterSpacing > 0 ? 'label' as const
          : el.fontSize <= 12 ? 'accent' as const
          : 'body' as const,
      }))

      const res = await fetch('/api/auto-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backgroundType: background.type,
          backgroundValue: background.value,
          texts,
          mood: project.product.mood,
        }),
      })

      if (!res.ok) throw new Error('실패')
      const data = await res.json()

      if (data.styles?.length) {
        for (const style of data.styles) {
          updateElement(section.id, style.id, {
            color: style.color,
            fontWeight: style.fontWeight,
          })
        }
      }
    } catch (err) {
      console.error('[AutoStyle]', err)
      alert('자동 매칭 실패. 다시 시도해주세요.')
    } finally {
      setIsAutoStyling(false)
    }
  }

  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      updateSectionBackground(section.id, { type: 'image', value: reader.result as string })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-5">
      {/* 배경 타입 */}
      <Field label="배경 타입">
        <div className="flex gap-1">
          {(['color', 'gradient', 'image'] as const).map((t) => (
            <button
              key={t}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all',
                background.type === t
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
              onClick={() => updateSectionBackground(section.id, { type: t })}
            >
              {t === 'color' ? '단색' : t === 'gradient' ? '그라데이션' : '이미지'}
            </button>
          ))}
        </div>
      </Field>

      {/* 배경 값 */}
      {background.type === 'color' && (
        <Field label="배경색">
          <ColorPicker
            value={background.value}
            onChange={(v) => updateSectionBackground(section.id, { value: v })}
          />
        </Field>
      )}

      {background.type === 'gradient' && (
        <Field label="그라데이션">
          <input
            type="text"
            className="w-full text-xs border rounded-lg px-2.5 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={background.value}
            onChange={(e) => updateSectionBackground(section.id, { value: e.target.value })}
            placeholder="linear-gradient(180deg, #FAF7F2 0%, #FFFFFF 100%)"
          />
          <div
            className="mt-2 w-full h-12 rounded-lg border"
            style={{ background: background.value }}
          />
        </Field>
      )}

      {background.type === 'image' && (
        <Field label="배경 이미지">
          {/* 로컬 파일 업로드 */}
          <button
            onClick={() => bgFileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-all text-xs font-medium mb-2"
          >
            <Upload size={14} />
            로컬 이미지 업로드
          </button>
          <input
            ref={bgFileRef}
            type="file"
            accept="image/*"
            onChange={handleBgFileUpload}
            className="hidden"
          />
          {/* URL 입력 */}
          <input
            type="text"
            className="w-full text-xs border rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={background.value.startsWith('data:') ? '' : background.value}
            onChange={(e) => updateSectionBackground(section.id, { value: e.target.value })}
            placeholder="또는 이미지 URL 입력"
          />
          {/* 미리보기 */}
          {background.value && (
            <img
              src={background.value}
              alt=""
              className="mt-2 w-full h-20 object-cover rounded-lg border"
            />
          )}
        </Field>
      )}

      {/* 오버레이 (이미지 배경용) */}
      {background.type === 'image' && (
        <Field label="오버레이">
          <input
            type="text"
            className="w-full text-xs border rounded-lg px-2.5 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={background.overlay ?? ''}
            onChange={(e) => updateSectionBackground(section.id, { overlay: e.target.value })}
            placeholder="rgba(0,0,0,0.3)"
          />
        </Field>
      )}

      {/* 섹션 높이 */}
      <Field label={`섹션 높이 (${section.height}px)`}>
        <input
          type="number"
          value={section.height}
          onChange={(e) => updateSectionHeight(section.id, Number(e.target.value))}
          className="w-full text-xs border rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          min={200}
          max={2000}
          step={10}
        />
      </Field>

      {/* 텍스트 자동 매칭 */}
      <Field label="텍스트 자동 매칭">
        <button
          onClick={handleAutoStyle}
          disabled={isAutoStyling}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {isAutoStyling ? (
            <><Loader2 size={14} className="animate-spin" /> AI 분석 중...</>
          ) : (
            <><Wand2 size={14} /> 배경에 맞게 텍스트 색상 자동 조정</>
          )}
        </button>
        <p className="text-[10px] text-gray-400 mt-1">배경색/이미지를 분석하여 텍스트 색상과 굵기를 자동 조정합니다</p>
      </Field>
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <div
          className="w-8 h-8 rounded-md border border-gray-200 flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          className="flex-1 text-xs border rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
        <input
          type="color"
          className="w-8 h-8 rounded cursor-pointer border-0 p-0"
          value={value.startsWith('#') ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            className={cn(
              'w-6 h-6 rounded-md border-2 transition-transform hover:scale-110',
              value === color ? 'border-blue-500 scale-110' : 'border-transparent'
            )}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            title={color}
          />
        ))}
      </div>
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
