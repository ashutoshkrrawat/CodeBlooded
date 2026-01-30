import { Link } from "react-router-dom";

export default function RegisterPanel() {
  return (
    <div className="space-y-3">
      
      <Link
        to="/register/ngo"
        className="flex items-center gap-3 p-4 rounded-xl border transition"
        style={{
          backgroundColor: 'var(--accent-blue-light)',
          borderColor: 'var(--accent-blue-lighter)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--accent-blue-lighter)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--accent-blue-light)';
        }}
      >
        <span 
          className="w-10 h-10 rounded-full text-white flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-blue)' }}
        >
          🤝
        </span>
        <span className="font-medium" style={{ color: 'var(--card-foreground)' }}>
          Register as NGO
        </span>
      </Link>

      <Link
        to="/register/government"
        className="flex items-center gap-3 p-4 rounded-xl border transition"
        style={{
          backgroundColor: 'var(--accent-indigo-light)',
          borderColor: 'var(--accent-indigo-lighter)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--accent-indigo-lighter)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--accent-indigo-light)';
        }}
      >
        <span 
          className="w-10 h-10 rounded-full text-white flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-indigo)' }}
        >
          🏛️
        </span>
        <span className="font-medium" style={{ color: 'var(--card-foreground)' }}>
          Register as Government
        </span>
      </Link>

      <Link
        to="/register/donor"
        className="flex items-center gap-3 p-4 rounded-xl border transition"
        style={{
          backgroundColor: 'var(--accent-green-light)',
          borderColor: 'var(--accent-green-lighter)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--accent-green-lighter)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--accent-green-light)';
        }}
      >
        <span 
          className="w-10 h-10 rounded-full text-white flex items-center justify-center"
          style={{ backgroundColor: 'var(--accent-green)' }}
        >
          💰
        </span>
        <span className="font-medium" style={{ color: 'var(--card-foreground)' }}>
          Register as Donor
        </span>
      </Link>

    </div>
  );
}
