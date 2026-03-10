import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Graticule,
  ZoomableGroup,
} from 'react-simple-maps';
import cities from '../data/cities';
import { hapticClick } from '../utils/haptic';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json';

export default function WorldMap({ currentCity, onCityChange, isPowered, signalAcquired }) {
  const [hoveredCity, setHoveredCity] = useState(null);
  const [position, setPosition] = useState({ coordinates: [20, 20], zoom: 1 });

  const handleMoveEnd = useCallback((pos) => {
    setPosition(pos);
  }, []);

  // Dot sizes scale inversely with zoom
  const dotSize = useMemo(() => Math.max(4, 6 / position.zoom), [position.zoom]);
  const selectedDotSize = dotSize * 1.5;

  if (!isPowered) {
    return (
      <div className="map-container w-full flex items-center justify-center opacity-30">
        <span className="text-[#1a3a35] text-xs tracking-widest" style={{ fontFamily: 'Orbitron' }}>
          MAP OFFLINE
        </span>
      </div>
    );
  }

  return (
    <div className="map-container w-full relative overflow-hidden" style={{ touchAction: 'none' }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [20, 20],
        }}
        width={800}
        height={400}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={handleMoveEnd}
          minZoom={1}
          maxZoom={8}
        >
          {/* Ocean background */}
          <rect x={-200} y={-200} width={1200} height={800} fill="#050e0c" />

          {/* Graticule grid lines */}
          <Graticule stroke="#091e1b" strokeWidth={0.3} strokeDasharray="2,4" />

          {/* Land masses */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rpiproperties?.name || geo.id}
                  geography={geo}
                  fill="#0c2622"
                  stroke="#00b89a"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: '#0e2e2a' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Connection lines from selected city */}
          {(() => {
            const sel = cities.find(c => c.name === currentCity);
            if (!sel) return null;
            return cities.filter(c => c.name !== currentCity).map(city => (
              <line
                key={`conn-${city.name}`}
                x1={0} y1={0} x2={0} y2={0}
                stroke="#00e5c6"
                strokeWidth={0.2 / position.zoom}
                opacity="0.04"
                strokeDasharray="3,5"
              />
            ));
          })()}

          {/* City markers */}
          {cities.map((city) => {
            const isSel = city.name === currentCity;
            const isHov = city.name === hoveredCity;
            const r = isSel ? selectedDotSize : isHov ? dotSize * 1.2 : dotSize;

            return (
              <Marker key={city.name} coordinates={[city.lon, city.lat]}>
                {/* Animated pulse ring for selected city */}
                {isSel && (
                  <>
                    <circle r={r * 3} fill="none" stroke="#00e5c6" strokeWidth={0.5} opacity="0">
                      <animate attributeName="r" from={r * 1.5} to={r * 3.5} dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.5" to="0" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    <circle r={r * 2} fill="rgba(0,229,198,0.12)" />
                  </>
                )}

                {/* Hover halo */}
                {isHov && !isSel && (
                  <circle r={r * 2} fill="rgba(0,229,198,0.08)" />
                )}

                {/* Outer ring */}
                <circle
                  r={r * 1.5}
                  fill="none"
                  stroke={isSel ? '#00e5c6' : isHov ? '#00e5c6' : '#00997f'}
                  strokeWidth={0.4}
                  opacity={isSel ? 0.6 : isHov ? 0.4 : 0.15}
                />

                {/* Touch target (larger invisible circle) */}
                <circle
                  r={Math.max(12, r * 3)}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); hapticClick(); onCityChange(city.name); }}
                  onMouseEnter={() => setHoveredCity(city.name)}
                  onMouseLeave={() => setHoveredCity(null)}
                />

                {/* Visible dot */}
                <circle
                  r={r}
                  fill={isSel ? '#00e5c6' : isHov ? '#00d4b4' : '#00b89a'}
                  style={{
                    pointerEvents: 'none',
                    filter: isSel ? 'drop-shadow(0 0 5px #00e5c6)' : 'none',
                    transition: 'fill 0.15s ease',
                  }}
                />

                {/* Bright core for selected */}
                {isSel && (
                  <circle r={r * 0.3} fill="#fff" opacity="0.7" style={{ pointerEvents: 'none' }} />
                )}

                {/* City label */}
                {(isSel || isHov) && (
                  <g style={{ pointerEvents: 'none' }}>
                    <rect
                      x={r * 2}
                      y={-6}
                      width={city.name.length * 5.5 + 8}
                      height={14}
                      rx={2}
                      fill="rgba(5,14,12,0.92)"
                      stroke="#1a3a35"
                      strokeWidth={0.4}
                    />
                    <text
                      x={r * 2 + 4}
                      y={4}
                      fill={isSel ? '#00e5c6' : '#00d4b4'}
                      fontSize={8}
                      fontFamily="Orbitron, monospace"
                      opacity={isSel ? 0.95 : 0.75}
                    >
                      {city.name}
                    </text>
                  </g>
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Hover tooltip at bottom */}
      <AnimatePresence>
        {hoveredCity && hoveredCity !== currentCity && (
          <motion.div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 vfd-text text-[10px] bg-[#050e0c]/95 px-3 py-1.5 rounded border border-[#1a3a35] z-30"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {hoveredCity.toUpperCase()} — {cities.find(c => c.name === hoveredCity)?.country}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIGNAL ACQUIRED flash */}
      <AnimatePresence>
        {signalAcquired && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-[#050e0c]/85 px-6 py-3 rounded-lg border border-[#00e5c6]/30">
              <motion.span
                className="vfd-text text-sm tracking-[0.3em] font-bold signal-acquired-flash"
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                SIGNAL ACQUIRED
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="absolute top-1.5 left-2 vfd-text text-[8px] opacity-40 tracking-widest z-10">
        BROADCAST LOCATION
      </div>
    </div>
  );
}
