'use client';
/**
 * app/dashboard/page.tsx — Live KPI Dashboard + Charts
 * Clearview Retail Bank — Monitoring Workbench
 */
import { useEffect, useState, useCallback } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface KPIs {
  active_cases: number;
  in_flight: number;
  p1_breach_risk: number;
  avg_redress_payout: string;
  stp_rate: string;
}

interface ChartData {
  by_intent: { intent_type: string; count: string }[];
  by_status: { status: string; count: string }[];
  by_channel: { channel: string; count: string }[];
  redress_by_intent: { intent_type: string; avg_redress: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  intake: '#6f6f6f', triaging: '#0f62fe', evidence_gathering: '#0043ce',
  policy_review: '#6929c4', drafting: '#9f1853', hitl_review: '#f1c21b',
  dispatched: '#24a148', closed: '#24a148', escalated: '#da1e28',
};

const CHART_PALETTE = ['#0f62fe','#6929c4','#005d5d','#0043ce','#9f1853','#1192e8','#198038','#da1e28'];

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchAll = useCallback(async () => {
    try {
      const [kpiRes, chartRes] = await Promise.all([
        fetch(`${API}/dashboard/kpis`),
        fetch(`${API}/dashboard/charts`),
      ]);
      setKpis(await kpiRes.json());
      setCharts(await chartRes.json());
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Dashboard fetch failed', e);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return (
    <main style={{ padding: '2rem', fontFamily: 'IBM Plex Sans, sans-serif', maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#161616' }}>
          Clearview Complaints — Live Dashboard
        </h1>
        <span style={{ fontSize: '0.75rem', color: '#6f6f6f' }}>
          Last updated: {lastUpdated} · Auto-refreshes every 15s
        </span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <KpiCard label="Active Cases" value={kpis?.active_cases ?? '—'} color="#0f62fe" />
        <KpiCard label="In-Flight Pipeline" value={kpis?.in_flight ?? '—'} color="#0043ce" />
        <KpiCard label="P1 Breach Risk" value={kpis?.p1_breach_risk ?? '—'} color={kpis?.p1_breach_risk ? '#da1e28' : '#24a148'} />
        <KpiCard label="Avg Redress Payout" value={kpis ? `£${kpis.avg_redress_payout}` : '—'} color="#6929c4" />
        <KpiCard label="STP Rate" value={kpis?.stp_rate ?? '—'} color="#005d5d" />
      </div>

      {/* Charts row */}
      {charts && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Complaints by Intent */}
            <ChartCard title="Complaints by Intent">
              <BarChart
                data={charts.by_intent.map(r => ({ label: r.intent_type.replace(/_/g, ' '), value: parseInt(r.count) }))}
                color="#0f62fe"
              />
            </ChartCard>

            {/* Complaints by Status */}
            <ChartCard title="Complaints by Status">
              <DonutChart
                data={charts.by_status.map((r, i) => ({
                  label: r.status,
                  value: parseInt(r.count),
                  color: STATUS_COLORS[r.status] || CHART_PALETTE[i % CHART_PALETTE.length],
                }))}
              />
            </ChartCard>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Avg Redress by Intent */}
            <ChartCard title="Avg Redress Payout by Intent (Upheld)">
              <BarChart
                data={charts.redress_by_intent.map(r => ({
                  label: r.intent_type.replace(/_/g, ' '),
                  value: Math.round(parseFloat(r.avg_redress)),
                }))}
                color="#6929c4"
                prefix="£"
              />
            </ChartCard>

            {/* Complaints by Channel */}
            <ChartCard title="Complaints by Channel">
              <BarChart
                data={charts.by_channel.map(r => ({ label: r.channel.replace(/_/g, ' '), value: parseInt(r.count) }))}
                color="#005d5d"
              />
            </ChartCard>
          </div>
        </>
      )}

      {/* Quick links */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <NavButton href="/complaints" label="View All Complaints →" />
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px',
      padding: '1.25rem', borderTop: `4px solid ${color}`
    }}>
      <p style={{ fontSize: '0.75rem', color: '#6f6f6f', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: '#161616', margin: 0 }}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', background: '#fff', padding: '1.25rem' }}>
      <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#161616', marginBottom: '1rem',
        textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h2>
      {children}
    </div>
  );
}

function BarChart({ data, color, prefix = '' }: { data: { label: string; value: number }[]; color: string; prefix?: string }) {
  if (!data.length) return <p style={{ color: '#6f6f6f', fontSize: '0.875rem' }}>No data</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
          <span style={{ width: '130px', flexShrink: 0, color: '#393939', textAlign: 'right',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            title={item.label}>{item.label}</span>
          <div style={{ flex: 1, background: '#f4f4f4', borderRadius: '2px', height: '18px', overflow: 'hidden' }}>
            <div style={{
              width: `${(item.value / max) * 100}%`, height: '100%',
              background: color, borderRadius: '2px',
              transition: 'width 0.4s ease'
            }} />
          </div>
          <span style={{ width: '48px', flexShrink: 0, color: '#161616', fontWeight: 600 }}>
            {prefix}{item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  if (!data.length) return <p style={{ color: '#6f6f6f', fontSize: '0.875rem' }}>No data</p>;
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 140;
  const r = 52;
  const cx = size / 2;
  const cy = size / 2;

  // Build SVG arc segments
  let angle = -90;
  const segments = data.map((item) => {
    const sweep = (item.value / total) * 360;
    const startAngle = angle;
    angle += sweep;
    return { ...item, startAngle, sweep };
  });

  const polarToXY = (deg: number, radius: number) => ({
    x: cx + radius * Math.cos((deg * Math.PI) / 180),
    y: cy + radius * Math.sin((deg * Math.PI) / 180),
  });

  const arcPath = (startDeg: number, sweepDeg: number, outerR: number, innerR: number) => {
    if (sweepDeg >= 360) sweepDeg = 359.99;
    const s = polarToXY(startDeg, outerR);
    const e = polarToXY(startDeg + sweepDeg, outerR);
    const si = polarToXY(startDeg + sweepDeg, innerR);
    const ei = polarToXY(startDeg, innerR);
    const large = sweepDeg > 180 ? 1 : 0;
    return `M${s.x},${s.y} A${outerR},${outerR} 0 ${large},1 ${e.x},${e.y} L${si.x},${si.y} A${innerR},${innerR} 0 ${large},0 ${ei.x},${ei.y} Z`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {segments.map((seg, i) => (
          <path key={i} d={arcPath(seg.startAngle, seg.sweep, r, 30)} fill={seg.color} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="700" fill="#161616">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#6f6f6f">total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
            <span style={{ color: '#393939' }}>{item.label}</span>
            <span style={{ fontWeight: 600, color: '#161616', marginLeft: 'auto', paddingLeft: '8px' }}>
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} style={{
      display: 'inline-block', padding: '0.75rem 1.5rem', background: '#0f62fe',
      color: '#fff', borderRadius: '4px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600
    }}>
      {label}
    </a>
  );
}
