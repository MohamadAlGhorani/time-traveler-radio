import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { hapticTap, hapticTurn } from '../utils/haptic';

const MIN_YEAR = 1947;
const MAX_YEAR = 2077;
const TOTAL_RANGE = MAX_YEAR - MIN_YEAR;

function angleToYear(angle) {
  const normalizedAngle = Math.max(-270, Math.min(270, angle));
  const progress = (normalizedAngle + 270) / 540;
  return MIN_YEAR + progress * TOTAL_RANGE;
}

function yearToAngle(year) {
  const progress = (year - MIN_YEAR) / TOTAL_RANGE;
  return progress * 540 - 270;
}

export default function YearDial({ currentYear, onYearChange, isPowered }) {
  const knobRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ angle: 0, startAngle: 0 });
  const currentAngleRef = useRef(yearToAngle(currentYear));
  const lastHapticRef = useRef(0);

  const getAngleFromEvent = useCallback((e, rect) => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (!isPowered) return;
    e.preventDefault();

    hapticTap();

    const rect = knobRef.current.getBoundingClientRect();
    const startAngle = getAngleFromEvent(e, rect);

    dragStartRef.current = {
      angle: currentAngleRef.current,
      startAngle,
    };
    setIsDragging(true);

    const handleMove = (moveE) => {
      moveE.preventDefault();
      const currentPointerAngle = getAngleFromEvent(moveE, rect);
      let delta = currentPointerAngle - dragStartRef.current.startAngle;

      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      const newAngle = dragStartRef.current.angle + delta * 1.5;
      const clampedAngle = Math.max(-270, Math.min(270, newAngle));
      currentAngleRef.current = clampedAngle;

      const year = angleToYear(clampedAngle);
      onYearChange(year);

      const now = Date.now();
      if (now - lastHapticRef.current > 60) {
        hapticTurn();
        lastHapticRef.current = now;
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  }, [isPowered, getAngleFromEvent, onYearChange]);

  const rotation = yearToAngle(currentYear);
  const roundedYear = Math.round(currentYear);

  // Calculate the sliding position: 0% at MIN_YEAR, 100% at MAX_YEAR
  const progress = (roundedYear - MIN_YEAR) / TOTAL_RANGE;

  // Generate tick marks for every 10 years, labels for every 10
  const ticks = [];
  for (let y = 1950; y <= 2070; y += 5) {
    const isMajor = y % 10 === 0;
    const tickProgress = (y - MIN_YEAR) / TOTAL_RANGE;
    ticks.push({ year: y, progress: tickProgress, isMajor });
  }

  // The band width in px — wider = more spread out marks
  const bandWidth = 800;
  // Offset: move the band so `progress` position aligns with center of container
  const offsetPx = -(progress * bandWidth);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      {/* Frequency band display — old radio style */}
      <div className="freq-band-container">
        {/* The sliding band — left:50% centers origin, then translateX shifts by year */}
        <div
          className="freq-band"
          style={{
            width: `${bandWidth}px`,
            left: '50%',
            transform: `translateX(${offsetPx}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {ticks.map(({ year: y, progress: tp, isMajor }) => (
            <div
              key={y}
              className="freq-tick"
              style={{ left: `${tp * 100}%` }}
            >
              <div
                className={`freq-tick-line ${isMajor ? 'major' : 'minor'} ${
                  Math.abs(roundedYear - y) < 3 ? 'near' : ''
                }`}
              />
              {isMajor && (
                <span
                  className={`freq-tick-label ${
                    Math.abs(roundedYear - y) < 6 ? 'active' : ''
                  }`}
                >
                  {y}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Center needle indicator — fixed */}
        <div className="freq-needle" />

        {/* Edge fade masks are handled via CSS */}
      </div>

      {/* Knob */}
      <motion.div
        ref={knobRef}
        className="knob-outer"
        role="slider"
        aria-label="Year selector"
        aria-valuemin={1947}
        aria-valuemax={2077}
        aria-valuenow={roundedYear}
        aria-valuetext={`Year ${roundedYear}`}
        tabIndex={isPowered ? 0 : -1}
        onKeyDown={(e) => {
          if (!isPowered) return;
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onYearChange(Math.min(2077, currentYear + 1)); }
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onYearChange(Math.max(1947, currentYear - 1)); }
          if (e.key === 'PageUp') { e.preventDefault(); onYearChange(Math.min(2077, currentYear + 10)); }
          if (e.key === 'PageDown') { e.preventDefault(); onYearChange(Math.max(1947, currentYear - 10)); }
        }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        style={{ opacity: isPowered ? 1 : 0.5, touchAction: 'none' }}
        animate={{ rotate: rotation }}
        transition={{
          type: 'spring',
          stiffness: isDragging ? 800 : 200,
          damping: isDragging ? 50 : 25,
          mass: 0.8,
        }}
      >
        <div className="knob-middle">
          <div className="knob-inner">
            <div className="knob-indicator" />
          </div>
        </div>
      </motion.div>

      {/* Label */}
      <div className="flex items-center gap-2">
        <span className="text-[#555] text-[9px] sm:text-[10px] tracking-widest" style={{ fontFamily: 'Orbitron' }}>
          YEAR
        </span>
        {isDragging && (
          <span className="vfd-text text-[9px] sm:text-[10px]">
            {roundedYear}
          </span>
        )}
      </div>
    </div>
  );
}
