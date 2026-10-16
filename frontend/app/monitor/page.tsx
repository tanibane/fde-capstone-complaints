'use client';
/**
 * app/monitor/page.tsx — Complaint Agent Trace Viewer
 * Clearview Retail Bank — Monitoring Workbench
 * Usage: /monitor?id=<complaint_id>
 */
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AuditEntry {
  audit_id: string;
  complaint_id: string;
  event_type: string;
  agent_name: string | null;
  payload: any;
  created_at: string;
}

const STAGE_COLORS: Record<string, string> = {
  intake:             '#6f6f6f',
  triage_decision:    '#0f62fe',
  evidence_query:     '#0043ce',
  policy_decision:    '#6929c4',
  draft_complete:     '#005d5d',
  hitl_action:        '#f1c21b',
  dispatch:           '#24a148',
  escalation:         '#da1e28',
};

function MonitorInner() {
  const params = useSearchParams();
  const id = params.get('id');
  const [trail, setTrail] = useState<AuditEntry[]>([]);
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API}/audit/${id}`).then(r => r.json()),
      fetch(`${API}/complaints/${id}`).then(r => r.json()),
    ]).then(([audit, comp]) => {
      setTrail(audit.audit_trail || []);
      setComplaint(comp.complaint || comp);
      setLoading(false);
    });
  }, [id]);

  if (!id) return (
    <main style={{ padding: '2rem', fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <p style={{ color: '#da1e28' }}>No complaint ID provided. Use <code>?id=&lt;complaint_id&gt;</code></p>
    </main>
  );

  if (loading) return <div style={{ padding: '2rem' }}>Loading audit trail...</div>;

  return (
    <main style={{ padding: '2rem', fontFamily: 'IBM Plex Sans, sans-serif', maxWidth: '900px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <a href="/complaints" style={{ fontSize: '0.875rem', color: '#0f62fe', textDecoration: 'none' }}>
          ← Back to complaints
        </a>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        Agent Trace
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#6f6f6f', marginBottom: '2rem', fontFamily: 'monospace' }}>
        {id}
      </p>

      {/* Complaint summary strip */}
      {complaint && (
        <div style={{ background: '#f4f4f4', borderRadius: '4px', padding: '1rem', marginBottom: '2rem',
          display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
          <span><strong>Customer:</strong> {complaint.full_name || complaint.customer_id}</span>
          <span><strong>Channel:</strong> {complaint.channel}</span>
          <span><strong>Priority:</strong> {complaint.priority || '—'}</span>
          <span><strong>Status:</strong> {complaint.status}</span>
          <span><strong>Intent:</strong> {complaint.intent_type || '—'}</span>
        </div>
      )}

      {complaint?.complaint_text && (
        <div style={{ border: '1px solid #e0e0e0', borderLeft: '3px solid #0f62fe', borderRadius: '4px',
          padding: '1rem', marginBottom: '2rem', background: '#fff' }}>
          <div style={{ fontSize: '0.75rem', color: '#6f6f6f', textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Complaint description</div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#161616', lineHeight: 1.5 }}>
            {complaint.complaint_text}
          </p>
        </div>
      )}

      {/* Timeline */}
      {trail.length === 0 ? (
        <p style={{ color: '#6f6f6f' }}>No audit events found for this complaint.</p>
      ) : (
        <div style={{ position: 'relative' }}>
          {/* vertical line */}
          <div style={{ position: 'absolute', left: '15px', top: 0, bottom: 0, width: '2px', background: '#e0e0e0' }} />

          {trail.map((entry, i) => {
            const color = STAGE_COLORS[entry.event_type] || '#6f6f6f';
            const isExpanded = expanded === i;
            return (
              <div key={entry.audit_id} style={{ position: 'relative', paddingLeft: '44px', marginBottom: '1.25rem' }}>
                {/* dot */}
                <div style={{ position: 'absolute', left: '8px', top: '6px', width: '16px', height: '16px',
                  borderRadius: '50%', background: color, border: '2px solid #fff', boxShadow: '0 0 0 2px ' + color }} />

                <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', background: '#fff',
                  borderLeft: `3px solid ${color}` }}>
                  <div style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', cursor: entry.payload ? 'pointer' : 'default' }}
                    onClick={() => entry.payload && setExpanded(isExpanded ? null : i)}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {entry.event_type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      {entry.agent_name && (
                        <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', color: '#6f6f6f',
                          background: '#f4f4f4', padding: '2px 6px', borderRadius: '12px' }}>
                          {entry.agent_name}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                      {entry.payload && (
                        <span style={{ fontSize: '0.75rem', color: '#0f62fe' }}>{isExpanded ? '▲ hide' : '▼ payload'}</span>
                      )}
                    </div>
                  </div>

                  {isExpanded && entry.payload && (
                    <div style={{ borderTop: '1px solid #e0e0e0', padding: '1rem',
                      background: '#f4f4f4', borderRadius: '0 0 4px 4px' }}>
                      <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all', color: '#161616', fontFamily: 'IBM Plex Mono, monospace' }}>
                        {JSON.stringify(entry.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function MonitorPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Loading...</div>}>
      <MonitorInner />
    </Suspense>
  );
}
