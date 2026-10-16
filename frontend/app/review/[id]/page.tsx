'use client';
/**
 * app/review/[id]/page.tsx — HITL Human Review Panel
 * Clearview Retail Bank — Monitoring Workbench
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [redressOverride, setRedressOverride] = useState('');
  const [justification, setJustification] = useState('');
  const [letterEdits, setLetterEdits] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${API}/complaints/${id}`).then(r => r.json()).then(d => {
      setData(d);
      setLetterEdits(d.draft_output?.resolution_letter || '');
      setRedressOverride(d.policy_output?.redress_amount?.toString() || '0');
    });
  }, [id]);

  const submitDecision = async (decision: 'approved' | 're_triage' | 'escalated') => {
    await fetch(`${API}/hitl/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaint_id: id,
        analyst_id: 'ANALYST-001', // In production: from auth session
        decision,
        redress_override: parseFloat(redressOverride) || null,
        redress_justification: justification || null,
        letter_edits: letterEdits !== data?.draft_output?.resolution_letter ? letterEdits : null,
        notes: notes || null,
      }),
    });
    setSubmitted(true);
  };

  if (!data) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (submitted) return (
    <div style={{ padding: '2rem', fontFamily: 'IBM Plex Sans, sans-serif' }}>
      <div style={{ background: '#defbe6', border: '1px solid #24a148', borderRadius: '4px', padding: '1rem' }}>
        ✅ Decision submitted. <a href="/complaints">← Back to complaints</a>
      </div>
    </div>
  );

  const policy = data.policy_output;
  const triage = data.triage_output;
  const complaint = data.complaint;

  return (
    <main style={{ padding: '2rem', fontFamily: 'IBM Plex Sans, sans-serif', maxWidth: '1100px' }}>
      {/* Vulnerability Alert Banner */}
      {triage?.vulnerability_flag && (
        <div style={{ background: '#fff1f1', border: '2px solid #da1e28', borderRadius: '4px',
          padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <strong style={{ color: '#da1e28' }}>VULNERABLE CUSTOMER DETECTED</strong>
          <span style={{ color: '#da1e28', fontSize: '0.875rem' }}>
            — Markers: {Array.isArray(triage.vulnerability_markers) ? triage.vulnerability_markers.join(', ') : String(triage.vulnerability_markers || '')} — HITL mandatory
          </span>
        </div>
      )}

      {/* FCA Deadline Alert */}
      {complaint?.disp_14_deadline && new Date(complaint.disp_14_deadline) < new Date(Date.now() + 48 * 3600 * 1000) && (
        <div style={{ background: '#fff8e1', border: '1px solid #f1c21b', borderRadius: '4px',
          padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
          ⏰ <strong>FCA DISP 1.4 deadline in &lt;48h</strong> — {new Date(complaint.disp_14_deadline).toLocaleString()}
        </div>
      )}

      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        HITL Review — {id?.slice(0, 8)}...
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* AI Recommendation */}
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#0f62fe' }}>
            AI Recommendation
          </h2>
          <InfoRow label="Outcome" value={policy?.outcome} bold />
          <InfoRow label="Confidence" value={policy?.confidence_score ? `${(parseFloat(policy.confidence_score) * 100).toFixed(0)}%` : '—'} />
          <InfoRow label="FCA Rules" value={policy?.fca_rule_refs ? (Array.isArray(policy.fca_rule_refs) ? policy.fca_rule_refs.join(', ') : String(policy.fca_rule_refs)) : '—'} />
          <InfoRow label="Priority" value={triage?.priority} />
          <InfoRow label="Intent" value={triage?.intent_type?.replace(/_/g, ' ')} />
          <InfoRow label="Sentiment" value={triage?.sentiment_score != null ? parseFloat(triage.sentiment_score).toFixed(2) : undefined} />

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f4f4f4', borderRadius: '4px', fontSize: '0.875rem' }}>
            <strong>Reasoning:</strong>
            <p style={{ margin: '0.5rem 0 0', color: '#393939' }}>{policy?.reasoning_summary || '—'}</p>
          </div>
        </div>

        {/* Redress Adjustment */}
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#6929c4' }}>
            Redress Adjustment
          </h2>
          <InfoRow label="AI Calculated" value={`£${policy?.redress_amount || 0}`} bold />
          <InfoRow label="Tier" value={policy?.redress_tier} />

          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Override Amount (£)
            </label>
            <input type="number" value={redressOverride} onChange={e => setRedressOverride(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #8d8d8d', borderRadius: '4px', fontSize: '1rem' }} />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Justification for override
            </label>
            <textarea value={justification} onChange={e => setJustification(e.target.value)}
              rows={3} placeholder="Required if overriding AI amount..."
              style={{ width: '100%', padding: '8px', border: '1px solid #8d8d8d', borderRadius: '4px', fontSize: '0.875rem', resize: 'vertical' }} />
          </div>
        </div>
      </div>

      {/* Letter Editor */}
      <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', padding: '1.25rem', marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#005d5d' }}>
          Inline Letter Editor
        </h2>
        <textarea value={letterEdits} onChange={e => setLetterEdits(e.target.value)}
          rows={14}
          style={{ width: '100%', padding: '12px', border: '1px solid #8d8d8d', borderRadius: '4px',
            fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem', resize: 'vertical' }} />
        <div style={{ marginTop: '0.75rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            style={{ width: '100%', padding: '8px', border: '1px solid #8d8d8d', borderRadius: '4px', fontSize: '0.875rem' }} />
        </div>
      </div>

      {/* Decision Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button onClick={() => submitDecision('approved')}
          style={{ flex: 1, padding: '1rem', background: '#24a148', color: '#fff', border: 'none',
            borderRadius: '4px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
          ✅ Approve & Dispatch
        </button>
        <button onClick={() => submitDecision('re_triage')}
          style={{ flex: 1, padding: '1rem', background: '#f1c21b', color: '#161616', border: 'none',
            borderRadius: '4px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
          🔄 Request Re-triage
        </button>
        <button onClick={() => submitDecision('escalated')}
          style={{ flex: 1, padding: '1rem', background: '#da1e28', color: '#fff', border: 'none',
            borderRadius: '4px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
          🚨 Escalate to Investigations
        </button>
      </div>
    </main>
  );
}

function InfoRow({ label, value, bold }: { label: string; value?: string | null; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0',
      borderBottom: '1px solid #f4f4f4', fontSize: '0.875rem' }}>
      <span style={{ color: '#6f6f6f' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 400, color: '#161616' }}>{value || '—'}</span>
    </div>
  );
}
