# Weather Website (Glassmorphism) 🌤️

Professional, responsive weather website built with **HTML**, **CSS**, and **JavaScript**.

## ✨ Features
- ✅ **Glassmorphism UI** with beautiful gradients and smooth animations
- ✅ **Search by city name** (e.g., London, Tokyo, New York)
- ✅ **Current location weather** using geolocation API
- ✅ **5-day weather forecast** with daily summaries
- ✅ **Loading animation** while fetching data
- ✅ **Friendly error messages** for invalid cities
- ✅ **Recent search history** saved in localStorage
- ✅ **Dark mode toggle** with persistent theme
- ✅ **Fully responsive** for desktop, tablet, and mobile
- ✅ **Hover effects** and smooth transitions
- ✅ **Professional footer** "Created by Ansh Bhatnagar"

## 📁 Files
```
.
├── index.html      (HTML structure)
├── style.css       (Glassmorphism styling)
├── script.js       (Logic & API integration)
└── README.md       (This file)
```

## 🚀 Quick Start

### 1️⃣ Get OpenWeatherMap API Key
1. Visit [https://openweathermap.org/api](https://openweathermap.org/api)
2. Sign up (free tier includes 60 calls/min)
3. Go to your API keys section and copy your key

### 2️⃣ Add API Key to script.js
Open `script.js` and replace this line:
```javascript
const API_KEY = 'YOUR_API_KEY_HERE';
```
with:
```javascript
const API_KEY = 'your_actual_api_key_here';
```

### 3️⃣ Open in Browser
**Option A — Direct Open:**
- Double-click `index.html` in your file explorer, then open with your browser

**Option B — Serve with Python (Recommended):**
```bash
# Windows PowerShell
python -m http.server 8000

# Linux/Mac
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

**Option C — Use VS Code Live Server:**
- Install "Live Server" extension in VS Code
- Right-click `index.html` → "Open with Live Server"

## 🎨 Features in Detail

### Search Weather
- Type any city name and press Enter or click "Search"
- Displays current temperature (°C), condition, humidity, wind speed, and feels-like temp
- Shows 5-day forecast below

### Current Location
- Click the 📍 icon to get weather for your current location
- Browser will ask for permission to access your location

### Dark Mode
- Click the 🌓 icon to toggle between light and dark themes
- Theme preference is saved in localStorage

### Recent Searches
- Recently searched cities appear as clickable chips
- Max 6 recent searches are stored and persist across browser sessions

## 🔐 Security Note (Production)

**⚠️ DO NOT commit your API key to public repositories!**

For production deployment:
1. Create a backend endpoint (Node.js, Python, etc.)
2. Store API key on your server
3. Call the backend endpoint from your frontend instead

Example proxy setup:
```javascript
// Instead of direct API call:
// const url = `https://api.openweathermap.org/data/2.5/weather?...&appid=${API_KEY}`;

// Use your backend:
// const url = '/api/weather?city=London';
```

## 📦 Technology Stack
- **HTML5** — Semantic markup with accessibility features (aria-labels, aria-live)
- **CSS3** — Glassmorphism, gradients, flexbox, grid, media queries, animations
- **JavaScript (Vanilla)** — No frameworks, pure ES6+ (fetch API, async/await, localStorage)
- **OpenWeatherMap API** — Real-time weather data

## 📱 Responsive Breakpoints
- **Desktop** (> 900px) — Full 5-column forecast grid
- **Tablet** (601px - 900px) — 3-column forecast grid
- **Mobile** (≤ 600px) — 2-column forecast grid, stacked layout

## 🎯 Bonus Features Included
✅ Dark mode toggle  
✅ Geolocation support  
✅ Recent search history  
✅ 5-day forecast  
✅ Loading overlay  
✅ Error handling  
✅ Keyboard support (Enter to search)  
✅ Accessibility (ARIA labels, semantic HTML)

## 🛠️ Optional Enhancements
- Add °C/°F unit toggle
- Show hourly forecast charts
- Add service worker for offline caching
- Add weather alerts/warnings
- Implement geosearch (autocomplete)
- Add multiple language support

## 📄 License
Created by **Ansh Bhatnagar** - Feel free to use and modify!

## 🎓 Learning Resources
- [OpenWeatherMap API Docs](https://openweathermap.org/api)
- [MDN Web Docs — Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [CSS Glassmorphism Design](https://www.glassmorphism.com/)

---

**Enjoy! 🌈 If you need help, check your browser console (F12) for any error messages.**
