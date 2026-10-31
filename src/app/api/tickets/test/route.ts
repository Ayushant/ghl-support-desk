import { getSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

const SAMPLE_TICKETS = [
  { name: 'Sarah Johnson', email: 'sarah@justinsurance.com', message: 'I need help resetting my exam portal password' },
  { name: 'Mike Chen', email: 'mike@justinsurance.com', message: 'When is my next insurance license exam scheduled?' },
  { name: 'Priya Patel', email: 'priya@justinsurance.com', message: 'My SCORM course shows incomplete but I finished all modules' },
  { name: 'James Wilson', email: 'james@justinsurance.com', message: 'Can I reschedule my Property & Casualty exam to next week?' },
  { name: 'Emily Davis', email: 'emily@justinsurance.com', message: 'I passed my exam but haven\'t received the certificate yet' },
  { name: 'Alex Rivera', email: 'alex@justinsurance.com', message: 'The study material links in Module 3 are broken' },
]

export async function POST() {
  const sample = SAMPLE_TICKETS[Math.floor(Math.random() * SAMPLE_TICKETS.length)]
  const eventId = `test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const contactId = `ghl_${Math.random().toString(36).slice(2, 10)}`

  const { error } = await getSupabaseAdmin().from('tickets').insert({
    event_id: eventId,
    ghl_contact_id: contactId,
    contact_name: sample.name,
    contact_email: sample.email,
    message: sample.message,
    status: 'open',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ status: 'created', name: sample.name })
}
