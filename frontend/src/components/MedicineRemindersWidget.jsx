import React, { useState, useEffect } from 'react';
import { Pill, Plus, CheckCircle, Circle, Volume2, Trash2, Clock, X, HeartPulse } from 'lucide-react';
import api from '../services/api';
import { speakText, cleanTranscript } from '../services/speech';
import VoiceInput from './VoiceInput';

export default function MedicineRemindersWidget() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00 AM');
  const [newType, setNewType] = useState('medicine');
  const [submitting, setSubmitting] = useState(false);

  const fetchReminders = async () => {
    try {
      const res = await api.get('/reminders');
      setReminders(res.data.reminders || []);
    } catch (err) {
      console.warn('Reminders fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const toggleReminder = async (id) => {
    try {
      // Optimistic UI update
      setReminders(prev => prev.map(r => r.id === id ? { ...r, is_completed: r.is_completed ? 0 : 1 } : r));
      const res = await api.put(`/reminders/${id}/toggle`);
      if (res.data.reminder?.is_completed) {
        speakText(`Great job! Marked ${res.data.reminder.title} as completed.`);
      }
    } catch (err) {
      fetchReminders(); // Rollback on error
    }
  };

  const deleteReminder = async (id) => {
    try {
      setReminders(prev => prev.filter(r => r.id !== id));
      await api.delete(`/reminders/${id}`);
    } catch (err) {
      fetchReminders();
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/reminders', {
        title: newTitle.trim(),
        time_str: newTime,
        type: newType
      });
      setNewTitle('');
      setModalOpen(false);
      fetchReminders();
    } catch (err) {
      alert('Could not add reminder.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoiceTitle = (text) => {
    if (!text) return;
    setNewTitle(prev => cleanTranscript(prev ? `${prev} ${text}` : text));
  };

  const readReminderAloud = (rem) => {
    speakText(`Reminder for ${rem.time_str}: ${rem.title}. ${rem.is_completed ? 'Status: Already taken.' : 'Status: Pending.'}`);
  };

  const readAllReminders = () => {
    const pending = reminders.filter(r => !r.is_completed);
    if (pending.length === 0) {
      speakText('Wonderful! All your medicine and daily routine reminders are completed for today.');
    } else {
      const titles = pending.map(r => `${r.title} at ${r.time_str}`).join('. ');
      speakText(`You have ${pending.length} pending reminders today: ${titles}.`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'routine': return '🚶';
      case 'food': return '🍲';
      case 'checkin': return '❤️';
      default: return '💊';
    }
  };

  const completedCount = reminders.filter(r => r.is_completed).length;

  return (
    <section className="workspace-card medicine-reminders-card" role="region" aria-label="Daily Medicine & Routine Reminders">
      <div className="section-title" style={{ marginBottom: '1rem' }}>
        <div>
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-primary)' }}>
            <HeartPulse size={14} /> Smart Health &amp; Routine Tracker
          </span>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.2rem 0 0' }}>
            Daily Medicine &amp; Check-in Reminders
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="action-button action-outline small"
            onClick={readAllReminders}
            title="Read all reminders aloud"
            aria-label="Read all pending reminders aloud"
          >
            <Volume2 size={16} /> <span>Read All</span>
          </button>
          <button
            type="button"
            className="action-button action-primary small"
            onClick={() => setModalOpen(true)}
            aria-label="Add new reminder"
          >
            <Plus size={16} /> <span>Add Reminder</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {reminders.length > 0 && (
        <div style={{ marginBottom: '1.2rem', background: 'var(--bg-subtle)', padding: '0.65rem 0.9rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
            <span>Today's Progress ({completedCount}/{reminders.length} completed)</span>
            <span style={{ color: completedCount === reminders.length ? 'var(--accent-success)' : 'var(--accent-primary)' }}>
              {Math.round((completedCount / reminders.length) * 100)}%
            </span>
          </div>
          <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(completedCount / reminders.length) * 100}%`,
                background: completedCount === reminders.length ? 'linear-gradient(90deg, #16a34a, #22c55e)' : 'linear-gradient(90deg, #2563eb, #3b82f6)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Reminders List */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading health reminders...</p>
      ) : reminders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)' }}>
          <Pill size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
          <p style={{ margin: 0, fontWeight: 700 }}>No reminders added yet.</p>
          <p style={{ fontSize: '0.85rem', margin: '0.2rem 0 0' }}>Tap "+ Add Reminder" above to set up medication or daily check-in alerts.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {reminders.map((rem) => {
            const isDone = Boolean(rem.is_completed);
            return (
              <div
                key={rem.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  background: isDone ? 'rgba(34, 197, 94, 0.06)' : 'var(--bg-subtle)',
                  border: isDone ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid var(--border-color)',
                  opacity: isDone ? 0.78 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Left Toggle & Text */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => toggleReminder(rem.id)}
                    aria-label={isDone ? `Mark ${rem.title} as incomplete` : `Mark ${rem.title} as completed`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: isDone ? 'var(--accent-success)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {isDone ? <CheckCircle size={22} fill="currentColor" color="#fff" /> : <Circle size={22} />}
                  </button>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.1rem' }}>{getIcon(rem.type)}</span>
                      <strong style={{
                        fontSize: '0.98rem',
                        color: 'var(--text-primary)',
                        textDecoration: isDone ? 'line-through' : 'none'
                      }}>
                        {rem.title}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                      <Clock size={12} /> {rem.time_str}
                    </span>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => readReminderAloud(rem)}
                    aria-label={`Listen to reminder: ${rem.title}`}
                    title="Read aloud"
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      color: 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Volume2 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteReminder(rem.id)}
                    aria-label={`Delete reminder: ${rem.title}`}
                    title="Delete reminder"
                    style={{
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      {modalOpen && (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label="Add new reminder">
          <div className="dialog-card">
            <button type="button" className="dialog-close" onClick={() => setModalOpen(false)}>
              <X size={18} />
            </button>
            <span className="eyebrow">➕ Daily Reminder</span>
            <h2>Add Health / Routine Reminder</h2>
            <p>Set a daily reminder for medication, water, walk, or check-in.</p>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label htmlFor="reminder-title-input" style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Reminder Title
                </label>
                <input
                  id="reminder-title-input"
                  type="text"
                  className="input-field"
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                  placeholder="e.g. Evening Heart Medication"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  autoFocus
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <VoiceInput onTranscript={handleVoiceTitle} label="Speak Title" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Time
                  </label>
                  <select
                    className="input-field"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                  >
                    {['07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '05:00 PM', '07:00 PM', '09:00 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    Category
                  </label>
                  <select
                    className="input-field"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="medicine">💊 Medicine</option>
                    <option value="routine">🚶 Walk / Routine</option>
                    <option value="food">🍲 Meal / Water</option>
                    <option value="checkin">❤️ Check-in</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="action-button action-primary"
                style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Reminder'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
