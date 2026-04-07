'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { MoodType, GeneratedSectionData, ProductInfo, Section } from '@/types'
import { buildSectionsFromGenerated, getDefaultSection, ALL_SECTION_TYPES, SECTION_LABELS } from '@/lib/sections'
import { createProject } from '@/lib/supabase/projects'
import { uploadProductImage } from '@/lib/supabase/storage'
import { ensureSession } from '@/lib/supabase/auth'
import { v4 as uuidv4 } from 'uuid'

const CATEGORIES = [
  '뷰티/스킨케어', '헤어케어', '바디케어', '향수/방향',
  '식품/건강기능', '음료/차', '생활용품', '청소용품',
  '패션/의류', '가방/지갑', '전자제품', '주방용품',
  '반려동물', '스포츠/아웃도어', '인테리어', '기타',
]

const MOODS: { value: MoodType; label: string; emoji: string; desc: string }[] = [
  { value: 'premium', label: '프리미엄', emoji: '✨', desc: '고급스럽고 신뢰감' },
  { value: 'clean', label: '클린/미니멀', emoji: '🧊', desc: '깔끔하고 직관적' },
  { value: 'natural', label: '내추럴', emoji: '🌿', desc: '따뜻하고 자연스러운' },
  { value: 'impact', label: '임팩트', emoji: '🔥', desc: '강렬하고 눈에 띄는' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'loading'>('form')
  const [loadingStatus, setLoadingStatus] = useState('')

  // Form state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [mood, setMood] = useState<MoodType>('clean')
  const [kp1, setKp1] = useState('')
  const [kp2, setKp2] = useState('')
  const [kp3, setKp3] = useState('')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleGenerate = async () => {
    if (!productName || !category || !kp1 || !kp2 || !kp3) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }

    setStep('loading')

    try {
      // ── 1단계: 세션 확인 + 이미지 업로드 ──
      setLoadingStatus('준비 중...')
      const user = await ensureSession()
      if (!user) throw new Error('세션 생성 실패')

      let imageUrl = ''
      let imagePath = ''

      if (imageFile) {
        setLoadingStatus('이미지 업로드 중...')
        const upload = await uploadProductImage(imageFile)
        imageUrl = upload.url
        imagePath = upload.path
      }

      // ── 2단계: AI 콘텐츠 생성 + 이미지 생성 병렬 ──
      setLoadingStatus('AI가 상세페이지를 디자인하고 있어요...')

      const [contentRes, imageRes] = await Promise.allSettled([
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName, category, mood,
            keyPoints: [kp1, kp2, kp3],
          }),
        }),
        fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName, category, mood,
            styles: ['texture', 'ingredient', 'lifestyle', 'banner'],
          }),
        }),
      ])

      // ── 3단계: 섹션 구성 ──
      setLoadingStatus('섹션을 구성하고 있어요...')

      let sections: Section[]

      if (contentRes.status === 'fulfilled' && contentRes.value.ok) {
        const data = await contentRes.value.json()
        if (data.sections && Array.isArray(data.sections)) {
          sections = buildSectionsFromGenerated(data.sections as GeneratedSectionData[], mood)
        } else {
          // AI 실패 시 기본 템플릿
          sections = ALL_SECTION_TYPES.map((type, i) => ({
            ...getDefaultSection(type, mood),
            order: i,
          }))
        }
      } else {
        // 네트워크 에러 시 기본 템플릿
        sections = ALL_SECTION_TYPES.map((type, i) => ({
          ...getDefaultSection(type, mood),
          order: i,
        }))
      }

      // ── 4단계: AI 생성 이미지 적용 ──
      const aiImages: Record<string, string> = {}
      if (imageRes.status === 'fulfilled' && imageRes.value.ok) {
        const imgData = await imageRes.value.json()
        Object.assign(aiImages, imgData.images || {})
        console.log(`AI 이미지 ${imgData.generated}/${imgData.requested}장 생성 완료`)
      }

      // 섹션 엘리먼트에서 generate: 마커를 실제 이미지로 교체
      // + 특정 섹션 배경에 AI 생성 이미지 자동 적용
      const sectionBgMap: Record<string, string> = {
        texture: 'texture',
        banner: 'banner',
        hero: 'lifestyle',
      }

      for (const section of sections) {
        // 섹션 배경 이미지 적용
        const bgStyle = sectionBgMap[section.type]
        if (bgStyle && aiImages[bgStyle] && section.background.type === 'color') {
          // texture, banner 섹션은 배경 이미지로 전환
          if (section.type === 'texture' || section.type === 'banner') {
            section.background = {
              type: 'image',
              value: aiImages[bgStyle],
              overlay: 'rgba(0,0,0,0.3)',
            }
          }
        }

        // 엘리먼트 이미지 마커 교체
        for (const el of section.elements) {
          if (el.type === 'image') {
            if (el.src === 'product' && imageUrl) {
              el.src = imageUrl
            } else if (el.src.startsWith('generate:')) {
              const style = el.src.replace('generate:', '')
              if (aiImages[style]) {
                el.src = aiImages[style]
              }
            }
          }
        }
      }

      // ── 5단계: 프로젝트 생성 ──
      setLoadingStatus('프로젝트를 저장하는 중...')

      const product: ProductInfo = {
        name: productName,
        category,
        mood,
        keyPoints: [kp1, kp2, kp3],
        imageUrl,
        imagePath,
      }

      const project = await createProject({
        name: productName,
        product,
        sections,
      })

      // ── 6단계: 에디터로 이동 ──
      router.push(`/editor/${project.id}`)
    } catch (err) {
      console.error('[Generate]', err)
      alert(err instanceof Error ? err.message : '생성 실패. 다시 시도해주세요.')
      setStep('form')
    }
  }

  // ─── 로딩 화면 ───
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Loader2 className="animate-spin text-white" size={32} />
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-800 text-lg">{loadingStatus}</p>
          <p className="text-sm text-gray-400 mt-2">AI가 780px 이미지 시퀀스 상세페이지를 디자인합니다</p>
          <p className="text-xs text-gray-300 mt-1">약 20~40초 소요</p>
        </div>
        <div className="flex gap-2">
          {['레이아웃 설계', 'AI 카피', 'AI 이미지', '조립'].map((s, i) => (
            <div
              key={s}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── 입력 폼 ───
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-gray-400 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">새 프로젝트</h1>
            <p className="text-xs text-gray-400">780px 이미지 시퀀스 상세페이지</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 이미지 */}
          <div>
            <label className="text-sm font-semibold text-gray-800">
              제품 이미지 <span className="text-red-400">*</span>
            </label>
            <div
              className="mt-2 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-300 transition cursor-pointer"
              onClick={() => document.getElementById('img-input')?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="미리보기" className="max-h-48 mx-auto rounded-lg" />
              ) : (
                <>
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-sm text-gray-500">이미지를 클릭하거나 드래그하세요</p>
                  <p className="text-xs text-gray-400">투명 배경 PNG 권장</p>
                </>
              )}
              <input id="img-input" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
          </div>

          {/* 제품명 */}
          <div>
            <label className="text-sm font-semibold text-gray-800">
              제품명 <span className="text-red-400">*</span>
            </label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="예: 어성초 진정 토너 300ml"
              className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="text-sm font-semibold text-gray-800">
              카테고리 <span className="text-red-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              <option value="">선택하세요</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 분위기 */}
          <div>
            <label className="text-sm font-semibold text-gray-800">
              분위기 <span className="text-red-400">*</span>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    mood === m.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{m.emoji}</span>
                  <p className="font-semibold text-sm text-gray-800 mt-1">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 핵심 소구포인트 */}
          <div>
            <label className="text-sm font-semibold text-gray-800">
              핵심 소구포인트 <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-gray-400 mt-0.5 mb-2">AI가 이걸 바탕으로 디자인 + 카피를 생성합니다</p>
            {[
              { val: kp1, set: setKp1, ph: '예: 72시간 지속 보습' },
              { val: kp2, set: setKp2, ph: '예: 피부과 전문의 개발' },
              { val: kp3, set: setKp3, ph: '예: 민감성 피부 적합' },
            ].map((item, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <span className="text-xs font-bold text-blue-500 w-4 text-center">{i + 1}</span>
                <input
                  value={item.val}
                  onChange={(e) => item.set(e.target.value)}
                  placeholder={item.ph}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            ))}
          </div>

          {/* 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={!productName || !category || !kp1 || !kp2 || !kp3 || !imageFile}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-base hover:opacity-90 disabled:opacity-40 transition shadow-lg"
          >
            AI 상세페이지 생성하기
          </button>
          <p className="text-center text-xs text-gray-400">
            AI가 780px 이미지 시퀀스 상세페이지를 자동으로 디자인합니다
          </p>
        </div>
      </div>
    </div>
  )
}
