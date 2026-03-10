import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * SpeakerGrille — Hybrid equalizer visualizer.
 * Uses real AnalyserNode data when available (speech, static, effects),
 * and generates convincing simulated music bars when YouTube is playing.
 */
export default function SpeakerGrille({ isPowered, isNewsBulletin, isTuning, radioRef, currentTrack, volume = 0.8 }) {
  const animFrameRef = useRef(null);
  const [barHeights, setBarHeights] = useState(() => new Array(32).fill(2));

  // Simulated music state — persistent across frames
  const simRef = useRef({
    // Base frequency curve (bass-heavy shape)
    baseCurve: new Array(32).fill(0),
    // Per-bar phase offsets for organic movement
    phases: new Array(32).fill(0).map(() => Math.random() * Math.PI * 2),
    // Per-bar speed multipliers
    speeds: new Array(32).fill(0).map(() => 0.5 + Math.random() * 1.5),
    // Beat pulse state
    beatPhase: 0,
    beatInterval: 0.5, // ~120 BPM
    lastBeat: 0,
    beatDecay: 0,
    // Smoothed heights for interpolation
    smoothed: new Array(32).fill(2),
  });

  // Initialize the base frequency curve (bass-heavy, tapering to treble)
  useEffect(() => {
    const sim = simRef.current;
    for (let i = 0; i < 32; i++) {
      const t = i / 31;
      // Bass hump (0-0.15), mid presence (0.2-0.5), treble rolloff
      const bass = Math.exp(-((t - 0.08) ** 2) / 0.01) * 0.9;
      const mid = Math.exp(-((t - 0.35) ** 2) / 0.04) * 0.6;
      const presence = Math.exp(-((t - 0.6) ** 2) / 0.03) * 0.35;
      const rolloff = Math.max(0, 1 - t * 1.2) * 0.2;
      sim.baseCurve[i] = bass + mid + presence + rolloff;
    }
  }, []);

  const generateMusicBars = useCallback((time) => {
    const sim = simRef.current;
    const vol = volume;
    const heights = [];

    // Advance beat
    sim.beatPhase += 0.016; // ~60fps
    if (sim.beatPhase >= sim.beatInterval) {
      sim.beatPhase = 0;
      sim.beatDecay = 1.0;
      // Slight randomization of beat timing for human feel
      sim.beatInterval = 0.45 + Math.random() * 0.1;
    }
    sim.beatDecay *= 0.92; // Exponential decay

    for (let i = 0; i < 32; i++) {
      const t = i / 31;

      // Base shape from frequency curve
      let h = sim.baseCurve[i];

      // Organic wave motion per bar
      const wave = Math.sin(time * 0.001 * sim.speeds[i] + sim.phases[i]);
      const wave2 = Math.sin(time * 0.0007 * sim.speeds[i] * 1.3 + sim.phases[i] * 2.1);
      h += wave * 0.15 + wave2 * 0.08;

      // Beat pulse — stronger on bass, lighter on treble
      const beatWeight = Math.max(0, 1 - t * 2);
      h += sim.beatDecay * beatWeight * 0.4;

      // Random micro-variation (simulates transients)
      h += (Math.random() - 0.5) * 0.08;

      // Scale by volume and map to pixel height (2-55px)
      h = Math.max(0, h) * vol;
      const px = 2 + h * 53;

      // Smooth interpolation (prevents jitter)
      sim.smoothed[i] += (px - sim.smoothed[i]) * 0.3;
      heights.push(Math.max(2, sim.smoothed[i]));
    }

    return heights;
  }, [volume]);

  useEffect(() => {
    if (!isPowered) {
      setBarHeights(new Array(32).fill(2));
      return;
    }

    const isMusicPlaying = !!currentTrack?.ytId;

    const draw = (time) => {
      const radio = radioRef?.current;
      let useReal = false;
      let realHeights = null;

      // Try to get real analyser data
      if (radio?.isInitialized) {
        const data = radio.getAnalyserData();
        if (data) {
          // Check if there's meaningful audio (not just silence)
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length;

          if (avg > 5) {
            // Real audio is playing (speech, effects, static)
            useReal = true;
            realHeights = [];
            const binCount = data.length;
            for (let i = 0; i < 32; i++) {
              const binIndex = Math.floor((i / 32) * binCount);
              const nextBin = Math.min(binIndex + 2, binCount - 1);
              const binAvg = (data[binIndex] + data[nextBin]) / 2;
              realHeights.push(2 + (binAvg / 255) * 53);
            }
          }
        }
      }

      if (useReal && realHeights) {
        // Blend real analyser data with music sim if both active
        if (isMusicPlaying && !isTuning) {
          const musicHeights = generateMusicBars(time);
          const blended = realHeights.map((rh, i) => Math.max(rh, musicHeights[i]));
          setBarHeights(blended);
        } else {
          setBarHeights(realHeights);
        }
      } else if (isMusicPlaying && !isTuning) {
        // YouTube music only — use simulated bars
        setBarHeights(generateMusicBars(time));
      } else {
        // Nothing playing — flat
        setBarHeights(prev => prev.map(h => h + (2 - h) * 0.1));
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPowered, radioRef, currentTrack, isTuning, generateMusicBars]);

  const barColor = isNewsBulletin ? '#ffb347' : '#00e5c6';
  const barOpacity = isTuning ? 0.3 : 0.6;

  return (
    <div className="speaker-grille w-full relative flex items-center justify-center" aria-hidden="true">
      {/* Speaker holes pattern */}
      <div className="absolute inset-2 opacity-40">
        <svg viewBox="0 0 200 60" className="w-full h-full">
          {Array.from({ length: 20 }).map((_, row) =>
            Array.from({ length: 40 }).map((_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={col * 5 + 2.5}
                cy={row * 3.2 + 1.6}
                r="0.8"
                fill="#2a2a2a"
              />
            ))
          )}
        </svg>
      </div>

      {/* Active visualization — hybrid analyser + simulated bars */}
      {isPowered && (
        <div className="absolute inset-4 flex items-end justify-center gap-[2px] z-10">
          {barHeights.map((height, i) => (
            <div
              key={i}
              className="w-[3px] rounded-t-sm"
              style={{
                backgroundColor: barColor,
                opacity: barOpacity,
                height: `${height}px`,
                transition: 'height 0.06s ease-out',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
