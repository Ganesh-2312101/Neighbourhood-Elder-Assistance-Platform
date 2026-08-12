import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Pill,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UsersRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SERVICES = [
  { icon: ShoppingBag, title: 'Everyday errands', text: 'Groceries and household essentials, arranged with a nearby volunteer.' },
  { icon: Pill, title: 'Medicine pickup', text: 'Prescription collection and delivery with clear task updates.' },
  { icon: HeartHandshake, title: 'Companionship', text: 'Friendly visits and neighborhood walks that help people stay connected.' }
];

const STEPS = [
  ['01', 'Request help', 'Share what you need and the best time to help.'],
  ['02', 'Match locally', 'A verified volunteer nearby can accept the request.'],
  ['03', 'Stay informed', 'Follow progress and communicate in one secure place.']
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ seniorsCount: 0, volunteersCount: 0, completedTasksCount: 0 });

  useEffect(() => {
    api.get('/stats')
      .then(({ data }) => data?.stats && setStats(data.stats))
      .catch(() => {});
  }, []);

  const dashboardPath = user?.role === 'senior' ? '/senior' : user?.role === 'volunteer' ? '/volunteer' : '/admin';

  return (
    <div className="neap-home">
      <section className="neap-hero">
        <div className="neap-hero-copy">
          <div className="neap-kicker"><Sparkles size={15} /> Neighbourhood support, made simple</div>
          <h1>Everyday help.<br /><span>Closer to home.</span></h1>
          <p className="neap-hero-lede">
            NEAP brings seniors, trusted volunteers, and families together to make everyday assistance feel safer, simpler, and more personal.
          </p>
          <div className="neap-hero-actions">
            {user ? (
              <button className="neap-button neap-button-primary" onClick={() => navigate(dashboardPath)}>
                Open your dashboard <ArrowRight size={18} />
              </button>
            ) : (
              <>
                <Link className="neap-button neap-button-primary" to="/register-senior">Request assistance <ArrowRight size={18} /></Link>
                <Link className="neap-button neap-button-quiet" to="/register-volunteer">Become a volunteer</Link>
              </>
            )}
          </div>
          {!user && <Link className="neap-signin" to="/login">Already registered? <span>Sign in</span><ChevronRight size={15} /></Link>}
          <div className="neap-trust-row">
            <span><ShieldCheck size={17} /> Verified volunteers</span>
            <span><MessageCircle size={17} /> Live updates</span>
            <span><MapPin size={17} /> Local support</span>
          </div>
        </div>

        <div className="neap-hero-visual" aria-label="How a support request progresses">
          <div className="neap-visual-glow" />
          <div className="neap-request-card neap-request-main">
            <div className="neap-request-top"><span className="neap-status"><span /> Active request</span><Clock3 size={17} /></div>
            <div className="neap-request-body">
              <div className="neap-request-icon"><ShoppingBag size={24} /></div>
              <div><strong>Grocery pickup</strong><p>Today · 2 items requested</p></div>
            </div>
            <div className="neap-volunteer-line"><div className="neap-avatar">A</div><span><b>Sasisivaprakash M</b> accepted this request</span><Check size={16} /></div>
          </div>
          <div className="neap-request-card neap-request-float">
            <div className="neap-mini-icon"><HeartHandshake size={18} /></div>
            <div><b>Help is on the way</b><small>Your volunteer is nearby</small></div>
          </div>
          <div className="neap-map-card"><MapPin size={20} /><span>Connected in your neighbourhood</span><i className="neap-map-dot dot-one" /><i className="neap-map-dot dot-two" /><i className="neap-map-line" /></div>
        </div>
      </section>

      <section className="neap-proof" aria-label="Platform impact">
        <div><strong>{stats.completedTasksCount || '—'}</strong><span>completed requests</span></div>
        <div><strong>{stats.volunteersCount || '—'}</strong><span>community volunteers</span></div>
        <div><strong>{stats.seniorsCount || '—'}</strong><span>seniors supported</span></div>
        <div className="neap-proof-note"><ShieldCheck size={20} /><span>Built around trust, privacy, and care.</span></div>
      </section>

      <section className="neap-section">
        <div className="neap-section-heading"><span>How it works</span><h2>Support that feels personal,<br />from start to finish.</h2></div>
        <div className="neap-steps">
          {STEPS.map(([number, title, text]) => <article className="neap-step" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
      </section>

      <section className="neap-services-section">
        <div className="neap-section-heading"><span>What neighbours can help with</span><h2>Practical support for<br />the moments that matter.</h2></div>
        <div className="neap-services">
          {SERVICES.map(({ icon: Icon, title, text }) => <article className="neap-service" key={title}><div><Icon size={23} /></div><h3>{title}</h3><p>{text}</p><Link to="/register-senior">Learn more <ArrowRight size={16} /></Link></article>)}
        </div>
      </section>

      <section className="neap-safety">
        <div className="neap-safety-icon"><ShieldCheck size={30} /></div>
        <div><span>Designed for peace of mind</span><h2>Care is better when everyone feels informed.</h2><p>Verified volunteer profiles, task updates, and a clear activity history give seniors and their families confidence at every step.</p></div>
        <Link className="neap-button neap-button-dark" to={user ? dashboardPath : '/register-senior'}>Get started <ArrowRight size={18} /></Link>
      </section>
    </div>
  );
}
