import DisasterCard from './DisasterCard';

export default function DisasterFeed({disasters = []}) {
    return (
        <div
            className="
        rounded-2xl border border-[var(--border)]
        bg-[var(--background)]
        h-[calc(100vh-160px)]
        overflow-y-auto
        p-3
        space-y-4
      "
        >
            {/* FEED HEADER */}
            <div className="sticky top-0 bg-[var(--background)] pb-2 z-10">
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                    Active Crises
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                    {disasters.length} live simulated disaster
                    {disasters.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* EMPTY STATE */}
            {disasters.length === 0 && (
                <div className="mt-10 text-center text-sm text-[var(--muted-foreground)]">
                    No active disasters yet.
                    <br />
                    Generate a crisis to begin simulation.
                </div>
            )}

            {/* DISASTER CARDS */}
            {disasters.map((issue) => (
                <DisasterCard
                    key={issue._id || issue.createdAt}
                    issue={issue}
                />
            ))}
        </div>
    );
}
