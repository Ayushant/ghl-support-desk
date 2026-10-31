import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { ticketId, status } = await req.json()

  if (!ticketId || !status) {
    return NextResponse.json(
      { error: 'ticketId and status are required' },
      { status: 400 }
    )
  }

  const { error } = await getSupabaseAdmin()
    .from('tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'updated' })
}
