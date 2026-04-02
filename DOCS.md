# Traseo - Documentație Completă

## Cuprins
1. [Despre Proiect](#despre-proiect)
2. [Arhitectură](#arhitectură)
3. [Instalare și Setup](#instalare-și-setup)
4. [Structura Proiectului](#structura-proiectului)
5. [API Tranzy OpenData](#api-tranzy-opendata)
6. [Funcționalități](#funcționalități)
7. [Design System](#design-system)
8. [Deployment](#deployment)
9. [Securitate](#securitate)

---

## Despre Proiect

**Traseo** este o aplicație web personală de management al transportului public din Cluj-Napoca. Aplicația utilizează API-ul Tranzy OpenData pentru a oferi:

- Tracking real-time al vehiculelor pe hartă
- Sistem de favorite pentru rute și stații
- Estimări timp de sosire (ETA) calculate client-side
- Tracking costuri bilete individuale
- Vizualizare rute cu trasee pe hartă
- Găsire stații apropiate cu geolocație

### Stack Tehnologic

| Tehnologie | Versiune | Rol |
|-----------|----------|-----|
| React | 19.1.0 | Framework UI |
| Vite | 5.4.10 | Build tool + dev server |
| Redux Toolkit | 2.8.2 | State management |
| React Router | 7.x | Client-side routing |
| Leaflet | 1.9.4 | Bibliotecă hărți |
| react-leaflet | 5.0.0 | Wrapper React pentru Leaflet |
| Framer Motion | - | Animații și tranziții |
| Lucide React | - | Iconuri |

---

## Arhitectură

### Flux de Date

```
Tranzy API (GTFS)
       │
       ▼
  Redux Store (thunks)
       │
       ├── vehicles (real-time, refresh 10s)
       ├── routes (static, cached)
       ├── trips (static, cached)
       ├── stops (static, cached)
       ├── stopTimes (static, cached)
       └── shapes (static, cached)
       │
       ▼
  React Components
       │
       ├── Map (Leaflet full-bleed)
       ├── Dashboard (bento grid)
       ├── Favorites (localStorage)
       ├── Route Detail (shapes + stops)
       └── Cost Tracker (localStorage)
```

### Model de Date

```
Agency (1) ──→ (N) Routes
Route  (1) ──→ (N) Trips
Trip   (1) ──→ (1) Shape (polyline GPS)
Trip   (1) ──→ (N) StopTimes (secvență stații)
Stop   (1) ──→ (N) StopTimes
Vehicle     ──→ Trip (trip_id)
Vehicle     ──→ Route (route_id)
```

### Persistență Locală (localStorage)

| Key | Conținut |
|-----|----------|
| `traseo_favorites` | Array de favorite: route (rută completă) sau partial_route (interval stații) |
| `traseo_map_theme` | Tema hartă: 'streets', 'dark', sau 'light' |

---

## Instalare și Setup

### Prerequisite
- Node.js >= 18
- npm >= 9

### Setup Local

```bash
# Clonare repository
git clone <repo-url>
cd traseo

# Instalare dependențe
npm install

# Creare fișier environment
cp .env.example .env
# Editează .env și adaugă API key-ul Tranzy
```

### Variabile de Mediu

| Variabilă | Descriere | Obligatoriu |
|-----------|-----------|-------------|
| `VITE_TRANZY_API_KEY` | API key pentru Tranzy OpenData | DA |

### Comenzi

```bash
npm run dev      # Pornește server dezvoltare (http://localhost:5173)
npm run build    # Build producție în /dist
npm run preview  # Preview build producție
npm run lint     # Verificare ESLint
```

---

## Structura Proiectului

```
traseo/
├── public/                  # Assets statice
├── src/
│   ├── main.jsx            # Entry point React
│   ├── App.jsx             # Router principal
│   ├── App.css             # Stiluri globale app
│   ├── index.css           # Reset CSS + variabile design
│   │
│   ├── styles/
│   │   ├── variables.css   # Design tokens (teal/cyan palette)
│   │   ├── reset.css       # Modern CSS reset
│   │   ├── glass.css       # Glass panels, badges, buttons
│   │   └── animations.css  # Keyframes, utilities
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.jsx # Desktop sidebar + mobile bottom nav
│   │   ├── Home.jsx        # Dashboard bento grid
│   │   ├── Map.jsx         # Hartă interactivă full-bleed
│   │   ├── Vehicles.jsx    # Lista vehicule cu detalii rută
│   │   ├── Routes.jsx      # Rute cu timeline stații + rute parțiale
│   │   ├── Favorites.jsx   # Pagină favorite
│   │   └── *.css           # Stiluri per componentă
│   │
│   ├── hooks/
│   │   ├── useFavorites.js # localStorage favorites CRUD
│   │   └── useMapTheme.js  # Map tile theme switcher
│   │
│   ├── utils/
│   │   ├── api.js          # Client API centralizat
│   │   └── helpers.js      # Vehicle types, formatters, haversine
│   │
│   ├── store/
│   │   ├── index.js        # Store configuration
│   │   └── slices/         # vehiclesSlice, routesSlice, stopsSlice, tripsSlice, shapesSlice, stopTimesSlice
│   │
│   └── assets/
│
├── .env                    # Variabile mediu (NU se commitează)
├── .gitignore
├── index.html              # HTML entry point
├── vite.config.js          # Configurare Vite
├── eslint.config.js        # Configurare ESLint
├── package.json
├── CLAUDE.md               # Context proiect pentru Claude
├── DOCS.md                 # Această documentație
├── PLAN.md                 # Plan implementare
└── tranzy_opendata_api_docs.txt  # Documentație API Tranzy
```

---

## API Tranzy OpenData

### Configurare

- **Base URL**: `https://api.tranzy.ai/v1/opendata`
- **Autentificare**: Header `X-API-KEY: <api_key>`
- **Filtrare agenție**: Header `X-Agency-Id: 2` (CTP Cluj)
- **Format**: JSON
- **Versiune**: v1.0-BETA

### Endpoints Disponibile

#### Date Statice

| Endpoint | Descriere | # Înregistrări |
|----------|-----------|----------------|
| `GET /routes` | Lista tuturor rutelor | 167 |
| `GET /trips` | Călătorii pe fiecare rută | 315 |
| `GET /stops` | Toate stațiile cu coordonate | 911 |
| `GET /stop_times` | Secvența stațiilor per trip | 4,082 |
| `GET /shapes` | Puncte GPS trasee | 114,510 |
| `GET /agency` | Lista agențiilor | 5 |

#### Date Real-Time

| Endpoint | Descriere | Refresh |
|----------|-----------|---------|
| `GET /vehicles` | Poziții vehicule live | ~30s |

### Tipuri Vehicule (GTFS)

| Cod | Tip |
|-----|-----|
| 0 | Tramvai |
| 3 | Autobuz |
| 11 | Troleibuz |

### Limitări Importante

1. **Fără orare programate** - `stop_times` conține doar secvența stațiilor, NU ore de sosire/plecare
2. **Fără date tarifare** - costurile trebuie gestionate manual
3. **Fără predicții ETA server-side** - ETA se calculează client-side din poziția GPS a vehiculului față de stație
4. **Rate limiting** - se aplică pe toate endpoint-urile

### Ruta 10 (Frecventă)

- **route_id**: 119
- **Tip**: Troleibuz (type: 11)
- **Traseu**: Gheorgheni ↔ CUG
- **Direcția 0** (19 stații): Disp. Unirii → Snagov Nord → Borsec Nord → Bistritei → Septimiu Albini Nord → P-ta Cipariu Nord → P-ta Avram Iancu → Regionala CFR → Ploiesti → **Paris** → Rasaritului → Halta Marasti → Bobalnei Est → Terapia Est → TERAPIA Sud → SINTEROM Sud → SIETA → TERMOROM Sud → Disp. ERS CUG
- **Direcția 1** (13 stații): ERS CUG Nord → TERMOROM Nord → SINTEROM Nord → TERAPIA Nord → Terapia Vest → Bobalnei Vest → Fabricii → Maresal C-tin Prezan → Dorobantilor → Campus Universitar Vest → Iulius Mall Vest → Valeriu Bologa → Disp. Unirii

---

## Funcționalități

### Implementate (v2 - Redesign Complet)

#### Dashboard (Home)
- **Bento grid layout** cu statistici live (vehicule, active, rute, troleibuze)
- **Widget Ruta 10** cu vehicule active și link rapid la hartă
- **Fleet breakdown** cu bar charts animate pe tip vehicul
- **Quick nav cards** cu icoane gradient și date live
- **Salut personalizat** bazat pe ora zilei

#### Hartă Interactivă
- **3 teme de hartă**: Streets (Voyager cu străzi), Dark (CartoDB), Light
- **Markere vehicule cu număr rută** (nu emoji generic)
- **Filtre tip vehicul** (bus/tram/troleibuz)
- **Click vehicul**: afișează traseul complet (shape polyline) + direcția
- **Popup-uri glassmorphic** cu detalii vehicul
- **Auto-close popup** la click pe hartă/zoom/drag
- **Auto-refresh** la 10 secunde
- **React.memo** pe markere pentru performanță

#### Vehicule
- **Sortare inteligentă**: active primul (crescător după număr), apoi inactive
- **Click pe vehicul**: deschide panoul de detalii rută cu TOATE vehiculele de pe acea rută
- **Detalii relevante**: direcție (headsign), viteză, timp de la ultima actualizare
- **Search + filtre** per tip vehicul

#### Rute
- **Click pe rută**: deschide panou detaliat cu:
  - Vehicule active cu direcție și viteză
  - Timeline stații pe fiecare direcție
  - Stații terminale evidențiate
- **Selectare rute parțiale**: click pe 2 stații pentru a marca un interval
- **Salvare rute parțiale la favorite** (ex: de la stația 3 la stația 6)
- **Buton favorite** pe fiecare rută

#### Favorite
- **Pagină dedicată** cu toate favoritele
- **Rute complete** salvate cu date live (vehicule active)
- **Rute parțiale** - interval de stații specificat
- **Vehicule live** per favorit (primele 3 cu direcție și viteză)
- **Persistență localStorage** (key: `traseo_favorites`)

#### Design & UX
- **Paletă teal/cyan** (fără mov "AI-generated")
- **Aurora background** animat cu CSS @property
- **Glassmorphic panels** cu backdrop-filter
- **Framer Motion** pe toate paginile (AnimatePresence, stagger, layout)
- **Sidebar vertical** pe desktop, bottom tab bar pe mobile
- **Responsive** complet pe toate breakpoints

### Planificate (v3)

- **ETA Calculator** - estimare timp sosire din GPS vehicul + distanță stație
- **Cost Tracker** - jurnal cheltuieli bilete cu statistici lunare
- **My Commute** - salvare traseu frecvent (ex: Aleea Muscel → Strada Paris)
- **Notificări vehicul** - alertă când vehiculul se apropie de stație
- **PWA** - Add to Home Screen, cache offline

---

## Design System - "Spatial Glass"

### Concept
Dark-first glassmorphic UI cu aurora gradients teal/cyan. Bento grid layout, panouri translucide, markere vehicule cu numere de rută.

### Paletă de Culori

```css
:root {
  /* Backgrounds */
  --bg-primary: #0A0E1A;
  --bg-surface: rgba(255, 255, 255, 0.04);
  --bg-glass: rgba(15, 20, 40, 0.75);

  /* Accents - Teal/Cyan Gradient (NU mov!) */
  --accent-start: #0EA5E9;
  --accent-mid: #06B6D4;
  --accent-end: #06D6A0;

  /* Vehicle Types */
  --color-bus: #3B82F6;          /* Albastru */
  --color-tram: #10B981;         /* Verde */
  --color-trolleybus: #F59E0B;   /* Portocaliu/Amber */

  /* Semantic */
  --color-success: #00E5A0;
  --color-warning: #FFB347;
  --color-danger: #FF6B6B;

  /* Text */
  --text-primary: #F0F0F5;
  --text-secondary: #8892B0;
  --text-muted: #4A5568;
}
```

### Tipografie

```css
/* Headings & Body */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Data, numere, ETA, countdown */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### Efecte Glass

```css
.glass-panel {
  background: var(--bg-glass);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--border-glass);
  border-radius: 16px;
}
```

### Breakpoints

```css
/* Mobile first */
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
```

---

## Deployment

### Vercel

Aplicația este configurată pentru deploy pe Vercel:

1. Conectează repository-ul GitHub la Vercel
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Adaugă variabilele de mediu în Vercel Dashboard:
   - `VITE_TRANZY_API_KEY` = API key-ul Tranzy

### Build de Producție

```bash
npm run build    # Generează /dist
npm run preview  # Testare locală build
```

---

## Securitate

### API Key Protection

- API key-ul este stocat în `.env` (exclus din git prin `.gitignore`)
- În development, Vite expune variabilele `VITE_*` prin `import.meta.env`
- **Atenție**: Pe Vercel, variabilele `VITE_*` sunt incluse în bundle-ul client-side
- **Recomandare producție**: Creează un Vercel Serverless Function ca proxy API:
  ```
  /api/tranzy/[...path].js → proxy către api.tranzy.ai cu key-ul din env server-side
  ```

### Date Locale

- Favoritele și setările sunt stocate în `localStorage` (date non-sensibile)
- Nu se stochează date personale sau de autentificare utilizator

### Best Practices

- Nu comite niciodată `.env` în repository
- Folosește `.env.example` ca template (fără valori reale)
- Rotește API key-ul periodic prin Tranzy Dashboard
