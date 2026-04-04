// 섹션 컴포넌트 공용 타입 및 헬퍼

import { getPaddingStyle, getImageWidthPercent } from '@/lib/sections'
import type { Section, ImageConfig } from '@/types'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface SectionProps {
  section: Section
  productImageUrl: string
  isSelected: boolean
  onSelect: () => void
}

// 섹션 외부 래퍼
export function SectionWrapper({
  section,
  isSelected,
  onSelect,
  children,
  minHeight = 320,
}: {
  section: Section
  isSelected: boolean
  onSelect: () => void
  children: React.ReactNode
  minHeight?: number
}) {
  return (
    <div
      className={cn(
        'relative w-full cursor-pointer transition-all duration-150 select-none',
        isSelected && 'ring-2 ring-blue-500 ring-inset'
      )}
      style={{
        backgroundColor: section.style.backgroundColor,
        padding: getPaddingStyle(section.style.padding),
        minHeight,
        textAlign: section.style.textAlign,
      }}
      onClick={onSelect}
    >
      {children}
    </div>
  )
}

// 제품 이미지 (position에 따라 렌더링)
export function ProductImage({
  imageUrl,
  config,
}: {
  imageUrl: string
  config: ImageConfig
}) {
  if (config.position === 'background') return null // background는 SectionWrapper에서 처리

  const width = getImageWidthPercent(config.size)

  return (
    <div
      className="relative mx-auto"
      style={{
        width,
        aspectRatio: '1 / 1',
        transform: `translate(${config.offsetX}px, ${config.offsetY}px) scale(${config.scale})`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="제품 이미지"
        className="w-full h-full object-contain drop-shadow-xl"
        crossOrigin="anonymous"
      />
    </div>
  )
}

// 배경 이미지 오버레이
export function BackgroundImage({
  imageUrl,
  config,
}: {
  imageUrl: string
  config: ImageConfig
}) {
  if (config.position !== 'background') return null
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        transform: `translate(${config.offsetX}px, ${config.offsetY}px) scale(${config.scale})`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        className="w-full h-full object-contain opacity-20"
        crossOrigin="anonymous"
      />
    </div>
  )
}

// 하이라이트 배지
export function HighlightBadge({
  text,
  textColor,
}: {
  text: string
  textColor: string
}) {
  if (!text) return null
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 border"
      style={{ color: textColor, borderColor: textColor }}
    >
      {text}
    </span>
  )
}
