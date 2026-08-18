import L from "leaflet";
import "leaflet/dist/leaflet.css";

const layers = {
  Map: null,
  Temperature: "temp",
  Rain: "precipitation",
  Clouds: "clouds",
  Wind: "wind"
};

export function mountWeatherMap(element, { latitude, longitude, layer }) {
  const map = L.map(element, { zoomControl: false, attributionControl: false }).setView([latitude, longitude], 9);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  const weatherLayer = layers[layer];
  if (weatherLayer && apiKey) L.tileLayer(`https://tile.openweathermap.org/map/${weatherLayer}_new/{z}/{x}/{y}.png?appid=${apiKey}`, { opacity: .72, maxZoom: 19 }).addTo(map);
  L.circleMarker([latitude, longitude], { radius: 8, color: "#ffffff", weight: 3, fillColor: "#fc715d", fillOpacity: 1 }).addTo(map);
  return () => map.remove();
}
