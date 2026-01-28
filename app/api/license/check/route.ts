import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

const QuerySchema = z.object({
  email: z.string().email()
})

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email') ?? ''
    const parsed = QuerySchema.safeParse({ email })
    if (!parsed.success) {
      return NextResponse.json({ active: false, error: 'invalid_email' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('licenses')
      .select('status')
      .eq('email', parsed.data.email.toLowerCase())
      .maybeSingle()

    if (error) {
      return NextResponse.json({ active: false, error: error.message }, { status: 500 })
    }

    const active = (data?.status ?? '') === 'active'
    return NextResponse.json({ active })
  } catch (e: any) {
    return NextResponse.json({ active: false, error: 'server_error' }, { status: 500 })
  }
}
