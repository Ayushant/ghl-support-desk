-- Support tickets table
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  ghl_contact_id TEXT NOT NULL,
  ghl_conversation_id TEXT,
  contact_name TEXT,
  contact_email TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved')),
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SCORM progress table
CREATE TABLE scorm_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  ghl_contact_id TEXT NOT NULL,
  student_email TEXT,
  course_name TEXT,
  score_raw NUMERIC,
  completion_status TEXT CHECK (completion_status IN ('incomplete', 'completed', 'passed', 'failed')),
  lesson_location TEXT,
  session_time TEXT,
  synced_to_ghl BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_ghl_contact ON tickets(ghl_contact_id);
CREATE INDEX idx_scorm_ghl_contact ON scorm_progress(ghl_contact_id);
