import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { EditorLayout } from '@/components/editor/EditorLayout'

interface EditorPageProps {
  params: Promise<{ projectId: string }>
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId } = await params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return notFound()
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (error || !project) {
    return notFound()
  }

  // DB row → Project 타입 변환
  const projectData = {
    id: project.id,
    userId: project.user_id,
    name: project.name,
    product: project.product,
    sections: project.sections,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  }

  return <EditorLayout project={projectData} />
}
