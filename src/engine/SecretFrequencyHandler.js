/**
 * SecretFrequencyHandler — Easter egg detection and execution
 */

const EASTER_EGGS = {
  roswell: {
    year: 1947,
    name: 'Roswell Incident',
    description: 'Alien signal detected',
  },
  moonLanding: {
    year: 1969,
    name: 'Moon Landing',
    description: 'One small step for man...',
  },
  bttf: {
    year: 1985,
    name: 'Back to the Future',
    description: 'Great Scott!',
  },
  y2k: {
    year: 1999,
    name: 'Y2K Bug',
    description: 'System error detected',
  },
  future: {
    year: 2077,
    name: 'Cyberpunk Future',
    description: 'Welcome to Night City',
  },
};

function pickBestVoice(preferGender) {
  const synth = window.speechSynthesis;
  const voices = synth.getVoices().filter(v => v.lang.startsWith('en'));
  if (voices.length === 0) return null;

  const rank = (v) => {
    const n = v.name.toLowerCase();
    let s = 0;
    if (n.includes('natural'))  s += 120;
    if (n.includes('enhanced')) s += 110;
    if (n.includes('premium'))  s += 100;
    if (n.includes('samantha') || n.includes('karen') || n.includes('daniel'))  s += 85;
    if (n.includes('alex') || n.includes('tom') || n.includes('moira'))  s += 75;
    if (n.includes('google'))   s += 60;
    if (n.includes('online') || n.includes('neural'))  s += 55;
    if (!v.localService)        s += 30;
    if (v.lang === 'en-US')     s += 10;
    if (n.includes('compact') || n.includes('novelty') || n.includes('zarvox') ||
        n.includes('bells') || n.includes('boing') || n.includes('trinoids'))  s -= 80;
    return s;
  };

  const sorted = [...voices].sort((a, b) => rank(b) - rank(a));

  if (preferGender) {
    const maleHints = ['daniel', 'alex', 'tom', 'james', 'guy', 'male'];
    const femaleHints = ['samantha', 'karen', 'moira', 'fiona', 'victoria', 'female'];
    const hints = preferGender === 'male' ? maleHints : femaleHints;
    const match = sorted.find(v => hints.some(h => v.name.toLowerCase().includes(h)));
    if (match) return match;
  }

  return sorted[0];
}

function speak(text, { rate = 1, pitch = 1, volume = 0.9, gender = null } = {}) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;
  const voice = pickBestVoice(gender);
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

export class SecretFrequencyHandler {
  constructor(radioManager) {
    this.radio = radioManager;
    this.activeEgg = null;
    this.pirateSource = null;
  }

  check(year) {
    if (year % 1 !== 0 && Math.abs(year % 1 - 0.5) < 0.2) {
      return { type: 'pirate', ...this.getPirateRadio(year) };
    }

    const roundedYear = Math.round(year);

    if (roundedYear === 1947) return { type: 'roswell', ...EASTER_EGGS.roswell };
    if (roundedYear === 1969) return { type: 'moonLanding', ...EASTER_EGGS.moonLanding };
    if (roundedYear === 1985) return { type: 'bttf', ...EASTER_EGGS.bttf };
    if (roundedYear === 1999) return { type: 'y2k', ...EASTER_EGGS.y2k, blinkRed: true };
    if (roundedYear === 2077) return { type: 'future', ...EASTER_EGGS.future };

    return null;
  }

  activate(egg) {
    if (!egg || !this.radio.isInitialized) return;

    this.deactivate();
    this.activeEgg = egg;

    switch (egg.type) {
      case 'roswell':     this.activateRoswell(); break;
      case 'moonLanding': this.activateMoonLanding(); break;
      case 'bttf':        this.activateBTTF(); break;
      case 'y2k':         this.activateY2K(); break;
      case 'future':      this.activateFuture(); break;
      case 'pirate':      this.activatePirate(); break;
    }
  }

  deactivate() {
    if (this.pirateSource) {
      try { this.pirateSource.stop(); } catch (e) {}
      this.pirateSource = null;
    }
    // Stop cyberpunk loop if active
    this.radio.stopCyberpunkLoop();
    this.activeEgg = null;
  }

  activateRoswell() {
    this.radio.playTheremin();
    setTimeout(() => {
      this.radio.playMorseCode('... --- ... / .-- . / .- .-. . / .... . .-. .');
    }, 2000);
  }

  /** 1969: Apollo 11 — crackly radio chatter + quindar tones + speech */
  activateMoonLanding() {
    // Play Apollo radio chatter (crackling static + quindar tones)
    this.radio.playApolloChatter();

    setTimeout(() => {
      speak("Houston, Tranquility Base here. The Eagle has landed.", {
        rate: 0.8, pitch: 0.65, volume: 0.7, gender: 'male',
      });
    }, 1500);

    setTimeout(() => {
      speak("That's one small step for man, one giant leap for mankind.", {
        rate: 0.85, pitch: 0.7, volume: 0.8, gender: 'male',
      });
    }, 5000);
  }

  activateBTTF() {
    this.radio.playTone(440, 0.3, 'square', 0.15);
    setTimeout(() => this.radio.playTone(554.37, 0.3, 'square', 0.15), 300);
    setTimeout(() => this.radio.playTone(659.25, 0.3, 'square', 0.15), 600);
    setTimeout(() => this.radio.playTone(880, 0.6, 'square', 0.15), 900);

    setTimeout(() => {
      speak("Great Scott! The flux capacitor is activated!", {
        rate: 1.2, pitch: 1.15, gender: 'male',
      });
    }, 500);
  }

  /** 1999: Y2K — modem dialup + NEWS blinks red (blinkRed flag on egg) */
  activateY2K() {
    this.radio.playModemDialup();

    setTimeout(() => {
      speak(
        "Warning. System date error. Year two thousand overflow detected. All systems compromised.",
        { rate: 1.05, pitch: 0.65, gender: 'male' }
      );
    }, 3000);
  }

  /** 2077: Cyberpunk — persistent synth loop + neon pink display */
  activateFuture() {
    // Start the looping cyberpunk synth (stays playing until deactivate)
    this.radio.startCyberpunkLoop();

    setTimeout(() => {
      speak(
        "Incoming transmission from Mars Colony Seven. Population report: two hundred fifty thousand residents. " +
        "Neural link adoption rate at ninety-seven percent. Earth weather control systems nominal. " +
        "This is Radio Neo-Tokyo, broadcasting on the quantum frequency.",
        { rate: 1.0, pitch: 1.05, gender: 'female' }
      );
    }, 2500);
  }

  activatePirate() {
    this.pirateSource = this.radio.playPirateStatic();

    setTimeout(() => {
      const messages = [
        "You've found the pirate frequency. This station doesn't exist. You were never here.",
        "Illegal broadcast detected. Authorities have been notified. Just kidding. Rock on.",
        "Welcome to the underground. No commercials. No rules. No signal.",
      ];
      speak(messages[Math.floor(Math.random() * messages.length)], {
        rate: 0.9, pitch: 0.75, volume: 0.7, gender: 'male',
      });
    }, 1500);
  }

  getPirateRadio(year) {
    return {
      year: Math.round(year),
      name: 'Pirate Radio',
      description: `Illegal broadcast at ${year.toFixed(1)} FM`,
    };
  }
}

export default SecretFrequencyHandler;
