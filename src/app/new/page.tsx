'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, Loader2, Download, RefreshCw, Smartphone, Monitor } from 'lucide-react'
import Link from 'next/link'
import type { MoodType } from '@/types'

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
  const [step, setStep] = useState<'form' | 'loading' | 'preview'>('form')
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [loadingStatus, setLoadingStatus] = useState('')
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile')
  const iframeRef = useRef<HTMLIFrameElement>(null)

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
    setLoadingStatus('AI가 상세페이지를 디자인하고 있어요...')

    try {
      // 이미지를 base64로 변환 (있으면)
      let imageBase64: string | undefined
      if (imageFile) {
        const reader = new FileReader()
        imageBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string
            // data:image/png;base64, 부분 제거
            resolve(result.split(',')[1])
          }
          reader.readAsDataURL(imageFile)
        })
      }

      setLoadingStatus('AI가 디자인 + 카피 + 레이아웃을 생성하고 있어요...')

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          category,
          mood,
          keyPoints: [kp1, kp2, kp3],
          imageBase64,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'AI 생성 실패')
      }

      const data = await res.json()
      let html = data.html || ''

      // __PRODUCT_IMG__ 마커를 실제 이미지로 교체
      if (imagePreview) {
        html = html.replace(/__PRODUCT_IMG__/g, imagePreview)
      } else {
        // 이미지 없으면 SVG 플레이스홀더
        html = html.replace(/__PRODUCT_IMG__/g,
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23f0f0f0'%3E%3Crect width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23ccc'%3EProduct%3C/text%3E%3C/svg%3E"
        )
      }

      setGeneratedHtml(html)
      setStep('preview')
    } catch (err) {
      alert(err instanceof Error ? err.message : '생성 실패')
      setStep('form')
    }
  }

  const handleDownloadHtml = () => {
    const blob = new Blob([generatedHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${productName}-상세페이지.html`
    a.click()
    URL.revokeObjectURL(url)
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
          <p className="text-sm text-gray-400 mt-2">Gemini AI가 디자인 + 카피 + 레이아웃을 한번에 생성합니다</p>
          <p className="text-xs text-gray-300 mt-1">약 15~30초 소요</p>
        </div>
        <div className="flex gap-2">
          {['이미지 분석', 'AI 디자인', '카피 작성', 'HTML 생성'].map((s, i) => (
            <div key={s} className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 animate-pulse"
              style={{ animationDelay: `${i * 0.3}s` }}>
              {s}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── 프리뷰 화면 ───
  if (step === 'preview') {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* 툴바 */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('form')} className="text-gray-500 hover:text-gray-800">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-gray-800">{productName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode('mobile')}
                className={`p-1.5 rounded-md transition ${viewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}>
                <Smartphone size={16} className={viewMode === 'mobile' ? 'text-blue-600' : 'text-gray-400'} />
              </button>
              <button onClick={() => setViewMode('desktop')}
                className={`p-1.5 rounded-md transition ${viewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}>
                <Monitor size={16} className={viewMode === 'desktop' ? 'text-blue-600' : 'text-gray-400'} />
              </button>
            </div>
            <button onClick={handleGenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border text-gray-600 hover:bg-gray-50">
              <RefreshCw size={14} /> 재생성
            </button>
            <button onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              <Download size={14} /> HTML 다운로드
            </button>
          </div>
        </div>

        {/* 프리뷰 영역 */}
        <div className="flex-1 flex justify-center py-6 px-4">
          <div className={`bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300 ${
            viewMode === 'mobile' ? 'w-[390px]' : 'w-full max-w-[860px]'
          }`} style={{ height: 'calc(100vh - 80px)' }}>
            <iframe
              ref={iframeRef}
              srcDoc={generatedHtml}
              className="w-full h-full border-0"
              title="상세페이지 프리뷰"
              sandbox="allow-scripts"
            />
          </div>
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
          <h1 className="text-xl font-bold text-gray-900">새 프로젝트</h1>
        </div>

        <div className="space-y-6">
          {/* 이미지 */}
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

          {/* 제품명 */}
          <div>
            <label className="text-sm font-semibold text-gray-800">제품명 <span className="text-red-400">*</span></label>
            <input value={productName} onChange={(e) => setProductName(e.target.value)}
              placeholder="예: 메디큐브 제로모공 원데이 세럼"
              className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="text-sm font-semibold text-gray-800">카테고리 <span className="text-red-400">*</span></label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
              <option value="">선택하세요</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 분위기 */}
          <div>
            <label className="text-sm font-semibold text-gray-800">분위기 <span className="text-red-400">*</span></label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {MOODS.map(m => (
                <button key={m.value} type="button" onClick={() => setMood(m.value)}
                  className={`p-3 rounded-xl border-2 text-left transition ${
                    mood === m.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <span className="text-lg">{m.emoji}</span>
                  <p className="font-semibold text-sm text-gray-800 mt-1">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 핵심 소구포인트 */}
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
                <input value={item.val} onChange={(e) => item.set(e.target.value)}
                  placeholder={item.ph}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            ))}
          </div>

          {/* 생성 버튼 */}
          <button onClick={handleGenerate}
            disabled={!productName || !category || !kp1 || !kp2 || !kp3}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-base hover:opacity-90 disabled:opacity-40 transition shadow-lg">
            🚀 AI 상세페이지 생성하기
          </button>
          <p className="text-center text-xs text-gray-400">
            Gemini AI가 디자인 + 카피 + 레이아웃을 한번에 생성합니다
          </p>
        </div>
      </div>
    </div>
  )
}
