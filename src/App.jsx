import { motion, AnimatePresence } from 'framer-motion';
import PowerButton from './components/PowerButton';
import VFDDisplay from './components/VFDDisplay';
import YearDial from './components/YearDial';
import WorldMap from './components/WorldMap';
import SpeakerGrille from './components/SpeakerGrille';
import VolumeSlider from './components/VolumeSlider';
import NewsButton from './components/NewsButton';
import { useRadioAudio } from './hooks/useRadioAudio';

function App() {
  const {
    isPowered,
    isBooting,
    currentYear,
    currentCity,
    isTuning,
    isNewsBulletin,
    currentTrack,
    easterEgg,
    volume,
    displayYear,
    bootPhase,
    signalAcquired,
    isGlitching,
    radioRef,
    togglePower,
    onYearChange,
    onCityChange,
    onVolumeChange,
    triggerNewsBulletin,
  } = useRadioAudio();

  const isFuture = easterEgg?.type === 'future';

  return (
    <div className="app-container w-screen h-[100dvh] bg-[#0a0a0a] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      {/* Skip to content link for keyboard users */}
      <a
        href="#radio-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[#00e5c6] focus:text-black focus:px-4 focus:py-2 focus:rounded focus:text-sm focus:font-bold"
      >
        Skip to radio controls
      </a>

      {/* Ambient background glow */}
      <AnimatePresence>
        {isPowered && (
          <motion.div
            className="fixed inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] sm:w-[800px] sm:h-[600px] rounded-full"
              style={{
                background: easterEgg?.type === 'bttf'
                  ? 'radial-gradient(ellipse, rgba(255,179,71,0.08) 0%, transparent 70%)'
                  : easterEgg?.type === 'y2k'
                  ? 'radial-gradient(ellipse, rgba(0,255,65,0.08) 0%, transparent 70%)'
                  : easterEgg?.type === 'roswell'
                  ? 'radial-gradient(ellipse, rgba(0,255,100,0.06) 0%, transparent 70%)'
                  : isFuture
                  ? 'radial-gradient(ellipse, rgba(255,0,128,0.08) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse, rgba(0,229,198,0.06) 0%, transparent 70%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Radio Chassis */}
      <motion.div
        className="radio-chassis w-full max-w-2xl relative z-10 max-h-[calc(100dvh-16px)] sm:max-h-[calc(100dvh-32px)] overflow-y-auto overflow-x-hidden scrollbar-hide"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <main id="radio-main" className="relative z-10 p-3 sm:p-6 flex flex-col gap-3 sm:gap-4" aria-label="Time Traveler's Radio">
          {/* Top bar: Brand + Power + Controls */}
          <div className="flex items-center justify-between gap-2">
            {/* Left: Power + Brand */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <PowerButton
                isPowered={isPowered}
                onClick={togglePower}
                isBooting={isBooting}
              />
              <div className="min-w-0">
                <h1
                  className={`text-[10px] sm:text-sm font-bold tracking-[0.2em] sm:tracking-[0.3em] truncate ${
                    isFuture ? 'text-[#ff0080]' : isPowered ? 'text-[#00e5c6]' : 'text-[#333]'
                  }`}
                  style={{
                    fontFamily: 'Orbitron',
                    textShadow: isFuture
                      ? '0 0 10px rgba(255,0,128,0.4)'
                      : isPowered
                      ? '0 0 10px rgba(0,229,198,0.4)'
                      : 'none',
                  }}
                >
                  TIME TRAVELER'S
                </h1>
                <p
                  className={`text-[8px] sm:text-[10px] tracking-[0.4em] sm:tracking-[0.5em] ${
                    isFuture ? 'text-[#a000c8]' : isPowered ? 'text-[#00997f]' : 'text-[#222]'
                  }`}
                  style={{ fontFamily: 'Orbitron' }}
                >
                  RADIO
                </p>
              </div>
            </div>

            {/* Right: News + Volume */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <NewsButton
                onClick={triggerNewsBulletin}
                isPowered={isPowered && !isBooting}
                isNewsBulletin={isNewsBulletin}
              />
              <VolumeSlider
                volume={volume}
                onVolumeChange={onVolumeChange}
                isPowered={isPowered}
              />
            </div>
          </div>

          {/* VFD Display */}
          <VFDDisplay
            isPowered={isPowered}
            displayYear={displayYear}
            currentTrack={currentTrack}
            currentCity={currentCity}
            isTuning={isTuning}
            isNewsBulletin={isNewsBulletin}
            easterEgg={easterEgg}
            bootPhase={bootPhase}
            isGlitching={isGlitching}
            signalAcquired={signalAcquired}
          />

          {/* Speaker Grille */}
          <SpeakerGrille
            isPowered={isPowered}
            isNewsBulletin={isNewsBulletin}
            isTuning={isTuning}
            radioRef={radioRef}
            currentTrack={currentTrack}
            volume={volume}
          />

          {/* Controls row: Map + Dial — stacks on very small screens */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start">
            <div className="flex-1 w-full">
              <WorldMap
                currentCity={currentCity}
                onCityChange={onCityChange}
                isPowered={isPowered && !isBooting}
                signalAcquired={signalAcquired}
              />
            </div>

            <div className="flex-shrink-0">
              <YearDial
                currentYear={currentYear}
                onYearChange={onYearChange}
                isPowered={isPowered && !isBooting}
              />
            </div>
          </div>

          {/* Easter egg notification */}
          <AnimatePresence>
            {easterEgg && (
              <motion.div
                role="alert"
                aria-live="assertive"
                className={`text-center text-[10px] sm:text-xs py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg border ${
                  easterEgg.type === 'bttf'
                    ? 'border-amber-500/30 bg-amber-500/5 text-amber-400'
                    : easterEgg.type === 'y2k'
                    ? 'border-green-500/30 bg-green-500/5 text-green-400'
                    : easterEgg.type === 'roswell'
                    ? 'border-green-400/30 bg-green-400/5 text-green-300'
                    : easterEgg.type === 'future'
                    ? 'border-pink-500/30 bg-pink-500/5 text-pink-400'
                    : easterEgg.type === 'pirate'
                    ? 'border-[#00e5c6]/30 bg-[#00e5c6]/5 text-[#00e5c6]'
                    : 'border-[#00e5c6]/30 bg-[#00e5c6]/5 text-[#00e5c6]'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                style={{ fontFamily: 'Special Elite' }}
              >
                {easterEgg.type === 'roswell' && '👽 '}
                {easterEgg.type === 'moonLanding' && '🌙 '}
                {easterEgg.type === 'bttf' && '⚡ '}
                {easterEgg.type === 'y2k' && '💻 '}
                {easterEgg.type === 'future' && '🚀 '}
                {easterEgg.type === 'pirate' && '🏴‍☠️ '}
                {easterEgg.name}: {easterEgg.description}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="flex items-center justify-between text-[7px] sm:text-[8px] text-[#333] tracking-widest" aria-hidden="true" style={{ fontFamily: 'Orbitron' }}>
            <span>MODEL TTR-2024</span>
            <span className="hidden xs:inline">TEMPORAL AUDIO SYSTEMS</span>
            <span>SERIAL: {isPowered ? '88-MPH' : '------'}</span>
          </div>
        </main>
      </motion.div>
    </div>
  );
}

export default App;
