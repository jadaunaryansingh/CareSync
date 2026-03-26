import { useEffect, useId, useRef, useState } from 'react';
import { loadMapMyIndiaSdk } from '../mapmyindia';

export default function LiveMap({ title, markers = [], height = 360 }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerRefs = useRef([]);
  const rawId = useId();
  const mapId = `mapmyindia-${rawId.replace(/[:]/g, '')}`;
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const key = import.meta.env.VITE_MAPMYINDIA_API_KEY;
        const mappls = await loadMapMyIndiaSdk(key);
        if (cancelled || !containerRef.current) return;

        if (!mapRef.current) {
          // MapMyIndia expects a valid container id string.
          mapRef.current = new mappls.Map(mapId, {
            center: [28.6139, 77.2090],
            zoom: 11,
          });
        }

        markerRefs.current.forEach((m) => m?.remove?.());
        markerRefs.current = [];

        const valid = markers.filter((m) => Number.isFinite(m.latitude) && Number.isFinite(m.longitude));
        valid.forEach((m) => {
          const marker = new mappls.Marker({ map: mapRef.current, position: { lat: m.latitude, lng: m.longitude }, title: m.title });
          markerRefs.current.push(marker);
        });

        if (valid.length > 0) {
          const bounds = valid.map((m) => ({ lat: m.latitude, lng: m.longitude }));
          mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 14 });
        }
      } catch (e) {
        setError(e.message || 'Unable to load map');
      }
    }

    // Delay one frame to ensure container is fully in DOM before SDK init.
    const rafId = window.requestAnimationFrame(() => {
      init();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [markers, mapId]);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div
          id={mapId}
          ref={containerRef}
          style={{ width: '100%', height, borderRadius: 10, overflow: 'hidden' }}
        />
      )}
    </div>
  );
}
