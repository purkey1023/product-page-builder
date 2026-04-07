import { isSupabaseConfigured, createClientSupabase } from './client'
import { ensureSession } from './auth'
import type { Project, CreateProjectInput } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import {
  getAllProjects as idbGetAll,
  getProjectById as idbGet,
  putProject as idbPut,
  deleteProjectById as idbDelete,
} from '@/lib/local-db'

// ──────────────────────────────────────
// 프로젝트 목록 조회
// ──────────────────────────────────────
export async function getProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured) {
    const all = await idbGetAll()
    return all.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }

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
  if (!isSupabaseConfigured) {
    return idbGet(id)
  }

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
  if (!isSupabaseConfigured) {
    const now = new Date().toISOString()
    const project: Project = {
      id: uuidv4(),
      userId: 'local-user',
      name: input.name,
      product: input.product,
      sections: input.sections,
      createdAt: now,
      updatedAt: now,
    }
    await idbPut(project)
    return project
  }

  const supabase = createClientSupabase()
  const user = await ensureSession()
  if (!user) throw new Error('세션 생성에 실패했습니다.')

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
  if (!isSupabaseConfigured) {
    const updated = { ...project, updatedAt: new Date().toISOString() }
    await idbPut(updated)
    return
  }

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
  if (!isSupabaseConfigured) {
    await idbDelete(id)
    return
  }

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
