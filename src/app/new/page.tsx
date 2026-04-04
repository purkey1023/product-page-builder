'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ImageUploadStep } from '@/components/wizard/ImageUploadStep'
import { MoodSelector } from '@/components/wizard/MoodSelector'
import { uploadProductImage } from '@/lib/supabase/storage'
import { createProject } from '@/lib/supabase/projects'
import type { MoodType } from '@/types'

const schema = z.object({
  productName: z.string().min(1, '제품명을 입력하세요').max(50),
  category: z.string().min(1, '카테고리를 선택하세요'),
  mood: z.enum(['premium', 'clean', 'natural', 'impact']),
  keyPoint1: z.string().min(1, '소구포인트를 입력하세요'),
  keyPoint2: z.string().min(1, '소구포인트를 입력하세요'),
  keyPoint3: z.string().min(1, '소구포인트를 입력하세요'),
})

type FormValues = z.infer<typeof schema>

const CATEGORIES = [
  '뷰티/스킨케어', '헤어케어', '바디케어', '향수/방향',
  '식품/건강기능', '음료/차', '생활용품', '청소용품',
  '패션/의류', '가방/지갑', '전자제품', '주방용품',
  '반려동물', '스포츠/아웃도어', '인테리어', '기타',
]

const KEYPOINT_PLACEHOLDERS = [
  '예: 72시간 지속 보습',
  '예: 무향 저자극 성분',
  '예: 피부과 테스트 완료',
]

export default function NewProjectPage() {
  const router = useRouter()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mood: 'clean' },
  })

  const selectedMood = watch('mood')

  const handleImageChange = (file: File) => {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const onSubmit = async (values: FormValues) => {
    if (!imageFile) {
      alert('제품 이미지를 업로드해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. 이미지 업로드
      setStatus('이미지 업로드 중...')
      const uploaded = await uploadProductImage(imageFile)

      // 2. AI 생성
      setStatus('AI가 상세페이지를 작성하고 있어요...')
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: values.productName,
          category: values.category,
          mood: values.mood as MoodType,
          keyPoints: [values.keyPoint1, values.keyPoint2, values.keyPoint3],
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'AI 생성 실패')
      }
      const { sections } = await res.json()

      // 3. 프로젝트 저장
      setStatus('프로젝트 저장 중...')
      const project = await createProject({
        name: values.productName,
        product: {
          name: values.productName,
          category: values.category,
          mood: values.mood as MoodType,
          keyPoints: [values.keyPoint1, values.keyPoint2, values.keyPoint3],
          imageUrl: uploaded.url,
          imagePath: uploaded.path,
        },
        sections,
      })

      router.push(`/editor/${project.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다.'
      alert(msg)
      setIsSubmitting(false)
      setStatus('')
    }
  }

  // 생성 중 로딩 화면
  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-5 bg-gray-50">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={28} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-800">{status}</p>
          <p className="text-sm text-gray-400 mt-1">잠시만 기다려주세요 (약 20~30초)</p>
        </div>
        {/* 진행 단계 표시 */}
        <div className="flex gap-2 mt-2">
          {['이미지 업로드', 'AI 생성', '저장'].map((step, i) => {
            const isActive =
              (i === 0 && status.includes('이미지')) ||
              (i === 1 && status.includes('AI')) ||
              (i === 2 && status.includes('저장'))
            return (
              <div
                key={step}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-5 py-8">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">새 프로젝트</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 이미지 업로드 */}
          <Section title="제품 이미지" required>
            <ImageUploadStep preview={imagePreview} onFileChange={handleImageChange} />
            {!imageFile && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                투명 배경(누끼) PNG를 업로드하면 더 멋진 결과물이 만들어져요
              </p>
            )}
          </Section>

          {/* 제품명 */}
          <Section title="제품명" required>
            <input
              {...register('productName')}
              placeholder="예: 수분 크림 토너 200ml"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            />
            {errors.productName && (
              <ErrorMsg>{errors.productName.message}</ErrorMsg>
            )}
          </Section>

          {/* 카테고리 */}
          <Section title="카테고리" required>
            <select
              {...register('category')}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white appearance-none"
            >
              <option value="">카테고리를 선택하세요</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <ErrorMsg>{errors.category.message}</ErrorMsg>}
          </Section>

          {/* 분위기 */}
          <Section title="상세페이지 분위기" required>
            <MoodSelector
              value={selectedMood}
              onChange={(v) => setValue('mood', v)}
            />
          </Section>

          {/* 핵심 소구포인트 */}
          <Section
            title="핵심 소구포인트"
            required
            description="제품의 강점을 3가지 입력하세요. AI가 이를 바탕으로 카피를 작성합니다."
          >
            <div className="space-y-2.5">
              {([1, 2, 3] as const).map((n) => (
                <div key={n} className="flex gap-2.5 items-center">
                  <span className="text-xs font-bold text-blue-500 w-4 text-center flex-shrink-0">
                    {n}
                  </span>
                  <input
                    {...register(`keyPoint${n}` as const)}
                    placeholder={KEYPOINT_PLACEHOLDERS[n - 1]}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  />
                </div>
              ))}
              {(errors.keyPoint1 || errors.keyPoint2 || errors.keyPoint3) && (
                <ErrorMsg>소구포인트를 모두 입력해주세요</ErrorMsg>
              )}
            </div>
          </Section>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={!imageFile}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-base hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            상세페이지 생성하기 ✨
          </button>

          {!imageFile && (
            <p className="text-center text-xs text-gray-400">
              이미지를 먼저 업로드해야 생성할 수 있어요
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

function Section({
  title,
  required,
  description,
  children,
}: {
  title: string
  required?: boolean
  description?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2">
        <span className="text-sm font-semibold text-gray-800">
          {title}
          {required && <span className="text-red-400 ml-1">*</span>}
        </span>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <p className="text-red-500 text-xs mt-1">{children}</p>
}
