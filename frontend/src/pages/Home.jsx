import KPISection from "@/components/KPISection";
import MapSection from "@/components/MapSection";
import Timeline from "@/components/Timeline";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <KPISection />
      <MapSection />
      <Timeline />
    </div>
  );
}
