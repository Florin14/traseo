# Traseo - Plan de Implementare

## Viziune

Transformarea Traseo dintr-o aplicație de tracking basic într-o experiență premium de management al transportului public din Cluj-Napoca. Design "Spatial Glass" - dark glassmorphic UI cu paletă teal/cyan, panouri translucide, animații fluide, și funcționalități smart care economisesc timp și bani.

## Status

| Fază | Status | Descriere |
|------|--------|-----------|
| 0 | DONE | Setup dependențe, structură foldere, design tokens |
| 1 | DONE | Design system CSS, layout, sidebar, page transitions |
| 2 | DONE | Hartă optimizată: 3 teme, numere rută pe markere, shapes la click, filtre |
| 3 | DONE | Rute clickable cu stații timeline, vehicule click cu detalii rută |
| 4 | DONE | Favorite cu rute complete + rute parțiale (interval stații) |
| 5 | PENDING | ETA Calculator |
| 6 | PENDING | Cost Tracker |
| 7 | PENDING | Dashboard avansat cu widget-uri |
| 8 | PENDING | Polish & optimizare |

### Modificări suplimentare efectuate:
- Paletă culori schimbată din MOV în TEAL/CYAN (mov = "AI-generated")
- Troleibuz culoare: #F59E0B (amber) în loc de purple
- Harta: default "streets" (Voyager cu străzi), nu dark
- Vehicule: sortare active primul + crescător după număr
- Vehicule: click arată toate vehiculele pe aceeași rută cu direcții
- Routes: click afișează timeline stații + vehicule active
- Routes: selectare rute parțiale (click 2 stații) + salvare la favorite
- Map: popup-uri se închid la click/zoom/drag
- Map: polyline traseu la click pe vehicul

---

## Faze de Implementare

### Faza 0 - Setup & Fundație (Pre-requisite)
> Configurare proiect, dependențe noi, design system de bază

- [ ] **0.1** Instalare dependențe noi
  - `framer-motion` (animații, gesturi, layout transitions)
  - `lucide-react` (icoane moderne, tree-shakeable)
  - `@fontsource/inter` + `@fontsource/jetbrains-mono` (fonturi locale)
- [ ] **0.2** Creare `.env.example` (template fără valori)
- [ ] **0.3** Actualizare `index.html` (titlu "Traseo", meta tags, favicon)
- [ ] **0.4** Setup Design System CSS
  - CSS custom properties (variabile culori, spațiere, tipografie)
  - Reset CSS modern
  - Clase utilitare glass panel, aurora background
  - Animații keyframe globale (pulse, shimmer, aurora-shift)
- [ ] **0.5** Setup structură foldere extinsă
  ```
  src/
  ├── components/
  │   ├── layout/        # Navbar, Sidebar, BottomSheet
  │   ├── map/           # MapView, VehicleMarker, RouteShape
  │   ├── cards/         # RouteCard, StopCard, VehicleCard
  │   ├── favorites/     # FavoritesList, FavoriteButton
  │   ├── tracker/       # CostTracker, CostEntry
  │   ├── commute/       # MyCommute, ETADisplay
  │   └── ui/            # GlassPanel, Badge, Countdown, Spinner
  ├── hooks/             # useGeolocation, useFavorites, useETA
  ├── utils/             # eta.js, distance.js, formatters.js
  ├── store/
  │   ├── index.js
  │   ├── slices/        # vehiclesSlice, routesSlice, stopsSlice, etc.
  │   └── thunks/
  └── styles/
      ├── variables.css  # Design tokens
      ├── reset.css      # CSS reset
      ├── glass.css      # Glass panel utilities
      └── animations.css # Global keyframes
  ```

---

### Faza 1 - Design System & Layout
> Implementare temă vizuală completă și layout principal

- [ ] **1.1** Implementare CSS Variables & Design Tokens
  - Paletă culori complete (bg, surface, accent, semantic, text)
  - Scale spațiere (4px base)
  - Scale tipografie (fluid cu clamp())
  - Border radius, shadows, blur values
- [ ] **1.2** Aurora Background animat
  - CSS `@property` pentru gradient animat
  - Shift subtil culori bazat pe ora zilei (dimineață=warm, seară=cool, noapte=deep)
  - Performance: `will-change: background` + GPU compositing
- [ ] **1.3** Glass Panel component
  - `backdrop-filter: blur(16px) saturate(180%)`
  - Border subtil `rgba(255,255,255,0.08)`
  - Variante: default, elevated, interactive
  - Hover state cu border glow
- [ ] **1.4** Layout Principal
  - Full-bleed map ca background layer (z-index: 0)
  - Floating sidebar stânga pentru navigare + conținut (z-index: 10)
  - Bottom sheet pe mobile (drag up/down cu Framer Motion)
  - Stats bar floating top-right
- [ ] **1.5** Navbar Redesign
  - Vertical icon sidebar (collapsed) pe desktop
  - Bottom tab bar pe mobile
  - Icoane Lucide cu tooltip hover
  - Active state cu glow accent
  - Glass panel styling
- [ ] **1.6** Tranziții între pagini
  - Framer Motion `AnimatePresence` pe router
  - Fade + slide transitions
  - Shared layout animations pentru cards

---

### Faza 2 - Hartă Îmbunătățită
> Hartă full-bleed cu trasee, markere custom, și interacțiuni avansate

- [ ] **2.1** Hartă Full-Bleed
  - Leaflet map 100vw x 100vh ca layer background
  - Stil hartă dark (CartoDB Dark Matter tiles sau similar)
  - Centru implicit: Cluj-Napoca (46.7712, 23.6236)
  - Eliminare controale default, custom zoom controls glass style
- [ ] **2.2** Markere Vehicule Custom
  - SVG markers cu culoare pe tip (bus=albastru, tram=verde, troleibuz=violet)
  - Animație puls pentru vehicule active
  - Rotație marker bazată pe direcția de mers
  - Cluster markers la zoom-out
- [ ] **2.3** Trasee pe Hartă (Shapes)
  - Fetch și cache shapes data
  - Desenare polyline colorate per rută
  - Animație "drawing" la selectare rută (stroke-dashoffset)
  - Grosime variabilă bazată pe zoom level
- [ ] **2.4** Stații pe Hartă
  - Markere stații (cercuri mici) vizibile la zoom > 14
  - Popup glass panel cu info stație
  - Highlight stații pe ruta selectată
- [ ] **2.5** Interacțiuni Hartă
  - Click vehicul → popup info glass panel
  - Click rută → highlight traseu + stații
  - Geolocație utilizator (punct albastru pulsant)
  - "Follow vehicle" mode (hartă urmărește un vehicul)
- [ ] **2.6** Filtre Hartă
  - Toggle tip vehicul (bus/tram/troleibuz)
  - Toggle doar vehicule active
  - Filtrare pe rută specifică
  - Glass panel filter bar floating

---

### Faza 3 - Rute & Stații
> Pagini detaliate pentru rute și stații cu date complete

- [ ] **3.1** Lista Rute Redesign
  - Bento grid cu RouteCards glass style
  - Culoare accent din `route_color`
  - Badge tip vehicul (icona + text)
  - Număr vehicule active live pe fiecare rută
  - Search/filter bar
  - Sortare: nume, tip, vehicule active
- [ ] **3.2** Pagină Detaliu Rută
  - Header cu nume rută, tip, culoare
  - Mini-hartă cu traseu shape + stații
  - Lista stații ordonată (timeline vertical)
  - Vehicule active pe rută (poziție pe timeline)
  - Buton adăugare favorite
- [ ] **3.3** Lista Stații
  - Stații sortate după distanță (geolocație)
  - Card stație cu nume + rutele care trec
  - Search stație
  - Hartă mini cu locație stație
- [ ] **3.4** Pagină Detaliu Stație
  - Nume stație + hartă localizare
  - Rutele care deservesc stația
  - Vehicule care se apropie (live ETA)
  - Buton favorite

---

### Faza 4 - Favorite & My Commute
> Sistem de favorite și traseu zilnic personalizat

- [ ] **4.1** Sistem Favorite (localStorage)
  - Adăugare/eliminare rute și stații favorite
  - Hook `useFavorites()` - CRUD operations
  - Animație heart/star la toggle
  - Persistență localStorage cu key `traseo_favorites`
- [ ] **4.2** Pagină Favorite
  - Secțiuni: Rute Favorite, Stații Favorite
  - Quick-access cards cu date live (vehicule active, ETA)
  - Reordonare drag & drop (Framer Motion)
  - Empty state frumos cu CTA
- [ ] **4.3** My Commute Setup
  - Selectare stație plecare (ex: stația de lângă Aleea Muscel)
  - Selectare stație destinație (ex: stația Paris)
  - Identificare automată rute care conectează cele 2 stații
  - Salvare în localStorage
- [ ] **4.4** My Commute Dashboard
  - Card principal pe home: "Următorul 10 spre Paris"
  - ETA cel mai apropiat vehicul pe ruta ta
  - Vehicule active pe ruta ta cu poziții
  - Quick action: "Arată pe hartă"

---

### Faza 5 - ETA Calculator
> Estimare timp sosire bazată pe date GPS real-time

- [ ] **5.1** Utilitar calcul distanță
  - Haversine formula (distanță linie dreaptă)
  - Distanță de-a lungul shape-ului (punct pe polyline)
  - `utils/distance.js`
- [ ] **5.2** Algoritm ETA
  - Găsire vehicule pe ruta selectată
  - Calculare distanță vehicul → stație de-a lungul traseului
  - Estimare timp: distanță / viteză medie (fallback 20 km/h dacă vehicul staționar)
  - Afișare "~X min" cu indicator de confidence
  - `utils/eta.js`
- [ ] **5.3** Hook useETA
  - Input: route_id, stop_id
  - Output: { minutes, confidence, vehicleId, isApproaching }
  - Auto-refresh cu vehicule data
  - Sortare vehicule după ETA (cel mai apropiat primul)
- [ ] **5.4** ETA Display Component
  - Digit-flip counter animat (Framer Motion)
  - Culoare: verde (<5min), galben (5-15min), roșu (>15min)
  - "Se apropie!" alert când < 2 minute
  - Indicator "Live" pulsant

---

### Faza 6 - Cost Tracker
> Jurnal cheltuieli transport cu statistici

- [ ] **6.1** Model de date costuri
  - Entry: { id, date, amount, routeName, type: 'ticket'|'pass', note }
  - Presetări: bilet CTP = 3 RON (configurabil)
  - localStorage persistență
- [ ] **6.2** Formular adăugare cheltuială
  - Quick add: "Am luat bilet pe ruta X" (un tap)
  - Câmpuri: sumă, rută (dropdown favorite), dată, notă
  - Glass panel modal cu animație
- [ ] **6.3** Pagină Cost Tracker
  - Sumar luna curentă (total, nr călătorii, medie/zi)
  - Grafic cheltuieli ultimele 30 zile (SVG simplu, fără librărie)
  - Lista cheltuieli cu filtre (lună, rută)
  - Comparație: cost bilete vs abonament lunar
  - Export date (CSV opțional)
- [ ] **6.4** Widget Dashboard
  - Card bento: "Cheltuieli luna aceasta: XX RON"
  - Mini sparkline grafic tendință
  - "Ai economisi XX RON cu abonament" (dacă e cazul)

---

### Faza 7 - Dashboard & Home Redesign
> Landing page transformată în dashboard personal inteligent

- [ ] **7.1** Bento Grid Dashboard
  - Layout bento responsive (CSS grid cu grid-template-areas)
  - Cards cu dimensiuni variate (1x1, 2x1, 2x2)
  - Animație stagger la load (Framer Motion)
- [ ] **7.2** Widget-uri Dashboard
  - **My Commute** (2x1): ETA pentru ruta favorită, vehicule active
  - **Hartă Mini** (2x2): Preview hartă cu vehiculele tale
  - **Costuri** (1x1): Total luna curentă + tendință
  - **Vehicule Active** (1x1): Counter total vehicule CTP online
  - **Rute Favorite** (2x1): Quick access cu status live
  - **Stații Apropiate** (1x1): Cele mai apropiate 3 stații (geolocație)
  - **Meteo** (1x1): Temperatura curentă (opțional, API gratis)
- [ ] **7.3** Salut personalizat
  - "Bună dimineața!" / "Bună seara!" bazat pe oră
  - Quick stats: "X vehicule active, ruta 10 are Y vehicule"

---

### Faza 8 - Polish & Optimizare
> Performanță, accesibilitate, finishing touches

- [ ] **8.1** Optimizare Performanță
  - Lazy loading pagini (React.lazy + Suspense)
  - Cache date statice (routes, stops, shapes) cu TTL 24h
  - Debounce search inputs
  - Virtualizare liste lungi (dacă e nevoie)
  - Shapes: simplificare polyline la zoom-out
- [ ] **8.2** Responsive & Mobile
  - Bottom sheet navigation pe mobile
  - Touch gestures (swipe, pinch-zoom)
  - Safe area insets pentru notch
  - Testare pe diverse screen sizes
- [ ] **8.3** Loading States
  - Skeleton screens glass style (shimmer animation)
  - Spinner cu branding
  - Error states cu retry
  - Empty states cu ilustrații/CTA
- [ ] **8.4** Accesibilitate
  - Contrast suficient pe dark theme
  - Focus indicators vizibile
  - Aria labels pe elemente interactive
  - Keyboard navigation
- [ ] **8.5** Final Touches
  - Favicon + meta tags complete
  - Open Graph tags pentru share
  - PWA manifest (opțional - pentru "Add to Home Screen")
  - 404 page glass style

---

## Priorități și Dependențe

```
Faza 0 (Setup) ─────────────────────────────────────────────────┐
    │                                                           │
    ▼                                                           │
Faza 1 (Design System) ──────┐                                 │
    │                         │                                 │
    ▼                         ▼                                 │
Faza 2 (Hartă)          Faza 3 (Rute & Stații)                │
    │                         │                                 │
    └──────────┬──────────────┘                                 │
               ▼                                                │
         Faza 4 (Favorite & Commute)                           │
               │                                                │
               ▼                                                │
         Faza 5 (ETA Calculator) ◄──────────────────────────────┘
               │                                                
               ▼                                                
         Faza 6 (Cost Tracker)                                 
               │                                                
               ▼                                                
         Faza 7 (Dashboard)                                    
               │                                                
               ▼                                                
         Faza 8 (Polish)                                       
```

**Fazele 2 și 3** pot fi lucrate în paralel.
**Faza 5 (ETA)** depinde de Faze 2+3 (date hartă + stații).
**Faza 7 (Dashboard)** depinde de toate celelalte (integrează widget-uri).

---

## Estimări Complexitate

| Fază | Complexitate | Note |
|------|-------------|------|
| 0 - Setup | Mică | Dependențe + structură |
| 1 - Design System | Medie | CSS + componente UI base |
| 2 - Hartă | Mare | Shapes, markere custom, interacțiuni |
| 3 - Rute & Stații | Medie | CRUD pages + redesign |
| 4 - Favorite | Medie | localStorage + UI |
| 5 - ETA | Mare | Algoritm calcul + real-time updates |
| 6 - Cost Tracker | Medie | Forms + statistici |
| 7 - Dashboard | Mare | Integrare toate widget-urile |
| 8 - Polish | Medie | Optimizări + responsive |

---

## Principii de Design

1. **Map-First**: Harta este aplicația. UI-ul plutește deasupra.
2. **Glassmorphic Depth**: Panouri translucide creează ierarhie vizuală.
3. **Motion with Purpose**: Fiecare animație comunică ceva (loading, tranziție, atenție).
4. **Data Dense, Not Cluttered**: Multe informații, prezentate clar prin tipografie și spațiere.
5. **Personal**: Aplicația se adaptează la rutele și obiceiurile tale.
6. **Performance**: Animațiile folosesc GPU compositing. Datele statice sunt cache-uite.

---

## Notă Implementare

Acest plan este un ghid flexibil. Ordinea task-urilor din fiecare fază poate fi ajustată. Fazele se implementează secvențial, dar task-urile din aceeași fază pot fi parallelizate.
