import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Lock, Music, Camera, Image as ImageIcon, MessageCircle, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import VoiceInput from '../components/VoiceInput';
import VoiceRecorder from '../components/VoiceRecorder';
import SpeechPlayer from '../components/SpeechPlayer';
import { cleanTranscript } from '../services/speech';

export default function ChatRoom() {
  const { taskId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencySending, setEmergencySending] = useState(false);

  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/chat/${taskId}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Chat fetch error:', err);
      setError(err.response?.data?.error || err.message || 'Could not load chat messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchMessages();
    }
  }, [taskId]);

  useEffect(() => {
    if (socket && taskId) {
      socket.emit('join:task', { taskId });

      const handleIncomingMessage = (msg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      };

      socket.on('message:received', handleIncomingMessage);

      return () => {
        socket.emit('leave:task', { taskId });
        socket.off('message:received', handleIncomingMessage);
      };
    }
  }, [socket, taskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendRawContent = async (contentToSend) => {
    if (!contentToSend) return;

    try {
      if (socket && socket.connected) {
        // Send once via Socket.IO real-time connection
        socket.emit('message:send', {
          taskId,
          senderId: user.id,
          senderName: user.name,
          senderRole: user.role,
          content: contentToSend
        });
      } else {
        // Fallback REST API if socket is disconnected
        const res = await api.post(`/chat/${taskId}/messages`, { content: contentToSend });
        if (res.data?.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === res.data.message.id)) return prev;
            return [...prev, res.data.message];
          });
          scrollToBottom();
        }
      }
    } catch (err) {
      console.error('Send error:', err);
      alert('Message failed to send: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const contentToSend = newMessage.trim();
    setNewMessage('');
    await sendRawContent(contentToSend);
  };

  // Called when a real voice note audio recording is finished & sent by VoiceRecorder
  const handleSendAudioMsg = async (audioBase64String) => {
    await sendRawContent(audioBase64String);
  };

  // Called when user selects a photo/image of medicine box or item
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo size is too large (max 5MB). Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result;
      await sendRawContent(`[IMAGE]:${base64Image}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const sendEmergencyAlert = async () => {
    setEmergencySending(true);
    try {
      if (user?.role === 'senior') {
        await api.post('/tasks/sos', {});
      } else {
        await api.post('/safety/report', {
          task_id: taskId,
          reason: 'Emergency assistance requested from the secure chat.'
        });
      }
      setEmergencyOpen(false);
      alert('Emergency alert sent. The safety team and nearby support have been notified.');
    } catch (err) {
      alert(err.response?.data?.error || 'We could not send the emergency alert. Please call local emergency services if you are in immediate danger.');
    } finally {
      setEmergencySending(false);
    }
  };

  return (
    <div className="flow-page chat-page">
      
      {/* Hidden File Input for Photo Attachment */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handlePhotoSelect}
        style={{ display: 'none' }}
      />

      {/* Header Bar */}
      <div className="card chat-header" role="banner" aria-label="Chat room header">
        <button onClick={() => navigate(-1)} className="btn btn-secondary chat-back" aria-label="Go back to previous page">
          <ArrowLeft style={{ width: 22, height: 22 }} /> Back
        </button>

        <div className="chat-title-block">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            💬 In-App Chat
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Lock style={{ width: 14, height: 14 }} /> Secure &amp; Private Chat
          </span>
        </div>

        <SpeechPlayer text={`In app chat room. You can send text, voice audio notes, or photos of what you need.`} />
      </div>

      {error ? (
        <div className="card chat-error">
          <p style={{ color: 'var(--accent-danger)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '1rem' }}>
            {error}
          </p>
          <button onClick={fetchMessages} className="btn btn-primary">
            Try Loading Again
          </button>
        </div>
      ) : (
        <>
          {/* Messages Container */}
          <div className="card chat-transcript" role="log" aria-live="polite" aria-label="Chat messages" aria-relevant="additions">
            {loading ? (
              <p className="chat-loading">Loading chat history...</p>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon"><MessageCircle /></div>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                  No messages in this chat room yet.
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                  Type a message, record a voice note, or tap <strong>📷 Send Photo</strong> to show a picture of what you need!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                const isAudio = msg.content && msg.content.startsWith('[AUDIO]:');
                const isImage = msg.content && msg.content.startsWith('[IMAGE]:');

                const audioSrc = isAudio ? msg.content.replace('[AUDIO]:', '') : null;
                const imageSrc = isImage ? msg.content.replace('[IMAGE]:', '') : null;

                return (
                  <div
                    key={msg.id || Math.random()}
                    className={`chat-message ${isMe ? 'is-mine' : 'is-theirs'}`}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      background: isMe ? 'var(--accent-primary)' : 'var(--bg-primary)',
                      color: isMe ? '#ffffff' : 'var(--text-primary)',
                      border: isMe ? 'none' : '2px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '0.85rem 1.1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <strong style={{ fontSize: '0.95rem' }}>
                        {isMe ? 'You' : msg.sender_name} ({msg.sender_role})
                      </strong>
                      {!isMe && !isAudio && !isImage && (
                        <SpeechPlayer text={`${msg.sender_name} says: ${msg.content}`} label="Listen" />
                      )}
                    </div>

                    {/* Audio Voice Note Player */}
                    {isAudio && (
                      <div style={{ marginTop: '0.35rem', background: isMe ? 'rgba(255,255,255,0.15)' : '#ffffff', padding: '0.6rem 0.85rem', borderRadius: '12px', border: isMe ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', fontWeight: 800, fontSize: '0.85rem' }}>
                          <Music size={15} /> <span>Voice Note Audio Message</span>
                        </div>
                        <audio
                          controls
                          src={audioSrc}
                          style={{ width: '100%', height: '36px', borderRadius: '8px' }}
                        />
                      </div>
                    )}

                    {/* Photo / Image Attachment */}
                    {isImage && (
                      <div style={{ marginTop: '0.35rem' }}>
                        <img
                          src={imageSrc}
                          alt="Attached Item Photo"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '320px',
                            borderRadius: '12px',
                            border: isMe ? '2px solid rgba(255,255,255,0.4)' : '2px solid var(--border-color)',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                        <span style={{ fontSize: '0.78rem', opacity: 0.9, marginTop: '0.25rem', display: 'block', fontWeight: 700 }}>
                          📷 Photo of item
                        </span>
                      </div>
                    )}

                    {/* Plain Text Message */}
                    {!isAudio && !isImage && (
                      <p style={{ fontSize: '1.1rem', whiteSpace: 'pre-wrap', margin: 0 }}>{msg.content}</p>
                    )}

                    <span style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block', marginTop: '0.4rem', textAlign: 'right' }}>
                      {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Media & Input Controls Toolbar */}
          <div className="card chat-composer">
            
            {/* Media Action Bar: Equal 2 Columns */}
            <div className="chat-tools">
              
              {/* 1. Record Voice Audio Note */}
              <div style={{ width: '100%' }}>
                <VoiceRecorder onSendAudio={handleSendAudioMsg} />
              </div>

              {/* 2. Speak to Type (Dictation) */}
              <div style={{ width: '100%' }}>
                <VoiceInput 
                  onTranscript={(text) => setNewMessage((prev) => cleanTranscript(prev ? `${prev} ${text}` : text))} 
                />
              </div>

              <button type="button" className="chat-photo-button" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon /> <span>Send photo</span>
              </button>

              <button type="button" className="chat-emergency-button" onClick={() => setEmergencyOpen(true)}>
                <AlertTriangle /> <span>Emergency help</span>
              </button>

            </div>

            {/* Standard Text Input Form */}
            <form onSubmit={handleSendMessage} className="chat-send-form" role="form" aria-label="Send a message">
              <label htmlFor="chat-input" className="visually-hidden">Type your message</label>
              <input
                id="chat-input"
                type="text"
                className="input-field chat-input"
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                aria-required="true"
              />
              <button type="submit" className="btn btn-primary chat-send-button" aria-label="Send message">
                <Send style={{ width: 22, height: 22 }} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </>
      )}

      {emergencyOpen && (
        <div className="dialog-backdrop">
          <div className="dialog-card emergency-dialog" role="alertdialog" aria-modal="true" aria-labelledby="emergency-dialog-title">
            <div className="emergency-dialog-icon"><AlertTriangle /></div>
            <span className="eyebrow">Safety alert</span>
            <h2 id="emergency-dialog-title">Send emergency help alert?</h2>
            <p>This notifies nearby support and the safety team that immediate assistance may be needed for this task.</p>
            <div className="emergency-dialog-actions">
              <button type="button" className="action-button action-outline" onClick={() => setEmergencyOpen(false)} disabled={emergencySending}>Cancel</button>
              <button type="button" className="action-button action-danger" onClick={sendEmergencyAlert} disabled={emergencySending}><AlertTriangle size={16} /> {emergencySending ? 'Sending alert...' : 'Send emergency alert'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
