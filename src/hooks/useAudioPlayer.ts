import { useState, useEffect, useCallback } from 'react';
import { createAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

export type PlayState = 'idle' | 'loading' | 'playing' | 'paused';

export interface AudioPlayerHook {
  state: PlayState;
  isPlaying: boolean;
  togglePlay: () => void;
  replay: () => void;
}

// Voice dock state for a remote narration URL. The player's playback state is
// synced by a 500 ms poll ONLY while the clip is loading or playing — a paused
// or finished player is inert, so polling stops instead of running forever.
// (duration/position were removed: no consumer rendered them and they invited a
// ms/seconds unit mismatch.)
export function useAudioPlayerHook(audioUrl?: string | null): AudioPlayerHook {
  const [state, setState] = useState<PlayState>('idle');
  const [player, setPlayer] = useState<AudioPlayer | null>(null);

  // Create / recreate the player when the URL changes; release the old one.
  useEffect(() => {
    setState('idle');
    if (!audioUrl) {
      setPlayer(null);
      return;
    }

    const newPlayer = createAudioPlayer({ uri: audioUrl }, { updateInterval: 500 });
    setPlayer(newPlayer);

    return () => {
      try {
        newPlayer.remove();
      } catch (e) {
        if (__DEV__) console.warn('[audio] player release failed', e);
      }
    };
  }, [audioUrl]);

  // Poll only while work is in flight: while loading (to notice isLoaded) and
  // while playing (to notice pause/finish). A paused/idle player never polls.
  useEffect(() => {
    if (!player) return;
    if (state !== 'loading' && state !== 'playing') return;

    const tick = () => {
      try {
        if (!player.isLoaded) return; // still loading
        const finished = player.duration > 0 && player.currentTime >= player.duration - 0.1;
        if (finished) {
          setState('idle');
        } else if (player.paused) {
          setState('paused');
        } else if (player.playing) {
          setState('playing');
        }
      } catch (e) {
        if (__DEV__) console.warn('[audio] status poll failed', e);
      }
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [player, state]);

  const togglePlay = useCallback(() => {
    if (!player) return;
    try {
      if (player.playing) {
        player.pause();
        setState('paused');
      } else {
        player.play();
        setState('playing');
      }
    } catch (e) {
      if (__DEV__) console.warn('[audio] togglePlay failed', e);
    }
  }, [player]);

  const replay = useCallback(() => {
    if (!player) return;
    try {
      player.seekTo(0);
      player.play();
      setState('playing');
    } catch (e) {
      if (__DEV__) console.warn('[audio] replay failed', e);
    }
  }, [player]);

  return { state, isPlaying: state === 'playing', togglePlay, replay };
}
