import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowRight, Bell, CheckCircle, CheckCircle2, Clock3, HeartHandshake, MapPin, MessageCircle, RefreshCw, ShieldCheck, Star, UsersRound, X, History } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import fcmClient from '../../services/fcmClient';

const category = {
  groceries: ['Groceries', '🛒'],
  pharmacy: ['Medicine', '💊'],
  tech: ['Tech support', '📱'],
  repair: ['Home repair', '🔧'],
  transport: ['Transport', '🚗'],
  other: ['Neighbourly help', '🤝']
};

const taskCategory = (type) => category[type] || [type || 'Help request', '🤝'];

export default function VolunteerFeed() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  
  const [feed, setFeed] = useState([]);
  const [claimed, setClaimed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [push, setPush] = useState('default');
  const [tab, setTab] = useState(location.state?.tab || 'active');

  const load = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      setRefreshing(true);
      const fetchData = async (url) => {
        try {
          const [a, b] = await Promise.all([api.get(url), api.get('/tasks/my-tasks')]);
          setFeed(a.data.feed || []);
          setClaimed(b.data.tasks || []);
        } catch (err) {
          console.warn('Feed load error:', err);
        }
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchData(`/tasks/feed?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`),
          () => fetchData('/tasks/feed'),
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        await fetchData('/tasks/feed');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    if ('Notification' in window) setPush(Notification.permission);
  }, []);

  useEffect(() => {
    if (location.state?.tab) {
      setTab(location.state.tab);
    }
  }, [location.state]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => load(true);
    const alert = payload => {
      refresh();
      setNotice(payload);
      setTimeout(() => setNotice(null), 7000);
    };

    socket.on('feed:refresh', refresh);
    socket.on('task:created', refresh);
    socket.on('task:updated', refresh);
    socket.on('volunteer:new_task_alert', alert);

    return () => {
      socket.off('feed:refresh', refresh);
      socket.off('task:created', refresh);
      socket.off('task:updated', refresh);
      socket.off('volunteer:new_task_alert', alert);
    };
  }, [socket]);

  const decline = async id => {
    setFeed(old => old.filter(task => task.id !== id));
    try {
      await api.post(`/tasks/${id}/decline`);
    } catch {
      load(true);
    }
  };

  const enablePush = async () => {
    const granted = await fcmClient.requestPermission();
    setPush(granted ? 'granted' : 'denied');
  };

  const active = claimed.filter(t => ['assigned', 'in_progress'].includes(t.status));
  const open = feed.filter(t => t.status === 'pending');
  const completed = claimed.filter(t => t.status === 'completed');

  return (
    <div className="workspace volunteer-workspace">
      {notice && (
        <div className="live-notice">
          <Bell size={19} />
          <div>
            <b>{notice.title || 'New request nearby'}</b>
            <span>{notice.body || 'A neighbour needs assistance.'}</span>
          </div>
          <button onClick={() => setNotice(null)} aria-label="Dismiss notification">
            <X size={17} />
          </button>
        </div>
      )}

      {user?.verification_status !== 'verified' && (
        <div className="verification-banner">
          <AlertTriangle size={20} />
          <div>
            <b>Verification in progress</b>
            <span>You can view nearby requests now. Claiming unlocks after an admin approves your profile.</span>
          </div>
        </div>
      )}

      <header className="workspace-hero volunteer-hero">
        <div>
          <span className="eyebrow"><HeartHandshake size={14} /> Volunteer workspace</span>
          <h1>Make a difference nearby.</h1>
          <p>See requests in your area, manage your active help, and track your completed history with neighbours.</p>
        </div>
        <div className="hero-controls">
          {push === 'granted' ? (
            <span className="push-active"><Bell size={15} /> Notifications on</span>
          ) : (
            <button className="action-button action-outline" onClick={enablePush}>
              <Bell size={16} /> Enable alerts
            </button>
          )}
          <button className="icon-button" onClick={() => load()} aria-label="Refresh requests">
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
          </button>
        </div>
      </header>

      <section className="workspace-summary volunteer-summary" aria-label="Volunteer activity summary">
        <div 
          className={`summary-active ${tab === 'active' ? 'active-summary-card' : ''}`} 
          style={{ cursor: 'pointer' }}
          onClick={() => setTab('active')}
        >
          <span>Active tasks</span>
          <strong>{active.length}</strong>
          <small>currently with you</small>
        </div>

        <div 
          className={`summary-open ${tab === 'open' ? 'active-summary-card' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setTab('open')}
        >
          <span>Open nearby</span>
          <strong>{open.length}</strong>
          <small>requests to review</small>
        </div>

        <div 
          className={`summary-helped ${tab === 'history' ? 'active-summary-card' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setTab('history')}
        >
          <span>People helped</span>
          <strong>{completed.length}</strong>
          <small>completed history</small>
        </div>

        <div className="summary-area">
          <span>Service area</span>
          <strong>3 mi</strong>
          <small>from your location</small>
        </div>
      </section>

      {/* Filter Navigation Segmented Control */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0' }}>
        <div className="segmented-control">
          <button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>
            Active <span>({active.length})</span>
          </button>
          <button className={tab === 'open' ? 'active' : ''} onClick={() => setTab('open')}>
            Open Nearby <span>({open.length})</span>
          </button>
          <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
            Completed History <span>({completed.length})</span>
          </button>
          <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>
            View All <span>({active.length + open.length + completed.length})</span>
          </button>
        </div>
      </div>

      {/* Active Tasks Section */}
      {(tab === 'active' || tab === 'all') && (
        <section className="mission-section">
          <div className="section-title">
            <div>
              <span className="eyebrow">In progress</span>
              <h2>Your active tasks ({active.length})</h2>
            </div>
            {active.length > 0 && <span className="live-count"><i /> Live</span>}
          </div>

          {active.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <CheckCircle2 size={30} />
              <h3>No active tasks in progress</h3>
              <p>You have no claimed requests in progress. Explore open requests nearby to offer assistance.</p>
              <button className="action-button action-outline" onClick={() => setTab('open')}>View open requests</button>
            </div>
          ) : (
            <div className="mission-grid">
              {active.map(task => {
                const [name, icon] = taskCategory(task.category);
                return (
                  <article className="mission-card" key={task.id}>
                    <div className="mission-card-top">
                      <span className="task-icon">{icon}</span>
                      <span className={`status-pill status-${task.status}`}>
                        {task.status === 'in_progress' ? 'In progress' : 'Assigned'}
                      </span>
                    </div>
                    <h3>{name}</h3>
                    <p>{task.description}</p>
                    <div className="task-meta">
                      <span><MapPin size={15} /> {task.approximate_area_text || 'Nearby area'}</span>
                      <span><Clock3 size={15} /> {new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="card-divider" />
                    <div className="mission-person">
                      <span>{task.requester_name?.[0] || 'N'}</span>
                      <div>
                        <small>Helping</small>
                        <b>{task.requester_name || 'Neighbour'}</b>
                      </div>
                    </div>
                    <div className="card-actions">
                      <Link className="text-button" to={`/chat/${task.id}`}>
                        <MessageCircle size={16} /> Message
                      </Link>
                      {task.requester_phone && (
                        <a 
                          className="text-button" 
                          href={`https://wa.me/${task.requester_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi ' + (task.requester_name || 'there') + ', I am your NEAP volunteer.')}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ color: '#25D366' }}
                        >
                          <MessageCircle size={16} /> WhatsApp
                        </a>
                      )}
                      <Link className="action-button action-primary small" to={`/volunteer/task/${task.id}`}>
                        Open task <ArrowRight size={15} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Open Help Requests Section */}
      {(tab === 'open' || tab === 'all') && (
        <section className="open-requests-section">
          <div className="section-title">
            <div>
              <span className="eyebrow">Available nearby</span>
              <h2>Open help requests ({open.length})</h2>
            </div>
            <button className="text-button" onClick={() => load()}>
              <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="loading-list"><i /><i /><i /></div>
          ) : open.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={30} />
              <h3>You’re all caught up</h3>
              <p>There are no open requests in your area right now. New requests will appear here automatically.</p>
              <button className="action-button action-outline" onClick={() => load()}>Check again</button>
            </div>
          ) : (
            <div className="open-request-list">
              {open.map(task => {
                const [name, icon] = taskCategory(task.category);
                return (
                  <article className="open-request-card" key={task.id}>
                    <div className="task-icon">{icon}</div>
                    <div className="open-request-content">
                      <div className="request-heading">
                        <div>
                          <span className="status-pill status-pending">
                            {task.urgency === 'today' ? 'Needed today' : 'This week'}
                          </span>
                          <h3>{name}</h3>
                        </div>
                        <span className="distance">
                          <MapPin size={14} /> {task.distance_miles ? `${task.distance_miles} mi away` : 'Nearby'}
                        </span>
                      </div>
                      <p>{task.description}</p>
                      <div className="task-meta">
                        <span><UsersRound size={15} /> Requested by a neighbour</span>
                        <span><Clock3 size={15} /> {task.approximate_area_text || 'Local area'}</span>
                      </div>
                    </div>
                    <div className="open-request-actions">
                      <Link to={`/volunteer/claim/${task.id}`} className="action-button action-primary small">
                        Review & claim <ArrowRight size={15} />
                      </Link>
                      <button className="text-button" onClick={() => decline(task.id)}>Not available</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Completed Task History Section */}
      {(tab === 'history' || tab === 'all') && (
        <section className="history-section" style={{ marginTop: '1rem' }}>
          <div className="section-title">
            <div>
              <span className="eyebrow"><History size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Volunteer History</span>
              <h2>Requests you completed ({completed.length})</h2>
            </div>
          </div>

          {loading ? (
            <div className="loading-list"><i /><i /></div>
          ) : completed.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={30} />
              <h3>No completed task history yet</h3>
              <p>Once you accept and complete requests raised by senior neighbours, your completed history and reviews will appear here.</p>
              <button className="action-button action-outline" onClick={() => setTab('open')}>Browse open requests</button>
            </div>
          ) : (
            <div className="history-request-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {completed.map(task => {
                const [name, icon] = taskCategory(task.category);
                return (
                  <article 
                    className="request-card history-card" 
                    key={task.id}
                    style={{
                      borderLeft: '4px solid #10b981',
                      background: 'var(--card-bg, #ffffff)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div className="request-card-top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="task-icon" style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}>{icon}</span>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{name}</h3>
                          <small style={{ color: 'var(--text-secondary)' }}>Helped {task.requester_name || 'Senior Neighbour'}</small>
                        </div>
                      </div>
                      <span className="status-pill status-completed">
                        <CheckCircle size={12} style={{ marginRight: '3px' }} /> Completed
                      </span>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: '0.2rem 0' }}>
                      "{task.description}"
                    </p>

                    {task.rating_stars ? (
                      <div style={{ padding: '0.6rem 0.8rem', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#d97706', fontWeight: 700, fontSize: '0.85rem' }}>
                          <span>Senior Review:</span>
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} size={14} fill={n <= task.rating_stars ? '#f59e0b' : 'none'} color="#f59e0b" />
                          ))}
                          <span style={{ marginLeft: '0.2rem', color: '#374151' }}>({task.rating_stars}/5)</span>
                        </div>
                        {task.rating_comment && (
                          <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.82rem', fontStyle: 'italic', color: '#4b5563' }}>
                            "{task.rating_comment}"
                          </p>
                        )}
                      </div>
                    ) : null}

                    <div className="task-meta" style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color, #f1f5f9)' }}>
                      <span><MapPin size={14} /> {task.approximate_area_text || 'Local area'}</span>
                      <span><Clock3 size={14} /> {new Date(task.updated_at || task.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="card-actions" style={{ marginTop: '0.4rem' }}>
                      <Link to={`/chat/${task.id}`} className="text-button">
                        <MessageCircle size={15} /> Chat log
                      </Link>
                      <Link to={`/volunteer/task/${task.id}`} className="action-button action-outline small">
                        View details <ArrowRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
