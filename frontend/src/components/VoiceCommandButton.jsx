import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { startVoiceCommandListening, executeCommand } from '../services/voiceCommands';

/**
 * VoiceCommandButton
 * Click-to-activate voice navigation button.
 * Simple, fast, and 100% reliable.
 */
export default function VoiceCommandButton() {
  const [listening, setListening] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showHelp, setShowHelp]   = useState(false);
  const recognitionRef = useRef(null);

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { increaseFont, decreaseFont, toggleHighContrast, toggleDarkMode, resetToNormalMode } = useAccessibility();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  /* ── Activate Voice Command Listener on Click ── */
  const handleMicClick = () => {
    if (listening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_) {}
      }
      setListening(false);
      setStatusMsg('');
      return;
    }

    setListening(true);
    setStatusMsg('🎙️ Listening... Say: "home", "request", "sos", "read", "contrast", "back", "logout"');

    const recognition = startVoiceCommandListening({
      onListening: () => setListening(true),
      onMatch: (command, transcript) => {
        setStatusMsg(`✅ Understood: "${transcript}"`);
        executeCommand(command, {
          navigate,
          logout: handleLogout,
          increaseFont,
          decreaseFont,
          toggleHighContrast,
          toggleDarkMode,
          resetToNormalMode,
        }, user?.role);

        setTimeout(() => {
          setStatusMsg('');
          setListening(false);
        }, 2500);
      },
      onNoMatch: (transcript) => {
        setStatusMsg(`❌ Not recognised: "${transcript}". Try: "home", "request", "sos", "read", "contrast", "back", "logout"`);
        setTimeout(() => {
          setStatusMsg('');
          setListening(false);
        }, 3500);
      },
      onEnd: () => {
        setListening(false);
        setTimeout(() => setStatusMsg(''), 2500);
      },
    });

    recognitionRef.current = recognition;
  };

  return (
    <>
      {/* Status Toast */}
      {statusMsg && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: listening ? '#1d4ed8' : '#1e293b',
            color: '#fff',
            padding: '0.65rem 1.4rem',
            borderRadius: '30px',
            fontSize: '0.93rem',
            fontWeight: 700,
            zIndex: 10001,
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            maxWidth: '480px',
            width: '90%',
            textAlign: 'center',
            animation: 'fadeInUp 0.25s ease',
          }}
        >
          {statusMsg}
        </div>
      )}

      {/* Help Panel */}
      {showHelp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Voice command help"
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '90px',
            background: 'var(--bg-card)',
            border: '2px solid var(--accent-primary)',
            borderRadius: '16px',
            padding: '1.2rem 1.4rem',
            zIndex: 10000,
            width: '310px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>🎙️ Voice Commands</strong>
            <button
              onClick={() => setShowHelp(false)}
              aria-label="Close help panel"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ marginBottom: '0.85rem', padding: '0.5rem 0.7rem', background: 'rgba(29,78,216,0.08)', borderRadius: '8px', border: '1px solid rgba(29,78,216,0.18)' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
              💡 Click the mic button below and speak any command:
            </p>
          </div>

          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '340px', overflowY: 'auto' }}>
            {[
              ['"home", "go home", "dashboard", "start", "main page", "take me home"', 'Goes to your dashboard'],
              ['"request", "request help", "need help", "i need help", "get help", "new task"', 'Opens Create Task'],
              ['"sos", "send sos", "emergency", "urgent help", "call for help"', 'Triggers SOS'],
              ['"read", "read the page", "speak", "read to me", "what does it say"', 'Reads page aloud'],
              ['"stop", "quiet", "pause", "silence", "be quiet"', 'Stops reading'],
              ['"contrast", "high contrast", "normal mode", "light mode", "accessibility mode"', 'Toggles contrast / normal mode'],
              ['"back", "go back", "return", "previous page"', 'Goes back'],
              ['"bye", "goodbye", "exit", "sign out", "log out"', 'Logs out'],
            ].map(([phrases, desc]) => (
              <li key={desc} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>{desc}</span>
                <code style={{ background: 'var(--bg-subtle)', padding: '3px 7px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 600, color: 'var(--accent-primary)', wordBreak: 'break-word', lineHeight: 1.4 }}>
                  {phrases}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Floating Mic Button */}
      <button
        onClick={handleMicClick}
        onContextMenu={(e) => { e.preventDefault(); setShowHelp(prev => !prev); }}
        aria-label={listening ? 'Stop voice command — currently listening' : 'Start voice command — click to activate'}
        aria-pressed={listening}
        title="Click to activate voice commands (Right-click for help)"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 9999,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: listening
            ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
            : 'linear-gradient(135deg, #1d4ed8, #1e40af)',
          color: '#fff',
          boxShadow: listening
            ? '0 0 0 6px rgba(220,38,38,0.25), 0 8px 24px rgba(220,38,38,0.4)'
            : '0 8px 24px rgba(29,78,216,0.35)',
          transition: 'all 0.3s ease',
          animation: listening ? 'pulse-mic 1.2s ease-in-out infinite' : 'none',
        }}
      >
        {listening ? <MicOff size={22} /> : <Mic size={22} />}
      </button>

      <style>{`
        @keyframes pulse-mic {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4), 0 8px 24px rgba(220,38,38,0.4); }
          50%       { box-shadow: 0 0 0 12px rgba(220,38,38,0), 0 8px 24px rgba(220,38,38,0.4); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
