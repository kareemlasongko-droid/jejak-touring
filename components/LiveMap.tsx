"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";

type Props = {
  latitude: number | null;
  longitude: number | null;
  destinationLat: number;
  destinationLng: number;
  nickname: string;
};

export default function LiveMap({ latitude, longitude, destinationLat, destinationLng, nickname }: Props) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const carMarker = useRef<Marker | null>(null);
  const routeLine = useRef<Polyline | null>(null);
  const fitted = useRef(false);

  useEffect(() => {
    let disposed = false;
    async function initialize() {
      const L = await import("leaflet");
      if (disposed || !element.current || map.current) return;
      const instance = L.map(element.current, { zoomControl: false }).setView([destinationLat, destinationLng], 13);
      L.control.zoom({ position: "bottomright" }).addTo(instance);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(instance);
      L.marker([destinationLat, destinationLng], {
        icon: L.divIcon({ className: "map-pin-wrap", html: '<div class="map-pin destination-pin"><span></span></div>', iconSize: [38, 48], iconAnchor: [19, 44] }),
      }).addTo(instance).bindTooltip("Tujuan");
      map.current = instance;
      window.setTimeout(() => instance.invalidateSize(), 100);
    }
    initialize();
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
      fitted.current = false;
    };
  }, []);

  useEffect(() => {
    if (latitude === null || longitude === null) return;
    const lat = latitude;
    const lng = longitude;
    async function updatePosition() {
      const L = await import("leaflet");
      if (!map.current) return;
      if (!carMarker.current) {
        carMarker.current = L.marker([lat, lng], {
          icon: L.divIcon({ className: "map-pin-wrap", html: '<div class="car-pin"><span></span></div>', iconSize: [42, 42], iconAnchor: [21, 21] }),
        }).addTo(map.current).bindTooltip(nickname);
      } else {
        carMarker.current.setLatLng([lat, lng]);
      }
      if (!routeLine.current) {
        routeLine.current = L.polyline([[lat, lng], [destinationLat, destinationLng]], {
          color: "#f7c948", weight: 3, opacity: 0.65, dashArray: "8 10",
        }).addTo(map.current);
      } else {
        routeLine.current.setLatLngs([[lat, lng], [destinationLat, destinationLng]]);
      }
      if (!fitted.current) {
        map.current.fitBounds([[lat, lng], [destinationLat, destinationLng]], { padding: [55, 55], maxZoom: 15 });
        fitted.current = true;
      } else {
        map.current.panTo([lat, lng], { animate: true, duration: 0.7 });
      }
    }
    updatePosition();
  }, [latitude, longitude, destinationLat, destinationLng, nickname]);

  return <div ref={element} className="map-canvas" aria-label={`Peta posisi ${nickname} dan tujuan perjalanan`} />;
}
