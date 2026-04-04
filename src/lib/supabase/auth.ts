import { createClientSupabase } from './client'

/**
 * 세션이 없으면 익명 로그인으로 자동 생성합니다.
 * 기존 세션이 있으면 그대로 반환합니다.
 */
export async function ensureSession() {
  const supabase = createClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) throw new Error('세션 생성에 실패했습니다.')
  return data.user
}
