import { Link } from "react-router-dom";

export default function RegisterPanel() {
  return (
    <div className="space-y-3">
      
      <Link
        to="/signup/ngo"
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
        to="/signup/user"
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
          👤
        </span>
        <span className="font-medium" style={{ color: 'var(--card-foreground)' }}>
          Register as User
        </span>
      </Link>

    </div>
  );
}
