'use client';

export default function NavBar() {
  return (
    <nav style={{
      background: '#161616',
      borderBottom: '1px solid #393939',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      height: '48px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>
      <a href="/dashboard" style={{
        color: '#fff',
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: 700,
        paddingRight: '2rem',
        borderRight: '1px solid #393939',
        marginRight: '1.5rem',
        whiteSpace: 'nowrap',
      }}>
        Clearview Complaints
      </a>

      <NavLink href="/dashboard" label="Dashboard" />
      <NavLink href="/complaints" label="Complaints" />
      <NavLink href="/monitor" label="Agent Monitor" />

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{
          background: '#0f62fe', color: '#fff',
          fontSize: '0.6875rem', fontWeight: 600,
          padding: '2px 8px', borderRadius: '12px',
        }}>LIVE</span>
        <span style={{ color: '#8d8d8d', fontSize: '0.75rem' }}>Capstone v1.0</span>
      </div>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} style={{
      color: '#c6c6c6',
      textDecoration: 'none',
      fontSize: '0.875rem',
      padding: '0 1rem',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
    }}>
      {label}
    </a>
  );
}
