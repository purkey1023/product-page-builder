'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Camera, Images, X } from 'lucide-react'
import Link from 'next/link'
import type { MoodType, GeneratedSectionData, ProductInfo, Section, UploadedImage, ImageCategory } from '@/types'
import { buildSectionsFromGenerated, getDefaultSection, ALL_SECTION_TYPES } from '@/lib/sections'
import { createProject } from '@/lib/supabase/projects'
import { uploadProductImage } from '@/lib/supabase/storage'
import { ensureSession } from '@/lib/supabase/auth'
import { v4 as uuidv4 } from 'uuid'

type CreateMode = 'simple' | 'multi'

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

const CATEGORY_LABELS: Record<ImageCategory, string> = {
  product: '제품', model: '모델컷', texture: '텍스처',
  ingredient: '성분', lifestyle: '라이프스타일', detail: '디테일', background: '배경',
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1] || '')
    reader.readAsDataURL(file)
  })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'loading'>('form')
  const [loadingStatus, setLoadingStatus] = useState('')
  const [mode, setMode] = useState<CreateMode>('simple')

  // 공통 폼 state
  const [productName, setProductName] = useState('')
  const [category, setCategory] = useState('')
  const [mood, setMood] = useState<MoodType>('clean')
  const [kp1, setKp1] = useState('')
  const [kp2, setKp2] = useState('')
  const [kp3, setKp3] = useState('')

  // 간편 모드
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // 멀티 모드
  const [multiImages, setMultiImages] = useState<UploadedImage[]>([])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleMultiImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (multiImages.length + files.length > 10) {
      alert('최대 10장까지 업로드 가능합니다.')
      return
    }
    const newImages: UploadedImage[] = []
    for (const file of files) {
      const dataUrl = await fileToDataUrl(file)
      newImages.push({
        id: uuidv4(),
        previewUrl: URL.createObjectURL(file),
        dataUrl,
      })
    }
    setMultiImages((prev) => [...prev, ...newImages])
    e.target.value = ''
  }

  const removeMultiImage = (id: string) => {
    setMultiImages((prev) => prev.filter((img) => img.id !== id))
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 간편 모드 생성
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleSimpleGenerate = async () => {
    if (!productName || !category || !kp1 || !kp2 || !kp3) {
      alert('모든 필수 항목을 입력해주세요.')
      return
    }
    setStep('loading')

    try {
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

      let productImageBase64 = ''
      if (imageFile) {
        productImageBase64 = await fileToBase64(imageFile)
      }

      setLoadingStatus('AI가 제품을 분석하고 11개 섹션을 디자인하고 있어요... (1~2분 소요)')

      const [contentRes, imageRes] = await Promise.allSettled([
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName, category, mood, keyPoints: [kp1, kp2, kp3] }),
        }),
        fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productName, category, mood,
            styles: ['texture', 'ingredient', 'lifestyle', 'banner', 'hero_bg'],
            productImageBase64,
          }),
        }),
      ])

      setLoadingStatus('섹션을 구성하고 있어요...')
      let sections = await buildSections(contentRes, mood)
      const aiImages = await extractAiImages(imageRes)
      applyImages(sections, aiImages, imageUrl)

      setLoadingStatus('프로젝트를 저장하는 중...')
      const project = await createProject({
        name: productName,
        product: { name: productName, category, mood, keyPoints: [kp1, kp2, kp3], imageUrl, imagePath },
        sections,
      })
      router.push(`/editor/${project.id}`)
    } catch (err) {
      console.error('[SimpleGenerate]', err)
      alert(err instanceof Error ? err.message : '생성 실패. 다시 시도해주세요.')
      setStep('form')
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 멀티 이미지 모드 생성
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleMultiGenerate = async () => {
    if (!productName || !category || !kp1 || !kp2 || !kp3 || multiImages.length === 0) {
      alert('모든 필수 항목을 입력하고 이미지를 1장 이상 업로드해주세요.')
      return
    }
    setStep('loading')

    try {
      setLoadingStatus('준비 중...')
      const user = await ensureSession()
      if (!user) throw new Error('세션 생성 실패')

      // 1. 이미지 업로드 (첫 번째 이미지를 대표 제품 이미지로)
      setLoadingStatus(`이미지 ${multiImages.length}장 업로드 중...`)
      const uploadedUrls: string[] = []
      for (const img of multiImages) {
        // dataUrl → File → upload
        const res = await fetch(img.dataUrl)
        const blob = await res.blob()
        const file = new File([blob], `${img.id}.png`, { type: 'image/png' })
        const upload = await uploadProductImage(file)
        uploadedUrls.push(upload.url)
      }
      const mainImageUrl = uploadedUrls[0]
      const mainImagePath = ''

      // 2. AI 이미지 분석 + 콘텐츠 생성 병렬
      setLoadingStatus('AI가 이미지를 분석하고 섹션을 디자인하고 있어요... (1~2분 소요)')

      const imagesForAnalysis = multiImages.map((img) => ({
        id: img.id,
        base64: img.dataUrl.split(',')[1] || '',
      }))

      const [analyzeRes, contentRes] = await Promise.allSettled([
        fetch('/api/analyze-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: imagesForAnalysis, productName, category }),
        }),
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName, category, mood, keyPoints: [kp1, kp2, kp3] }),
        }),
      ])

      // 3. 분석 결과 파싱
      setLoadingStatus('이미지를 섹션에 배치하고 있어요...')

      interface AnalyzedImg { id: string; category: ImageCategory; suggestedSection: string; analysis: string }
      let analyzed: AnalyzedImg[] = []
      if (analyzeRes.status === 'fulfilled' && analyzeRes.value.ok) {
        const data = await analyzeRes.value.json()
        analyzed = data.images || []
        console.log('[Multi] 분석 결과:', analyzed.map(a => `${a.category}→${a.suggestedSection}`).join(', '))
      }

      // 분석 결과를 multiImages에 합치기
      const imageUrlMap = new Map<string, string>()
      multiImages.forEach((img, i) => imageUrlMap.set(img.id, uploadedUrls[i]))

      // 카테고리별 이미지 URL 그룹
      const categoryImages: Record<string, string[]> = {}
      for (const a of analyzed) {
        const url = imageUrlMap.get(a.id)
        if (!url) continue
        if (!categoryImages[a.category]) categoryImages[a.category] = []
        categoryImages[a.category].push(url)
      }

      // 4. 섹션 생성
      let sections = await buildSections(contentRes, mood)

      // 5. 분석 결과에 따라 이미지 → 섹션 배치
      const sectionImageMapping: Record<string, { elementSrc?: string; bgImage?: string }> = {}

      // product → hero, specs, cta의 'product' 마커
      const productImgs = categoryImages['product'] || [mainImageUrl]
      // model → hero 배경 또는 lifestyle 영역
      const modelImgs = categoryImages['model'] || []
      // texture → texture 섹션 배경
      const textureImgs = categoryImages['texture'] || []
      // ingredient → ingredients 카드
      const ingredientImgs = categoryImages['ingredient'] || []
      // lifestyle → benefits 교차 레이아웃
      const lifestyleImgs = categoryImages['lifestyle'] || []
      // background → banner, cta 배경
      const backgroundImgs = categoryImages['background'] || []
      // detail → proof, howto
      const detailImgs = categoryImages['detail'] || []

      // 남은 AI 생성 필요 스타일
      const needAiStyles: string[] = []

      for (const section of sections) {
        // 섹션 배경 이미지 배치
        if (section.type === 'texture' && textureImgs.length > 0) {
          section.background = { type: 'image', value: textureImgs.shift()!, overlay: 'rgba(0,0,0,0.15)' }
        } else if (section.type === 'banner' && (backgroundImgs.length > 0 || modelImgs.length > 1)) {
          const bgUrl = backgroundImgs.shift() || modelImgs.pop()
          if (bgUrl) section.background = { type: 'image', value: bgUrl, overlay: 'rgba(0,0,0,0.4)' }
        } else if (section.type === 'cta' && backgroundImgs.length > 0) {
          section.background = { type: 'image', value: backgroundImgs.shift()!, overlay: 'rgba(0,0,0,0.5)' }
        } else if (section.type === 'hero' && modelImgs.length > 0) {
          section.background = { type: 'image', value: modelImgs.shift()!, overlay: 'rgba(0,0,0,0.1)' }
        }

        // 엘리먼트 이미지 배치
        for (const el of section.elements) {
          if (el.type !== 'image') continue

          if (el.src === 'product') {
            if (productImgs.length > 0) el.src = productImgs[0]
            else if (mainImageUrl) el.src = mainImageUrl
          } else if (el.src.startsWith('generate:')) {
            const style = el.src.replace('generate:', '')
            let matched = false

            if (style === 'lifestyle' && lifestyleImgs.length > 0) {
              el.src = lifestyleImgs.shift()!
              matched = true
            } else if (style === 'ingredient' && ingredientImgs.length > 0) {
              el.src = ingredientImgs.shift()!
              matched = true
            } else if (style === 'texture' && textureImgs.length > 0) {
              el.src = textureImgs.shift()!
              matched = true
            } else if (style === 'lifestyle' && modelImgs.length > 0) {
              el.src = modelImgs.shift()!
              matched = true
            } else if (detailImgs.length > 0) {
              el.src = detailImgs.shift()!
              matched = true
            }

            // 매칭 안 된 건 AI 생성 대상
            if (!matched && !needAiStyles.includes(style)) {
              needAiStyles.push(style)
            }
          }
        }
      }

      // 6. 매칭 안 된 이미지 자리는 AI로 생성
      if (needAiStyles.length > 0) {
        setLoadingStatus(`매칭 안 된 이미지 ${needAiStyles.length}장을 AI로 생성 중...`)
        try {
          const firstImgBase64 = imagesForAnalysis[0]?.base64 || ''
          const imgRes = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productName, category, mood,
              styles: needAiStyles,
              productImageBase64: firstImgBase64,
            }),
          })
          if (imgRes.ok) {
            const imgData = await imgRes.json()
            const aiImgs = imgData.images || {}
            // 남은 generate: 마커 교체
            for (const section of sections) {
              for (const el of section.elements) {
                if (el.type === 'image' && el.src.startsWith('generate:')) {
                  const style = el.src.replace('generate:', '')
                  if (aiImgs[style]) el.src = aiImgs[style]
                }
              }
            }
          }
        } catch { /* AI 이미지 실패해도 계속 진행 */ }
      }

      // 7. 프로젝트 생성
      setLoadingStatus('프로젝트를 저장하는 중...')
      const project = await createProject({
        name: productName,
        product: {
          name: productName, category, mood,
          keyPoints: [kp1, kp2, kp3],
          imageUrl: mainImageUrl,
          imagePath: mainImagePath,
        },
        sections,
      })
      router.push(`/editor/${project.id}`)
    } catch (err) {
      console.error('[MultiGenerate]', err)
      alert(err instanceof Error ? err.message : '생성 실패. 다시 시도해주세요.')
      setStep('form')
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 공통 헬퍼
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  async function buildSections(contentRes: PromiseSettledResult<Response>, mood: MoodType): Promise<Section[]> {
    if (contentRes.status === 'fulfilled' && contentRes.value.ok) {
      const data = await contentRes.value.json()
      if (data.sections?.length) {
        return buildSectionsFromGenerated(data.sections as GeneratedSectionData[], mood)
      }
    }
    return ALL_SECTION_TYPES.map((type, i) => ({ ...getDefaultSection(type, mood), order: i }))
  }

  async function extractAiImages(imageRes: PromiseSettledResult<Response>): Promise<Record<string, string>> {
    if (imageRes.status === 'fulfilled' && imageRes.value.ok) {
      const data = await imageRes.value.json()
      return data.images || {}
    }
    return {}
  }

  function applyImages(sections: Section[], aiImages: Record<string, string>, imageUrl: string) {
    const sectionBgMap: Record<string, { style: string; overlay: string }> = {
      texture: { style: 'texture', overlay: 'rgba(0,0,0,0.15)' },
      banner: { style: 'banner', overlay: 'rgba(0,0,0,0.4)' },
      cta: { style: 'hero_bg', overlay: 'rgba(0,0,0,0.5)' },
    }
    for (const section of sections) {
      const bgMapping = sectionBgMap[section.type]
      if (bgMapping && aiImages[bgMapping.style]) {
        section.background = { type: 'image', value: aiImages[bgMapping.style], overlay: bgMapping.overlay }
      }
      for (const el of section.elements) {
        if (el.type === 'image') {
          if (el.src === 'product' && imageUrl) el.src = imageUrl
          else if (el.src.startsWith('generate:')) {
            const style = el.src.replace('generate:', '')
            if (aiImages[style]) el.src = aiImages[style]
          }
        }
      }
    }
  }

  const handleGenerate = () => {
    if (mode === 'simple') handleSimpleGenerate()
    else handleMultiGenerate()
  }

  const isFormValid = productName && category && kp1 && kp2 && kp3 && (mode === 'simple' ? imageFile : multiImages.length > 0)

  // ─── 로딩 화면 ───
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Loader2 className="animate-spin text-white" size={32} />
        </div>
        <div className="text-center">
          <p className="font-bold text-gray-800 text-lg">{loadingStatus}</p>
          <p className="text-sm text-gray-400 mt-2">
            {mode === 'simple'
              ? 'AI가 11개 섹션 + 이미지를 생성합니다'
              : 'AI가 이미지를 분석하고 섹션에 자동 배치합니다'}
          </p>
          <p className="text-xs text-gray-300 mt-1">약 1~2분 소요 (퀄리티 최우선)</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {(mode === 'simple'
            ? ['11개 섹션 설계', '카피라이팅', 'AI 이미지', '레이아웃 조립']
            : ['이미지 분석', '섹션 매칭', '카피라이팅', 'AI 보충 이미지', '레이아웃 조립']
          ).map((s, i) => (
            <div key={s} className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}>
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
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-700"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">새 프로젝트</h1>
            <p className="text-xs text-gray-400">780px 이미지 시퀀스 상세페이지</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* ── 모드 선택 ── */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('simple')}
              className={`p-4 rounded-xl border-2 text-left transition ${
                mode === 'simple' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Camera size={24} className={mode === 'simple' ? 'text-blue-500' : 'text-gray-400'} />
              <p className="font-semibold text-sm text-gray-800 mt-2">📷 간편 모드</p>
              <p className="text-xs text-gray-500 mt-0.5">사진 1장 + AI가 나머지 생성</p>
            </button>
            <button
              onClick={() => setMode('multi')}
              className={`p-4 rounded-xl border-2 text-left transition ${
                mode === 'multi' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Images size={24} className={mode === 'multi' ? 'text-purple-500' : 'text-gray-400'} />
              <p className="font-semibold text-sm text-gray-800 mt-2">🖼️ 멀티 이미지</p>
              <p className="text-xs text-gray-500 mt-0.5">여러 사진 업로드 + AI 자동 배치</p>
            </button>
          </div>

          {/* ── 이미지 업로드 (모드별) ── */}
          {mode === 'simple' ? (
            <div>
              <label className="text-sm font-semibold text-gray-800">제품 이미지 <span className="text-red-400">*</span></label>
              <div className="mt-2 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-blue-300 transition cursor-pointer"
                onClick={() => document.getElementById('img-input')?.click()}>
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
          ) : (
            <div>
              <label className="text-sm font-semibold text-gray-800">
                이미지 업로드 <span className="text-red-400">*</span>
                <span className="text-xs text-gray-400 ml-2">({multiImages.length}/10장)</span>
              </label>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">
                제품 사진, 모델컷, 텍스처, 성분 이미지 등 다양한 사진을 올려주세요. AI가 분석하여 적절한 섹션에 자동 배치합니다.
              </p>

              {/* 썸네일 그리드 */}
              {multiImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {multiImages.map((img) => (
                    <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border">
                      <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                      {img.category && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5">
                          {CATEGORY_LABELS[img.category]}
                        </div>
                      )}
                      <button
                        onClick={() => removeMultiImage(img.id)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={10} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 업로드 버튼 */}
              {multiImages.length < 10 && (
                <div
                  className="border-2 border-dashed border-purple-200 rounded-2xl p-6 text-center hover:border-purple-400 transition cursor-pointer"
                  onClick={() => document.getElementById('multi-img-input')?.click()}
                >
                  <div className="text-3xl mb-2">🖼️</div>
                  <p className="text-sm text-gray-500">클릭하여 이미지 추가 (여러 장 선택 가능)</p>
                  <p className="text-xs text-gray-400">제품, 모델, 텍스처, 성분, 배경 등</p>
                  <input id="multi-img-input" type="file" accept="image/*" multiple className="hidden" onChange={handleMultiImageAdd} />
                </div>
              )}
            </div>
          )}

          {/* ── 공통 폼 필드 ── */}
          <div>
            <label className="text-sm font-semibold text-gray-800">제품명 <span className="text-red-400">*</span></label>
            <input value={productName} onChange={(e) => setProductName(e.target.value)}
              placeholder="예: 어성초 진정 토너 300ml"
              className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800">카테고리 <span className="text-red-400">*</span></label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
              <option value="">선택하세요</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800">분위기 <span className="text-red-400">*</span></label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {MOODS.map((m) => (
                <button key={m.value} type="button" onClick={() => setMood(m.value)}
                  className={`p-3 rounded-xl border-2 text-left transition ${mood === m.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="text-lg">{m.emoji}</span>
                  <p className="font-semibold text-sm text-gray-800 mt-1">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-800">핵심 소구포인트 <span className="text-red-400">*</span></label>
            <p className="text-xs text-gray-400 mt-0.5 mb-2">AI가 이걸 바탕으로 디자인 + 카피를 생성합니다</p>
            {[
              { val: kp1, set: setKp1, ph: '예: 72시간 지속 보습' },
              { val: kp2, set: setKp2, ph: '예: 피부과 전문의 개발' },
              { val: kp3, set: setKp3, ph: '예: 민감성 피부 적합' },
            ].map((item, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <span className="text-xs font-bold text-blue-500 w-4 text-center">{i + 1}</span>
                <input value={item.val} onChange={(e) => item.set(e.target.value)} placeholder={item.ph}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            ))}
          </div>

          {/* ── 생성 버튼 ── */}
          <button onClick={handleGenerate} disabled={!isFormValid}
            className={`w-full py-4 text-white rounded-2xl font-bold text-base hover:opacity-90 disabled:opacity-40 transition shadow-lg ${
              mode === 'simple'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                : 'bg-gradient-to-r from-purple-600 to-pink-600'
            }`}>
            {mode === 'simple' ? 'AI 상세페이지 생성하기' : `AI 상세페이지 생성하기 (${multiImages.length}장 분석)`}
          </button>
          <p className="text-center text-xs text-gray-400">
            {mode === 'simple'
              ? 'AI가 780px 이미지 시퀀스 상세페이지를 자동으로 디자인합니다'
              : '업로드한 이미지를 AI가 분석하여 적절한 섹션에 자동 배치합니다'}
          </p>
        </div>
      </div>
    </div>
  )
}
