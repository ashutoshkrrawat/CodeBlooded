import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

export default function IndiaMap() {
  const [geoData, setGeoData] = useState(null);
  const [selected, setSelected] = useState(null);

  // Load GeoJSON
  useEffect(() => {
    fetch("/geo/india_states.geojson")
      .then((res) => res.json())
      .then((data) => {
        // Add mock crisis data
        data.features.forEach((f) => {
          f.properties.risk = Math.floor(Math.random() * 100);
          f.properties.confidence = Math.floor(80 + Math.random() * 15);
          f.properties.crisis = "Flood";
          f.properties.population =
            (Math.random() * 3 + 0.5).toFixed(2) + "M";
        });
        setGeoData(data);
      });
  }, []);

  // Pastel risk colors (IMPORTANT)
  const getColor = (risk) => {
    if (risk > 80) return "#FCA5A5"; // soft red
    if (risk > 60) return "#FCD34D"; // soft amber
    if (risk > 40) return "#A7F3D0"; // soft green
    return "#DCFCE7"; // very light green
  };

  // Style each state
  const stateStyle = (feature) => ({
    fillColor: getColor(feature.properties.risk),
    weight: 1.2,
    opacity: 1,
    color: "#0891B2", // UN cyan border
    fillOpacity: 0.75,
  });

  // Click interaction
  const onEachState = (feature, layer) => {
    layer.on({
      click: () => {
        setSelected({
          name:
            feature.properties.NAME_1 ||
            feature.properties.state ||
            "Unknown",
          risk: feature.properties.risk,
          confidence: feature.properties.confidence,
          crisis: feature.properties.crisis,
          population: feature.properties.population,
        });
      },
    });
  };

  const getRiskBadgeStyle = (risk) => {
    if (risk > 80) {
      return {
        bg: 'var(--accent-red-lighter)',
        text: 'var(--accent-red-foreground)',
      };
    } else if (risk > 60) {
      return {
        bg: 'var(--accent-yellow-lighter)',
        text: 'var(--accent-yellow-foreground)',
      };
    } else {
      return {
        bg: 'var(--accent-green-lighter)',
        text: 'var(--accent-green-foreground)',
      };
    }
  };

  return (
    <div 
      className="relative rounded-2xl shadow-sm border overflow-hidden w-[900px]"
      style={{
        backgroundColor: 'var(--card)',
        borderColor: 'var(--border)',
        boxShadow: '0 14px 35px -14px oklch(0.2 0.02 260 / 0.22)',
      }}
    >
      {/* MAP */}
      <div className="h-[800px] w-[900px] relative">
        <MapContainer
          center={[22.5937, 78.9629]}
          zoom={4.5}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          {/* SOFT BACKGROUND TILES (KEY DIFFERENCE) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="© OpenStreetMap © CARTO"
          />

          {geoData && (
            <GeoJSON
              data={geoData}
              style={stateStyle}
              onEachFeature={onEachState}
            />
          )}
        </MapContainer>

        {/* SOFT WHITE WASH OVERLAY */}
        <div className="pointer-events-none absolute inset-0 backdrop-blur-[1px]" style={{ backgroundColor: 'oklch(1 0 0 / 0.3)' }} />
      </div>

      {/* FLOATING INFO CARD */}
      {selected && (
        <div 
          className="absolute right-6 top-16 w-[300px] rounded-xl shadow-lg p-4 border"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)',
            boxShadow: '0 14px 35px -14px oklch(0.2 0.02 260 / 0.22)',
          }}
        >
          <h3 className="font-semibold" style={{ color: 'var(--card-foreground)' }}>
            {selected.name}, India
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {selected.crisis} Risk
          </p>

          <div className="flex justify-between items-center mt-3">
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Risk Score</span>
            <span
              className="px-2 py-1 rounded-md text-sm font-medium"
              style={getRiskBadgeStyle(selected.risk)}
            >
              {selected.risk}
            </span>
          </div>

          <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
            Confidence: {selected.confidence}%
          </p>

          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Population Impacted: Est. {selected.population}
          </p>

          <p className="text-sm mt-3" style={{ color: 'var(--muted-foreground)' }}>
            <strong>Top Action:</strong> Deploy response teams within 24 hours
          </p>
        </div>
      )}
    </div>
  );
}
