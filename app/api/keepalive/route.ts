import { NextResponse } from 'next/server'

import { getSupabase } from '@/lib/supabase'

// Called once a day by Vercel Cron (see vercel.json). It makes one tiny read so the
// free Supabase project keeps seeing activity.
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ ok: false, reason: 'Supabase is not configured' }, { status: 200 })
  }
  const { error } = await supabase.from('store_types').select('slug', { head: true, count: 'exact' })
  return NextResponse.json({ ok: !error })
}
