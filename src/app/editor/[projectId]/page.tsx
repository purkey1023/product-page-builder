'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { EditorLayout } from '@/components/editor/EditorLayout'
import { getProject } from '@/lib/supabase/projects'
import type { Project } from '@/types'

export default function EditorPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const p = await getProject(projectId)
        if (!p) {
          setError('프로젝트를 찾을 수 없습니다.')
          return
        }
        setProject(p)
      } catch (err) {
        setError(err instanceof Error ? err.message : '로드 실패')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-600">{error ?? '프로젝트를 찾을 수 없습니다.'}</p>
        <a href="/" className="text-blue-600 hover:underline text-sm">대시보드로 돌아가기</a>
      </div>
    )
  }

  return <EditorLayout project={project} />
}
