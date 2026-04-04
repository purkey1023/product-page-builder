'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Loader2 } from 'lucide-react'
import { getProjects } from '@/lib/supabase/projects'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { ensureSession } from '@/lib/supabase/auth'
import type { Project } from '@/types'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        await ensureSession()
        const list = await getProjects()
        setProjects(list)
      } catch {
        // 오류 발생 시에도 빈 대시보드 표시
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 프로젝트</h1>
          <p className="text-sm text-gray-400 mt-1">{projects.length}개의 프로젝트</p>
        </div>
        <Link
          href="/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          새 프로젝트
        </Link>
      </div>

      {/* 프로젝트 그리드 */}
      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onDeleted={(id) => setProjects((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="text-6xl">📦</div>
      <div>
        <p className="text-gray-600 font-medium">아직 프로젝트가 없어요</p>
        <p className="text-sm text-gray-400 mt-1">
          제품 이미지를 업로드하고 3분 안에 상세페이지를 만들어보세요
        </p>
      </div>
      <Link
        href="/new"
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
      >
        <Plus size={15} />
        첫 프로젝트 만들기
      </Link>
    </div>
  )
}
