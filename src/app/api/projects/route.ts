import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import type { CreateProjectInput } from '@/types'

export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ projects: data })
  } catch (error) {
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const input: CreateProjectInput = await req.json()

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

    if (error) throw error
    return NextResponse.json({ project: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '생성 실패' }, { status: 500 })
  }
}
