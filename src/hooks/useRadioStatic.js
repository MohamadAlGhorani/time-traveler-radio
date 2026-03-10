import { useRef, useEffect } from 'react';

/**
 * useRadioStatic — Procedural hum + static using OscillatorNode & GainNode.
 *
 * When `isTuning` is true, static volume ramps up.
 * When false, it drops to a low ambient hum.
 * Requires a running AudioContext (passed as `ctx`).
 * Connect point is `destinationNode` (typically the master gain).
 */
export function useRadioStatic(ctx, destinationNode, isTuning, isPowered) {
  const nodesRef = useRef(null);

  useEffect(() => {
    if (!ctx || !destinationNode || !isPowered) {
      // Clean up if powered off
      if (nodesRef.current) {
        try { nodesRef.current.hum.stop(); } catch(e) {}
        try { nodesRef.current.noise.stop(); } catch(e) {}
        nodesRef.current = null;
      }
      return;
    }

    // Only create nodes once per power cycle
    if (!nodesRef.current) {
      // ── 60Hz hum (mains transformer buzz) ──
      const hum = ctx.createOscillator();
      hum.type = 'sine';
      hum.frequency.value = 60;

      const humHarmonic = ctx.createOscillator();
      humHarmonic.type = 'sine';
      humHarmonic.frequency.value = 120;

      const humGain = ctx.createGain();
      humGain.gain.value = 0.02;

      const humHarmonicGain = ctx.createGain();
      humHarmonicGain.gain.value = 0.008;

      hum.connect(humGain).connect(destinationNode);
      humHarmonic.connect(humHarmonicGain).connect(destinationNode);

      hum.start();
      humHarmonic.start();

      // ── White noise for static ──
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Shape with bandpass for "radio static" character
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 4000;
      noiseFilter.Q.value = 0.7;

      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0; // starts silent

      noise.connect(noiseFilter).connect(noiseGain).connect(destinationNode);
      noise.start();

      nodesRef.current = {
        hum, humHarmonic, humGain, humHarmonicGain,
        noise, noiseFilter, noiseGain,
      };
    }

    // ── React to isTuning changes ──
    const { noiseGain, humGain } = nodesRef.current;
    const now = ctx.currentTime;

    if (isTuning) {
      // Ramp static up, boost hum
      noiseGain.gain.linearRampToValueAtTime(0.25, now + 0.15);
      humGain.gain.linearRampToValueAtTime(0.04, now + 0.15);
    } else {
      // Ramp static down to near-silence, hum back to ambient
      noiseGain.gain.linearRampToValueAtTime(0.005, now + 0.3);
      humGain.gain.linearRampToValueAtTime(0.015, now + 0.3);
    }
  }, [ctx, destinationNode, isTuning, isPowered]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (nodesRef.current) {
        try { nodesRef.current.hum.stop(); } catch(e) {}
        try { nodesRef.current.humHarmonic.stop(); } catch(e) {}
        try { nodesRef.current.noise.stop(); } catch(e) {}
        nodesRef.current = null;
      }
    };
  }, []);
}

export default useRadioStatic;
