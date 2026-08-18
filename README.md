# Chameleon Weather

Chameleon Weather is a modern, modular web application designed for real-time weather monitoring, interactive radar mapping, and air quality index (AQI) analysis. Built with modular Vanilla JavaScript, modern CSS custom properties, and Vite, it delivers an adaptive, visual user experience with dark and light themes and persistent user preferences.

---

## Features

### Weather & Environmental Intelligence
- **Real-Time Weather Metrics**: Displays accurate temperature, feels-like index, humidity, wind conditions, and atmospheric pressure.
- **Air Quality Index (AQI)**: Detailed pollutant evaluation including PM2.5, PM10, NO2, and O3 measurements with color-coded safety indicators.
- **Hourly & Extended Forecasts**: Granular hourly projections alongside a 5-day weather forecast.
- **Interactive Weather Maps**: Embedded spatial map views with toggleable overlay layers powered by Leaflet.js.
- **Solar Schedule**: Sunrise, sunset, and solar position metrics.

### User Experience & Customization
- **Adaptive Theme System**: Seamless toggle between Light and Dark appearance modes with customized contrast palettes.
- **Dynamic Unit Switching**: Instant conversion between Metric (°C) and Imperial (°F) units.
- **Saved Locations**: Ability to bookmark and switch between favorite cities.
- **User Onboarding**: Personalization wizard for configuring preferred location and display styles.

### Reliability & Performance
- **Progressive Data Fetching**: Async API handler with request cancellation via `AbortController` to handle fast search queries gracefully.
- **Resilient Fallback Mode**: Gracefully operates with structured mock data when live API keys are unconfigured.

---

## Technology Stack

- **Core**: JavaScript (ES Next, ES Modules)
- **Styling**: Vanilla CSS (CSS Variables, Grid & Flexbox)
- **Mapping**: Leaflet.js
- **Build System**: Vite
- **Testing**: Vitest with JSDOM

---

## Getting Started

### Prerequisites

Ensure Node.js (v18 or higher) and a package manager (`npm` or `pnpm`) are installed.

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd "Chameleon Weather"
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Add your OpenWeather API key:

```env
VITE_OPENWEATHER_API_KEY=your_api_key_here
```

*Note: If no API key is specified, the application seamlessly operates using fallback demo data.*

### Available Scripts

- **Start Development Server**:
  ```bash
  npm run dev
  ```

- **Run Automated Tests**:
  ```bash
  npm run test
  ```

- **Build for Production**:
  ```bash
  npm run build
  ```

- **Preview Production Build**:
  ```bash
  npm run preview
  ```

---

## Project Architecture

```
src/
├── app/                  # Application entry point and state router
├── features/             # Feature-based module organization
│   ├── authentication/   # Auth modals and landing views
│   ├── onboarding/       # Preference setup wizard
│   ├── profile/          # User profile management
│   └── weather/          # Weather dashboard, components, maps, & API services
├── shared/               # Reusable utility functions and storage helpers
└── styles/               # Global styles, variables, and theme definitions
```

---

## Security & Persistence Notice

User preferences, account details, and saved cities are persisted in the browser's `localStorage` for demonstration purposes. For production deployments, integrate client authentication with a secure backend API and user database.

---

## License

This project is distributed under the MIT License.