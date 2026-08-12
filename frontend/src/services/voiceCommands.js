// Voice Command Navigation Engine
// Matches spoken phrases to app actions and navigation

import { speakText, isSpeechRecognitionSupported } from './speech';

// Command definitions: phrase keywords → command key
const COMMAND_MAP = [
  {
    keys: ['go home', 'home', 'my dashboard', 'dashboard', 'main page', 'go to home', 'take me home', 'main menu', 'start'],
    command: 'HOME'
  },
  {
    keys: ['request help', 'request', 'create task', 'new task', 'ask for help', 'create request', 'need help', 'i need help', 'get help', 'help request', 'make request', 'new request'],
    command: 'CREATE_TASK'
  },
  {
    keys: ['my requests', 'my tasks', 'open requests', 'view tasks', 'show tasks', 'my help requests', 'show requests', 'view requests'],
    command: 'MY_TASKS'
  },
  {
    keys: ['volunteer', 'go to volunteer', 'help someone', 'volunteer feed', 'volunteer home', 'volunteer page', 'show volunteer', 'open volunteer'],
    command: 'VOLUNTEER_HOME'
  },
  {
    keys: ['open chat', 'chat', 'messages', 'go to chat', 'show chat', 'open messages', 'message'],
    command: 'CHAT'
  },
  {
    keys: ['send sos', 'sos', 'emergency', 'help me', 'urgent', 'urgent help', 'call for help', 'send emergency', 'emergency help'],
    command: 'SOS'
  },
  {
    keys: ['read the page', 'read page', 'read', 'read aloud', 'read this', 'speak', 'speak the page', 'read out', 'read to me', 'what does it say'],
    command: 'READ_PAGE'
  },
  {
    keys: ['stop reading', 'stop', 'stop speaking', 'quiet', 'silence', 'be quiet', 'shut up', 'pause'],
    command: 'STOP_READING'
  },
  {
    keys: ['increase text', 'bigger text', 'zoom in', 'larger font', 'bigger font', 'larger text', 'make bigger', 'increase font', 'font up'],
    command: 'FONT_INCREASE'
  },
  {
    keys: ['decrease text', 'smaller text', 'zoom out', 'smaller font', 'smaller', 'make smaller', 'decrease font', 'font down', 'reduce text'],
    command: 'FONT_DECREASE'
  },
  {
    keys: ['high contrast', 'contrast', 'contrast mode', 'toggle contrast', 'dark mode', 'night mode', 'change contrast', 'flip contrast', 'accessibility mode'],
    command: 'TOGGLE_CONTRAST'
  },
  {
    keys: ['normal mode', 'light mode', 'white mode', 'standard mode', 'default mode', 'normal contrast', 'turn off contrast', 'disable contrast', 'regular mode', 'reset contrast', 'white theme'],
    command: 'RESET_NORMAL_MODE'
  },
  {
    keys: ['log out', 'logout', 'sign out', 'exit', 'log me out', 'sign me out', 'bye', 'goodbye'],
    command: 'LOGOUT'
  },
  {
    keys: ['go back', 'back', 'go back please', 'previous page', 'go to previous', 'return'],
    command: 'GO_BACK'
  },
];


/**
 * Match a spoken transcript to a known command key.
 * Returns the command string or null if no match.
 */
export function matchCommand(transcript) {
  const lower = transcript.toLowerCase().trim().replace(/[.!?]$/, '');
  for (const { keys, command } of COMMAND_MAP) {
    for (const key of keys) {
      if (lower.includes(key)) {
        return command;
      }
    }
  }
  return null;
}

/**
 * Execute a matched command given a set of handlers.
 * Handlers object: { navigate, triggerSOS, increaseFont, decreaseFont, toggleHighContrast, logout }
 */
export function executeCommand(command, handlers, userRole) {
  const { navigate, triggerSOS, increaseFont, decreaseFont, toggleHighContrast, logout } = handlers;

  switch (command) {
    case 'HOME':
      if (userRole === 'senior') {
        speakText('Going to your senior dashboard.');
        navigate('/senior');
      } else if (userRole === 'volunteer') {
        speakText('Going to your volunteer dashboard.');
        navigate('/volunteer');
      } else {
        speakText('Going home.');
        navigate('/');
      }
      break;

    case 'CREATE_TASK':
      speakText('Opening the create task page. Please describe what you need help with.');
      navigate('/senior/create-task');
      break;

    case 'MY_TASKS':
      speakText('Showing your requests.');
      navigate('/senior');
      break;

    case 'VOLUNTEER_HOME':
      speakText('Going to the volunteer feed.');
      navigate('/volunteer');
      break;

    case 'SOS':
      speakText('Sending SOS alert to nearby volunteers. Please stay calm, help is on the way.');
      if (triggerSOS) triggerSOS();
      break;

    case 'READ_PAGE': {
      const main = document.querySelector('main') || document.body;
      const text = main.innerText?.replace(/\s+/g, ' ').trim() || 'Nothing to read.';
      speakText(text.substring(0, 500), 0.8);
      break;
    }

    case 'STOP_READING':
      window.speechSynthesis?.cancel();
      break;

    case 'FONT_INCREASE':
      speakText('Increasing text size.');
      if (increaseFont) increaseFont();
      break;

    case 'FONT_DECREASE':
      speakText('Decreasing text size.');
      if (decreaseFont) decreaseFont();
      break;

    case 'TOGGLE_CONTRAST':
      speakText('Toggling high contrast mode.');
      if (toggleHighContrast) toggleHighContrast();
      break;

    case 'RESET_NORMAL_MODE':
      speakText('Switched to clean white theme.');
      if (handlers.resetToNormalMode) handlers.resetToNormalMode();
      break;

    case 'LOGOUT':
      speakText('Logging you out. Goodbye!');
      if (logout) setTimeout(logout, 1200);
      break;

    case 'GO_BACK':
      speakText('Going back.');
      window.history.back();
      break;

    default:
      speakText('Sorry, I did not understand that command. Try saying: go home, request help, or send SOS.');
  }
}

/**
 * Start listening for a voice command (one-shot, 4 second timeout).
 * Returns the recognition instance so the caller can stop it.
 */
export function startVoiceCommandListening({ onListening, onMatch, onNoMatch, onEnd }) {
  if (!isSpeechRecognitionSupported()) {
    speakText('Voice commands are not supported in this browser. Please use Chrome or Edge.');
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 3;

  let handled = false;

  if (onListening) onListening();

  recognition.onresult = (event) => {
    handled = true;
    for (let i = 0; i < event.results[0].length; i++) {
      const transcript = event.results[0][i].transcript;
      const command = matchCommand(transcript);
      if (command) {
        if (onMatch) onMatch(command, transcript);
        return;
      }
    }
    if (onNoMatch) onNoMatch(event.results[0][0].transcript);
  };

  recognition.onerror = (event) => {
    handled = true;
    if (event.error !== 'no-speech' && event.error !== 'aborted') {
      speakText('Could not hear you clearly. Please try again.');
    }
    if (onEnd) onEnd();
  };

  recognition.onend = () => {
    if (!handled && onEnd) {
      onEnd();
    }
  };

  recognition.start();
  return recognition;
}
