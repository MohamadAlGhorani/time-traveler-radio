import { useState, useRef, useCallback, useEffect } from 'react';
import { RadioManager } from '../engine/RadioManager';
import { SecretFrequencyHandler } from '../engine/SecretFrequencyHandler';
import { useRadioStatic } from './useRadioStatic';
import { useYouTubePlayer } from './useYouTubePlayer';
import { getNewsBulletin } from '../data/newsDatabase';
import { getTopHit, getTrackDisplay } from '../data/musicDatabase';

/**
 * useRadioAudio — Master hook for all audio state and interaction.
 * Now integrates YouTube IFrame Player for real music playback.
 */
export function useRadioAudio() {
  const radioRef = useRef(null);
  const easterEggRef = useRef(null);
  const newsTimerRef = useRef(null);

  const [isPowered, setIsPowered] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentCity, setCurrentCity] = useState('New York');
  const [isTuning, setIsTuning] = useState(false);
  const [isNewsBulletin, setIsNewsBulletin] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [easterEgg, setEasterEgg] = useState(null);
  const [volume, setVolume] = useState(0.8);
  const [displayYear, setDisplayYear] = useState(0);
  const [bootPhase, setBootPhase] = useState('off');
  const [signalAcquired, setSignalAcquired] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);

  // YouTube player
  const yt = useYouTubePlayer('yt-player-hidden');

  // Expose audio context & master gain for useRadioStatic
  const ctx = radioRef.current?.ctx || null;
  const masterGain = radioRef.current?.masterGain || null;

  // Procedural hum + static
  useRadioStatic(ctx, masterGain, isTuning, isPowered);

  const getRadio = useCallback(() => {
    if (!radioRef.current) {
      radioRef.current = new RadioManager();
      easterEggRef.current = new SecretFrequencyHandler(radioRef.current);
    }
    return radioRef.current;
  }, []);

  // News bulletin callbacks — duck YouTube during news
  useEffect(() => {
    const radio = radioRef.current;
    if (radio) {
      radio.onNewsStart = () => {
        setIsNewsBulletin(true);
        yt.duck();
      };
      radio.onNewsEnd = () => {
        setIsNewsBulletin(false);
        yt.unduck(volume);
      };
    }
  }, [isPowered, yt.duck, yt.unduck, volume]);

  // Schedule periodic news bulletins
  useEffect(() => {
    if (isPowered && bootPhase === 'ready') {
      newsTimerRef.current = setInterval(() => {
        if (!isTuning && radioRef.current) {
          const bulletin = getNewsBulletin(currentYear);
          radioRef.current.speakBulletin(bulletin.script, bulletin.persona);
        }
      }, 60000);

      const initialTimeout = setTimeout(() => {
        if (!isTuning && radioRef.current) {
          const bulletin = getNewsBulletin(currentYear);
          radioRef.current.speakBulletin(bulletin.script, bulletin.persona);
        }
      }, 30000);

      return () => {
        clearInterval(newsTimerRef.current);
        clearTimeout(initialTimeout);
      };
    }
  }, [isPowered, bootPhase, currentYear, isTuning]);

  /**
   * Play music for the given year via YouTube.
   */
  const playMusicForYear = useCallback((year, city) => {
    const track = getTopHit(year, city);
    setCurrentTrack(track);

    if (track?.ytId) {
      yt.playVideo(track.ytId);
      yt.setVolume(volume);
    }
  }, [yt, volume]);

  /**
   * IGNITION SEQUENCE
   *
   * Mobile browsers require AudioContext.resume() and YouTube player init
   * to happen within the synchronous call stack of a user gesture.
   * We init both FIRST, then run the async boot sequence.
   */
  const powerOn = useCallback(async () => {
    const radio = getRadio();

    // MUST happen in the synchronous user gesture context
    // so mobile browsers unlock audio playback.
    await radio.init();
    await yt.initPlayer();

    setIsPowered(true);
    setIsBooting(true);

    // Phase 1: Engine start
    setBootPhase('engine');
    radio.playEngineStart();

    await sleep(1500);

    // Phase 2: Frequency flipping
    setBootPhase('flipping');
    radio.playFrequencyFlip();
    radio.startHiss();

    // Count up display year
    const targetYear = new Date().getFullYear();
    const duration = 2500;
    const startTime = Date.now();
    const countUp = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const yr = Math.round(progress * targetYear);
      setDisplayYear(yr);
      if (progress < 1) {
        requestAnimationFrame(countUp);
      } else {
        setDisplayYear(targetYear);
        setCurrentYear(targetYear);
      }
    };
    requestAnimationFrame(countUp);

    await sleep(3000);

    // Phase 3: Welcome voice
    setBootPhase('welcome');
    radio.applyEraFilter(targetYear);
    await radio.speakWelcome(currentCity, targetYear);

    await sleep(500);

    // Phase 4: Ready — start playing real music!
    setBootPhase('ready');
    setIsBooting(false);
    playMusicForYear(targetYear, currentCity);
  }, [getRadio, currentCity, yt, playMusicForYear]);

  const powerOff = useCallback(() => {
    const radio = radioRef.current;
    if (radio) {
      radio.dispose();
      radioRef.current = null;
      easterEggRef.current = null;
    }
    // Stop YouTube
    yt.stop();

    window.speechSynthesis?.cancel();
    setIsPowered(false);
    setIsBooting(false);
    setBootPhase('off');
    setCurrentTrack(null);
    setEasterEgg(null);
    setIsNewsBulletin(false);
    setDisplayYear(0);
    setSignalAcquired(false);
    setIsGlitching(false);
  }, [yt]);

  const togglePower = useCallback(() => {
    if (isPowered) {
      powerOff();
    } else {
      powerOn();
    }
  }, [isPowered, powerOn, powerOff]);

  /**
   * Year dial change
   */
  const tuningTimeoutRef = useRef(null);

  const onYearChange = useCallback((year) => {
    const radio = radioRef.current;
    if (!radio || !isPowered) return;

    setCurrentYear(year);
    setDisplayYear(Math.round(year));

    // Start tuning: pause YouTube, play static
    if (!isTuning) {
      setIsTuning(true);
      radio.startTuning();
      yt.pause(); // Mute music while tuning
    }

    // Debounce: stop tuning after user stops turning
    clearTimeout(tuningTimeoutRef.current);
    tuningTimeoutRef.current = setTimeout(() => {
      radio.stopTuning();
      setIsTuning(false);

      const roundedYear = Math.round(year);
      setCurrentYear(roundedYear);
      setDisplayYear(roundedYear);

      // Trigger 200ms glitch on year snap
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 200);

      radio.applyEraFilter(roundedYear);

      // Play new music for the selected year + city!
      playMusicForYear(roundedYear, currentCity);

      // Check for easter eggs
      const handler = easterEggRef.current;
      if (handler) {
        const egg = handler.check(year);
        if (egg) {
          setEasterEgg(egg);
          handler.activate(egg);
          // During easter eggs, duck the YouTube music
          yt.duck();
          setTimeout(() => {
            setEasterEgg(null);
            handler.deactivate();
            yt.unduck(volume);
          }, 8000);
        } else {
          handler.deactivate();
          setEasterEgg(null);
        }
      }
    }, 400);
  }, [isPowered, isTuning, currentCity, yt, playMusicForYear, volume]);

  const onCityChange = useCallback((city) => {
    setCurrentCity(city);

    setSignalAcquired(true);
    setTimeout(() => setSignalAcquired(false), 1500);

    const radio = radioRef.current;
    if (radio?.isInitialized) {
      radio.playTone(880, 0.15, 'sine', 0.12);
      setTimeout(() => radio.playTone(1174.66, 0.2, 'sine', 0.1), 100);

      // Play region-appropriate music for the new city
      setTimeout(() => playMusicForYear(currentYear, city), 300);
    }
  }, [currentYear, playMusicForYear]);

  const onVolumeChange = useCallback((val) => {
    setVolume(val);
    radioRef.current?.setVolume(val);
    yt.setVolume(val); // Sync YouTube volume
  }, [yt]);

  const triggerNewsBulletin = useCallback(() => {
    const radio = radioRef.current;
    if (!radio || !isPowered || isBooting) return;

    const bulletin = getNewsBulletin(currentYear);
    radio.speakBulletin(bulletin.script, bulletin.persona);
  }, [isPowered, isBooting, currentYear]);

  return {
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
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default useRadioAudio;
