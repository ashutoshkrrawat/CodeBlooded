import KPICard from "./KPICard";
import Stagger from "./Stagger";

export default function KPISection() {
  return (
    <section className="grid grid-cols-4 gap-5 px-6 mt-6">
      <Stagger baseDelay={0.5}>
      <KPICard
        label="NGOs Connected"
        value={347}
        variant="cyan"
      />

      <KPICard
        label="Active Crisis Zones"
        value={67}
        variant="blue"
      />

      <KPICard
        label="Funds Mobilized"
        value={5785220}
        prefix="$"
        variant="green"
      />

      <KPICard
        label="People Potentially Impacted"
        value={1294489}
        variant="indigo"
      />
      </Stagger>
    </section>
  );
}
