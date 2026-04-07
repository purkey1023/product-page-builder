import { isSupabaseConfigured, createClientSupabase } from './client'

/**
 * 세션이 없으면 익명 로그인으로 자동 생성합니다.
 * Supabase 미설정 시 로컬 모드로 동작합니다.
 */
export async function ensureSession() {
  if (!isSupabaseConfigured) {
    // 로컬 모드: 가상 유저 반환
    return { id: 'local-user', email: null } as { id: string; email: string | null }
  }

  const supabase = createClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw new Error('세션 생성에 실패했습니다.')
  return data.user
}
