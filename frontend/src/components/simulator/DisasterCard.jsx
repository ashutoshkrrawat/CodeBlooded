import SeverityRing from "./SeverityRing";

export default function DisasterCard({ issue }) {
  if (!issue) return null;

  const {
    title,
    date,
    status,
    aiAnalysis,
  } = issue;

  const severityValue = aiAnalysis?.severity?.overall ?? 0;
  const urgencyLevel = aiAnalysis?.urgency?.level ?? "unknown";
  const priorityLevel = aiAnalysis?.priority?.level ?? "N/A";
  const explanation = aiAnalysis?.explanation?.content ?? "";

  return (
    <div
      className="
        rounded-xl border border-[var(--border)]
        bg-[var(--card)]
        p-4 space-y-4
      "
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[var(--foreground)] leading-snug">
            {title}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)]">
            {aiAnalysis.location.name} • {new Date(date).toLocaleString()}
          </p>
        </div>

        <SeverityRing value={severityValue} />
      </div>

      {/* STATUS ROW */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className="
            px-2 py-1 rounded-full
            bg-[var(--secondary)]
            text-[var(--foreground)]
          "
        >
          {status}
        </span>

        <span
          className={`
            px-2 py-1 rounded-full font-medium
            ${
              priorityLevel === "CRITICAL"
                ? "bg-[var(--accent-red-light)] text-[var(--accent-red-foreground)]"
                : "bg-[var(--accent-yellow-light)] text-[var(--accent-yellow-foreground)]"
            }
          `}
        >
          {priorityLevel}
        </span>

        <span className="text-[var(--muted-foreground)]">
          Urgency: {urgencyLevel}
        </span>
      </div>

      {/* AI EXPLANATION */}
      <div className="text-sm text-[var(--foreground)] leading-relaxed">
        {explanation}
      </div>
    </div>
  );
}
