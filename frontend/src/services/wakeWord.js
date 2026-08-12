/**
 * Wake Word Detection Service — "Hey NEAP"
 *
 * Runs a continuous low-power speech recognition loop in the background.
 * When "Hey NEAP" (or similar phrases) is detected, it calls onWakeWordDetected().
 * Automatically restarts itself after silence/timeout to keep listening.
 *
 * Browser Support: Chrome, Edge (Web Speech API required).
 */

const WAKE_PHRASES = [
  'hey neap',
  'hey nip',
  'hey need',
  'okay neap',
  'ok neap',
  'neap help',
  'neap listen',
  'hey help',
];

let recognitionInstance = null;
let isRunning = false;
let intentionalStop = false;
let onWakeCallback = null;
let restartTimer = null;

/**
 * Match a transcript against wake word phrases.
 */
function isWakeWord(transcript) {
  const lower = transcript.toLowerCase().trim();
  return WAKE_PHRASES.some(phrase => lower.includes(phrase));
}

/**
 * Start the wake word detection loop.
 * @param {Function} onWakeWordDetected - Called when wake word is heard.
 * @returns {boolean} true if started, false if not supported.
 */
export function startWakeWordDetection(onWakeWordDetected) {
  if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
    console.warn('[WakeWord] Web Speech API not supported in this browser.');
    return false;
  }

  if (isRunning) return true; // Already running

  onWakeCallback = onWakeWordDetected;
  intentionalStop = false;
  isRunning = true;

  _startLoop();
  return true;
}

/**
 * Stop the wake word detection loop completely.
 */
export function stopWakeWordDetection() {
  intentionalStop = true;
  isRunning = false;
  if (restartTimer) clearTimeout(restartTimer);
  if (recognitionInstance) {
    try { recognitionInstance.stop(); } catch (_) {}
    recognitionInstance = null;
  }
}

/**
 * Pause wake word detection temporarily (e.g., while voice command is active).
 */
export function pauseWakeWordDetection() {
  if (recognitionInstance) {
    try { recognitionInstance.stop(); } catch (_) {}
  }
}

/**
 * Resume wake word detection after a pause.
 */
export function resumeWakeWordDetection() {
  if (isRunning && !intentionalStop) {
    restartTimer = setTimeout(_startLoop, 800);
  }
}

export function isWakeWordRunning() {
  return isRunning;
}

/**
 * Internal: create and start one recognition session.
 */
function _startLoop() {
  if (!isRunning || intentionalStop) return;
  if (restartTimer) clearTimeout(restartTimer);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true; // Detect early to be responsive
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 3;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      // Check all alternatives
      for (let j = 0; j < result.length; j++) {
        const transcript = result[j].transcript;
        if (isWakeWord(transcript)) {
          // Wake word found — notify callback then restart loop
          if (onWakeCallback) onWakeCallback();
          // Briefly stop to hand over to command listener
          try { recognition.stop(); } catch (_) {}
          return;
        }
      }
    }
  };

  recognition.onerror = (event) => {
    // 'no-speech' and 'aborted' are expected — restart silently
    if (['no-speech', 'aborted', 'audio-capture'].includes(event.error)) {
      if (!intentionalStop && isRunning) {
        restartTimer = setTimeout(_startLoop, 500);
      }
      return;
    }
    // 'not-allowed' means mic permission denied — stop permanently
    if (event.error === 'not-allowed') {
      console.warn('[WakeWord] Microphone permission denied. Wake word disabled.');
      isRunning = false;
      return;
    }
    // Any other error: restart after a short delay
    if (!intentionalStop && isRunning) {
      restartTimer = setTimeout(_startLoop, 1500);
    }
  };

  recognition.onend = () => {
    // Recognition session ended (timeout, network, etc.) — restart automatically
    if (!intentionalStop && isRunning) {
      restartTimer = setTimeout(_startLoop, 400);
    }
  };

  try {
    recognition.start();
    recognitionInstance = recognition;
  } catch (err) {
    // Already started or another instance running — retry after delay
    if (!intentionalStop && isRunning) {
      restartTimer = setTimeout(_startLoop, 1000);
    }
  }
}
