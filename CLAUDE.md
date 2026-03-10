# Time Traveler's Radio

## Quick Reference

- **Stack**: React 19 + Vite 7 + Tailwind CSS 4 + Framer Motion
- **Audio**: Web Audio API (procedural) + YouTube IFrame API (music) + Web Speech API (news)
- **Deploy**: Docker on Render.com (Express server)
- **Dev**: `npm run dev` | **Build**: `npm run build` | **Prod**: `npm start`

## Architecture

```
src/
  App.jsx                    # Root layout: chassis, power bar, display, controls
  hooks/
    useRadioAudio.js         # Master state machine — power, year, city, tuning, news
    useYouTubePlayer.js      # YouTube IFrame API wrapper (lazy-loaded, hidden player)
    useRadioStatic.js        # 60Hz hum + bandpass white noise (ambient static)
  engine/
    RadioManager.js          # Web Audio API controller — filters, SFX, speech, ducking
    SecretFrequencyHandler.js # Easter egg detection (1947, 1969, 1985, 1999, 2077, pirate)
  components/
    PowerButton.jsx          # On/off toggle with ignition sequence
    VFDDisplay.jsx           # Year + city + track display (scanlines, glitch effects)
    YearDial.jsx             # Rotary knob → year (1947–2077), frequency band UI
    WorldMap.jsx             # SVG map with 20 cities, zoom/pan, signal acquired flash
    SpeakerGrille.jsx        # Hybrid equalizer (real AnalyserNode + simulated bars)
    VolumeSlider.jsx         # Rotary volume knob (0–100%)
    NewsButton.jsx           # Triggers era-specific news bulletin via speech synthesis
  data/
    musicDatabase.js         # 13 regions × 20+ years, verified YouTube IDs
    newsDatabase.js          # 8 era personas + headlines (1950–2024)
    cities.js                # 20 cities with lat/lon + SVG coordinates
    worldMapData.js          # Continent SVG path data
  utils/
    haptic.js                # Navigator.vibrate wrappers
```

## Key Data Flow

```
User Action → useRadioAudio (state machine) → RadioManager (audio) + useYouTubePlayer (music)
                                             → SecretFrequencyHandler (easter eggs)
                                             → Component props (visual updates)
```

Year change: debounce 400ms → applyEraFilter → getTopHit(year, city) → YouTube playVideo
City change: signal acquired flash → load region music → play
News: duck YouTube to 15% → speak bulletin → unduck

## Audio Pipeline

```
YouTube (hidden iframe) ──┐
Procedural SFX ──────────→ masterGain → analyser → speakers
Speech synthesis ─────────┘              ↓
                                   SpeakerGrille (visual)
```

Era filters morph the sound:
- Pre-1960: 300Hz highpass + 4kHz lowpass + 15% hiss (lo-fi radio)
- Modern: full bandwidth, no hiss

## Conventions

- **CSS**: Tailwind utilities + custom CSS in `index.css` for VFD/chassis styles
- **Colors**: `#00e5c6` (teal primary), `#ffb347` (amber/news), `#ff0080` (future/pink)
- **Font**: Orbitron (headings/labels), Special Elite (easter egg text)
- **Animations**: Framer Motion for layout, CSS keyframes for VFD effects
- **No TypeScript** — plain JSX
- **No state library** — React hooks + refs only
- **No router** — single-page app

## Music Database

Regions: us, uk, france, germany, japan, korea, brazil, latin, india, middleeast, russia, africa, australia, china

City → region mapping in `cityRegion` object. `closestYear()` finds nearest available year when exact match doesn't exist.

**When adding/replacing YouTube IDs**: verify with oEmbed API:
```
https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json
```
200 = embeddable, 404 = dead, 401 = restricted (won't play in iframe)

## Easter Eggs

| Year | Type | Effects |
|------|------|---------|
| 1947 | Roswell | Theremin + Morse code ("SOS WE ARE HERE") |
| 1969 | Moon Landing | Apollo chatter + quindar tones + "Houston, Tranquility Base" |
| 1985 | Back to the Future | Chord arpeggio + "Great Scott!" |
| 1999 | Y2K | Modem dialup + matrix rain overlay |
| 2077 | Cyberpunk Future | Synth loop + Mars Colony broadcast |
| *.5 | Pirate Radio | Bit-crushed static + illegal broadcast |

## Deployment

- **Dockerfile**: Multi-stage (node:20-alpine build → production with Express)
- **render.yaml**: Render Blueprint (free plan, Docker runtime, port 3000)
- **Security headers**: CSP, HSTS, X-Frame-Options, Permissions-Policy
- **Caching**: HTML no-cache, assets 1-year immutable
- Docker runs as non-root `node` user

## Common Tasks

### Add a new city
1. Add to `src/data/cities.js` (name, country, lat, lon)
2. Map city name → region in `cityRegion` in `musicDatabase.js`

### Add music for a region/year
1. Find YouTube video ID (verify with oEmbed)
2. Add entry to region's array in `musicDatabase.js`: `{ year, title, artist, ytId }`

### Add a new easter egg
1. Add detection logic in `SecretFrequencyHandler.js` (`checkYear` method)
2. Add audio effects in `RadioManager.js`
3. Add visual styling in `VFDDisplay.jsx` + `index.css`

### Add a news era
1. Add persona to `personas` in `newsDatabase.js`
2. Add headlines to `headlines` object keyed by year
