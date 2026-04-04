'use client'

import { useCallback } from 'react'
import { Upload, ImageIcon } from 'lucide-react'

interface ImageUploadStepProps {
  preview: string | null
  onFileChange: (file: File) => void
  isUploading?: boolean
}

export function ImageUploadStep({ preview, onFileChange, isUploading }: ImageUploadStepProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileChange(file)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) onFileChange(file)
    },
    [onFileChange]
  )

  return (
    <label
      className="block cursor-pointer"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleChange}
        disabled={isUploading}
      />

      {preview ? (
        // 이미지 미리보기
        <div className="relative w-full h-52 rounded-2xl overflow-hidden border-2 border-blue-300 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="제품 미리보기"
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
              클릭해서 변경
            </span>
          </div>
        </div>
      ) : (
        // 업로드 플레이스홀더
        <div className="w-full h-52 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={20} className="text-gray-400" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {isUploading ? '업로드 중...' : '이미지를 드래그하거나 클릭하세요'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · 최대 10MB</p>
            <p className="text-xs text-blue-500 mt-1 font-medium">투명 배경 PNG 권장</p>
          </div>
        </div>
      )}
    </label>
  )
}
