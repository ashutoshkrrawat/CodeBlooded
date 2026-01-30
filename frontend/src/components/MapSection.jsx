import IndiaMap from "./IndiaMap";
import PriorityPanel from "./PriorityPanel";
import RegisterPanel from "./RegisterPanel";
import AISignals from "./AISignals";

export default function MapSection() {
  return (
    <section className="px-6 mt-6 grid grid-cols-[1.3fr_0.9fr] gap-6">
      
      {/* MAP */}
      <div className="relative animate-[fadeUp_0.6s_ease-out]">
        <IndiaMap />
      </div>

      {/* RIGHT DECISION PANEL */}
      <div className="space-y-6">
        <PriorityPanel />
        <AISignals />
        <RegisterPanel />
      </div>

    </section>
  );
}
