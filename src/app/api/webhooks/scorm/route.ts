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
      payload.id ||
      `${payload.registrationId || 'scorm'}_${payload.courseId || ''}_${Date.now()}`

    const completionStatus =
      payload.registrationCompletion ||
      payload.completion_status ||
      'incomplete'

    const scoreRaw =
      payload.registrationSuccess === 'PASSED'
        ? payload.score?.scaled
          ? payload.score.scaled * 100
          : null
        : payload.score_raw ?? null

    const ghlContactId =
      payload.learner?.id ||
      payload.ghl_contact_id ||
      payload.learnerId ||
      ''

    const { error } = await supabase.from('scorm_progress').upsert(
      {
        event_id: eventId,
        ghl_contact_id: ghlContactId,
        student_email:
          payload.learner?.email || payload.student_email || null,
        course_name:
          payload.course?.title || payload.course_name || 'Unknown Course',
        score_raw: scoreRaw,
        completion_status: completionStatus.toLowerCase(),
        lesson_location: payload.lesson_location || null,
        session_time: payload.session_time || null,
        synced_to_ghl: false,
      },
      { onConflict: 'event_id', ignoreDuplicates: true }
    )

    if (error) {
      console.error('SCORM DB error:', error)
      return NextResponse.json({ status: 'error' }, { status: 500 })
    }

    // Push to GHL custom fields if we have a contact ID
    if (ghlContactId && process.env.GHL_API_KEY) {
      try {
        await fetch(
          `https://services.leadconnectorhq.com/contacts/${ghlContactId}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${process.env.GHL_API_KEY}`,
              'Content-Type': 'application/json',
              Version: '2021-04-15',
            },
            body: JSON.stringify({
              customFields: [
                { key: 'course_score', value: String(scoreRaw ?? 0) },
                { key: 'course_status', value: completionStatus },
              ],
              tags:
                completionStatus === 'passed' || completionStatus === 'completed'
                  ? ['Course Completed']
                  : ['Needs Retry'],
            }),
          }
        )

        await supabase
          .from('scorm_progress')
          .update({ synced_to_ghl: true })
          .eq('event_id', eventId)
      } catch (syncErr) {
        console.error('GHL sync error:', syncErr)
      }
    }

    return NextResponse.json({ status: 'received' }, { status: 200 })
  } catch (err) {
    console.error('SCORM webhook error:', err)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
