import { createClientSupabase } from './client'
import type { Project, CreateProjectInput } from '@/types'

// ──────────────────────────────────────
// 프로젝트 목록 조회
// ──────────────────────────────────────
export async function getProjects(): Promise<Project[]> {
  const supabase = createClientSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

// ──────────────────────────────────────
// 단일 프로젝트 조회
// ──────────────────────────────────────
export async function getProject(id: string): Promise<Project | null> {
  const supabase = createClientSupabase()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return mapRow(data)
}

// ──────────────────────────────────────
// 프로젝트 생성
// ──────────────────────────────────────
export async function createProject(input: CreateProjectInput): Promise<Project> {
  const supabase = createClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: input.name,
      product: input.product,
      sections: input.sections,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapRow(data)
}

// ──────────────────────────────────────
// 프로젝트 저장 (전체 업데이트)
// ──────────────────────────────────────
export async function saveProject(project: Project): Promise<void> {
  const supabase = createClientSupabase()
  const { error } = await supabase
    .from('projects')
    .update({
      name: project.name,
      product: project.product,
      sections: project.sections,
      updated_at: new Date().toISOString(),
    })
    .eq('id', project.id)

  if (error) throw new Error(error.message)
}

// ──────────────────────────────────────
// 프로젝트 삭제
// ──────────────────────────────────────
export async function deleteProject(id: string): Promise<void> {
  const supabase = createClientSupabase()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ──────────────────────────────────────
// DB row → Project 타입 변환
// ──────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    product: row.product,
    sections: row.sections,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
