import { useCallback, useEffect, useRef, useState } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

export type PlayState = 'idle' | 'loading' | 'playing' | 'paused';

export interface AudioPlayerHook {
  state: PlayState;
  isPlaying: boolean;
  togglePlay: () => void;
  replay: () => void;
}

// Voice dock state for a remote narration URL, shared by the inline card and
// the sticky bar. Playback state is driven by expo-audio's
// `playbackStatusUpdate` events (via useAudioPlayerStatus) instead of polling,
// so the `didJustFinish` flag is noticed reliably: when a clip ends naturally
// the UI returns to idle, the position rewinds to 0 and the player stays
// paused. Pause/resume never seek, so a mid-way pause keeps its position.
//
// `useAudioPlayer` owns and releases the player (on unmount and on URL change)
// and `useAudioPlayerStatus` removes its listener automatically, so leaving the
// screen stops the audio and never leaks a subscription.
export function useAudioPlayerHook(audioUrl?: string | null): AudioPlayerHook {
  const player = useAudioPlayer(audioUrl ?? null, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);
  const [state, setState] = useState<PlayState>('idle');
  const finishedRef = useRef(false);

  // A new source always starts from idle.
  useEffect(() => {
    finishedRef.current = false;
    setState('idle');
  }, [audioUrl]);

  // Derive the UI state from the player's status events.
  useEffect(() => {
    if (status.didJustFinish) {
      // Natural end (not a user pause): stop the UI, rewind to the start and
      // leave the player paused. The ref keeps this from repeating on the
      // status events that follow the seek.
      if (!finishedRef.current) {
        finishedRef.current = true;
        setState('idle');
        try {
          player.pause();
          player.seekTo(0).catch(() => {});
        } catch (e) {
          if (__DEV__) console.warn('[audio] finish reset failed', e);
        }
      }
      return;
    }

    finishedRef.current = false;

    if (!status.isLoaded) {
      // Show loading only for a play request that is still buffering.
      setState((prev) => (prev === 'playing' ? 'loading' : prev));
      return;
    }

    if (status.playing) {
      setState('playing');
      return;
    }

    // Not playing and not finished: a user pause. Keep the position as-is.
    setState((prev) => (prev === 'playing' || prev === 'loading' ? 'paused' : prev));
  }, [status, player]);

  const togglePlay = useCallback(() => {
    try {
      if (player.playing) {
        player.pause();
        setState('paused');
      } else {
        player.play();
        setState(player.isLoaded ? 'playing' : 'loading');
      }
    } catch (e) {
      if (__DEV__) console.warn('[audio] togglePlay failed', e);
    }
  }, [player]);

  const replay = useCallback(() => {
    try {
      player.seekTo(0).catch(() => {});
      player.play();
      setState(player.isLoaded ? 'playing' : 'loading');
    } catch (e) {
      if (__DEV__) console.warn('[audio] replay failed', e);
    }
  }, [player]);

  return { state, isPlaying: state === 'playing', togglePlay, replay };
}
