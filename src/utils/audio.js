// Audio context singleton
let audioContext = null;
let isMuted = false;
let bgMusicNode = null;
let nextBgMusicNode = null;
const CROSSFADE_DURATION = 2; // Crossfade duration in seconds

// Sound effect paths with format fallbacks
const SOUND_PATHS = {
  spin: {
    mp3: process.env.PUBLIC_URL + '/sounds/spin.mp3',
  },
  win: {
    mp3: process.env.PUBLIC_URL + '/sounds/win.mp3',
  },
  jackpot: {
    mp3: process.env.PUBLIC_URL + '/sounds/jackpot.mp3',
  },
  bgMusic: {
    mp3: process.env.PUBLIC_URL + '/sounds/background.mp3',
  }
};

// Cache for loaded audio buffers
const audioBuffers = {};

// Initialize audio context
const initAudio = async () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('Audio context initialized:', audioContext.state);
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('Audio context resumed:', audioContext.state);
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }
  return audioContext;
};

// Load and cache a sound
const loadSound = async (soundName) => {
  if (audioBuffers[soundName]) {
    return audioBuffers[soundName];
  }

  if (!SOUND_PATHS[soundName]) {
    console.error(`Sound ${soundName} not found in SOUND_PATHS`);
    return null;
  }

  const url = SOUND_PATHS[soundName].mp3;
  if (!url) {
    console.error(`No MP3 path found for sound ${soundName}`);
    return null;
  }

  try {
    console.log(`Attempting to load ${soundName} from ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`Successfully fetched ${url}, size: ${arrayBuffer.byteLength} bytes`);

    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log(`Successfully decoded ${soundName}:`, {
        duration: audioBuffer.duration,
        numberOfChannels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate
      });
      
      audioBuffers[soundName] = audioBuffer;
      return audioBuffer;
    } catch (decodeError) {
      console.error(`Failed to decode audio data for ${soundName}:`, decodeError);
      return null;
    }
  } catch (fetchError) {
    console.error(`Failed to fetch ${soundName}:`, fetchError);
    return null;
  }
};

// Create an audio source with gain control
const createAudioSource = (buffer, volume = 1, loop = false) => {
  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  
  source.buffer = buffer;
  source.loop = loop;
  gainNode.gain.value = volume;
  
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  return { source, gainNode };
};

// Play a sound with optional volume
const playSound = async (soundName, volume = 1) => {
  if (isMuted) return;

  try {
    if (!audioContext) {
      await initAudio();
    } else if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const buffer = await loadSound(soundName);
    if (!buffer) {
      console.warn(`Could not play sound: ${soundName}`);
      return;
    }

    const { source, gainNode } = createAudioSource(buffer, volume);
    source.start(0);
    
    // Return a cleanup function
    return () => {
      try {
        source.stop();
        source.disconnect();
        gainNode.disconnect();
      } catch (error) {
        console.warn('Error cleaning up audio source:', error);
      }
    };
  } catch (error) {
    console.warn('Error playing sound:', error);
  }
};

// Play background music with seamless looping
export const playBackgroundMusic = async (volume = 0.3) => {
  // Don't start if already muted
  if (isMuted) return;

  // Don't start if already playing
  if (bgMusicNode?.source?.playbackState !== 'finished' && bgMusicNode?.source) {
    console.log('Background music is already playing');
    return;
  }

  try {
    if (!audioContext) {
      await initAudio();
    } else if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const buffer = await loadSound('bgMusic');
    if (!buffer) {
      console.error('Failed to load background music');
      return;
    }

    // Stop any existing music before starting new
    if (bgMusicNode?.source) {
      try {
        bgMusicNode.source.stop();
        bgMusicNode.source.disconnect();
        bgMusicNode.gainNode.disconnect();
      } catch (error) {
        console.warn('Error cleaning up old background music:', error);
      }
    }

    const currentTime = audioContext.currentTime;
    const { source, gainNode } = createAudioSource(buffer, volume, true);
    
    // Start the playback
    source.start(currentTime);
    bgMusicNode = { source, gainNode, startTime: currentTime };
    console.log('Background music started');

  } catch (error) {
    console.error('Error playing background music:', error);
  }
};

// Stop background music
export const stopBackgroundMusic = () => {
  if (bgMusicNode?.source) {
    try {
      const fadeOutDuration = 1; // 1 second fade out
      const currentTime = audioContext.currentTime;
      const { source, gainNode } = bgMusicNode;
      
      // Fade out current music
      gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeOutDuration);
      
      // Store the cleanup in a timeout
      setTimeout(() => {
        try {
          source.stop();
          source.disconnect();
          gainNode.disconnect();
        } catch (error) {
          console.warn('Error cleaning up audio source:', error);
        }
      }, fadeOutDuration * 1000);
      
      // Fade out next scheduled music if it exists
      if (nextBgMusicNode?.source) {
        const nextSource = nextBgMusicNode.source;
        const nextGain = nextBgMusicNode.gainNode;
        nextGain.gain.linearRampToValueAtTime(0, currentTime + fadeOutDuration);
        setTimeout(() => {
          try {
            nextSource.stop();
            nextSource.disconnect();
            nextGain.disconnect();
          } catch (error) {
            console.warn('Error cleaning up next audio source:', error);
          }
        }, fadeOutDuration * 1000);
        nextBgMusicNode = null;
      }
    } catch (error) {
      console.warn('Error stopping background music:', error);
    }
    bgMusicNode = null;
  }
};

// Initialize audio context on first user interaction
const initializeAudioOnInteraction = async () => {
  if (!audioContext) {
    await initAudio();
    // Start background music after first interaction
    playBackgroundMusic();
    document.removeEventListener('click', initializeAudioOnInteraction);
  }
};

document.addEventListener('click', initializeAudioOnInteraction);

export const toggleMute = async () => {
  isMuted = !isMuted;
  
  if (isMuted) {
    stopBackgroundMusic();
  } else {
    await playBackgroundMusic();
  }
  
  return isMuted;
};

// Add auto-start functionality
const autoStartAudio = async () => {
  try {
    await initAudio();
    await playBackgroundMusic();
  } catch (error) {
    console.warn('Could not auto-start audio:', error);
  }
};

// Call autoStartAudio when the module loads
autoStartAudio();

export const getMuteState = () => isMuted;

export const playSpinSound = () => playSound('spin', 0.5);
export const playWinSound = () => playSound('win', 0.6);
export const playJackpotSound = () => playSound('jackpot', 0.7); 