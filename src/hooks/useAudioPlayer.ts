import { useState, useEffect, useCallback } from 'react';
import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

export type PlayState = 'idle' | 'loading' | 'playing' | 'paused';

export interface AudioPlayerHook {
  state: PlayState;
  isPlaying: boolean;
  togglePlay: () => Promise<void>;
  replay: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  sound: AudioPlayer | null;
  duration: number;
  position: number;
}

export function useAudioPlayerHook(audioUrl?: string | null): AudioPlayerHook {
  const [player, setPlayer] = useState<AudioPlayer | null>(null);
  const [state, setState] = useState<PlayState>('idle');
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  // Cleanup on unmount or player change
  useEffect(() => {
    return () => {
      if (player) {
        try { player.remove(); } catch {}
      }
    };
  }, [player]);

  // Load / reload when audioUrl changes
  useEffect(() => {
    if (!audioUrl) {
      if (player) {
        try { player.remove(); } catch {}
        setPlayer(null);
      }
      setState('idle');
      setDuration(0);
      setPosition(0);
      return;
    }

    setState('loading');
    setDuration(0);
    setPosition(0);

    const newPlayer = createAudioPlayer({ uri: audioUrl }, { updateInterval: 500 });
    setPlayer(newPlayer);

    // Give loader a moment to finish; if it fails, fall back to idle
    const timeout = setTimeout(() => {
      if (!newPlayer.isLoaded) {
        // still loading or failed — stay loading until update
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [audioUrl]);

  // Poll status from the player instance so state stays in sync
  useEffect(() => {
    if (!player) return;

    const tick = () => {
      try {
        if (player.isLoaded) {
          setDuration(Math.round((player.duration ?? 0) * 1000));
          setPosition(Math.round((player.currentTime ?? 0) * 1000));

          if (player.paused || (!player.playing && player.currentTime >= player.duration - 0.1)) {
            if (player.currentTime >= player.duration - 0.1 && player.duration > 0) {
              setState('idle');
              setPosition(0);
            } else {
              setState('paused');
            }
          } else if (player.playing) {
            setState('playing');
          } else {
            setState('idle');
          }
        } else {
          setState('loading');
        }
      } catch {}
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [player]);

  const togglePlay = useCallback(async () => {
    if (!audioUrl || !player) return;
    try {
      if (player.playing) {
        player.pause();
        setState('paused');
      } else {
        player.play();
        setState('playing');
      }
    } catch {}
  }, [audioUrl, player]);

  const replay = useCallback(async () => {
    if (!player) return;
    try {
      await player.seekTo(0);
      player.play();
      setState('playing');
    } catch {}
  }, [player]);

  const play = useCallback(async () => {
    if (!player) return;
    try {
      player.play();
      setState('playing');
    } catch {}
  }, [player]);

  const pause = useCallback(async () => {
    if (!player) return;
    try {
      player.pause();
      setState('paused');
    } catch {}
  }, [player]);

  return {
    state,
    isPlaying: state === 'playing',
    togglePlay,
    replay,
    play,
    pause,
    sound: player,
    duration,
    position,
  };
}
