import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Clock3, Copy, Heart, MessageCircle, Phone, Plus, Send, Share2, ShieldCheck, ShoppingCart, Pill, Smartphone, Wrench, Car, Coffee, Star } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const quickHelp = [
  ['groceries', 'Groceries', ShoppingCart, 'Pick up essentials nearby'],
  ['pharmacy', 'Medicine', Pill, 'Collect a prescription'],
  ['tech', 'Tech support', Smartphone, 'Help with a device'],
  ['repair', 'Home repair', Wrench, 'A small fix at home'],
  ['transport', 'Ride or escort', Car, 'Travel with confidence'],
  ['other', 'Friendly visit', Coffee, 'A neighbour to talk to']
];

const statusLabel = (status) => ({ pending: 'Looking for a helper', assigned: 'Helper assigned', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled' }[status] || status);

export default function SeniorHome() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [wellness, setWellness] = useState('');
  const [sharing, setSharing] = useState(null);
  const [ratingTask, setRatingTask] = useState(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [sosLoading, setSosLoading] = useState(false);

  const fetchTasks = async () => {
    try { const { data } = await api.get('/tasks/my-tasks'); setTasks(data.tasks || []); } finally { setLoading(false); }
  };
  useEffect(() => {
    fetchTasks();
    if (!socket) return undefined;
    socket.on('task:updated', fetchTasks); socket.on('feed:refresh', fetchTasks); socket.on('task:relinquished', fetchTasks);
    return () => { socket.off('task:updated', fetchTasks); socket.off('feed:refresh', fetchTasks); socket.off('task:relinquished', fetchTasks); };
  }, [socket]);

  const sendSOS = async (latitude, longitude) => {
    try { await api.post('/tasks/sos', { latitude, longitude }); alert('SOS sent. Nearby volunteers have been notified.'); fetchTasks(); }
    catch (err) { alert(err.response?.data?.error || 'Unable to send SOS. Please call your emergency contact.'); }
    finally { setSosLoading(false); }
  };
  const handleSOS = () => {
    if (sosLoading) return; setSosLoading(true);
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => sendSOS(p.coords.latitude, p.coords.longitude), () => sendSOS(), { timeout: 15000, enableHighAccuracy: true });
    else sendSOS();
  };

  const handleWhatsAppSOS = () => {
    const text = `URGENT: I need help! My live location: `;
    const fallbackText = `URGENT: I need help! (Location unavailable)`;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const locUrl = `https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`;
          window.open(`https://wa.me/${contactPhone}?text=${encodeURIComponent(text + locUrl)}`, '_blank');
        },
        () => {
          window.open(`https://wa.me/${contactPhone}?text=${encodeURIComponent(fallbackText)}`, '_blank');
        },
        { timeout: 10000 }
      );
    } else {
      window.open(`https://wa.me/${contactPhone}?text=${encodeURIComponent(fallbackText)}`, '_blank');
    }
  };

  const completeTask = async (id) => { try { await api.post(`/tasks/${id}/status`, { status: 'completed', reason: 'Senior confirmed completion' }); fetchTasks(); } catch (err) { alert(err.response?.data?.error || 'Could not update this request.'); } };
  const submitRating = async () => {
    try { await api.post(`/tasks/${ratingTask.id}/rate`, { stars, comment, ratee_id: ratingTask.assigned_volunteer_id }); setRatingTask(null); setComment(''); fetchTasks(); }
    catch { alert('Rating could not be submitted.'); }
  };
  const copyShare = async () => { await navigator.clipboard.writeText(`${window.location.origin}/share/${sharing.id}`); alert('Tracking link copied.'); };

  const active = tasks.filter(t => !['completed', 'cancelled'].includes(t.status));
  const history = tasks.filter(t => ['completed', 'cancelled'].includes(t.status));
  const displayed = tab === 'active' ? active : history;
  const contactPhone = user?.trusted_contact_phone?.replace(/[^0-9]/g, '') || '';

  return <div className="workspace senior-workspace">
    <header className="workspace-hero">
      <div><span className="eyebrow"><Heart size={14} /> Senior workspace</span><h1>Hello, {user?.name?.split(' ')[0] || 'there'}.</h1><p>Request help, follow progress, and keep people you trust informed.</p></div>
      <Link className="action-button action-primary" to="/senior/create-task"><Plus size={19} /> Request help</Link>
    </header>

    <section className="senior-sos-panel">
      <div className="danger-icon"><AlertTriangle size={23} /></div>
      <div><b>Need urgent help?</b><p>Send an SOS to nearby volunteers or contact your trusted person.</p></div>
      <div className="sos-actions">
        {contactPhone && <a href={`tel:${contactPhone}`} className="action-button action-outline"><Phone size={16} /> Call contact</a>}
        {contactPhone && <button onClick={handleWhatsAppSOS} className="action-button action-outline" style={{borderColor: '#25D366', color: '#25D366'}}><MessageCircle size={16} /> WhatsApp SOS</button>}
        <button className="action-button action-danger" onClick={handleSOS} disabled={sosLoading}><AlertTriangle size={16} /> {sosLoading ? 'Sending SOS…' : 'Send SOS'}</button>
      </div>
    </section>

    <section className="workspace-summary">
      <div><span>Open requests</span><strong>{active.length}</strong><small>being coordinated now</small></div>
      <div><span>Completed</span><strong>{history.filter(t => t.status === 'completed').length}</strong><small>neighbourhood tasks</small></div>
      <div><span>Trusted contact</span><strong>{user?.trusted_contact_name?.split(' ')[0] || '—'}</strong><small>{user?.trusted_contact_relation || 'Add one in profile'}</small></div>
    </section>

    <section className="workspace-card wellness-card">
      <div className="section-title"><div><span className="eyebrow">Daily check-in</span><h2>How are you feeling today?</h2></div>{wellness && <span className="state-message"><Check size={14} /> Thanks for checking in</span>}</div>
      <div className="wellness-options">
        {[['great', 'Feeling great', 'Everything is going well'], ['okay', 'Doing okay', 'I may need help later'], ['visit', 'Need a visit', 'I would like someone to check in']].map(([id, title, description]) => <button key={id} className={wellness === id ? 'selected' : ''} onClick={() => setWellness(id)}><span>{id === 'great' ? '😊' : id === 'okay' ? '🙂' : '🤝'}</span><b>{title}</b><small>{description}</small></button>)}
      </div>
    </section>

    <section className="workspace-card quick-help-card">
      <div className="section-title"><div><span className="eyebrow">Start a request</span><h2>What do you need help with?</h2></div><Link to="/senior/create-task">View all options <ArrowRight size={15} /></Link></div>
      <div className="quick-help-grid">{quickHelp.map(([id, label, Icon, description]) => <button key={id} onClick={() => navigate('/senior/create-task', { state: { category: id, desc: description } })}><span><Icon size={20} /></span><b>{label}</b><small>{description}</small><ArrowRight size={15} /></button>)}</div>
    </section>

    <section className="requests-panel">
      <div className="section-title"><div><span className="eyebrow">Your requests</span><h2>Stay up to date</h2></div><div className="segmented-control"><button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>Active <span>{active.length}</span></button><button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>History <span>{history.length}</span></button></div></div>
      {loading ? <div className="loading-list"><i /><i /><i /></div> : displayed.length === 0 ? <div className="empty-state"><CheckCircle2 size={30} /><h3>{tab === 'active' ? 'No active requests' : 'No request history yet'}</h3><p>{tab === 'active' ? 'When you need a hand, create a request and we’ll help connect you locally.' : 'Completed requests will appear here.'}</p>{tab === 'active' && <Link className="action-button action-primary" to="/senior/create-task">Create a request</Link>}</div> : <div className="request-list">{displayed.map(task => <article className="request-card" key={task.id}><div className="request-card-top"><span className={`status-pill status-${task.status}`}>{statusLabel(task.status)}</span><time><Clock3 size={14} /> {new Date(task.created_at).toLocaleDateString()}</time></div><div className="request-card-content"><div className="task-symbol">{quickHelp.find(q => q[0] === task.category)?.[2] ? React.createElement(quickHelp.find(q => q[0] === task.category)[2], { size: 21 }) : <Heart size={21} />}</div><div><h3>{quickHelp.find(q => q[0] === task.category)?.[1] || task.category}</h3><p>{task.description}</p></div></div>{task.volunteer_name && <div className="helper-line"><ShieldCheck size={16} /><span><b>{task.volunteer_name}</b> is helping with this request</span></div>}<div className="request-actions">{task.status !== 'completed' && <Link to={`/chat/${task.id}`} className="text-button"><MessageCircle size={16} /> Message</Link>}<button className="text-button" onClick={() => setSharing(task)}><Share2 size={16} /> Share</button>{task.status === 'in_progress' && <button className="action-button action-primary small" onClick={() => completeTask(task.id)}>Mark complete</button>}{task.status === 'completed' && task.volunteer_name && <button className="action-button action-outline small" onClick={() => setRatingTask(task)}>Rate helper</button>}</div></article>)}</div>}
    </section>

    <button className="floating-sos" onClick={handleSOS} disabled={sosLoading}><AlertTriangle size={19} /> {sosLoading ? 'Sending…' : 'SOS'}</button>
    {sharing && <div className="dialog-backdrop"><div className="dialog-card"><button className="dialog-close" onClick={() => setSharing(null)}>×</button><span className="eyebrow">Share request</span><h2>Keep someone informed</h2><p>Send a read-only tracking link for this request to a trusted family member or friend.</p><div className="share-link"><span>{window.location.origin}/share/{sharing.id}</span><button onClick={copyShare}><Copy size={16} /> Copy</button></div>{contactPhone && <a className="action-button action-primary dialog-action" href={`https://wa.me/${contactPhone}?text=${encodeURIComponent(`Track my NEAP request: ${window.location.origin}/share/${sharing.id}`)}`} target="_blank" rel="noreferrer"><Send size={16} /> Share on WhatsApp</a>}</div></div>}
    {ratingTask && <div className="dialog-backdrop"><div className="dialog-card"><button className="dialog-close" onClick={() => setRatingTask(null)}>×</button><span className="eyebrow">Rate your experience</span><h2>How was {ratingTask.volunteer_name}?</h2><div className="star-picker">{[1,2,3,4,5].map(n => <button key={n} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)}><Star size={29} fill="currentColor" /></button>)}</div><textarea className="input-field" placeholder="Optional feedback" value={comment} onChange={e => setComment(e.target.value)} /><button className="action-button action-primary dialog-action" onClick={submitRating}>Submit rating <ArrowRight size={16} /></button></div></div>}
  </div>;
}
