'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, MoreVertical } from 'lucide-react'
import { deleteProject } from '@/lib/supabase/projects'
import type { Project } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ProjectCardProps {
  project: Project
  onDeleted: (id: string) => void
}

const MOOD_LABELS = {
  premium: '프리미엄',
  clean: '클린',
  natural: '내추럴',
  impact: '임팩트',
}

export function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`"${project.name}" 프로젝트를 삭제할까요?`)) return
    setIsDeleting(true)
    try {
      await deleteProject(project.id)
      onDeleted(project.id)
    } catch {
      alert('삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all overflow-hidden">
      {/* 썸네일 */}
      <Link href={`/editor/${project.id}`}>
        <div className="w-full h-44 bg-gray-100 overflow-hidden">
          {project.product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.product.imageUrl}
              alt={project.product.name}
              className="w-full h-full object-contain p-4"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
              📦
            </div>
          )}
        </div>
      </Link>

      {/* 정보 */}
      <div className="p-3">
        <Link href={`/editor/${project.id}`}>
          <h3 className="text-sm font-semibold text-gray-800 truncate hover:text-blue-600 transition-colors">
            {project.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-gray-400">
            {project.product.category}
          </span>
          <span className="text-[11px] text-gray-300">·</span>
          <span className="text-[11px] text-gray-400">
            {MOOD_LABELS[project.product.mood]}
          </span>
        </div>
        <p className="text-[11px] text-gray-300 mt-1">
          {formatDistanceToNow(new Date(project.updatedAt), {
            addSuffix: true,
            locale: ko,
          })}
        </p>
      </div>

      {/* 메뉴 버튼 */}
      <div className="absolute top-2 right-2">
        <button
          className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu((v) => !v)
          }}
        >
          <MoreVertical size={14} />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-200 py-1 w-32 z-10">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={13} />
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
