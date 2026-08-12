import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Phone, MessageSquare, CheckCircle, ShieldAlert, ArrowLeft, Navigation, AlertTriangle, PhoneCall, Star } from 'lucide-react';
import api from '../../services/api';
import { startVoiceCall } from '../../services/webrtc';
import TaskMapView from '../../components/TaskMapView';

export default function ActiveTask() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [panicModal, setPanicModal] = useState(false);
  const [panicReason, setPanicReason] = useState('');
  const [releaseModal, setReleaseModal] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');

  const handleReleaseSubmit = async () => {
    try {
      await api.post(`/tasks/${id}/release`, { reason: releaseReason || 'Unexpected situation' });
      alert('⚡ Task released back to neighborhood pool and forwarded to other nearby volunteers!');
      setReleaseModal(false);
      navigate('/volunteer');
    } catch (err) {
      alert('Release error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handlePanicSubmit = async () => {
    if (!panicReason) return;
    try {
      await api.post('/safety/report', { task_id: id, reason: panicReason });
      alert('🚨 Emergency safety report dispatched to admins!');
      setPanicModal(false);
      fetchTaskDetails();
    } catch (err) {
      alert('Error submitting report: ' + err.message);
    }
  };

  const navigate = useNavigate();

  const fetchTaskDetails = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.task);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await api.post(`/tasks/${id}/status`, { status: newStatus, reason: `Volunteer updated status to ${newStatus}` });
      fetchTaskDetails();
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  const handleStartCall = () => {
    if (!task) return;
    setInCall(true);
    startVoiceCall(
      task.requester_id,
      (remoteStream) => {
        const audioEl = new Audio();
        audioEl.srcObject = remoteStream;
        audioEl.play();
      },
      (err) => {
        alert('Voice call notice: ' + err);
        setInCall(false);
      }
    );
  };

  if (loading) return <div className="card"><p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading active task details...</p></div>;
  if (!task) return <div className="card"><p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Task not found.</p></div>;

  const phoneToCall = task.requester_phone || '555-0199';

  return (
    <div className="flow-page active-task-page" style={{ maxWidth: 750, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <button onClick={() => navigate('/volunteer')} className="btn btn-secondary" style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft style={{ width: 24, height: 24 }} /> Back to Feed
      </button>

      {/* Unlocked Exact Location Card */}
      <div className="card" style={{ border: '3px solid var(--accent-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <span className={`badge badge-${task.status}`}>
              {task.status.replace('_', ' ').toUpperCase()}
            </span>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-primary)' }}>
              {task.category.toUpperCase()} — {task.requester_name}
            </h2>
          </div>

          <button
            onClick={() => setPanicModal(true)}
            className="btn btn-danger active-safety-button"
            style={{ padding: '0.5rem 1rem' }}
          >
            <ShieldAlert style={{ width: 22, height: 22 }} />
            <span>REPORT / PANIC</span>
          </button>
        </div>

        {/* Unlocked Map Component & Directions Button */}
        <div style={{ marginTop: '1.25rem' }}>
          <TaskMapView 
            mode="unlocked" 
            lat={task.latitude || 40.7128} 
            lng={task.longitude || -74.0060} 
            fullAddress={task.full_address} 
            approxArea={task.approximate_area_text} 
          />
        </div>

        <p style={{ fontSize: '1.25rem', marginTop: '1.25rem', background: '#f8fafc', padding: '1.1rem', borderRadius: '14px', border: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)' }}>
          "{task.description}"
        </p>

        {/* Senior Extra Details */}
        <div style={{ marginTop: '1.25rem', padding: '1.1rem', background: '#eff6ff', borderRadius: '14px', border: '1px solid #bfdbfe' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', color: '#1e40af' }}>Senior Profile Details</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#1e3a8a', fontWeight: 600 }}>
            <li><strong>Age:</strong> {task.requester_age ? `${task.requester_age} years old` : 'Not provided'}</li>
            <li><strong>Mobility Needs:</strong> {task.requester_mobility_needs || 'None specified'}</li>
            {task.requester_trusted_contact_phone && (
              <li><strong>Emergency Contact:</strong> {task.requester_trusted_contact_phone}</li>
            )}
          </ul>
        </div>

        {/* Multi-Channel Communication Buttons */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1.25rem' }}>
          {/* Direct Phone Dialer Protocol */}
          <a
            href={`tel:${phoneToCall}`}
            className="btn btn-success"
            style={{ 
              flex: 1, 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              height: '52px',
              minHeight: '52px',
              padding: '0 1.25rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: '14px',
              textDecoration: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <PhoneCall style={{ width: 22, height: 22, flexShrink: 0 }} />
            <span>Call Senior Phone</span>
          </a>

          {/* Masked Chat */}
          <Link 
            to={`/chat/${task.id}`} 
            className="btn btn-primary"
            style={{ 
              flex: 1, 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem',
              height: '52px',
              minHeight: '52px',
              padding: '0 1.25rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: '14px',
              textDecoration: 'none',
              whiteSpace: 'nowrap'
            }}
          >
            <MessageSquare style={{ width: 22, height: 22, flexShrink: 0 }} />
            <span>Open Chat Room</span>
          </Link>
        </div>

        {/* Status Transitions */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Task Progress Actions:
          </h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {task.status === 'assigned' && (
              <button
                onClick={() => handleStatusChange('in_progress')}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <Navigation style={{ width: 24, height: 24 }} />
                <span>Mark "On My Way" / In Progress</span>
              </button>
            )}

            {task.status === 'in_progress' && (
              <button
                onClick={() => handleStatusChange('completed')}
                className="btn btn-success"
                style={{ flex: 1 }}
              >
                <CheckCircle style={{ width: 24, height: 24 }} />
                <span>Mark Task Completed</span>
              </button>
            )}

            {task.status === 'completed' && (
              <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '2px solid #34d399',
                borderRadius: '16px',
                padding: '1.25rem',
                color: '#065f46',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.2rem', color: '#047857' }}>
                  <CheckCircle style={{ width: 28, height: 28, color: '#059669' }} />
                  <span>Task Completed!</span>
                </div>
                <p style={{ margin: '0.6rem 0 0 0', fontSize: '1rem', color: '#065f46', lineHeight: 1.5, fontWeight: 600 }}>
                  You have successfully completed this request for <strong>{task.requester_name || 'your senior neighbor'}</strong>. This task is recorded in your volunteer history.
                </p>
                {task.rating_stars ? (
                  <div style={{ marginTop: '0.85rem', padding: '0.75rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d97706', fontWeight: 700 }}>
                      <span>Senior Review:</span>
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={16} fill={n <= task.rating_stars ? '#f59e0b' : 'none'} color="#f59e0b" />
                      ))}
                      <span style={{ marginLeft: '0.3rem', color: '#374151' }}>({task.rating_stars}/5)</span>
                    </div>
                    {task.rating_comment && (
                      <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.9rem', fontStyle: 'italic', color: '#4b5563' }}>
                        "{task.rating_comment}"
                      </p>
                    )}
                  </div>
                ) : null}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button onClick={() => navigate('/volunteer', { state: { tab: 'history' } })} className="btn btn-success" style={{ flex: 1, padding: '0.75rem 1rem', fontSize: '1rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <CheckCircle style={{ width: 20, height: 20 }} /> View History on Volunteer Page
                  </button>
                </div>
              </div>
            )}

            {/* Relinquish / Release Button */}
            {(task.status === 'assigned' || task.status === 'in_progress') && (
              <button
                onClick={() => setReleaseModal(true)}
                className="btn btn-secondary"
                style={{ background: '#fff1f2', color: '#e11d48', borderColor: '#fecdd3', fontWeight: 800 }}
              >
                <AlertTriangle style={{ width: 22, height: 22, color: '#e11d48' }} />
                <span>Cannot Attend / Forward to Other Volunteers</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Relinquish / Release Modal */}
      {releaseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', border: '3px solid #f43f5e' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e11d48', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle style={{ width: 28, height: 28 }} />
              Release &amp; Forward to Nearby Volunteers
            </h3>

            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem' }}>
              Had an unexpected emergency or vehicle issue? Releasing this request will immediately send push alerts to all other nearby volunteers so someone else can step in right away!
            </p>

            <textarea
              className="input-field"
              rows={3}
              placeholder="Optional: Brief reason for releasing (e.g. Vehicle breakdown, sudden emergency)..."
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleReleaseSubmit} className="btn btn-danger" style={{ flex: 1, background: '#e11d48', borderColor: '#be123c' }}>
                CONFIRM &amp; FORWARD REQUEST
              </button>
              <button onClick={() => setReleaseModal(false)} className="btn btn-secondary">
                Keep Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panic Modal */}
      {panicModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', border: '3px solid var(--accent-danger)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert style={{ width: 32, height: 32 }} />
              Submit Incident Report / Panic Trigger
            </h3>

            <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Describe what went wrong or any safety concern. Admins will be notified immediately.
            </p>

            <textarea
              className="input-field"
              rows={4}
              placeholder="Provide reason for alert..."
              value={panicReason}
              onChange={(e) => setPanicReason(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handlePanicSubmit} className="btn btn-danger" style={{ flex: 1 }}>
                SEND SAFETY ALERT
              </button>
              <button onClick={() => setPanicModal(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
