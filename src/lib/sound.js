/**
 * Sound generation for Fourier Series
 */

let audioCtx = null;
let oscillator = null;
let gainNode = null;
let isPlaying = false;

// Initialize Audio Context (must be triggered by user interaction)
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window["webkitAudioContext"])();
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 0.1; // Low volume to prevent clipping
  }
}

/**
 * Play or update the sound based on Fourier coefficients
 * @param {Object} coefs - The Fourier coefficients object
 * @param {Object} coefsActivity - The activity state of coefficients
 * @param {number} baseFreq - Base frequency in Hz
 */
export function togglePlay(coefs, coefsActivity, baseFreq = 220) {
  initAudio();

  if (isPlaying) {
    stopSound();
    return false; // Stopped
  }

  startSound(coefs, coefsActivity, baseFreq);
  return true; // Playing
}

export function updateSound(coefs, coefsActivity, baseFreq = 220) {
  if (!isPlaying || !audioCtx) return;
  startSound(coefs, coefsActivity, baseFreq); // Restart/Update with new wave
}

export function stopSound() {
  if (oscillator) {
    try {
      oscillator.stop();
      oscillator.disconnect();
    } catch (e) {
      // ignore if already stopped
    }
    oscillator = null;
  }
  isPlaying = false;
}

function startSound(coefs, coefsActivity, baseFreq) {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  if (oscillator) {
    oscillator.stop();
    oscillator.disconnect();
  }

  // supported systems check
  if (!["standard", "cos", "sin"].includes(coefs.type)) {
    console.warn(`Sound not supported for system: ${coefs.type}`);
    isPlaying = false;
    return;
  }

  // Frequency adjustment for half-period expansions
  // standard: period = L (b-a) -> f
  // cos/sin: period = 2L -> f/2
  let activeFreq = baseFreq;
  if (coefs.type === "cos" || coefs.type === "sin") {
    activeFreq = baseFreq / 2;
  }

  // Prepare arrays for PeriodicWave
  // The Web Audio API requires separate Real (Cosine) and Imag (Sine) terms.
  // Index 0 is DC offset (c0). Indices 1..N are harmonics.

  // Determine max K from the coefficient arrays
  let maxK = 0;
  coefs.families.forEach((fam) => {
    maxK = Math.max(maxK, fam.coefs.length);
  });

  const real = new Float32Array(maxK + 1);
  const imag = new Float32Array(maxK + 1);

  // Function to get active coefficient value
  const getVal = (famIndex, kIndex) => {
    // kIndex is 0-based index in array (harmonic k-1)
    if (
      coefsActivity.families[famIndex] &&
      coefsActivity.families[famIndex][kIndex]
    ) {
      return coefs.families[famIndex].coefs[kIndex];
    }
    return 0;
  };

  // Populate Real and Imag arrays based on system type
  // fourier.js systems:
  // standard: families[0]=cos (a_k), families[1]=sin (b_k)
  // cos: families[0]=cos (a_k)
  // sin: families[0]=sin (b_k)

  if (coefs.type === "standard") {
    // families[0] is cos, families[1] is sin
    for (let k = 1; k <= maxK; k++) {
      real[k] = getVal(0, k - 1); // a_k
      imag[k] = getVal(1, k - 1); // b_k
    }
  } else if (coefs.type === "cos") {
    // families[0] is cos
    for (let k = 1; k <= maxK; k++) {
      real[k] = getVal(0, k - 1); // a_k
    }
  } else if (coefs.type === "sin") {
    // families[0] is sin
    for (let k = 1; k <= maxK; k++) {
      imag[k] = getVal(0, k - 1); // b_k
    }
  }

  // Create the periodic wave
  const wave = audioCtx.createPeriodicWave(real, imag, {
    disableNormalization: false,
  });

  oscillator = audioCtx.createOscillator();
  oscillator.setPeriodicWave(wave);
  oscillator.frequency.value = activeFreq;
  oscillator.connect(gainNode);
  oscillator.start();

  isPlaying = true;
}
