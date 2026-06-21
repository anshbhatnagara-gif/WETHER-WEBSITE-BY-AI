/**
 * SkyCast — weather website
 * Uses the free Open-Meteo APIs (no API key required):
 *  - Geocoding:  https://geocoding-api.open-meteo.com/v1/search
 *  - Forecast:   https://api.open-meteo.com/v1/forecast
 */

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const el = (id) => document.getElementById(id);

const state = {
  unit: localStorage.getItem("unit") || "celsius", // "celsius" | "fahrenheit"
  place: null,
};

// WMO weather interpretation codes -> { text, icon }
const WMO = {
  0: { t: "Clear sky", i: "☀️" },
  1: { t: "Mainly clear", i: "🌤️" },
  2: { t: "Partly cloudy", i: "⛅" },
  3: { t: "Overcast", i: "☁️" },
  45: { t: "Fog", i: "🌫️" },
  48: { t: "Rime fog", i: "🌫️" },
  51: { t: "Light drizzle", i: "🌦️" },
  53: { t: "Drizzle", i: "🌦️" },
  55: { t: "Dense drizzle", i: "🌧️" },
  56: { t: "Freezing drizzle", i: "🌧️" },
  57: { t: "Freezing drizzle", i: "🌧️" },
  61: { t: "Light rain", i: "🌦️" },
  63: { t: "Rain", i: "🌧️" },
  65: { t: "Heavy rain", i: "🌧️" },
  66: { t: "Freezing rain", i: "🌧️" },
  67: { t: "Freezing rain", i: "🌧️" },
  71: { t: "Light snow", i: "🌨️" },
  73: { t: "Snow", i: "🌨️" },
  75: { t: "Heavy snow", i: "❄️" },
  77: { t: "Snow grains", i: "🌨️" },
  80: { t: "Rain showers", i: "🌦️" },
  81: { t: "Rain showers", i: "🌧️" },
  82: { t: "Violent showers", i: "⛈️" },
  85: { t: "Snow showers", i: "🌨️" },
  86: { t: "Snow showers", i: "❄️" },
  95: { t: "Thunderstorm", i: "⛈️" },
  96: { t: "Thunderstorm + hail", i: "⛈️" },
  99: { t: "Thunderstorm + hail", i: "⛈️" },
};

const wmo = (code) => WMO[code] || { t: "Unknown", i: "❓" };
const unitSymbol = () => (state.unit === "celsius" ? "°C" : "°F");
const windUnit = () => (state.unit === "celsius" ? "km/h" : "mph");

function setStatus(msg, isError = false) {
  const s = el("status");
  s.textContent = msg;
  s.classList.toggle("error", isError);
  s.classList.toggle("hidden", !msg);
}

function showSections(show) {
  ["current", "hourlySection", "dailySection"].forEach((id) =>
    el(id).classList.toggle("hidden", !show)
  );
}

async function geocode(name) {
  const url = `${GEO_URL}?name=${encodeURIComponent(name)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding request failed");
  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`No place found for "${name}"`);
  }
  const r = data.results[0];
  return {
    name: r.name,
    country: r.country,
    admin1: r.admin1,
    lat: r.latitude,
    lon: r.longitude,
  };
}

async function fetchForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,uv_index",
    hourly: "temperature_2m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "7",
    temperature_unit: state.unit,
    wind_speed_unit: state.unit === "celsius" ? "kmh" : "mph",
  });
  const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Forecast request failed");
  return res.json();
}

function renderCurrent(place, data) {
  const c = data.current;
  const w = wmo(c.weather_code);
  const placeName = [place.name, place.admin1, place.country]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(", ");

  el("curIcon").textContent = w.i;
  el("curTemp").textContent = Math.round(c.temperature_2m);
  el("curUnit").textContent = unitSymbol();
  el("curPlace").textContent = placeName;
  el("curDesc").textContent = w.t;
  el("curFeels").textContent = `Feels like ${Math.round(c.apparent_temperature)}${unitSymbol()}`;
  el("curHumidity").textContent = `${c.relative_humidity_2m}%`;
  el("curWind").textContent = `${Math.round(c.wind_speed_10m)} ${windUnit()}`;
  el("curPrecip").textContent = `${c.precipitation} mm`;
  el("curUv").textContent = c.uv_index != null ? Math.round(c.uv_index) : "—";

  document.title = `${Math.round(c.temperature_2m)}${unitSymbol()} ${place.name} — SkyCast`;
}

function renderHourly(data) {
  const { time, temperature_2m, weather_code } = data.hourly;
  const now = new Date();
  let start = time.findIndex((t) => new Date(t) >= now);
  if (start < 0) start = 0;

  const slots = [];
  for (let i = start; i < Math.min(start + 24, time.length); i++) {
    slots.push(i);
  }

  el("hourly").innerHTML = slots
    .map((i) => {
      const d = new Date(time[i]);
      const hour = d.toLocaleTimeString([], { hour: "numeric" });
      const w = wmo(weather_code[i]);
      return `
        <div class="hour">
          <div class="h-time">${hour}</div>
          <div class="h-icon">${w.i}</div>
          <div class="h-temp">${Math.round(temperature_2m[i])}${unitSymbol()}</div>
        </div>`;
    })
    .join("");
}

function renderDaily(data) {
  const d = data.daily;
  const rows = d.time.map((t, i) => {
    const date = new Date(t);
    const name = i === 0 ? "Today" : date.toLocaleDateString([], { weekday: "short" });
    const w = wmo(d.weather_code[i]);
    const rain = d.precipitation_probability_max?.[i];
    return `
      <div class="day">
        <span class="d-name">${name}</span>
        <span class="d-icon">${w.i}</span>
        <span class="d-rain">💧 ${rain != null ? rain + "%" : "—"}</span>
        <span class="d-temps">
          ${Math.round(d.temperature_2m_max[i])}${unitSymbol()}
          <span class="d-min">${Math.round(d.temperature_2m_min[i])}${unitSymbol()}</span>
        </span>
      </div>`;
  });
  el("daily").innerHTML = rows.join("");
}

async function loadWeather(place) {
  try {
    state.place = place;
    setStatus(`Loading weather for ${place.name}…`);
    const data = await fetchForecast(place.lat, place.lon);
    renderCurrent(place, data);
    renderHourly(data);
    renderDaily(data);
    showSections(true);
    setStatus("");
  } catch (err) {
    showSections(false);
    setStatus(err.message || "Could not load weather", true);
  }
}

async function searchCity(name) {
  const q = name.trim();
  if (!q) return;
  try {
    setStatus(`Searching "${q}"…`);
    const place = await geocode(q);
    localStorage.setItem("lastCity", q);
    await loadWeather(place);
  } catch (err) {
    showSections(false);
    setStatus(err.message || "Search failed", true);
  }
}

function useGeolocation() {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported by this browser.", true);
    return;
  }
  setStatus("Getting your location…");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      await loadWeather({
        name: "My location",
        admin1: "",
        country: "",
        lat: latitude,
        lon: longitude,
      });
    },
    () => setStatus("Location permission denied. Try searching a city.", true),
    { timeout: 10000 }
  );
}

function toggleUnit() {
  state.unit = state.unit === "celsius" ? "fahrenheit" : "celsius";
  localStorage.setItem("unit", state.unit);
  el("unitBtn").textContent = unitSymbol();
  if (state.place) loadWeather(state.place);
}

function init() {
  el("unitBtn").textContent = unitSymbol();

  el("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    searchCity(el("searchInput").value);
  });
  el("geoBtn").addEventListener("click", useGeolocation);
  el("unitBtn").addEventListener("click", toggleUnit);

  const last = localStorage.getItem("lastCity") || "Delhi";
  el("searchInput").value = last;
  searchCity(last);
}

document.addEventListener("DOMContentLoaded", init);
