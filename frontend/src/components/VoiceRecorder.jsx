import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Send, Trash2 } from 'lucide-react';

/**
 * Voice Note Recorder Component
 * Records real audio notes using browser MediaRecorder API
 * and returns the base64 audio string to parent on Send.
 */
export default function VoiceRecorder({ onSendAudio }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioPlayerRef = useRef(null);

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/aac'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const recordedMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: recordedMime });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const handleSend = () => {
    if (!audioBlob) return;

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      const base64Audio = reader.result;
      if (onSendAudio) {
        onSendAudio(`[AUDIO]:${base64Audio}`);
      }
      cancelRecording();
    };
  };

  const togglePreviewPlay = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="voice-recorder">
      {!isRecording && !audioUrl && (
        <button
          type="button"
          onClick={startRecording}
          className="voice-recorder-start"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '0 1rem',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            width: '100%',
            height: '46px',
            boxSizing: 'border-box'
          }}
        >
          <Mic style={{ width: 18, height: 18 }} />
          <span>Record Voice Note</span>
        </button>
      )}

      {/* Recording State UI */}
      {isRecording && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: '#fef2f2',
          border: '2px solid #fca5a5',
          borderRadius: '16px',
          padding: '0.65rem 1rem'
        }}>
          <div style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#dc2626',
            boxShadow: '0 0 10px #dc2626',
            animation: 'pulse 1s infinite'
          }} />
          <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '1rem' }}>
            Recording... {formatTime(recordingTime)}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.4rem 0.85rem',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Square style={{ width: 14, height: 14 }} /> Stop
          </button>
          <button
            type="button"
            onClick={cancelRecording}
            style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 700 }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Preview Audio Recorded UI */}
      {audioUrl && !isRecording && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: '#f0fdf4',
          border: '2px solid #bbf7d0',
          borderRadius: '16px',
          padding: '0.65rem 1rem',
          flexWrap: 'wrap'
        }}>
          <audio
            ref={audioPlayerRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={togglePreviewPlay}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
          </button>

          <span style={{ fontWeight: 800, color: '#166534', fontSize: '0.92rem' }}>
            🎵 Voice Note Ready ({formatTime(recordingTime)})
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={cancelRecording}
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                borderRadius: '10px',
                padding: '0.4rem 0.75rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Trash2 size={14} /> Delete
            </button>

            <button
              type="button"
              onClick={handleSend}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.4rem 1rem',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Send size={14} /> Send Voice Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
