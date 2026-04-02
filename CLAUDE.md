# Traseo - Cluj-Napoca Transit Tracker

## Project Overview
Personal transit management app for CTP Cluj-Napoca public transport. Helps optimize commute time and costs using real-time vehicle tracking and route planning.

## Tech Stack
- **Framework**: React 19 + Vite 5
- **State**: Redux Toolkit (separate slices per entity)
- **Routing**: React Router DOM v7
- **Map**: Leaflet + react-leaflet v5
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Styling**: CSS (custom design system - "Spatial Glass" dark theme, teal/cyan accent)
- **Deploy**: Vercel (frontend only)

## API - Tranzy OpenData
- **Base URL**: `https://api.tranzy.ai/v1/opendata`
- **Auth**: `X-API-KEY` header (stored in `.env` as `VITE_TRANZY_API_KEY`)
- **Agency**: CTP Cluj = Agency ID `2` (header `X-Agency-Id: 2`)
- **Client**: Centralized in `src/utils/api.js`
- **Docs**: See `tranzy_opendata_api_docs.txt` in project root

### Endpoints
| Endpoint | Type | Slice | Data |
|----------|------|-------|------|
| `/agency` | Static | — | Transit agencies list |
| `/routes` | Static | `routesSlice` | 167 routes (bus, tram, trolleybus) |
| `/trips` | Static | `tripsSlice` | Trip directions + headsigns |
| `/stops` | Static | `stopsSlice` | 911 stops with GPS coords |
| `/stop_times` | Static | `stopTimesSlice` | Stop sequence per trip (NO timetables) |
| `/shapes` | Static | `shapesSlice` | Route polyline GPS points (114K points) |
| `/vehicles` | Real-time | `vehiclesSlice` | Live vehicle positions (~420 vehicles) |

### Key Limitations
- **No scheduled timetables** - stop_times only has stop order, not arrival/departure times
- **No fare data** - cost tracking must be manual/user-entered
- **No ETA predictions** - calculated client-side from vehicle GPS + stop positions
- **Rate limiting** applies on all endpoints

## Important Route
- **Route 10** (Trolleybus): `route_id: 119`, Gheorgheni <-> CUG
  - Direction 0: Disp. Unirii -> Disp. ERS CUG (19 stops)
  - Direction 1: ERS CUG Nord -> Disp. Unirii (13 stops)

## Project Structure
```
src/
├── App.jsx              # Router + AnimatePresence
├── main.jsx             # Entry point
├── index.css            # CSS imports
├── styles/
│   ├── variables.css    # Design tokens (teal/cyan palette)
│   ├── reset.css        # Modern CSS reset
│   ├── glass.css        # Glass panels, badges, buttons
│   └── animations.css   # Keyframes, utilities
├── components/
│   ├── layout/
│   │   └── Sidebar.jsx  # Desktop sidebar + mobile bottom nav
│   ├── Home.jsx         # Dashboard with bento grid
│   ├── Map.jsx          # Full-bleed map with vehicle markers
│   ├── Vehicles.jsx     # Vehicle list with route detail panel
│   ├── Routes.jsx       # Routes with stops timeline + partial favorites
│   ├── Favorites.jsx    # Saved routes & partial routes
│   └── *.css            # Component styles
├── hooks/
│   ├── useFavorites.js  # localStorage favorites CRUD
│   └── useMapTheme.js   # Map tile theme switcher (dark/light/streets)
├── utils/
│   ├── api.js           # Centralized API client
│   └── helpers.js       # Vehicle types, formatters, haversine
├── store/
│   ├── index.js         # Redux store config
│   └── slices/          # vehiclesSlice, routesSlice, stopsSlice, tripsSlice, shapesSlice, stopTimesSlice
└── assets/
```

## Conventions
- Language: Romanian for UI text, English for code/comments
- Components: Functional components with hooks
- State: Redux Toolkit with createAsyncThunk for API calls
- CSS: Component-scoped `.css` files, design system via CSS custom properties
- Environment variables: Prefixed with `VITE_` for Vite exposure
- Colors: Teal/cyan palette (NO purple - purple looks "AI-generated")
  - Accent: #0EA5E9 -> #06B6D4 -> #06D6A0
  - Bus: #3B82F6, Tram: #10B981, Trolleybus: #F59E0B
- Map: Default theme is "streets" (Voyager tiles with labels), switchable to dark/light
- Favorites: localStorage with key `traseo_favorites`, supports route + partial_route types

## Security
- API key in `.env` (never committed, listed in `.gitignore`)
- `.env.example` provided as template
- For production: consider Vercel serverless functions as API proxy

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

## Design System - "Spatial Glass"
- Dark-first theme with aurora gradients (teal/cyan, NOT purple)
- Glassmorphic panels (`backdrop-filter: blur`) over dark background
- Bento grid layout for dashboard
- Framer Motion for page transitions and micro-interactions
- Typography: Inter (headings/body) + JetBrains Mono (data/numbers)
- Map: 3 tile themes (streets/dark/light), vehicle markers show route numbers
- Vehicle markers: Colored circles with route number, pulse animation for active
