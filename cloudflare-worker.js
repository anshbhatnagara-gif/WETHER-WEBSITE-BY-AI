/**
 * CloudFlare Workers Script - Weather API Proxy
 * 
 * Deploy this to CloudFlare Workers:
 * 1. Go to https://dash.cloudflare.com
 * 2. Create new Worker
 * 3. Paste this code
 * 4. Save and Deploy
 * 5. Copy Worker URL
 * 6. Update frontend to call this URL instead of direct API
 */

// Option 1: Open-Meteo (Free, No Key)
export default {
  async fetch(request) {
    // Enable CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Route: /weather?city=London
    if (path === '/weather') {
      const city = url.searchParams.get('city');
      if (!city) {
        return jsonResponse({ error: 'City parameter required' }, 400);
      }

      try {
        // Geocode city name
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          return jsonResponse({ error: 'City not found' }, 404);
        }

        const location = geoData.results[0];
        const { latitude, longitude, name, country } = location;

        // Get current weather
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();
        const current = weatherData.current;

        // Format response like OpenWeatherMap
        const response = {
          name,
          sys: { country },
          main: {
            temp: current.temperature_2m,
            feels_like: current.apparent_temperature,
            humidity: current.relative_humidity_2m,
          },
          weather: [
            {
              description: getWeatherDescription(current.weather_code),
              icon: getWeatherIcon(current.weather_code),
            },
          ],
          wind: { speed: current.wind_speed_10m },
          coord: { lat: latitude, lon: longitude },
        };

        return jsonResponse(response);
      } catch (error) {
        return jsonResponse({ error: error.message }, 500);
      }
    }

    // Route: /forecast?lat=35.6762&lon=139.6503
    if (path === '/forecast') {
      const lat = url.searchParams.get('lat');
      const lon = url.searchParams.get('lon');

      if (!lat || !lon) {
        return jsonResponse(
          { error: 'Latitude and longitude parameters required' },
          400
        );
      }

      try {
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max&timezone=auto`;
        const forecastRes = await fetch(forecastUrl);
        const forecastData = await forecastRes.json();

        return jsonResponse(forecastData);
      } catch (error) {
        return jsonResponse({ error: error.message }, 500);
      }
    }

    return jsonResponse({ error: 'Route not found' }, 404);
  },
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

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
    99: 'Thunderstorm with heavy hail',
  };
  return descriptions[code] || 'Unknown';
}
