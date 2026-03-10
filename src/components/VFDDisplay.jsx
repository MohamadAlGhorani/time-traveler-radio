import { motion, AnimatePresence } from 'framer-motion';

export default function VFDDisplay({
  isPowered,
  displayYear,
  currentTrack,
  currentCity,
  isTuning,
  isNewsBulletin,
  easterEgg,
  bootPhase,
  isGlitching,
  signalAcquired,
}) {
  if (!isPowered) {
    return (
      <div className="vfd-display w-full h-40 flex items-center justify-center">
        <span className="text-[#0a1a18] text-lg font-bold select-none" style={{ fontFamily: 'Orbitron' }}>
          ████████
        </span>
      </div>
    );
  }

  const yearStr = String(displayYear).padStart(4, '0');
  const isFlux = easterEgg?.type === 'bttf';
  const isY2K = easterEgg?.type === 'y2k';
  const isRoswell = easterEgg?.type === 'roswell';
  const isFuture = easterEgg?.type === 'future';

  // Dynamic classes
  const glitchClass = isGlitching ? 'year-glitch' : '';
  const y2kClass = isY2K ? 'y2k-glitch' : '';
  const tuningBlur = isTuning ? 'vfd-tuning-blur' : '';

  return (
    <div className={`vfd-display w-full h-40 relative ${y2kClass} ${isFuture ? 'vfd-neon-pink' : ''}`} role="status" aria-live="polite" aria-label="Radio display">
      <div className="scanline-overlay" />
      <div className="scanline-bar" />

      <div className={`relative z-5 flex flex-col items-center justify-center h-full px-4 py-3 ${tuningBlur}`}>
        {/* Year Display */}
        <motion.div
          className={`vfd-flicker text-4xl font-black tracking-widest ${glitchClass} ${
            isFuture ? 'vfd-text-pink' : isFlux ? 'flux-capacitor vfd-text-amber' : 'vfd-text'
          }`}
          key={yearStr}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          {isY2K ? '?????' : yearStr}
        </motion.div>

        {/* City */}
        <div className={`text-xs mt-1 opacity-70 tracking-wider ${isFuture ? 'vfd-text-pink' : 'vfd-text'}`}>
          {currentCity?.toUpperCase() || 'SCANNING...'}
        </div>

        {/* Status Line */}
        <div className="mt-2 w-full">
          <AnimatePresence mode="wait">
            {bootPhase === 'engine' && (
              <StatusLine key="engine" text="▶ IGNITION SEQUENCE..." />
            )}
            {bootPhase === 'flipping' && (
              <StatusLine key="flipping" text="▶ SCANNING FREQUENCIES..." />
            )}
            {bootPhase === 'welcome' && (
              <StatusLine key="welcome" text="▶ SYNCING TEMPORAL COORDINATES..." />
            )}
            {signalAcquired && bootPhase === 'ready' && (
              <StatusLine key="signal" text="📡 SIGNAL ACQUIRED" flash />
            )}
            {isTuning && !signalAcquired && bootPhase === 'ready' && (
              <StatusLine key="tuning" text="◎ TUNING..." amber />
            )}
            {isNewsBulletin && !isTuning && !signalAcquired && bootPhase === 'ready' && (
              <StatusLine
                key="news"
                text="📡 NEWS BULLETIN"
                amber
                pulse
                blinkRed={isY2K}
              />
            )}
            {easterEgg && !isTuning && !signalAcquired && bootPhase === 'ready' && (
              <StatusLine
                key="easter"
                text={`⚡ ${easterEgg.description?.toUpperCase()}`}
                amber={isFlux}
                pink={isFuture}
              />
            )}
            {!isTuning && !isNewsBulletin && !easterEgg && !signalAcquired && bootPhase === 'ready' && currentTrack && (
              <TrackDisplay key="track" track={currentTrack} isFuture={isFuture} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Y2K Matrix Rain overlay */}
      {isY2K && <MatrixRain />}

      {/* Flux Capacitor glow overlay */}
      {isFlux && (
        <div className="absolute inset-0 bg-amber-500/5 flux-capacitor rounded-lg pointer-events-none" />
      )}

      {/* Roswell overlay */}
      {isRoswell && (
        <div className="absolute inset-0 bg-green-500/5 pointer-events-none rounded-lg" />
      )}

      {/* Cyberpunk 2077 neon overlay */}
      {isFuture && (
        <div className="absolute inset-0 pointer-events-none rounded-lg"
          style={{ background: 'linear-gradient(180deg, rgba(255,0,128,0.04) 0%, rgba(128,0,255,0.06) 100%)' }}
        />
      )}
    </div>
  );
}

function StatusLine({ text, amber = false, pulse = false, flash = false, blinkRed = false, pink = false }) {
  return (
    <motion.div
      className={`text-xs text-center tracking-wider ${
        pink ? 'vfd-text-pink' : amber ? 'vfd-text-amber' : 'vfd-text'
      } ${pulse ? 'bulletin-active' : ''} ${blinkRed ? 'blink-red' : ''} ${flash ? 'signal-flash' : ''}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 0.9, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.3 }}
    >
      {text}
    </motion.div>
  );
}

function TrackDisplay({ track, isFuture }) {
  return (
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 0.8, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`text-xs truncate ${isFuture ? 'vfd-text-pink' : 'vfd-text'}`}>{track.title}</div>
      <div className={`text-[10px] opacity-60 truncate ${isFuture ? 'vfd-text-pink' : 'vfd-text'}`}>{track.artist}</div>
    </motion.div>
  );
}

function MatrixRain() {
  const chars = '0123456789ABCDEF!@#$%^&*';
  const columns = 20;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg z-30">
      {Array.from({ length: columns }).map((_, i) => (
        <span
          key={i}
          className="matrix-char"
          style={{
            left: `${(i / columns) * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random() * 2}s`,
          }}
        >
          {chars[Math.floor(Math.random() * chars.length)]}
        </span>
      ))}
    </div>
  );
}
