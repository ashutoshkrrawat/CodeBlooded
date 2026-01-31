import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function SimulatorHeader({ onGenerate, loading }) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim() || loading) return;
    onGenerate(input);
    setInput("");
  };

  return (
    <div className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* LEFT: Title */}
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Live Disaster Simulator
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Simulate a crisis and observe real-time system response
          </p>
        </div>

        {/* RIGHT: Small Input */}
        <div className="flex items-center gap-2 w-full max-w-md">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe a crisis…"
            className="
              flex-1 rounded-md border border-[var(--border)]
              bg-[var(--background)]
              px-3 py-2 text-sm
              text-[var(--foreground)]
              placeholder:text-[var(--muted-foreground)]
              focus:outline-none focus:ring-2 focus:ring-[var(--ring)]
            "
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="
              inline-flex items-center justify-center
              rounded-md px-4 py-2 text-sm font-medium
              bg-[var(--primary)] text-[var(--primary-foreground)]
              hover:opacity-90 disabled:opacity-60
            "
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Generate"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
