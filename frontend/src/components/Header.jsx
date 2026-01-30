import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header 
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
      }}
    >
      
      {/* Logo + Title */}
      <div className="flex items-center gap-2">
        <div 
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: 'var(--accent-cyan)' }}
        />
        <h1 className="text-lg font-semibold" style={{ color: 'var(--card-foreground)' }}>
          Crisis Intelligence Dashboard
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>
        <Link to="/">Home</Link>
        <Link to="/map" className="font-medium" style={{ color: 'var(--primary)' }}>Map</Link>
        <Link to="/feed">Feed</Link>
        <Link to="/analytics">Analytics</Link>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          to="/register/ngo"
          className="px-3 py-1.5 text-sm rounded-lg border"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--card-foreground)',
          }}
        >
          Register as NGO
        </Link>
        <Link
          to="/register/government"
          className="px-3 py-1.5 text-sm rounded-lg"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          Government / Donor
        </Link>
      </div>
    </header>
  );
}
