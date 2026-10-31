import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    const eventId =
      payload.id || `${payload.contact_id || payload.contactId}_${Date.now()}`

    const { error } = await supabase.from('tickets').upsert(
      {
        event_id: eventId,
        ghl_contact_id: payload.contact_id || payload.contactId || '',
        ghl_conversation_id:
          payload.conversation_id || payload.conversationId || null,
        contact_name:
          payload.contact?.name ||
          payload.full_name ||
          payload.contact_name ||
          'Unknown',
        contact_email:
          payload.contact?.email || payload.email || null,
        message:
          payload.body || payload.message || JSON.stringify(payload),
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
