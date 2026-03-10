/**
 * RadioManager — Web Audio API engine for Time Traveler's Radio
 *
 * Handles: audio context, gain nodes, filters, oscillators,
 * sound textures (hiss/static), era filters, audio ducking,
 * AnalyserNode for real-time visualization, and the ignition sequence.
 */

/* ── Voice selection ──────────────────────────────────────────── */

function rankVoice(v) {
  const n = v.name.toLowerCase();
  let score = 0;
  if (n.includes('natural'))   score += 120;
  if (n.includes('enhanced'))  score += 110;
  if (n.includes('premium'))   score += 100;
  if (n.includes('samantha'))  score += 85;
  if (n.includes('karen'))     score += 80;
  if (n.includes('daniel'))    score += 80;
  if (n.includes('moira'))     score += 78;
  if (n.includes('alex'))      score += 75;
  if (n.includes('tom'))       score += 72;
  if (n.includes('fiona'))     score += 70;
  if (n.includes('google'))    score += 60;
  if (n.includes('online') || n.includes('neural'))  score += 55;
  if (!v.localService)         score += 30;
  if (v.lang === 'en-US')      score += 10;
  if (v.lang === 'en-GB')      score += 8;
  if (n.includes('compact') || n.includes('novelty') || n.includes('zarvox') ||
      n.includes('whisper') || n.includes('bells') || n.includes('boing') ||
      n.includes('bubbles') || n.includes('cellos') || n.includes('trinoids'))
    score -= 80;
  return score;
}

function pickVoice(voices, preferGender) {
  const english = voices.filter(v => v.lang.startsWith('en'));
  if (english.length === 0) return null;
  const sorted = [...english].sort((a, b) => rankVoice(b) - rankVoice(a));
  if (preferGender) {
    const maleHints = ['daniel', 'alex', 'tom', 'james', 'guy', 'lee', 'rishi', 'aaron', 'david', 'male', 'jorge'];
    const femaleHints = ['samantha', 'karen', 'moira', 'fiona', 'victoria', 'kate', 'allison', 'ava', 'susan', 'zira', 'female', 'siri'];
    const hints = preferGender === 'male' ? maleHints : femaleHints;
    const match = sorted.find(v => hints.some(h => v.name.toLowerCase().includes(h)));
    if (match) return match;
  }
  return sorted[0];
}

function getEraGender(eraStyle) {
  switch (eraStyle) {
    case 'formal':       return 'male';
    case 'authoritative': return 'male';
    case 'smooth':       return 'male';
    case 'energetic':    return 'male';
    case 'cynical':      return 'female';
    case 'polished':     return 'female';
    case 'digital':      return 'female';
    case 'podcast':      return 'male';
    default:             return null;
  }
}

/* ── RadioManager class ───────────────────────────────────────── */

export class RadioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.hissGain = null;
    this.newsGain = null;
    this.eraFilter = null;
    this.eraFilterHigh = null;
    this.compressor = null;
    this.analyser = null;        // AnalyserNode for visualizer
    this.analyserData = null;    // Uint8Array for frequency data
    this.hissNode = null;
    this.isInitialized = false;
    this.currentYear = new Date().getFullYear();
    this.isTuning = false;
    this.tuningOsc = null;
    this.speechSynth = window.speechSynthesis;
    this.currentUtterance = null;
    this.onNewsStart = null;
    this.onNewsEnd = null;
    this.voicesReady = false;
    this._cyberpunkNodes = null; // for looping cyberpunk synth

    this._ensureVoices();
  }

  _ensureVoices() {
    if (!this.speechSynth) return;
    const voices = this.speechSynth.getVoices();
    if (voices.length > 0) { this.voicesReady = true; return; }
    this.speechSynth.addEventListener?.('voiceschanged', () => { this.voicesReady = true; });
  }

  _getVoices() {
    return this.speechSynth?.getVoices() || [];
  }

  async init() {
    if (this.isInitialized) return;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Mobile browsers suspend AudioContext until a user gesture resumes it
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Prime speech synthesis on iOS (must be triggered from user gesture)
    if (this.speechSynth) {
      const primer = new SpeechSynthesisUtterance('');
      primer.volume = 0;
      this.speechSynth.speak(primer);
    }

    // ── AnalyserNode ──
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 128;           // 64 frequency bins
    this.analyser.smoothingTimeConstant = 0.75;
    this.analyserData = new Uint8Array(this.analyser.frequencyBinCount);

    // Master gain → analyser → destination
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Music chain
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.6;
    this.eraFilter = this.ctx.createBiquadFilter();
    this.eraFilter.type = 'highpass';
    this.eraFilter.frequency.value = 20;
    this.eraFilterHigh = this.ctx.createBiquadFilter();
    this.eraFilterHigh.type = 'lowpass';
    this.eraFilterHigh.frequency.value = 20000;
    this.compressor = this.ctx.createDynamicsCompressor();
    this.musicGain.connect(this.eraFilter).connect(this.eraFilterHigh).connect(this.compressor).connect(this.masterGain);

    // SFX gain
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.masterGain);

    // Hiss gain
    this.hissGain = this.ctx.createGain();
    this.hissGain.gain.value = 0;
    this.hissGain.connect(this.masterGain);

    // News gain
    this.newsGain = this.ctx.createGain();
    this.newsGain.gain.value = 0.8;
    this.newsGain.connect(this.masterGain);

    this.isInitialized = true;
  }

  /* ── AnalyserNode access ─────────────────────────────────── */

  getAnalyserData() {
    if (!this.analyser || !this.analyserData) return null;
    this.analyser.getByteFrequencyData(this.analyserData);
    return this.analyserData;
  }

  /* ── Era filters ─────────────────────────────────────────── */

  applyEraFilter(year) {
    if (!this.isInitialized) return;
    this.currentYear = year;
    const now = this.ctx.currentTime;

    if (year < 1960) {
      this.eraFilter.frequency.linearRampToValueAtTime(300, now + 0.3);
      this.eraFilterHigh.frequency.linearRampToValueAtTime(4000, now + 0.3);
      this.compressor.threshold.linearRampToValueAtTime(-20, now + 0.3);
      this.compressor.ratio.linearRampToValueAtTime(4, now + 0.3);
      this.hissGain.gain.linearRampToValueAtTime(0.15, now + 0.3);
    } else if (year < 1970) {
      this.eraFilter.frequency.linearRampToValueAtTime(200, now + 0.3);
      this.eraFilterHigh.frequency.linearRampToValueAtTime(6000, now + 0.3);
      this.compressor.threshold.linearRampToValueAtTime(-18, now + 0.3);
      this.compressor.ratio.linearRampToValueAtTime(3, now + 0.3);
      this.hissGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
    } else if (year < 1980) {
      this.eraFilter.frequency.linearRampToValueAtTime(80, now + 0.3);
      this.eraFilterHigh.frequency.linearRampToValueAtTime(10000, now + 0.3);
      this.compressor.threshold.linearRampToValueAtTime(-15, now + 0.3);
      this.compressor.ratio.linearRampToValueAtTime(2.5, now + 0.3);
      this.hissGain.gain.linearRampToValueAtTime(0.08, now + 0.3);
    } else if (year < 1990) {
      this.eraFilter.frequency.linearRampToValueAtTime(60, now + 0.3);
      this.eraFilterHigh.frequency.linearRampToValueAtTime(12000, now + 0.3);
      this.compressor.threshold.linearRampToValueAtTime(-12, now + 0.3);
      this.compressor.ratio.linearRampToValueAtTime(6, now + 0.3);
      this.hissGain.gain.linearRampToValueAtTime(0.04, now + 0.3);
    } else if (year < 2000) {
      this.eraFilter.frequency.linearRampToValueAtTime(40, now + 0.3);
      this.eraFilterHigh.frequency.linearRampToValueAtTime(15000, now + 0.3);
      this.compressor.threshold.linearRampToValueAtTime(-10, now + 0.3);
      this.compressor.ratio.linearRampToValueAtTime(8, now + 0.3);
      this.hissGain.gain.linearRampToValueAtTime(0.02, now + 0.3);
    } else {
      this.eraFilter.frequency.linearRampToValueAtTime(20, now + 0.3);
      this.eraFilterHigh.frequency.linearRampToValueAtTime(20000, now + 0.3);
      this.compressor.threshold.linearRampToValueAtTime(-24, now + 0.3);
      this.compressor.ratio.linearRampToValueAtTime(2, now + 0.3);
      this.hissGain.gain.linearRampToValueAtTime(0, now + 0.3);
    }
  }

  /* ── Hiss / noise texture ────────────────────────────────── */

  startHiss() {
    if (!this.isInitialized || this.hissNode) return;
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    this.hissNode = this.ctx.createBufferSource();
    this.hissNode.buffer = buffer;
    this.hissNode.loop = true;
    const hissFilter = this.ctx.createBiquadFilter();
    hissFilter.type = 'bandpass';
    hissFilter.frequency.value = 3000;
    hissFilter.Q.value = 0.5;
    this.hissNode.connect(hissFilter);
    hissFilter.connect(this.hissGain);
    this.hissNode.start();
  }

  stopHiss() {
    if (this.hissNode) { this.hissNode.stop(); this.hissNode = null; }
  }

  /* ── Tuning static ──────────────────────────────────────── */

  startTuning() {
    if (!this.isInitialized || this.isTuning) return;
    this.isTuning = true;
    const bufferSize = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    this.tuningOsc = this.ctx.createBufferSource();
    this.tuningOsc.buffer = buffer;
    this.tuningOsc.loop = true;
    const tuningGain = this.ctx.createGain();
    tuningGain.gain.value = 0.3;
    this.tuningOsc.connect(tuningGain);
    tuningGain.connect(this.sfxGain);
    this.tuningOsc.start();
    this.musicGain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
  }

  stopTuning() {
    if (this.tuningOsc) { this.tuningOsc.stop(); this.tuningOsc = null; }
    this.isTuning = false;
    if (this.isInitialized) {
      this.musicGain.gain.linearRampToValueAtTime(0.6, this.ctx.currentTime + 0.3);
    }
  }

  /* ── Audio ducking ──────────────────────────────────────── */

  duckMusic() {
    if (!this.isInitialized) return;
    this.musicGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.5);
  }

  unduckMusic() {
    if (!this.isInitialized) return;
    this.musicGain.gain.linearRampToValueAtTime(0.6, this.ctx.currentTime + 0.5);
  }

  /* ── Speech ─────────────────────────────────────────────── */

  speakBulletin(script, persona) {
    if (!this.speechSynth) return;
    this.speechSynth.cancel();
    this.duckMusic();
    this.onNewsStart?.();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = persona?.rate || 1.0;
    utterance.pitch = persona?.pitch || 1.0;
    utterance.volume = 0.9;
    const voices = this._getVoices();
    const gender = getEraGender(persona?.style);
    const voice = pickVoice(voices, gender);
    if (voice) utterance.voice = voice;
    utterance.onend = () => { this.unduckMusic(); this.onNewsEnd?.(); this.currentUtterance = null; };
    utterance.onerror = () => { this.unduckMusic(); this.onNewsEnd?.(); this.currentUtterance = null; };
    this.currentUtterance = utterance;
    this.speechSynth.speak(utterance);
  }

  speakWelcome(city, year) {
    if (!this.speechSynth) return Promise.resolve();
    return new Promise((resolve) => {
      const script = `System check complete. Welcome to the Time Traveler's Radio. We are currently synced to ${city}, ${year}. The dial is yours. Where, and when, to next?`;
      const utterance = new SpeechSynthesisUtterance(script);
      utterance.rate = 0.92;
      utterance.pitch = 0.9;
      utterance.volume = 0.95;
      const voices = this._getVoices();
      const voice = pickVoice(voices, 'male');
      if (voice) utterance.voice = voice;
      utterance.onend = resolve;
      utterance.onerror = resolve;
      this.speechSynth.speak(utterance);
    });
  }

  /* ── Ignition sounds ────────────────────────────────────── */

  playEngineStart() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 30;
    osc.frequency.linearRampToValueAtTime(60, now + 1.5);
    const oscGain = this.ctx.createGain();
    oscGain.gain.value = 0.3;
    oscGain.gain.linearRampToValueAtTime(0.15, now + 1.5);
    oscGain.gain.linearRampToValueAtTime(0.05, now + 3);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    osc.connect(filter).connect(oscGain).connect(this.sfxGain);
    osc.start();
    osc.stop(now + 3);

    const starter = this.ctx.createOscillator();
    starter.type = 'square';
    starter.frequency.value = 80;
    starter.frequency.linearRampToValueAtTime(200, now + 0.8);
    starter.frequency.linearRampToValueAtTime(120, now + 1.2);
    const starterGain = this.ctx.createGain();
    starterGain.gain.value = 0.1;
    starterGain.gain.linearRampToValueAtTime(0, now + 1.5);
    starter.connect(starterGain).connect(this.sfxGain);
    starter.start();
    starter.stop(now + 1.5);
  }

  playFrequencyFlip() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 12; i++) {
      const startTime = now + (i * 3 / 12);
      const segDuration = 3 / 12;
      const osc = this.ctx.createOscillator();
      osc.type = ['sine', 'square', 'sawtooth', 'triangle'][i % 4];
      osc.frequency.value = 200 + Math.random() * 2000;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, startTime + segDuration - 0.02);
      osc.connect(gain).connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + segDuration);
    }
  }

  /* ── Easter egg sounds ──────────────────────────────────── */

  playTheremin() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    for (let i = 0; i < 20; i++) osc.frequency.linearRampToValueAtTime(300 + Math.random() * 400, now + i * 0.3);
    const vibrato = this.ctx.createOscillator();
    vibrato.type = 'sine';
    vibrato.frequency.value = 6;
    const vibratoGain = this.ctx.createGain();
    vibratoGain.gain.value = 20;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    const gain = this.ctx.createGain();
    gain.gain.value = 0.3;
    gain.gain.linearRampToValueAtTime(0, now + 6);
    osc.connect(gain).connect(this.sfxGain);
    vibrato.start(now);
    osc.start(now);
    osc.stop(now + 6);
    vibrato.stop(now + 6);
  }

  playMorseCode(message = '... --- ...') {
    if (!this.isInitialized) return;
    let t = this.ctx.currentTime;
    for (const char of message) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 800;
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      if (char === '.') {
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.setValueAtTime(0, t + 0.1);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.11); t += 0.2;
      } else if (char === '-') {
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.setValueAtTime(0, t + 0.3);
        osc.connect(gain).connect(this.sfxGain);
        osc.start(t); osc.stop(t + 0.31); t += 0.4;
      } else { t += 0.3; }
    }
  }

  /**
   * Apollo 11 radio chatter — overlapping crackly voices + static
   */
  playApolloChatter() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;

    // Crackling radio static bed
    const bufSize = this.ctx.sampleRate * 6;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * 0.15;
      if (Math.random() < 0.002) d[i] *= 4; // random crackle pops
    }
    const staticSrc = this.ctx.createBufferSource();
    staticSrc.buffer = buf;
    const staticFilter = this.ctx.createBiquadFilter();
    staticFilter.type = 'bandpass';
    staticFilter.frequency.value = 2000;
    staticFilter.Q.value = 1.5;
    const staticGain = this.ctx.createGain();
    staticGain.gain.value = 0.25;
    staticGain.gain.linearRampToValueAtTime(0, now + 6);
    staticSrc.connect(staticFilter).connect(staticGain).connect(this.sfxGain);
    staticSrc.start(now);
    staticSrc.stop(now + 6);

    // Simulated "radio beeps" (the quindar tones from mission control)
    [0, 1.5, 3.5].forEach(offset => {
      const beep = this.ctx.createOscillator();
      beep.type = 'sine';
      beep.frequency.value = 2525;
      const bg = this.ctx.createGain();
      bg.gain.setValueAtTime(0, now + offset);
      bg.gain.linearRampToValueAtTime(0.15, now + offset + 0.01);
      bg.gain.setValueAtTime(0.15, now + offset + 0.25);
      bg.gain.linearRampToValueAtTime(0, now + offset + 0.27);
      beep.connect(bg).connect(this.sfxGain);
      beep.start(now + offset);
      beep.stop(now + offset + 0.3);
    });
  }

  playModemDialup() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const dial1 = this.ctx.createOscillator(); dial1.frequency.value = 350;
    const dial2 = this.ctx.createOscillator(); dial2.frequency.value = 440;
    const dialGain = this.ctx.createGain();
    dialGain.gain.setValueAtTime(0.15, now);
    dialGain.gain.setValueAtTime(0, now + 0.5);
    dial1.connect(dialGain).connect(this.sfxGain);
    dial2.connect(dialGain);
    dial1.start(now); dial2.start(now);
    dial1.stop(now + 0.5); dial2.stop(now + 0.5);

    [1070, 1270, 2025, 2225, 1800, 980].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'square'; osc.frequency.value = freq;
      const gain = this.ctx.createGain();
      const start = now + 0.6 + i * 0.4;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.05);
      gain.gain.setValueAtTime(0.1, start + 0.35);
      gain.gain.linearRampToValueAtTime(0, start + 0.4);
      osc.connect(gain).connect(this.sfxGain);
      osc.start(start); osc.stop(start + 0.4);
    });
  }

  /**
   * Cyberpunk looping synth — stays playing until stopCyberpunkLoop() is called
   */
  startCyberpunkLoop() {
    if (!this.isInitialized || this._cyberpunkNodes) return;

    const now = this.ctx.currentTime;

    // Deep bass pad (looping via oscillator)
    const bass = this.ctx.createOscillator();
    bass.type = 'sawtooth';
    bass.frequency.value = 55;

    const bassFilter = this.ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 300;

    // LFO to sweep the filter cutoff
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 400;
    lfo.connect(lfoGain);
    lfoGain.connect(bassFilter.frequency);

    const bassGain = this.ctx.createGain();
    bassGain.gain.value = 0.18;

    bass.connect(bassFilter).connect(bassGain).connect(this.sfxGain);
    lfo.start(now);
    bass.start(now);

    // High arp pad
    const pad = this.ctx.createOscillator();
    pad.type = 'triangle';
    pad.frequency.value = 220;
    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.06;
    pad.connect(padGain).connect(this.sfxGain);
    pad.start(now);

    this._cyberpunkNodes = { bass, lfo, pad, bassGain, padGain };
  }

  stopCyberpunkLoop() {
    if (!this._cyberpunkNodes) return;
    const { bass, lfo, pad } = this._cyberpunkNodes;
    try { bass.stop(); } catch(e) {}
    try { lfo.stop(); } catch(e) {}
    try { pad.stop(); } catch(e) {}
    this._cyberpunkNodes = null;
  }

  playCyberpunkSynth() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;
    const bass = this.ctx.createOscillator();
    bass.type = 'sawtooth'; bass.frequency.value = 55;
    const bf = this.ctx.createBiquadFilter();
    bf.type = 'lowpass'; bf.frequency.value = 200;
    bf.frequency.linearRampToValueAtTime(800, now + 4);
    bf.frequency.linearRampToValueAtTime(200, now + 8);
    const bg = this.ctx.createGain();
    bg.gain.value = 0.2;
    bg.gain.linearRampToValueAtTime(0, now + 8);
    bass.connect(bf).connect(bg).connect(this.sfxGain);
    bass.start(now); bass.stop(now + 8);

    [130.81, 164.81, 196, 261.63, 329.63, 261.63, 196, 164.81].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'square'; osc.frequency.value = freq;
      const g = this.ctx.createGain();
      const s = now + i * 0.25;
      g.gain.setValueAtTime(0.15, s);
      g.gain.linearRampToValueAtTime(0, s + 0.2);
      osc.connect(g).connect(this.sfxGain);
      osc.start(s); osc.stop(s + 0.25);
    });
  }

  playPirateStatic() {
    if (!this.isInitialized) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() > 0.5 ? 1 : -1) * Math.random() * 0.3;
      if (i % 4 !== 0) data[i] = data[i - (i % 4)];
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain(); gain.gain.value = 0.2;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 1500; filter.Q.value = 2;
    source.connect(filter).connect(gain).connect(this.sfxGain);
    source.start();
    return source;
  }

  playTone(frequency, duration, type = 'sine', volume = 0.2) {
    if (!this.isInitialized) return;
    const osc = this.ctx.createOscillator();
    osc.type = type; osc.frequency.value = frequency;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
    osc.connect(gain).connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  setVolume(value) {
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, value)), this.ctx.currentTime + 0.1);
    }
  }

  dispose() {
    this.speechSynth?.cancel();
    this.stopHiss();
    this.stopTuning();
    this.stopCyberpunkLoop();
    if (this.ctx && this.ctx.state !== 'closed') this.ctx.close();
    this.isInitialized = false;
  }
}

export default RadioManager;
