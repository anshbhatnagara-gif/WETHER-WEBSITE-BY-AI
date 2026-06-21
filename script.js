/* script.js - Premium Weather App Logic */

/* ========== DOM SELECTORS ========== */
const el = {
  searchInput: document.getElementById('searchInput'),
  searchBtn: document.getElementById('searchBtn'),
  errorMsg: document.getElementById('errorMsg'),
  loading: document.getElementById('loading'),
  weatherCard: document.getElementById('weatherCard'),
  city: document.getElementById('city'),
  condition: document.getElementById('condition'),
  icon: document.getElementById('icon'),
  temp: document.getElementById('temp'),
  feels: document.getElementById('feels'),
  humidity: document.getElementById('humidity'),
  wind: document.getElementById('wind'),
  windUnit: document.getElementById('windUnit'),
  forecast: document.getElementById('forecast'),
  locationBtn: document.getElementById('locationBtn'),
  themeToggle: document.getElementById('themeToggle'),
  recentWrap: document.getElementById('recentWrap'),
  recentList: document.getElementById('recentList'),
  
  // Advanced Metric Selectors
  unitToggle: document.getElementById('unitToggle'),
  unitOptC: document.getElementById('unitOptC'),
  unitOptF: document.getElementById('unitOptF'),
  autocompleteDropdown: document.getElementById('autocompleteDropdown'),
  uvIndex: document.getElementById('uvIndex'),
  pressure: document.getElementById('pressure'),
  visibility: document.getElementById('visibility'),
  
  // SVG Chart Selectors
  hourlyChart: document.getElementById('hourlyChart'),
  chartArea: document.getElementById('chartArea'),
  chartLine: document.getElementById('chartLine'),
  chartPoints: document.getElementById('chartPoints'),
  chartGridLines: document.getElementById('chartGridLines'),
  chartLabels: document.getElementById('chartLabels')
};

/* ========== STATE & STORAGE ========== */
const STORAGE_KEYS = {
  RECENT: 'weather_recent_searches_v1',
  THEME: 'weather_theme_v1'
};
const MAX_RECENT = 6;

let currentUnit = 'C';
let currentWeatherData = null;
let currentForecastData = null;
let currentHourlyData = null;
let debounceTimer = null;

/* ========== UI HELPERS ========== */
function showLoading() { el.loading.classList.remove('hidden'); el.loading.setAttribute('aria-hidden','false'); }
function hideLoading() { el.loading.classList.add('hidden'); el.loading.setAttribute('aria-hidden','true'); }
function showError(msg) {
  el.errorMsg.textContent = msg;
  el.errorMsg.classList.remove('hidden');
}
function clearError() {
  el.errorMsg.textContent = '';
  el.errorMsg.classList.add('hidden');
}

/* Temperature conversion helper */
function convertTemp(cTemp) {
  if (currentUnit === 'F') {
    return Math.round((cTemp * 9/5) + 32);
  }
  return Math.round(cTemp);
}

/* Recent searches */
function saveRecent(city) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT);
    let arr = raw ? JSON.parse(raw) : [];
    arr = arr.filter(x => x.toLowerCase() !== city.toLowerCase());
    arr.unshift(city);
    if (arr.length > MAX_RECENT) arr = arr.slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(arr));
    renderRecent();
  } catch (e) { /* ignore */ }
}

function renderRecent() {
  const raw = localStorage.getItem(STORAGE_KEYS.RECENT);
  const arr = raw ? JSON.parse(raw) : [];
  if (!arr || arr.length === 0) { el.recentWrap.classList.add('hidden'); return; }
  el.recentList.innerHTML = '';
  arr.forEach(city => {
    const chip = document.createElement('button');
    chip.className = 'recent-chip';
    chip.textContent = city;
    chip.onclick = () => fetchByCity(city);
    el.recentList.appendChild(chip);
  });
  el.recentWrap.classList.remove('hidden');
}

/* ========== THEME HANDLERS ========== */
function applyWeatherTheme(code, isDay) {
  // Remove all existing themes
  document.body.classList.remove('theme-sunny', 'theme-rainy', 'theme-snowy', 'theme-cloudy', 'theme-stormy', 'theme-night');
  
  if (isDay === 0) {
    document.body.classList.add('theme-night');
    return;
  }
  
  if (code === 0 || code === 1) {
    document.body.classList.add('theme-sunny');
  } else if (code === 2 || code === 3 || code === 45 || code === 48) {
    document.body.classList.add('theme-cloudy');
  } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
    document.body.classList.add('theme-rainy');
  } else if ([71, 73, 75, 77, 85, 86].includes(code)) {
    document.body.classList.add('theme-snowy');
  } else if ([95, 96, 99].includes(code)) {
    document.body.classList.add('theme-stormy');
  } else {
    document.body.classList.add('theme-sunny');
  }
}

/* ========== RENDER DATA ========== */
function renderCurrent(data) {
  el.city.textContent = `${data.name}, ${data.sys?.country || ''}`;
  el.condition.textContent = capitalize(data.weather?.[0]?.description) || '—';
  el.icon.src = `https://openweathermap.org/img/wn/${data.weather?.[0]?.icon}@4x.png`;
  el.icon.alt = data.weather?.[0]?.description || 'weather icon';
  
  // Set temperatures
  el.temp.textContent = `${convertTemp(data.temp)}°${currentUnit}`;
  el.feels.textContent = `Feels like: ${convertTemp(data.feels_like)}°${currentUnit}`;
  
  // Set standard stats
  el.humidity.textContent = data.humidity;
  
  // Wind Speed Conversion (km/h vs mph)
  if (currentUnit === 'F') {
    const speedMph = Math.round(data.wind_speed * 0.621371);
    el.wind.textContent = speedMph;
    el.windUnit.textContent = 'mph';
  } else {
    el.wind.textContent = Math.round(data.wind_speed);
    el.windUnit.textContent = 'km/h';
  }
  
  // Set advanced metrics
  el.uvIndex.textContent = data.uv_index;
  el.pressure.textContent = data.pressure;
  el.visibility.textContent = data.visibility ? (data.visibility / 1000).toFixed(1) : '—';
  
  el.weatherCard.classList.remove('hidden');
}

function renderForecast(forecastList) {
  el.forecast.innerHTML = '';
  forecastList.forEach(item => {
    const div = document.createElement('div');
    div.className = 'forecast-item';
    div.innerHTML = `
      <div class="date">${item.dateStr}</div>
      <img src="${item.icon}" alt="${item.desc || 'icon'}" />
      <div class="f-temp">${convertTemp(item.temp)}°${currentUnit}</div>
    `;
    el.forecast.appendChild(div);
  });
}

function renderHourlyChart(points) {
  if (!points || points.length === 0) return;
  
  const width = 500;
  const height = 80;
  
  // Get converted temp values to find bounds
  const convertedTemps = points.map(p => convertTemp(p.temp));
  const minTemp = Math.min(...convertedTemps);
  const maxTemp = Math.max(...convertedTemps);
  const tempRange = maxTemp - minTemp === 0 ? 1 : maxTemp - minTemp;
  
  // Generate coordinate array
  const svgPoints = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const tempVal = convertTemp(p.temp);
    // Map temp from [minTemp, maxTemp] to [height - 10, 10]
    const y = (height - 10) - ((tempVal - minTemp) / tempRange) * (height - 20);
    return { x, y, temp: tempVal, time: p.time };
  });
  
  // Draw line path
  let linePath = `M ${svgPoints[0].x} ${svgPoints[0].y}`;
  for (let i = 1; i < svgPoints.length; i++) {
    linePath += ` L ${svgPoints[i].x} ${svgPoints[i].y}`;
  }
  el.chartLine.setAttribute('d', linePath);
  
  // Draw filled area path below the line
  const areaPath = linePath + ` L ${svgPoints[svgPoints.length - 1].x} 100 L ${svgPoints[0].x} 100 Z`;
  el.chartArea.setAttribute('d', areaPath);
  
  // Render circles for data points
  let pointsHtml = '';
  svgPoints.forEach(pt => {
    pointsHtml += `<circle cx="${pt.x}" cy="${pt.y}" r="4.5" fill="var(--text)" stroke="var(--accent)" stroke-width="2.5" />`;
  });
  el.chartPoints.innerHTML = pointsHtml;
  
  // Render dotted vertical grid lines
  let gridHtml = '';
  svgPoints.forEach(pt => {
    gridHtml += `<line x1="${pt.x}" y1="0" x2="${pt.x}" y2="100" stroke="var(--glass-border)" stroke-width="1" stroke-dasharray="2,2" />`;
  });
  el.chartGridLines.innerHTML = gridHtml;
  
  // Render labels text list below the chart
  let labelsHtml = '';
  svgPoints.forEach(pt => {
    const dateObj = new Date(pt.time);
    const hourStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
    labelsHtml += `
      <div class="chart-label-item">
        <span class="chart-label-time">${hourStr}</span>
        <span class="chart-label-temp">${pt.temp}°</span>
      </div>
    `;
  });
  el.chartLabels.innerHTML = labelsHtml;
}

/* ========== DATA & API CALLS ========== */
async function fetchByCity(city) {
  clearError();
  showLoading();
  el.autocompleteDropdown.classList.add('hidden');
  try {
    // Geocode city name to get coordinates
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('City not found. Try another name.');
    }
    
    const location = geoData.results[0];
    const { latitude, longitude, name, country } = location;
    
    await fetchAllWeatherData(latitude, longitude, name, country);
  } catch (err) {
    el.weatherCard.classList.add('hidden');
    showError(err.message || 'Unable to fetch weather.');
  } finally { hideLoading(); }
}

async function fetchWeatherByCoords(lat, lon) {
  try {
    // Reverse geocode to get city name (BigDataCloud free client-side API)
    let cityName = 'Current Location';
    let countryCode = '';
    try {
      const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        cityName = geoData.city || geoData.locality || geoData.principalSubdivision || 'Current Location';
        countryCode = geoData.countryCode || '';
      }
    } catch (e) {
      console.warn('Reverse geocoding failed, falling back to default name:', e);
    }
    
    await fetchAllWeatherData(lat, lon, cityName, countryCode);
  } catch (err) {
    showError('Failed to fetch location weather.');
  }
}

async function fetchAllWeatherData(lat, lon, cityName, country) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure,visibility&daily=weather_code,temperature_2m_max,uv_index_max&hourly=temperature_2m&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();
  
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;
  
  // Update dynamic weather background theme
  applyWeatherTheme(current.weather_code, current.is_day);
  
  // Format current weather metrics
  currentWeatherData = {
    name: cityName,
    sys: { country: country },
    temp: current.temperature_2m,
    feels_like: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    wind_speed: current.wind_speed_10m,
    pressure: current.surface_pressure,
    visibility: current.visibility,
    uv_index: daily.uv_index_max?.[0] ?? '—',
    weather: [{ 
      description: getWeatherDescription(current.weather_code),
      icon: getWeatherIcon(current.weather_code)
    }]
  };
  
  // Format 5-day forecast
  currentForecastData = daily.time.slice(0, 5).map((dateStr, idx) => ({
    dateStr: new Date(dateStr).toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'}),
    temp: daily.temperature_2m_max[idx],
    icon: `https://openweathermap.org/img/wn/${getWeatherIcon(daily.weather_code[idx])}@2x.png`,
    desc: getWeatherDescription(daily.weather_code[idx])
  }));
  
  // Format 24-hour hourly temperatures (filter matching from current hour onwards)
  const now = new Date();
  let startIndex = 0;
  const hourlyTimes = hourly.time;
  const currentIsoStr = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  const matchedIdx = hourlyTimes.findIndex(t => t.startsWith(currentIsoStr));
  if (matchedIdx !== -1) {
    startIndex = matchedIdx;
  }
  
  currentHourlyData = [];
  for (let i = 0; i < 24; i += 3) { // Show points every 3 hours (8 total points)
    const idx = startIndex + i;
    if (idx < hourlyTimes.length) {
      currentHourlyData.push({
        time: hourlyTimes[idx],
        temp: hourly.temperature_2m[idx]
      });
    }
  }
  
  // Render updates to UI
  renderCurrent(currentWeatherData);
  renderForecast(currentForecastData);
  renderHourlyChart(currentHourlyData);
  saveRecent(currentWeatherData.name);
}

/* WMO Weather Code Translators */
function getWeatherIcon(code) {
  if (code === 0) return '01d';
  if (code === 1 || code === 2) return '02d';
  if (code === 3) return '04d';
  if (code === 45 || code === 48) return '50d';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '09d';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '13d';
  return '01d';
}

function getWeatherDescription(code) {
  const descriptions = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return descriptions[code] || 'Unknown';
}

/* ========== AUTOCOMPLETE GEOSEARCH ========== */
async function fetchAutocomplete(query) {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(geoUrl);
    if (!res.ok) return;
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      el.autocompleteDropdown.classList.add('hidden');
      return;
    }
    renderAutocomplete(data.results);
  } catch (e) {
    console.error('Autocomplete fetch failed:', e);
  }
}

function renderAutocomplete(results) {
  el.autocompleteDropdown.innerHTML = '';
  results.forEach(item => {
    const div = document.createElement('div');
    div.className = 'autocomplete-item';
    div.innerHTML = `
      <span>${item.name}</span>
      <span class="autocomplete-country">${item.admin1 ? item.admin1 + ', ' : ''}${item.country_code?.toUpperCase() || ''}</span>
    `;
    div.onclick = () => {
      el.searchInput.value = item.name;
      el.autocompleteDropdown.classList.add('hidden');
      fetchByCity(item.name);
    };
    el.autocompleteDropdown.appendChild(div);
  });
  el.autocompleteDropdown.classList.remove('hidden');
}

/* ========== GEOLOCATION TRIGGERS ========== */
function fetchByGeolocation() {
  clearError();
  if (!navigator.geolocation) {
    showError('Geolocation not supported by your browser.');
    return;
  }
  showLoading();
  navigator.geolocation.getCurrentPosition(async pos => {
    try {
      const { latitude: lat, longitude: lon } = pos.coords;
      await fetchWeatherByCoords(lat, lon);
    } catch (err) {
      showError(err.message || 'Failed to fetch location weather.');
    } finally { hideLoading(); }
  }, err => {
    hideLoading();
    showError('Permission denied or unable to get location.');
  }, { timeout: 10000 });
}

/* ========== THEME HANDLERS ========== */
function loadTheme() {
  const t = localStorage.getItem(STORAGE_KEYS.THEME);
  if (t === 'dark') document.body.classList.add('dark');
}
function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
}

/* ========== UNIT SYSTEM TOGGLE ========== */
function toggleUnit() {
  currentUnit = currentUnit === 'C' ? 'F' : 'C';
  if (currentUnit === 'F') {
    el.unitToggle.classList.add('fahrenheit');
    el.unitOptC.classList.remove('active');
    el.unitOptF.classList.add('active');
  } else {
    el.unitToggle.classList.remove('fahrenheit');
    el.unitOptC.classList.add('active');
    el.unitOptF.classList.remove('active');
  }
  
  // Re-render UI elements using new unit type
  if (currentWeatherData) renderCurrent(currentWeatherData);
  if (currentForecastData) renderForecast(currentForecastData);
  if (currentHourlyData) renderHourlyChart(currentHourlyData);
}

/* ========== EVENTS & INIT ========== */
el.searchBtn.addEventListener('click', () => {
  const q = el.searchInput.value.trim();
  if (!q) return showError('Please enter a city name.');
  fetchByCity(q);
});

el.searchInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') el.searchBtn.click();
});

// Debounced autocomplete suggestions listener
el.searchInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  const q = el.searchInput.value.trim();
  if (q.length < 2) {
    el.autocompleteDropdown.classList.add('hidden');
    return;
  }
  debounceTimer = setTimeout(() => fetchAutocomplete(q), 300);
});

// Close autocomplete dropdown when clicking outside
document.addEventListener('click', e => {
  if (!el.searchInput.contains(e.target) && !el.autocompleteDropdown.contains(e.target)) {
    el.autocompleteDropdown.classList.add('hidden');
  }
});

el.locationBtn.addEventListener('click', fetchByGeolocation);
el.themeToggle.addEventListener('click', toggleTheme);
el.unitToggle.addEventListener('click', toggleUnit);

function capitalize(s){ return s ? s.replace(/\b\w/g, c => c.toUpperCase()) : s; }

function init() {
  renderRecent();
  loadTheme();
}
init();
