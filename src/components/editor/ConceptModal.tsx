'use client'

import { useState } from 'react'
import { Loader2, Palette } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { buildSectionsFromGenerated, getDefaultSection, ALL_SECTION_TYPES } from '@/lib/sections'
import type { MoodType, GeneratedSectionData } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const MOODS: { value: MoodType; label: string; emoji: string; desc: string; colors: string[] }[] = [
  { value: 'premium', label: '프리미엄', emoji: '✨', desc: '고급스럽고 신뢰감 있는 다크톤', colors: ['#0A0A0A', '#C9A96E', '#F5F0E8'] },
  { value: 'clean', label: '클린/미니멀', emoji: '🧊', desc: '깔끔하고 직관적인 화이트톤', colors: ['#FFFFFF', '#3B82F6', '#1A1A1A'] },
  { value: 'natural', label: '내추럴', emoji: '🌿', desc: '따뜻하고 자연스러운 웜톤', colors: ['#FAF7F2', '#6B8E5A', '#3D2B1F'] },
  { value: 'impact', label: '임팩트', emoji: '🔥', desc: '강렬하고 눈에 띄는 다크톤', colors: ['#0D0D0D', '#FF4444', '#FFFFFF'] },
]

interface ConceptModalProps {
  open: boolean
  onClose: () => void
}

export function ConceptModal({ open, onClose }: ConceptModalProps) {
  const project = useEditorStore((s) => s.project)
  const setProject = useEditorStore((s) => s.setProject)
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [mode, setMode] = useState<'colors' | 'full'>('colors')
  const [isLoading, setIsLoading] = useState(false)

  if (!project) return null

  const currentMood = project.product.mood

  const handleApply = async () => {
    if (!selectedMood || !project) return

    setIsLoading(true)
    try {
      if (mode === 'full') {
        // AI로 전체 재생성
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName: project.product.name,
            category: project.product.category,
            mood: selectedMood,
            keyPoints: project.product.keyPoints,
          }),
        })

        let newSections
        if (res.ok) {
          const data = await res.json()
          if (data.sections?.length) {
            newSections = buildSectionsFromGenerated(data.sections as GeneratedSectionData[], selectedMood)
          }
        }

        // AI 실패 시 기본 템플릿
        if (!newSections) {
          newSections = ALL_SECTION_TYPES.map((type, i) => ({
            ...getDefaultSection(type, selectedMood),
            order: i,
          }))
        }

        // 기존 이미지 소스 보존 (product, 업로드된 이미지)
        const oldImageMap = new Map<string, string>()
        for (const sec of project.sections) {
          for (const el of sec.elements) {
            if (el.type === 'image' && !el.src.startsWith('generate:')) {
              oldImageMap.set(`${sec.type}-${el.src === project.product.imageUrl ? 'product' : 'custom'}`, el.src)
            }
          }
        }

        // 새 섹션에 기존 이미지 적용
        for (const sec of newSections) {
          for (const el of sec.elements) {
            if (el.type === 'image' && el.src === 'product' && project.product.imageUrl) {
              el.src = project.product.imageUrl
            }
          }
        }

        setProject({
          ...project,
          product: { ...project.product, mood: selectedMood },
          sections: newSections,
          updatedAt: new Date().toISOString(),
        })
      } else {
        // 색상만 변경 — 기존 레이아웃 유지, 배경/텍스트 색상만 업데이트
        const { MOOD_PALETTES } = await import('@/lib/sections')
        const p = MOOD_PALETTES[selectedMood]

        const updatedSections = project.sections.map((sec, i) => {
          // 배경색 업데이트
          const altTypes = ['philosophy', 'ingredients', 'howto', 'reviews']
          const darkTypes = ['banner', 'cta']
          let newBg = sec.background
          if (sec.background.type === 'color') {
            const bgColor = darkTypes.includes(sec.type) ? p.bgDark
              : altTypes.includes(sec.type) ? p.bgAlt : p.bg
            newBg = { ...sec.background, value: bgColor }
          }

          // 엘리먼트 색상 업데이트
          const updatedElements = sec.elements.map((el) => {
            if (el.type === 'text') {
              // 텍스트 색상 자동 매핑
              const isLabel = el.fontSize <= 13 && el.letterSpacing > 0
              const isMuted = el.fontSize <= 14 || el.fontWeight <= 400
              const isDarkBg = darkTypes.includes(sec.type)

              let newColor = p.text
              if (isLabel) newColor = p.accent
              else if (isDarkBg) newColor = '#F5F0E8'
              else if (isMuted && el.fontSize <= 12) newColor = p.textLight
              else if (isMuted) newColor = p.textMuted

              return { ...el, color: newColor }
            }
            if (el.type === 'shape') {
              // accent 색상 매핑
              if (el.shapeType === 'circle' && el.borderRadius > 100) {
                return { ...el, backgroundColor: el.backgroundColor === 'transparent' ? el.backgroundColor : p.accent }
              }
              if (el.shapeType === 'line') {
                return { ...el, backgroundColor: el.backgroundColor === 'transparent' ? el.backgroundColor : p.accent }
              }
              // 카드 배경
              if (el.shapeType === 'rect' && el.borderRadius >= 16) {
                return { ...el, backgroundColor: p.accentBg }
              }
            }
            return el
          })

          return { ...sec, background: newBg, elements: updatedElements }
        })

        setProject({
          ...project,
          product: { ...project.product, mood: selectedMood },
          sections: updatedSections,
          updatedAt: new Date().toISOString(),
        })
      }

      onClose()
    } catch (err) {
      console.error('[ConceptChange]', err)
      alert('컨셉 변경 실패. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isLoading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette size={18} /> 컨셉 변경
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-gray-500">현재: <strong>{MOODS.find(m => m.value === currentMood)?.label}</strong></p>

        {/* 무드 선택 */}
        <div className="grid grid-cols-2 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMood(m.value)}
              disabled={isLoading}
              className={`p-3 rounded-xl border-2 text-left transition ${
                selectedMood === m.value
                  ? 'border-blue-500 bg-blue-50'
                  : m.value === currentMood
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{m.emoji}</span>
                <span className="font-semibold text-sm">{m.label}</span>
                {m.value === currentMood && <span className="text-[10px] text-gray-400">현재</span>}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{m.desc}</p>
              <div className="flex gap-1 mt-2">
                {m.colors.map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* 변경 모드 */}
        {selectedMood && selectedMood !== currentMood && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500">변경 범위</p>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('colors')}
                className={`flex-1 py-2.5 rounded-lg border-2 text-xs font-medium transition ${
                  mode === 'colors' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200'
                }`}
              >
                🎨 색상만 변경
                <p className="text-[10px] text-gray-400 mt-0.5">레이아웃 유지, 즉시 적용</p>
              </button>
              <button
                onClick={() => setMode('full')}
                className={`flex-1 py-2.5 rounded-lg border-2 text-xs font-medium transition ${
                  mode === 'full' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200'
                }`}
              >
                ✨ AI 전체 재생성
                <p className="text-[10px] text-gray-400 mt-0.5">카피+레이아웃 재생성 (1~2분)</p>
              </button>
            </div>
          </div>
        )}

        {/* 적용 버튼 */}
        <button
          onClick={handleApply}
          disabled={!selectedMood || selectedMood === currentMood || isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <><Loader2 size={15} className="animate-spin" /> {mode === 'full' ? 'AI가 재생성하고 있어요...' : '적용 중...'}</>
          ) : (
            '컨셉 변경 적용'
          )}
        </button>
      </DialogContent>
    </Dialog>
  )
}
