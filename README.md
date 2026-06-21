# SkyCast — Weather Website

A clean, fast, responsive weather website. Search any city or use your current
location to see current conditions, the next 24 hours, and a 7-day forecast.

**No API key required** — it uses the free [Open-Meteo](https://open-meteo.com/) APIs.

## Features

- City search with geocoding
- "Use my location" via the browser Geolocation API
- Current weather: temperature, feels-like, humidity, wind, precipitation, UV index
- Next 24 hours (scrollable) and 7-day forecast
- °C / °F toggle (remembered across visits)
- Last searched city remembered across visits
- Pure HTML/CSS/JS — no build step, no dependencies

## Run locally

It's a static site, so just open `index.html` in a browser, or serve it:

```bash
# Python
python3 -m http.server 3000
# then open http://localhost:3000

# or Node
npx http-server -p 3000
```

## How it works

- Geocoding: `https://geocoding-api.open-meteo.com/v1/search`
- Forecast:  `https://api.open-meteo.com/v1/forecast`

Weather conditions are mapped from WMO weather codes to icons/labels in `app.js`.

## Files

- `index.html` — markup
- `style.css` — styling (responsive, glassmorphism gradient theme)
- `app.js` — fetching + rendering logic
