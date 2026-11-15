# GoRepireo Standalone Live Navigation Module

A zero-Firebase, production-ready live delivery partner navigation module for **GoRepireo** built with React, TypeScript, Leaflet, and the existing custom Google Maps tile renderer.

---

## 1. Architectural Highlights

- **Zero Cloud DB / Zero Firebase**: Completely independent of Firebase Auth, Firestore, and Realtime Database.
- **Provider-Independent Routing**: Abstracted interface supporting both OSRM (development / instant testing) and self-hosted Valhalla (production-grade turn-by-turn routing).
- **Automated Route Deviation & Rerouting**: Continuously monitors the delivery technician's GPS location against the route polyline. If the worker moves > 35m off-route for consecutive readings, automatic rerouting is triggered with voice guidance.
- **Real-Time GPS Tracking**: Browser `navigator.geolocation.watchPosition` with satellite accuracy detection, high accuracy flags, heading/bearing tracking, and degraded-signal indicators.
- **Custom Map Renderer Adapter**: Adheres to the `MapRendererAdapter` contract:
  - `setRoute()`
  - `setWorkerPosition()`
  - `setDestination()`
  - `fitBounds()`
  - `clearRoute()`
  - `setStatus()`
- **Audio Voice Guidance**: Integrated turn-by-turn spoken guidance via the Web SpeechSynthesis API with queue management, deduplication, and mute controls.
- **Swiggy/Zomato Inspired UI**: Pixel-perfect layout matching GoRepireo's delivery design with live worker halo, destination pin, OTP verification card, and technician metrics.

---

## 2. Directory Structure

```
├── lib/navigation/
│   ├── types/
│   │   └── index.ts                 # Type definitions & contracts
│   ├── utils/
│   │   └── geo.ts                   # Haversine, bearing, point-to-line, deviation
│   ├── providers/
│   │   ├── OSRMProvider.ts          # Public OSRM + failover endpoints
│   │   ├── ValhallaProvider.ts      # Self-hosted Valhalla engine + polyline6 decoder
│   │   └── RoutingAdapter.ts        # Runtime provider switcher & failover
│   ├── services/
│   │   └── voiceGuidance.ts         # SpeechSynthesis TTS turn announcements
│   ├── hooks/
│   │   ├── useGeolocation.ts        # Browser watchPosition GPS hook
│   │   └── useNavigation.ts         # Navigation engine, deviation, ETA & progress
│   └── adapters/
│       └── MapRendererAdapter.ts    # Leaflet Google Maps tile integration
├── components/navigation/
│   ├── NavigationHeader.tsx         # Locality dropdown & user greeting
│   ├── RouteStatsPill.tsx           # Floating top distance & ETA pill
│   ├── NavigationMap.tsx            # Custom Leaflet Google Maps renderer
│   ├── NavigationControlCard.tsx    # Order info, Start OTP, Expert, controls
│   └── LiveNavigationView.tsx       # Unified container component
└── app/navigation/
    └── page.tsx                     # Standalone live navigation route
```

---

## 3. Environment Configuration

Configure the active routing engine via environment variables in `.env.local` or `.env`:

```env
# Choose active provider: 'osrm' (default) or 'valhalla'
NEXT_PUBLIC_ROUTING_PROVIDER=osrm
# or for Vite environments:
# VITE_ROUTING_PROVIDER=osrm

# Custom or Self-Hosted OSRM Server (Optional - defaults to public demo endpoint)
NEXT_PUBLIC_OSRM_URL=https://router.project-osrm.org

# Production Self-Hosted Valhalla Server URL
NEXT_PUBLIC_VALHALLA_URL=https://valhalla.gorepireo.com
```

---

## 4. How Route Deviation and Recalculation Works

1. As the worker moves, `useGeolocation` streams GPS coordinates (`lat`, `lng`, `accuracy`, `speed`, `heading`).
2. `useNavigation` projects the worker's coordinate onto each segment of the route polyline using cross-track distance calculations (`checkRouteDeviation`).
3. If the minimum distance from the route exceeds `deviationThresholdMeters` (default: 35 meters) for 2 consecutive updates (to eliminate single-point GPS jitter), the system flags `isOffRoute: true`.
4. The system announces `"Rerouting. Please proceed to the highlighted road."` and invokes `recalculateRoute()`.
5. The map adapter animates the new blue road polyline, updates the remaining kilometers/minutes pill, and recalculates step maneuvers.

---

## 5. Production Valhalla Deployment Guide

For high-throughput, latency-critical delivery routing without third-party rate limits, run Valhalla via Docker:

### Running Valhalla with Docker
```bash
# 1. Pull the official Valhalla container
docker pull gisops/valhalla:latest

# 2. Download OpenStreetMap PBF extract for your target region (e.g. West Bengal, India)
mkdir -p ./valhalla_data
curl -o ./valhalla_data/west-bengal.osm.pbf https://download.geofabrik.de/asia/india/eastern-zone-latest.osm.pbf

# 3. Start Valhalla instance
docker run -d --name valhalla \
  -p 8002:8002 \
  -v $(pwd)/valhalla_data:/data/valhalla \
  -e build_elevation=True \
  -e build_admins=True \
  gisops/valhalla:latest

# 4. Point GoRepireo to your production endpoint in .env.local
# NEXT_PUBLIC_ROUTING_PROVIDER=valhalla
# NEXT_PUBLIC_VALHALLA_URL=https://your-domain.com/valhalla
```

---

## 6. Verification and Local Execution

To test the standalone live navigation route:

```bash
# Run Next.js development server
npm run dev
```

Navigate to: `http://localhost:3000/navigation` in your browser. Grant location permissions when prompted to view live GPS tracking with automatic route generation to the customer destination.
