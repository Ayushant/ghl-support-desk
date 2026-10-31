import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { ticketId, replyMessage } = await req.json()

    if (!ticketId || !replyMessage) {
      return NextResponse.json(
        { error: 'ticketId and replyMessage are required' },
        { status: 400 }
      )
    }

    const { data: ticket } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const ghlResponse = await fetch(
      'https://services.leadconnectorhq.com/conversations/messages',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GHL_API_KEY}`,
          'Content-Type': 'application/json',
          Version: '2021-04-15',
        },
        body: JSON.stringify({
          type: 'SMS',
          contactId: ticket.ghl_contact_id,
          message: replyMessage,
        }),
      }
    )

    const ghlData = await ghlResponse.json()

    await supabase
      .from('tickets')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    return NextResponse.json({ status: 'sent', ghl: ghlData })
  } catch (err) {
    console.error('Reply error:', err)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
