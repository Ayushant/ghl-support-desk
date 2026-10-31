import { getSupabaseAdmin } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

function extractMessage(payload: Record<string, unknown>): string {
  if (typeof payload.body === 'string') return payload.body
  if (typeof payload.message === 'string') return payload.message

  const name = payload.full_name || payload.first_name || 'Someone'
  const type = payload.contact_type || 'contact'
  const email = payload.email || ''
  const phone = payload.phone || ''

  const parts = [`New ${type}: ${name}`]
  if (email) parts.push(`Email: ${email}`)
  if (phone) parts.push(`Phone: ${phone}`)

  const workflow = payload.workflow as Record<string, unknown> | undefined
  if (workflow?.name) parts.push(`Via: ${workflow.name}`)

  return parts.join(' | ')
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    const eventId =
      payload.id ||
      payload.contact_id ||
      `${payload.contactId || 'unknown'}_${Date.now()}`

    const contactName =
      payload.full_name ||
      payload.contact?.name ||
      payload.contact_name ||
      [payload.first_name, payload.last_name].filter(Boolean).join(' ') ||
      'Unknown'

    const { error } = await getSupabaseAdmin().from('tickets').upsert(
      {
        event_id: eventId,
        ghl_contact_id: payload.contact_id || payload.contactId || '',
        ghl_conversation_id:
          payload.conversation_id || payload.conversationId || null,
        contact_name: contactName,
        contact_email: payload.contact?.email || payload.email || null,
        message: extractMessage(payload),
        status: 'open',
      },
      { onConflict: 'event_id', ignoreDuplicates: true }
    )

    if (error) {
      console.error('DB insert error:', error)
      return NextResponse.json({ status: 'error' }, { status: 500 })
    }

    return NextResponse.json({ status: 'received' }, { status: 200 })
  } catch (err) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
