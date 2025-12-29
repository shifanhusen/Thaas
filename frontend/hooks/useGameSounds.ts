import { useCallback, useRef, useEffect } from 'react';

export const useGameSounds = () => {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    // Preload sounds
    const sounds = {
      draw: '/sounds/draw1.mp3',
      place: '/sounds/place.mp3',
      knock: '/sounds/knock.mp3',
      win: '/sounds/win.mp3',
      lose: '/sounds/lose.mp3',
      shuffle: '/sounds/shuffle.mp3',
    };

    Object.entries(sounds).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.volume = 0.5;
      audioRefs.current[key] = audio;
    });
  }, []);

  const playSound = useCallback((soundName: 'draw' | 'place' | 'knock' | 'win' | 'lose' | 'shuffle') => {
    const audio = audioRefs.current[soundName];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => console.log('Audio play failed (user interaction needed first):', e));
    }
  }, []);

  return { playSound };
};
