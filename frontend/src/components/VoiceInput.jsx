import React, { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { listenToSpeech, isSpeechRecognitionSupported } from '../services/speech';

export default function VoiceInput({ onTranscript, label = 'Tap to Speak', lang = 'en-US' }) {
  const [isListening, setIsListening] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const recognitionRef = React.useRef(null);

  const supported = isSpeechRecognitionSupported();

  const handleStartListening = () => {
    if (!supported) {
      alert('Voice input is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setStatusMsg('');
      return;
    }

    setIsListening(true);
    setStatusMsg('Listening... speak clearly into your microphone.');

    recognitionRef.current = listenToSpeech(
      (text) => {
        if (onTranscript) onTranscript(text);
      },
      (error) => {
        if (error === 'no-speech') {
          setStatusMsg("Didn't catch that. Please speak louder or check your mic.");
        } else if (error === 'aborted') {
          setStatusMsg(''); 
        } else {
          setStatusMsg('Voice error: ' + error);
        }
        setIsListening(false);
      },
      () => {
        setIsListening(false);
        setStatusMsg('');
      },
      lang
    );
  };

  return (
    <div className="voice-input">
      <button
        type="button"
        onClick={handleStartListening}
        aria-label={isListening ? 'Listening for speech input' : label}
        aria-pressed={isListening}
        className={`voice-input-button ${isListening ? 'is-listening' : ''}`}
      >
        {isListening ? (
          <>
            <MicOff />
            <span>Listening... Tap done</span>
          </>
        ) : (
          <>
            <Mic />
            <span>Speak to Type</span>
          </>
        )}
      </button>

      {statusMsg && (
        <p className="voice-input-status" role="status">
          {statusMsg}
        </p>
      )}
    </div>
  );
}
