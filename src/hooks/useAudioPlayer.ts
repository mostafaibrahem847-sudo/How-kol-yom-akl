import { useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';

export type PlayState = 'idle' | 'loading' | 'playing' | 'paused';

export interface AudioPlayerHook {
  state: PlayState;
  isPlaying: boolean;
  togglePlay: () => Promise<void>;
  replay: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  sound: Audio.Sound | null;
  duration: number;
  position: number;
}

export function useAudioPlayerHook(audioUrl?: string | null): AudioPlayerHook {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [state, setState] = useState<PlayState>('idle');
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const loadSound = useCallback(async () => {
    if (!audioUrl) {
      setSound(null);
      setState('idle');
      return;
    }
    try {
      setState('loading');
      // Unload previous
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false, progressUpdateIntervalMillis: 500 }
      );
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (!status.isLoaded) {
          if (status.error) {
            setState('idle');
          }
          return;
        }
        if (status.durationMillis != null) {
          setDuration(status.durationMillis);
        }
        if (status.positionMillis != null) {
          setPosition(status.positionMillis);
        }
        if (status.didJustFinish) {
          setState('idle');
          setPosition(0);
        } else if (status.isPlaying) {
          setState('playing');
        } else {
          setState('paused');
        }
      });
      setSound(newSound);
    } catch {
      setState('idle');
    }
  }, [audioUrl]);

  useEffect(() => {
    loadSound();
  }, [audioUrl]);

  const togglePlay = useCallback(async () => {
    if (!audioUrl || !sound) return;
    const status = await sound.getStatusAsync();
    if (!status.isLoaded) return;
    if (status.isPlaying) {
      await sound.pauseAsync();
      setState('paused');
    } else {
      await sound.playAsync();
      setState('playing');
    }
  }, [sound, audioUrl]);

  const replay = useCallback(async () => {
    if (!sound) return;
    try {
      await sound.setPositionAsync(0);
      await sound.playAsync();
      setState('playing');
    } catch {
      // ignore
    }
  }, [sound]);

  const play = useCallback(async () => {
    if (!sound) return;
    try {
      await sound.playAsync();
      setState('playing');
    } catch {
      // ignore
    }
  }, [sound]);

  const pause = useCallback(async () => {
    if (!sound) return;
    try {
      await sound.pauseAsync();
      setState('paused');
    } catch {
      // ignore
    }
  }, [sound]);

  return {
    state,
    isPlaying: state === 'playing',
    togglePlay,
    replay,
    play,
    pause,
    sound,
    duration,
    position,
  };
}
