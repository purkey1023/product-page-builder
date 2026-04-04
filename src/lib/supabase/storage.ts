import { createClientSupabase } from './client'
import { v4 as uuidv4 } from 'uuid'

const BUCKET = 'product-images'
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

export interface UploadResult {
  url: string
  path: string
}

export async function uploadProductImage(file: File): Promise<UploadResult> {
  // 유효성 검사
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('파일 크기는 10MB 이하여야 합니다.')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('PNG, JPG, WEBP 형식만 지원합니다.')
  }

  const supabase = createClientSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('로그인이 필요합니다.')

  const path = `${user.id}/${uuidv4()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(error.message)

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path)

  return { url: publicUrl, path }
}

export async function deleteProductImage(path: string): Promise<void> {
  const supabase = createClientSupabase()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(error.message)
}
