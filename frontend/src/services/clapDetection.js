/**
 * Double Clap Detection Service
 *
 * Uses the Web Audio API to detect two rapid claps from the microphone.
 * No speech recognition needed — works on sound amplitude spikes.
 *
 * Algorithm:
 *  1. Stream mic audio through an AnalyserNode.
 *  2. Every ~30ms measure the RMS (Root Mean Square) volume.
 *  3. A "clap" is a sudden spike above the threshold after a period of silence.
 *  4. If two claps happen within the time window → trigger callback.
 *
 * Browser support: All modern browsers (Chrome, Edge, Firefox, Safari).
 */

const CONFIG = {
  CLAP_THRESHOLD: 0.25,        // RMS volume spike required (0–1). Lower = more sensitive.
  SILENCE_THRESHOLD: 0.06,     // Below this = silence / background noise
  DOUBLE_CLAP_WINDOW_MS: 800,  // Max time between two claps (ms)
  COOLDOWN_MS: 1500,            // Ignore claps for this long after a double-clap fires
  CHECK_INTERVAL_MS: 20,       // How often to analyse audio (ms)
};

let audioContext = null;
let analyser = null;
let mediaStream = null;
let intervalId = null;
let isRunning = false;
let onDoubleClapCallback = null;

// Clap tracking state
let lastClapTime = 0;
let clapCount = 0;
let cooldownUntil = 0;
let wasAboveThreshold = false; // Prevents holding a loud note from counting as many claps

/**
 * Start double clap detection.
 * @param {Function} onDoubleClap - Called when a double clap is detected.
 * @returns {Promise<boolean>} true if started, false if not supported or permission denied.
 */
export async function startClapDetection(onDoubleClap) {
  if (isRunning) return true;

  if (!navigator.mediaDevices?.getUserMedia) {
    console.warn('[ClapDetect] getUserMedia not supported.');
    return false;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false, // Keep raw audio for better spike detection
        noiseSuppression: false,
        autoGainControl: false,
      }
    });
  } catch (err) {
    console.warn('[ClapDetect] Mic permission denied:', err);
    return false;
  }

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.2; // Low smoothing → sharp spike detection

  const source = audioContext.createMediaStreamSource(mediaStream);
  source.connect(analyser);

  onDoubleClapCallback = onDoubleClap;
  isRunning = true;

  // Reset state
  lastClapTime = 0;
  clapCount = 0;
  cooldownUntil = 0;
  wasAboveThreshold = false;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  intervalId = setInterval(() => {
    if (!isRunning) return;

    analyser.getByteFrequencyData(dataArray);

    // Calculate RMS volume (0–1 range)
    const rms = Math.sqrt(
      dataArray.reduce((sum, val) => sum + (val / 255) * (val / 255), 0) / dataArray.length
    );

    const now = Date.now();

    // Skip if in cooldown period
    if (now < cooldownUntil) return;

    if (rms > CONFIG.CLAP_THRESHOLD) {
      if (!wasAboveThreshold) {
        // Leading edge of a loud spike — this is a clap!
        wasAboveThreshold = true;

        const timeSinceLast = now - lastClapTime;

        if (lastClapTime > 0 && timeSinceLast <= CONFIG.DOUBLE_CLAP_WINDOW_MS) {
          // Second clap within window → DOUBLE CLAP!
          clapCount = 0;
          lastClapTime = 0;
          cooldownUntil = now + CONFIG.COOLDOWN_MS;

          if (onDoubleClapCallback) onDoubleClapCallback();
        } else {
          // First clap (or too slow after previous one) → start/reset window
          clapCount = 1;
          lastClapTime = now;
        }
      }
    } else if (rms < CONFIG.SILENCE_THRESHOLD) {
      // Back to silence — ready for next clap edge
      wasAboveThreshold = false;

      // Reset if too much time has passed since first clap
      if (lastClapTime > 0 && Date.now() - lastClapTime > CONFIG.DOUBLE_CLAP_WINDOW_MS + 200) {
        clapCount = 0;
        lastClapTime = 0;
      }
    }
  }, CONFIG.CHECK_INTERVAL_MS);

  return true;
}

/**
 * Stop clap detection and release microphone.
 */
export function stopClapDetection() {
  isRunning = false;

  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  analyser = null;
}

/**
 * Temporarily pause detection (e.g., during voice command listening).
 * Does NOT release the microphone stream.
 */
export function pauseClapDetection() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Resume detection after a pause.
 */
export function resumeClapDetection() {
  if (!isRunning || intervalId || !analyser) return;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  wasAboveThreshold = false;

  intervalId = setInterval(() => {
    if (!isRunning) return;

    analyser.getByteFrequencyData(dataArray);
    const rms = Math.sqrt(
      dataArray.reduce((sum, val) => sum + (val / 255) * (val / 255), 0) / dataArray.length
    );

    const now = Date.now();
    if (now < cooldownUntil) return;

    if (rms > CONFIG.CLAP_THRESHOLD) {
      if (!wasAboveThreshold) {
        wasAboveThreshold = true;
        const timeSinceLast = now - lastClapTime;

        if (lastClapTime > 0 && timeSinceLast <= CONFIG.DOUBLE_CLAP_WINDOW_MS) {
          clapCount = 0;
          lastClapTime = 0;
          cooldownUntil = now + CONFIG.COOLDOWN_MS;
          if (onDoubleClapCallback) onDoubleClapCallback();
        } else {
          clapCount = 1;
          lastClapTime = now;
        }
      }
    } else if (rms < CONFIG.SILENCE_THRESHOLD) {
      wasAboveThreshold = false;
      if (lastClapTime > 0 && Date.now() - lastClapTime > CONFIG.DOUBLE_CLAP_WINDOW_MS + 200) {
        clapCount = 0;
        lastClapTime = 0;
      }
    }
  }, CONFIG.CHECK_INTERVAL_MS);
}

export function isClapDetectionRunning() {
  return isRunning;
}
