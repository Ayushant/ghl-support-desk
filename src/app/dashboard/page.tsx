'use client'

import { useEffect, useState, useCallback } from 'react'

type Ticket = {
  id: string
  event_id: string
  ghl_contact_id: string
  ghl_conversation_id: string | null
  contact_name: string | null
  contact_email: string | null
  message: string
  status: 'open' | 'pending' | 'resolved'
  assigned_to: string | null
  created_at: string
  updated_at: string
}

const STATUS_COLORS = {
  open: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
}

export default function Dashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'pending' | 'resolved'>('all')
  const [creating, setCreating] = useState(false)

  async function createTestTicket() {
    setCreating(true)
    await fetch('/api/tickets/test', { method: 'POST' })
    setCreating(false)
    fetchTickets()
  }

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/tickets')
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch {
      setTickets([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTickets()
    const interval = setInterval(fetchTickets, 10000)
    return () => clearInterval(interval)
  }, [fetchTickets])

  async function updateStatus(ticketId: string, status: string) {
    await fetch('/api/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, status }),
    })
    fetchTickets()
  }

  async function sendReply(ticketId: string) {
    if (!replyText.trim()) return
    setSending(true)
    await fetch('/api/ghl/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, replyMessage: replyText }),
    })
    setReplyText('')
    setSending(false)
    fetchTickets()
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading tickets...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          GHL Support Desk
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {counts.open} open &middot; {counts.pending} pending &middot;{' '}
          {counts.resolved} resolved
        </p>
      </header>

      {/* Simulate GHL Webhook Banner */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-blue-800">
            Simulate a GHL webhook — creates a ticket as if a contact messaged in GoHighLevel
          </p>
          <button
            onClick={createTestTicket}
            disabled={creating}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            {creating ? 'Creating...' : '+ Simulate GHL Webhook'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'open', 'pending', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No tickets found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(ticket => (
              <div
                key={ticket.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Ticket row */}
                <div
                  className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setExpandedId(expandedId === ticket.id ? null : ticket.id)
                  }
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">
                        {ticket.contact_name || 'Unknown'}
                      </span>
                      {ticket.contact_email && (
                        <span className="text-sm text-gray-400">
                          {ticket.contact_email}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {ticket.message}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status]}`}
                  >
                    {ticket.status}
                  </span>

                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Expanded detail */}
                {expandedId === ticket.id && (
                  <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Full Message
                      </p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {ticket.message}
                      </p>
                    </div>

                    <div className="flex gap-4 mb-4 text-xs text-gray-400">
                      <span>ID: {ticket.id.slice(0, 8)}...</span>
                      <span>GHL Contact: {ticket.ghl_contact_id}</span>
                      {ticket.ghl_conversation_id && (
                        <span>Conv: {ticket.ghl_conversation_id}</span>
                      )}
                    </div>

                    {/* Status change */}
                    <div className="flex items-center gap-3 mb-4">
                      <label className="text-sm font-medium text-gray-700">
                        Status:
                      </label>
                      <select
                        value={ticket.status}
                        onChange={e => updateStatus(ticket.id, e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                      </select>

                      <a
                        href={`https://app.gohighlevel.com/contacts/detail/${ticket.ghl_contact_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline ml-auto"
                      >
                        View in GHL &rarr;
                      </a>
                    </div>

                    {/* Reply */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type a reply..."
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        onKeyDown={e => {
                          if (e.key === 'Enter') sendReply(ticket.id)
                        }}
                      />
                      <button
                        onClick={() => sendReply(ticket.id)}
                        disabled={sending || !replyText.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? 'Sending...' : 'Reply via GHL'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
