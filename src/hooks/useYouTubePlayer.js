import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * useYouTubePlayer — Manages a hidden YouTube IFrame player.
 *
 * Loads the YouTube IFrame API, creates a hidden player,
 * and exposes play/pause/volume/load controls.
 */

let apiLoaded = false;
let apiReady = false;
const apiReadyCallbacks = [];

function loadYouTubeAPI() {
  if (apiLoaded) return;
  apiLoaded = true;

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = () => {
    apiReady = true;
    apiReadyCallbacks.forEach(cb => cb());
    apiReadyCallbacks.length = 0;
  };
}

function whenAPIReady() {
  if (apiReady) return Promise.resolve();
  return new Promise(resolve => {
    apiReadyCallbacks.push(resolve);
  });
}

export function useYouTubePlayer(containerId = 'yt-player') {
  const playerRef = useRef(null);
  const playerReadyRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentVideoRef = useRef(null);
  const pendingVideoRef = useRef(null);

  // Load API on mount
  useEffect(() => {
    loadYouTubeAPI();
  }, []);

  // Initialize player
  const initPlayer = useCallback(async () => {
    if (playerRef.current && playerReadyRef.current) return;

    // If player exists but isn't ready, wait
    if (playerRef.current && !playerReadyRef.current) {
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (playerReadyRef.current) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        // Timeout after 10s
        setTimeout(() => { clearInterval(check); resolve(); }, 10000);
      });
    }

    await whenAPIReady();

    // Ensure container exists — position off-screen but not invisible
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '100px';
      container.style.height = '100px';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    return new Promise((resolve) => {
      playerRef.current = new window.YT.Player(containerId, {
        height: '100',
        width: '100',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          playsinline: 1, // Critical for iOS
          origin: window.location.origin,
          // Mobile: enable JS API and allow programmatic playback
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            playerReadyRef.current = true;
            setIsReady(true);
            resolve();

            // If a video was queued while player was initializing, play it now
            if (pendingVideoRef.current) {
              const vid = pendingVideoRef.current;
              pendingVideoRef.current = null;
              try {
                playerRef.current.loadVideoById({ videoId: vid, startSeconds: 0 });
              } catch (e) {
                console.warn('[YT Player] Failed to play pending video:', e);
              }
            }
          },
          onStateChange: (event) => {
            // YT.PlayerState: PLAYING=1, PAUSED=2, ENDED=0, BUFFERING=3, CUED=5
            setIsPlaying(event.data === 1);

            // If video ended, loop
            if (event.data === 0) {
              try {
                playerRef.current?.seekTo(0);
                playerRef.current?.playVideo();
              } catch (e) { /* ignore */ }
            }
          },
          onError: (event) => {
            console.warn('[YT Player] Error:', event.data, '— video:', currentVideoRef.current);
            // Error codes: 2=invalid param, 5=HTML5 error, 100=not found, 101/150=not embeddable
          },
        },
      });
    });
  }, [containerId]);

  /**
   * Play a specific YouTube video by ID.
   * On mobile, loadVideoById may fail silently (autoplay blocked).
   * We cue the video and then call playVideo() as a fallback.
   */
  const playVideo = useCallback(async (videoId) => {
    if (!videoId) return;

    currentVideoRef.current = videoId;

    // If player doesn't exist yet, queue the video and init
    if (!playerRef.current || !playerReadyRef.current) {
      pendingVideoRef.current = videoId;
      await initPlayer();
      return;
    }

    try {
      playerRef.current.loadVideoById({
        videoId,
        startSeconds: 0,
      });

      // Mobile fallback: if not playing after 1s, try cueVideoById + playVideo
      setTimeout(() => {
        try {
          const state = playerRef.current?.getPlayerState?.();
          // -1=unstarted, 0=ended, 2=paused, 3=buffering, 5=cued
          if (state !== 1 && state !== 3) {
            playerRef.current?.playVideo();
          }
        } catch (e) { /* ignore */ }
      }, 1000);
    } catch (e) {
      console.warn('[YT Player] Failed to load video:', e);
    }
  }, [initPlayer]);

  /**
   * Pause the current video.
   */
  const pause = useCallback(() => {
    try {
      playerRef.current?.pauseVideo();
    } catch (e) { /* ignore */ }
  }, []);

  /**
   * Resume playback.
   */
  const resume = useCallback(() => {
    try {
      playerRef.current?.playVideo();
    } catch (e) { /* ignore */ }
  }, []);

  /**
   * Stop playback completely.
   */
  const stop = useCallback(() => {
    try {
      playerRef.current?.stopVideo();
      currentVideoRef.current = null;
    } catch (e) { /* ignore */ }
  }, []);

  /**
   * Set volume (0-100 for YouTube API).
   */
  const setVolume = useCallback((vol) => {
    try {
      playerRef.current?.setVolume(Math.round(vol * 100));
    } catch (e) { /* ignore */ }
  }, []);

  /**
   * Duck volume (for news bulletins) — ramp to 15%.
   */
  const duck = useCallback(() => {
    try {
      playerRef.current?.setVolume(15);
    } catch (e) { /* ignore */ }
  }, []);

  /**
   * Unduck — restore to normal volume.
   */
  const unduck = useCallback((vol = 0.8) => {
    try {
      playerRef.current?.setVolume(Math.round(vol * 100));
    } catch (e) { /* ignore */ }
  }, []);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      try {
        playerRef.current?.destroy();
      } catch (e) { /* ignore */ }
      playerRef.current = null;
      playerReadyRef.current = false;
    };
  }, []);

  return {
    isReady,
    isPlaying,
    initPlayer,
    playVideo,
    pause,
    resume,
    stop,
    setVolume,
    duck,
    unduck,
    currentVideoId: currentVideoRef.current,
  };
}

export default useYouTubePlayer;
