import { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import cities from '../data/cities';
import continentPaths from '../data/worldMapData';
import { hapticClick, hapticTap } from '../utils/haptic';

function project(lon, lat) {
  const x = ((lon + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return [x, y];
}

export default function WorldMap({ currentCity, onCityChange, isPowered, signalAcquired }) {
  const [hoveredCity, setHoveredCity] = useState(null);
  const svgRef = useRef(null);

  // Zoom & pan
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1000, h: 500 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  const projectedCities = useMemo(() =>
    cities.map(c => {
      const [px, py] = project(c.lon, c.lat);
      return { ...c, px, py };
    }),
    []
  );

  const zoomLevel = 1000 / viewBox.w;

  // Graticule lines
  const graticuleLines = useMemo(() => {
    const lines = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = ((90 - lat) / 180) * 500;
      lines.push({ type: 'h', y, key: `lat${lat}`, isEquator: lat === 0 });
    }
    for (let lon = -150; lon <= 150; lon += 30) {
      const x = ((lon + 180) / 360) * 1000;
      lines.push({ type: 'v', x, key: `lon${lon}` });
    }
    return lines;
  }, []);

  // ── Zoom on wheel ──
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    const zoomFactor = e.deltaY < 0 ? 0.82 : 1.22;
    setViewBox(prev => {
      const newW = Math.max(100, Math.min(1000, prev.w * zoomFactor));
      const newH = newW / 2;
      const newX = prev.x + (prev.w - newW) * mx;
      const newY = prev.y + (prev.h - newH) * my;
      return {
        x: Math.max(-50, Math.min(1050 - newW, newX)),
        y: Math.max(-25, Math.min(525 - newH, newY)),
        w: newW,
        h: newH,
      };
    });
  }, []);

  // ── Pan on drag (mouse + touch) ──
  const handlePanStart = useCallback((e) => {
    if (e.target.closest('.city-hit')) return;
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    setIsPanning(true);

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    panStart.current = { x: clientX, y: clientY, vx: viewBox.x, vy: viewBox.y };

    const handlePanMove = (moveE) => {
      const mx = moveE.touches ? moveE.touches[0].clientX : moveE.clientX;
      const my = moveE.touches ? moveE.touches[0].clientY : moveE.clientY;
      const rect = svg.getBoundingClientRect();
      const dx = (mx - panStart.current.x) / rect.width * viewBox.w;
      const dy = (my - panStart.current.y) / rect.height * viewBox.h;
      setViewBox(prev => ({
        ...prev,
        x: Math.max(-50, Math.min(1050 - prev.w, panStart.current.vx - dx)),
        y: Math.max(-25, Math.min(525 - prev.h, panStart.current.vy - dy)),
      }));
    };
    const handlePanEnd = () => {
      setIsPanning(false);
      window.removeEventListener('mousemove', handlePanMove);
      window.removeEventListener('mouseup', handlePanEnd);
      window.removeEventListener('touchmove', handlePanMove);
      window.removeEventListener('touchend', handlePanEnd);
    };
    window.addEventListener('mousemove', handlePanMove);
    window.addEventListener('mouseup', handlePanEnd);
    window.addEventListener('touchmove', handlePanMove, { passive: false });
    window.addEventListener('touchend', handlePanEnd);
  }, [viewBox]);

  const handleDoubleClick = useCallback(() => {
    setViewBox({ x: 0, y: 0, w: 1000, h: 500 });
  }, []);

  if (!isPowered) {
    return (
      <div className="map-container w-full flex items-center justify-center opacity-30">
        <span className="text-[#1a3a35] text-xs tracking-widest" style={{ fontFamily: 'Orbitron' }}>
          MAP OFFLINE
        </span>
      </div>
    );
  }

  // Zoom-aware sizes
  const sw = Math.max(0.3, 0.5 / zoomLevel);
  const dotR = Math.max(3, 4.5 / zoomLevel);
  const selR = dotR * 1.4;
  const hovR = dotR * 1.2;
  const fs = Math.max(7, 11 / zoomLevel);
  const pulseMax = selR * 4;

  return (
    <div
      className="map-container w-full relative overflow-hidden"
      style={{ cursor: isPanning ? 'grabbing' : (zoomLevel > 1.05 ? 'grab' : 'default'), touchAction: 'none' }}
    >
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`World map. Currently tuned to ${currentCity || 'no city'}`}
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
        onTouchStart={handlePanStart}
        onDoubleClick={handleDoubleClick}
      >
        <defs>
          <radialGradient id="mapBg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(0,229,198,0.04)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(0,229,198,0.3)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Ocean */}
        <rect x="-50" y="-25" width="1100" height="550" fill="#050e0c" />
        <rect x="-50" y="-25" width="1100" height="550" fill="url(#mapBg)" />

        {/* Graticule */}
        {graticuleLines.map(line =>
          line.type === 'h' ? (
            <line
              key={line.key}
              x1="-50" y1={line.y} x2="1050" y2={line.y}
              stroke={line.isEquator ? '#0d3530' : '#091e1b'}
              strokeWidth={line.isEquator ? sw * 1.8 : sw * 0.7}
              strokeDasharray={line.isEquator ? '6,3' : '2,6'}
            />
          ) : (
            <line
              key={line.key}
              x1={line.x} y1="-25" x2={line.x} y2="525"
              stroke="#091e1b"
              strokeWidth={sw * 0.7}
              strokeDasharray="2,6"
            />
          )
        )}

        {/* Continent landmasses */}
        {continentPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="#0c2622"
            stroke="#00b89a"
            strokeWidth={sw}
            strokeLinejoin="round"
            opacity="0.8"
          />
        ))}

        {/* Faint connection lines from selected city */}
        {(() => {
          const sel = projectedCities.find(c => c.name === currentCity);
          if (!sel) return null;
          return projectedCities.filter(c => c.name !== currentCity).map(city => (
            <line
              key={`conn-${city.name}`}
              x1={sel.px} y1={sel.py} x2={city.px} y2={city.py}
              stroke="#00e5c6" strokeWidth={sw * 0.3} opacity="0.05"
              strokeDasharray="3,5"
            />
          ));
        })()}

        {/* City markers */}
        {projectedCities.map((city) => {
          const isSel = city.name === currentCity;
          const isHov = city.name === hoveredCity;
          const r = isSel ? selR : isHov ? hovR : dotR;

          return (
            <g key={city.name}>
              {/* Animated pulse for selected */}
              {isSel && (
                <>
                  <circle cx={city.px} cy={city.py} r={pulseMax} fill="none" stroke="#00e5c6" strokeWidth={sw * 0.8} opacity="0">
                    <animate attributeName="r" from={selR * 1.5} to={pulseMax} dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={city.px} cy={city.py} r={selR * 2.5} fill="url(#dotGlow)" />
                </>
              )}

              {/* Hover halo */}
              {isHov && !isSel && (
                <circle cx={city.px} cy={city.py} r={hovR * 2.2} fill="rgba(0,229,198,0.08)" />
              )}

              {/* Outer ring */}
              <circle
                cx={city.px} cy={city.py}
                r={r * 1.5}
                fill="none"
                stroke={isSel ? '#00e5c6' : isHov ? '#00e5c6' : '#00997f'}
                strokeWidth={sw * 0.6}
                opacity={isSel ? 0.6 : isHov ? 0.4 : 0.2}
              />

              {/* Main dot — clickable */}
              <circle
                className="city-hit"
                cx={city.px} cy={city.py}
                r={r}
                fill={isSel ? '#00e5c6' : isHov ? '#00d4b4' : '#00b89a'}
                style={{
                  cursor: 'pointer',
                  filter: isSel ? 'drop-shadow(0 0 5px #00e5c6)' : 'none',
                  transition: 'fill 0.15s ease',
                }}
                onClick={(e) => { e.stopPropagation(); hapticClick(); onCityChange(city.name); }}
                onMouseEnter={() => setHoveredCity(city.name)}
                onMouseLeave={() => setHoveredCity(null)}
              />

              {/* Bright core */}
              {isSel && (
                <circle cx={city.px} cy={city.py} r={selR * 0.35} fill="#fff" opacity="0.7" style={{ pointerEvents: 'none' }} />
              )}

              {/* Label */}
              {(isSel || isHov) && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect
                    x={city.px + r * 2}
                    y={city.py - fs * 0.7}
                    width={city.name.length * fs * 0.58 + fs * 0.8}
                    height={fs * 1.5}
                    rx={2 / zoomLevel}
                    fill="rgba(5,14,12,0.9)"
                    stroke="#1a3a35"
                    strokeWidth={sw * 0.4}
                  />
                  <text
                    x={city.px + r * 2 + fs * 0.35}
                    y={city.py + fs * 0.3}
                    fill={isSel ? '#00e5c6' : '#00d4b4'}
                    fontSize={fs}
                    fontFamily="Orbitron, monospace"
                    opacity={isSel ? 0.95 : 0.75}
                  >
                    {city.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

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

      {/* SIGNAL ACQUIRED */}
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

      {/* Zoom indicator */}
      {zoomLevel > 1.15 && (
        <div className="absolute top-1.5 right-2 vfd-text text-[8px] opacity-35 tracking-wider z-10">
          {zoomLevel.toFixed(1)}x
        </div>
      )}

      {/* Zoom buttons */}
      <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
        <button
          className="w-7 h-7 sm:w-5 sm:h-5 flex items-center justify-center rounded bg-[#0a1a18]/80 border border-[#1a3a35]/60 text-[#00e5c6] text-sm sm:text-[10px] hover:bg-[#1a3a35]/40 active:bg-[#1a3a35]/60 transition-colors"
          onClick={() => { hapticTap(); setViewBox(prev => {
            const nw = Math.max(100, prev.w * 0.75);
            const nh = nw / 2;
            return { x: Math.max(-50, prev.x + (prev.w - nw) / 2), y: Math.max(-25, prev.y + (prev.h - nh) / 2), w: nw, h: nh };
          }); }}
        aria-label="Zoom in">+</button>
        <button
          className="w-7 h-7 sm:w-5 sm:h-5 flex items-center justify-center rounded bg-[#0a1a18]/80 border border-[#1a3a35]/60 text-[#00e5c6] text-sm sm:text-[10px] hover:bg-[#1a3a35]/40 active:bg-[#1a3a35]/60 transition-colors"
          onClick={() => { hapticTap(); setViewBox(prev => {
            const nw = Math.min(1000, prev.w * 1.33);
            const nh = nw / 2;
            return { x: Math.max(-50, prev.x + (prev.w - nw) / 2), y: Math.max(-25, prev.y + (prev.h - nh) / 2), w: nw, h: nh };
          }); }}
          aria-label="Zoom out"
        >-</button>
      </div>
    </div>
  );
}
