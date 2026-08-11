import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speakText, stopSpeech } from '../services/speech';

export default function SpeechPlayer({ text, label = 'Read Aloud' }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggle = () => {
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    } else {
      if (!text) return;
      setIsPlaying(true);
      speakText(text, 0.85, 1.0);
      
      const duration = Math.max(2000, text.length * 80);
      setTimeout(() => setIsPlaying(false), duration);
    }
  };

  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={handleToggle}
      aria-label={`${label}: ${text}`}
      style={{
        padding: '0.5rem 1.1rem',
        minHeight: '44px',
        borderColor: 'var(--accent-primary)',
        color: 'var(--text-primary)',
        fontSize: '0.95rem'
      }}
    >
      {isPlaying ? (
        <>
          <VolumeX style={{ width: 20, height: 20, color: 'var(--accent-danger)' }} />
          <span>Stop Reading</span>
        </>
      ) : (
        <>
          <Volume2 style={{ width: 20, height: 20, color: 'var(--accent-primary)' }} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
