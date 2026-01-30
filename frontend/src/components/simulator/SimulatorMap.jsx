import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

/* -------------------------------
   Fix Leaflet default icon issue
-------------------------------- */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* -------------------------------
   Severity → Radar Color
-------------------------------- */
const getRadarColor = (severity = 0) => {
    const percent = Math.round(severity * 100);

    if (percent >= 80) return 'var(--accent-red)';
    if (percent >= 60) return 'var(--accent-orange)';
    if (percent >= 40) return 'var(--accent-yellow)';
    return 'var(--accent-green)';
};

export default function SimulatorMap({disasters = []}) {
    // Default India center
    const indiaCenter = [22.5937, 78.9629];

    return (
        <div
            className="
        h-[calc(100vh-160px)]
        rounded-2xl
        border border-[var(--border)]
        overflow-hidden
        bg-[var(--card)]
      "
        >
            <MapContainer
                center={indiaCenter}
                zoom={4.8}
                scrollWheelZoom={false}
                style={{height: '100%', width: '100%'}}
            >
                {/* Neutral, professional tiles */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution="© OpenStreetMap © CARTO"
                />

                {/* Radar Markers */}
                {disasters.map((issue) => {
                    // Extract coordinates from the API response structure
                    // Format: issue.coordinates.coordinates = [lon, lat] (GeoJSON Point format)
                    let lat, lon;

                    // Primary: check GeoJSON coordinates array
                    if (
                        issue?.coordinates?.coordinates &&
                        Array.isArray(issue.coordinates.coordinates)
                    ) {
                        const coords = issue.coordinates.coordinates;
                        lon = coords[0];
                        lat = coords[1];
                    }
                    // Fallback: check aiAnalysis location
                    else if (issue?.aiAnalysis?.location?.coordinates) {
                        const coords = issue.aiAnalysis.location.coordinates;
                        lat = coords.lat;
                        lon = coords.lon;
                    }

                    // Skip if no valid coordinates
                    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
                        console.warn(
                            'Invalid coordinates for issue:',
                            issue._id
                        );
                        return null;
                    }

                    const severity = issue?.aiAnalysis?.severity?.overall ?? 0;
                    const color = getRadarColor(severity);

                    const radarIcon = L.divIcon({
                        className: '',
                        html: `
              <div
                class="radar-marker"
                style="
                  background-color: ${color};
                  color: ${color};
                "
              ></div>
            `,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                    });

                    return (
                        <Marker
                            key={issue._id || issue.createdAt}
                            position={[lat, lon]}
                            icon={radarIcon}
                        >
                            <Popup>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold">
                                        {issue.title}
                                    </p>
                                    <p className="text-xs text-[var(--muted-foreground)]">
                                        {issue.aiAnalysis.location.name || "Not Available"}
                                    </p>
                                    <p className="text-xs">
                                        Type: {issue.type || 'Unknown'}
                                    </p>
                                    <p className="text-xs">
                                        Severity: {Math.round(severity * 100)}%
                                    </p>
                                    <p className="text-xs text-[var(--muted-foreground)]">
                                        Status: {issue.status}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
