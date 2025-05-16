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

// Check audio format support
const checkAudioFormat = (format) => {
  const audio = document.createElement('audio');
  const canPlay = audio.canPlayType(`audio/${format}`);
  console.log(`Browser support for ${format}: ${canPlay}`);
  return canPlay !== '';
};

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

// Schedule the next background music loop with crossfade
const scheduleNextLoop = (buffer, currentTime, duration) => {
  const startTime = currentTime + duration - CROSSFADE_DURATION;
  const { source, gainNode } = createAudioSource(buffer, 0, true);
  
  // Fade in the new loop
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.3, startTime + CROSSFADE_DURATION);
  
  source.start(startTime);
  return { source, gainNode, startTime };
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
  if (bgMusicNode && bgMusicNode.source.playbackState !== 'finished') {
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
    if (bgMusicNode) {
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
  if (bgMusicNode) {
    try {
      const fadeOutDuration = 1; // 1 second fade out
      const currentTime = audioContext.currentTime;
      
      // Fade out current music
      bgMusicNode.gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeOutDuration);
      setTimeout(() => bgMusicNode.source.stop(), fadeOutDuration * 1000);
      
      // Fade out next scheduled music if it exists
      if (nextBgMusicNode) {
        nextBgMusicNode.gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeOutDuration);
        setTimeout(() => nextBgMusicNode.source.stop(), fadeOutDuration * 1000);
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