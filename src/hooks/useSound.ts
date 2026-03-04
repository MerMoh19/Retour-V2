export function useSound() {
  const playSuccess = () => {
    try {
      const audio = new Audio('/sounds/success.mp3');
      audio.volume = 0.8;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('[v0] Success sound play failed:', error);
        });
      }
    } catch (error) {
      console.log('[v0] Error creating success audio:', error);
    }
  };

  const playError = () => {
    try {
      const audio = new Audio('/sounds/error.mp3');
      audio.volume = 0.8;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('[v0] Error sound play failed:', error);
        });
      }
    } catch (error) {
      console.log('[v0] Error creating error audio:', error);
    }
  };

  return { playSuccess, playError };
}
