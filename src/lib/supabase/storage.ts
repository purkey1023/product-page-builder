import { isSupabaseConfigured, createClientSupabase } from './client'
import { ensureSession } from './auth'
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

  // 로컬 모드: base64 Data URL로 변환
  if (!isSupabaseConfigured) {
    const dataUrl = await fileToDataUrl(file)
    return { url: dataUrl, path: `local/${uuidv4()}.${ext}` }
  }

  const supabase = createClientSupabase()
  const user = await ensureSession()
  if (!user) throw new Error('세션 생성에 실패했습니다.')

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
  if (!isSupabaseConfigured || path.startsWith('local/')) return
  const supabase = createClientSupabase()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
