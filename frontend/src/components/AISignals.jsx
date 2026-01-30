export default function AISignals() {
  return (
    <div 
      className="border rounded-2xl p-4"
      style={{
        backgroundColor: 'var(--accent-cyan-light)',
        borderColor: 'var(--accent-cyan-lighter)',
      }}
    >
      <h3 className="font-semibold mb-2" style={{ color: 'var(--accent-cyan-foreground)' }}>
        AI Signals Detected
      </h3>

      <ul className="text-sm space-y-1" style={{ color: 'var(--accent-cyan-foreground)' }}>
        <li>• Sudden spike in flood-related keywords</li>
        <li>• Rising dengue mentions on social media</li>
        <li>• Food supply disruption indicators detected</li>
      </ul>

      <p className="text-xs mt-3" style={{ color: 'var(--accent-cyan-foreground)' }}>
        Updated 2 minutes ago
      </p>
    </div>
  );
}
