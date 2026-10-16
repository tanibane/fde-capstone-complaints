'use client';
/**
 * app/complaints/page.tsx — Filterable Complaint Table
 * Clearview Retail Bank — Monitoring Workbench
 */
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const STATUS_COLORS: Record<string, string> = {
  intake: '#6f6f6f', triaging: '#0f62fe', evidence_gathering: '#0043ce',
  policy_review: '#6929c4', drafting: '#9f1853', hitl_review: '#f1c21b',
  dispatched: '#24a148', closed: '#24a148', escalated: '#da1e28',
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ priority: '', status: '', channel: '', vulnerability: '' });
  const [running, setRunning] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_id: 'CUST-001', channel: 'mobile', complaint_text: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const res = await fetch(`${API}/complaints?${params}&limit=50`);
    const data = await res.json();
    setComplaints(data.complaints || []);
    setTotal(data.total || 0);
  };

  useEffect(() => { fetchComplaints(); }, [filters]);

  const submitComplaint = async () => {
    if (!form.complaint_text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.complaint_id) {
        setForm({ customer_id: 'CUST-001', channel: 'mobile', complaint_text: '' });
        setShowForm(false);
        await fetchComplaints();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const runPipeline = async (id: string) => {
    setRunning(prev => new Set(prev).add(id));
    fetch(`${API}/pipeline/run/${id}`, { method: 'POST' }).finally(() => {
      fetchComplaints();
      setRunning(prev => { const s = new Set(prev); s.delete(id); return s; });
    });
    // Optimistically mark as triaging so user sees immediate feedback
    setComplaints(prev => prev.map(c => c.complaint_id === id ? { ...c, status: 'triaging' } : c));
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0 }}>Complaints ({total})</h1>
        <button onClick={() => setShowForm(f => !f)} style={{
          padding: '0.6rem 1.25rem', background: '#0f62fe', color: '#fff',
          border: 'none', borderRadius: '4px', fontSize: '0.875rem',
          fontWeight: 600, cursor: 'pointer',
        }}>
          {showForm ? '✕ Cancel' : '+ New Complaint'}
        </button>
      </div>

      {/* ── New Complaint Form ── */}
      {showForm && (
        <div style={{
          background: '#fff', border: '1px solid #0f62fe', borderRadius: '6px',
          padding: '1.25rem', marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#0f62fe' }}>
            Submit New Complaint
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Customer ID</label>
              <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #8d8d8d', borderRadius: '4px', fontSize: '0.875rem' }}>
                {['CUST-001','CUST-002','CUST-003','CUST-004','CUST-005','CUST-006','CUST-007',
                  'CUST-008','CUST-009','CUST-010','CUST-019','CUST-025'].map(id => (
                  <option key={id} value={id}>{id}{['CUST-004','CUST-007','CUST-010'].includes(id) ? ' ⚠ vulnerable' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Channel</label>
              <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #8d8d8d', borderRadius: '4px', fontSize: '0.875rem' }}>
                {['branch','call_centre','mobile','email','social_media'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Complaint Text <span style={{ color: '#6f6f6f', fontWeight: 400 }}>(min 10 characters)</span>
            </label>
            <textarea
              value={form.complaint_text}
              onChange={e => setForm(f => ({ ...f, complaint_text: e.target.value }))}
              rows={4}
              placeholder="Type the complaint here..."
              style={{ width: '100%', padding: '8px', border: '1px solid #8d8d8d', borderRadius: '4px', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>
          {/* Quick-fill demo buttons */}
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#6f6f6f', marginRight: '0.5rem' }}>Quick-fill:</span>
            {[
              { label: 'Duplicate charge', cid: 'CUST-001', ch: 'mobile', text: 'I was charged twice for Netflix on 3rd January — £12.99 twice on the same day. Please refund one of them.' },
              { label: 'Unauthorised txn', cid: 'CUST-005', ch: 'email', text: 'Someone made a £350 unauthorised transaction on my account on 5th January. I did not authorise this payment.' },
              { label: 'Vulnerable (bereavement)', cid: 'CUST-004', ch: 'branch', text: 'My husband passed away last month. I am elderly and devastated. I have called three times and nobody will help me close his account.' },
              { label: 'Data privacy', cid: 'CUST-025', ch: 'email', text: 'My personal data was shared without my consent. I want to know what data you hold and who you shared it with.' },
              { label: 'Legal threat', cid: 'CUST-019', ch: 'mobile', text: 'I will be contacting my solicitor and taking legal action if this mortgage dispute is not resolved by end of this week.' },
            ].map(q => (
              <button key={q.label} onClick={() => setForm({ customer_id: q.cid, channel: q.ch, complaint_text: q.text })}
                style={{ marginRight: '0.5rem', marginBottom: '0.4rem', padding: '3px 10px', background: '#e0e0e0',
                  border: 'none', borderRadius: '12px', fontSize: '0.75rem', cursor: 'pointer' }}>
                {q.label}
              </button>
            ))}
          </div>
          <button onClick={submitComplaint} disabled={submitting || form.complaint_text.trim().length < 10}
            style={{
              padding: '0.65rem 1.5rem', background: submitting ? '#8d8d8d' : '#24a148',
              color: '#fff', border: 'none', borderRadius: '4px',
              fontSize: '0.875rem', fontWeight: 600,
              cursor: submitting || form.complaint_text.trim().length < 10 ? 'not-allowed' : 'pointer',
            }}>
            {submitting ? 'Submitting…' : 'Submit Complaint'}
          </button>
        </div>
      )}


      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <FilterSelect label="Priority" field="priority" value={filters.priority}
          options={['', 'P1', 'P2', 'P3']} onChange={(v) => setFilters(f => ({ ...f, priority: v }))} />
        <FilterSelect label="Status" field="status" value={filters.status}
          options={['', 'intake', 'triaging', 'hitl_review', 'dispatched', 'escalated']}
          onChange={(v) => setFilters(f => ({ ...f, status: v }))} />
        <FilterSelect label="Channel" field="channel" value={filters.channel}
          options={['', 'branch', 'call_centre', 'mobile', 'email', 'social_media']}
          onChange={(v) => setFilters(f => ({ ...f, channel: v }))} />
        <FilterSelect label="Vulnerable" field="vulnerability" value={filters.vulnerability}
          options={['', 'true']} onChange={(v) => setFilters(f => ({ ...f, vulnerability: v }))} />
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
            {['ID', 'Customer', 'Description', 'Channel', 'Intent', 'Priority', 'Status', 'Vulnerable', 'Created', 'Actions'].map(h => (
              <th key={h} style={{ padding: '0.75rem', borderBottom: '2px solid #e0e0e0', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr key={c.complaint_id} style={{ borderBottom: '1px solid #e0e0e0' }}>
              <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {c.complaint_id.slice(0, 8)}...
              </td>
              <td style={{ padding: '0.75rem' }}>{c.full_name || c.customer_id}</td>
              <td style={{ padding: '0.75rem', maxWidth: '280px', fontSize: '0.8rem', color: '#393939' }}
                title={c.complaint_text}>
                {c.complaint_text?.length > 90 ? c.complaint_text.slice(0, 90) + '…' : c.complaint_text}
              </td>
              <td style={{ padding: '0.75rem' }}>{c.channel}</td>
              <td style={{ padding: '0.75rem' }}>{c.intent_type || '—'}</td>
              <td style={{ padding: '0.75rem' }}>
                <PriorityBadge priority={c.priority} />
              </td>
              <td style={{ padding: '0.75rem' }}>
                <span style={{ background: STATUS_COLORS[c.status] || '#6f6f6f', color: '#fff',
                  padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                  {c.status}
                </span>
              </td>
              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                {c.vulnerability_flag && (
                  <span style={{ color: '#da1e28', fontWeight: 700, fontSize: '1rem' }}>⚠</span>
                )}
              </td>
              <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#6f6f6f' }}>
                {new Date(c.created_at).toLocaleDateString()}
              </td>
              <td style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(c.status === 'intake' || running.has(c.complaint_id)) && (
                    <button onClick={() => runPipeline(c.complaint_id)}
                      disabled={running.has(c.complaint_id)}
                      style={{ padding: '4px 10px', background: running.has(c.complaint_id) ? '#8d8d8d' : '#0f62fe',
                        color: '#fff', border: 'none', borderRadius: '4px',
                        cursor: running.has(c.complaint_id) ? 'not-allowed' : 'pointer', fontSize: '0.75rem' }}>
                      {running.has(c.complaint_id) ? '⏳ Running…' : 'Run Pipeline'}
                    </button>
                  )}
                  {c.status === 'hitl_review' && (
                    <a href={`/review/${c.complaint_id}`}
                      style={{ padding: '4px 10px', background: '#f1c21b', color: '#161616', borderRadius: '4px',
                        fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>
                      Review →
                    </a>
                  )}
                  <a href={`/monitor?id=${c.complaint_id}`}
                    style={{ padding: '4px 10px', background: '#e0e0e0', color: '#161616', borderRadius: '4px',
                      fontSize: '0.75rem', textDecoration: 'none' }}>
                    Trace
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = { P1: '#da1e28', P2: '#f1c21b', P3: '#24a148' };
  return (
    <span style={{ background: colors[priority] || '#6f6f6f', color: priority === 'P2' ? '#161616' : '#fff',
      padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
      {priority || '—'}
    </span>
  );
}

function FilterSelect({ label, field, value, options, onChange }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem' }}>
        {options.map((o: string) => <option key={o} value={o}>{o || 'All'}</option>)}
      </select>
    </div>
  );
}
