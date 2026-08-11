import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, UserCheck, AlertTriangle, Check, X, RefreshCw,
  CreditCard, Camera, BarChart3, Users, Bell, Settings, Activity,
  TrendingUp, Clock, Search, Filter, ChevronDown, Eye, Zap,
  CheckCircle2, XCircle, Globe, Heart, Star, Award, ArrowUp, ArrowDown,
  MoreVertical, Download, Share2, Trash2, Shield, Lock, Unlock,
  PieChart, LineChart, MonitorCheck, Wifi, Server, Database
} from 'lucide-react';
import api from '../../services/api';

/* ─────────────────────── tiny helpers ─────────────────────── */
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {toasts.map(t => (
        <div key={t.id} className={`admin-toast admin-toast-${t.type}`}>
          <span>{t.icon}</span>
          <span style={{ flex: 1 }}>{t.msg}</span>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, minHeight: 0, color: 'inherit', opacity: 0.7, fontSize: '1.1rem' }}>×</button>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────── animated stat card ─────────────────────── */
function StatCard({ label, value, icon: Icon, color, trend, trendUp, pulse }) {
  const animated = useCountUp(value ?? 0);
  return (
    <div className={`admin-stat-card admin-stat-${color}`} style={{ position: 'relative', overflow: 'hidden' }}>
      {pulse && <div className="admin-pulse-ring" />}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div className={`admin-stat-icon admin-stat-icon-${color}`}>
          <Icon size={22} />
        </div>
        {trend != null && (
          <span className={`admin-trend-badge ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {trend}%
          </span>
        )}
      </div>
      <div className="admin-stat-number">{animated}</div>
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-shimmer" />
    </div>
  );
}

/* ─────────────────────── system health bar ─────────────────────── */
function HealthBar({ label, icon: Icon, value, color }) {
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          <Icon size={14} /> {label}
        </div>
        <span style={{ fontSize: '0.88rem', fontWeight: 800, color }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg-primary)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${value}%`, background: color,
          borderRadius: 99, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)'
        }} />
      </div>
    </div>
  );
}

function formatTimeAgo(dateInput) {
  if (!dateInput) return 'Recently';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}

/* ─────────────────────── activity feed item ─────────────────────── */
function ActivityItem({ icon, color, text, time, isNew }) {
  return (
    <div className={`admin-activity-item ${isNew ? 'admin-activity-new' : ''}`}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '1rem', color }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>{text}</p>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{formatTimeAgo(time)}</span>
      </div>
      {isNew && <span className="admin-new-dot" />}
    </div>
  );
}

/* ─────────────────────── quick action button ─────────────────────── */
function QuickAction({ icon, label, color, onClick }) {
  return (
    <button className="admin-quick-action" onClick={onClick} style={{ '--qa-color': color }}>
      <div className="admin-qa-icon">{icon}</div>
      <span className="admin-qa-label">{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*                     MAIN DASHBOARD COMPONENT                    */
/* ═══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgErrorMap, setImgErrorMap] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toasts, setToasts] = useState([]);
  const [expandedCard, setExpandedCard] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const toastId = useRef(0);

  const handleImgError = (key) => setImgErrorMap(prev => ({ ...prev, [key]: true }));

  const addToast = (msg, type = 'success', icon = '✅') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, msg, type, icon }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, verifRes, dispRes, actRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/verifications'),
        api.get('/admin/disputes'),
        api.get('/admin/activity')
      ]);
      setStats(statsRes.data.stats);
      setVerifications(verifRes.data.verifications || []);
      setDisputes(dispRes.data.disputes || []);
      setActivityFeed(actRes.data.activities || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to refresh data.', 'error', '❌');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdminData(); }, []);

  const handleVerificationAction = async (userId, action) => {
    try {
      await api.post(`/admin/verifications/${userId}`, { action });
      addToast(
        action === 'approve' ? 'Volunteer approved successfully! 🎉' : 'Application rejected.',
        action === 'approve' ? 'success' : 'warning',
        action === 'approve' ? '✅' : '🚫'
      );
      fetchAdminData();
    } catch (err) {
      addToast('Action failed: ' + err.message, 'error', '❌');
    }
  };

  const handleResolveDispute = async (reportId) => {
    try {
      await api.post(`/admin/disputes/${reportId}/resolve`, { status: 'resolved' });
      addToast('Dispute resolved successfully!', 'success', '🛡️');
      fetchAdminData();
    } catch (err) {
      addToast('Resolve failed: ' + err.message, 'error', '❌');
    }
  };

  const filteredVerifications = verifications.filter(v => {
    const matchSearch = !searchQuery || v.name?.toLowerCase().includes(searchQuery.toLowerCase()) || v.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterStatus === 'all' || v.verification_status === filterStatus;
    return matchSearch && matchFilter;
  });

  const TABS = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
    { id: 'verifications', label: 'Verifications', icon: <UserCheck size={16} />, badge: verifications.length },
    { id: 'disputes', label: 'Disputes', icon: <AlertTriangle size={16} />, badge: disputes.length },
  ];

  return (
    <div className="admin-dashboard-root">
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* ── Hero Header ── */}
      <div className="admin-hero-header">
        <div className="admin-hero-gradient" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div className="admin-shield-badge">
              <ShieldCheck size={20} />
            </div>
            <span className="admin-role-pill">ADMIN CONTROL CENTER</span>
          </div>
          <h1 className="admin-hero-title">Safety &amp; Operations Hub</h1>
          <p className="admin-hero-sub">Manage verifications, resolve disputes &amp; monitor platform health in real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button className="admin-refresh-btn" onClick={fetchAdminData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'admin-spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh Data'}
          </button>
          <button className="admin-export-btn" onClick={() => addToast('Export started!', 'info', '📥')}>
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {stats && (
        <div className="admin-stats-grid">
          <StatCard label="Seniors Registered" value={stats.seniors} icon={Heart} color="blue" trend={12} trendUp />
          <StatCard label="Total Volunteers" value={stats.volunteers} icon={Users} color="green" trend={8} trendUp />
          <StatCard label="Pending Verifications" value={stats.pendingVerifications} icon={Clock} color="amber" trend={3} trendUp={false} pulse={stats.pendingVerifications > 0} />
          <StatCard label="Safety Alerts" value={stats.openDisputes} icon={AlertTriangle} color="red" pulse={stats.openDisputes > 0} />
          <StatCard label="Tasks Completed" value={stats.tasksCompleted ?? 0} icon={CheckCircle2} color="teal" trend={22} trendUp />
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <div className="admin-tab-nav">
        {TABS.map(tab => (
          <button key={tab.id} className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge > 0 && <span className="admin-tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* ═══ TAB: OVERVIEW ═══ */}
      {activeTab === 'overview' && (
        <div className="admin-two-col">

          {/* Left: Activity Feed */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} style={{ color: '#6366f1' }} />
                <h3 className="admin-card-title">Live Activity Feed</h3>
              </div>
              <span className="admin-live-dot-label"><span className="admin-live-dot" />LIVE</span>
            </div>
            <div className="admin-activity-list">
              {activityFeed.length === 0 ? (
                <div className="admin-empty-state admin-inline-empty">
                  <Activity size={23} />
                  <h3>No recent activity</h3>
                  <p>Platform activity will appear here as requests and accounts are updated.</p>
                </div>
              ) : (
                activityFeed.map((item, i) => (
                  <ActivityItem key={i} {...item} />
                ))
              )}
            </div>
          </div>

          {/* Right col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Quick Actions */}
            <div className="admin-card">
              <div className="admin-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={20} style={{ color: '#f59e0b' }} />
                  <h3 className="admin-card-title">Quick Actions</h3>
                </div>
              </div>
              <div className="admin-quick-actions-grid">
                <QuickAction icon={<UserCheck size={20} />} label="Review Queue" color="#6366f1" onClick={() => setActiveTab('verifications')} />
                <QuickAction icon={<Shield size={20} />} label="View Disputes" color="#ef4444" onClick={() => setActiveTab('disputes')} />
                <QuickAction icon={<Bell size={20} />} label="Send Alert" color="#f59e0b" onClick={() => addToast('Alert panel coming soon!', 'info', '🔔')} />
                <QuickAction icon={<Download size={20} />} label="Export Data" color="#14b8a6" onClick={() => addToast('Exporting...', 'info', '📤')} />
                <QuickAction icon={<Settings size={20} />} label="Settings" color="#8b5cf6" onClick={() => addToast('Settings panel coming soon!', 'info', '⚙️')} />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═══ TAB: VERIFICATIONS ═══ */}
      {activeTab === 'verifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Search & Filter bar */}
          <div className="admin-search-bar">
            <div className="admin-search-input-wrap">
              <Search size={16} className="admin-search-icon" />
              <input
                className="admin-search-input"
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="admin-filter-group">
              <Filter size={14} />
              {['all', 'pending', 'approved', 'rejected'].map(s => (
                <button key={s} className={`admin-filter-pill ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="admin-loading-skeleton">
              {[1,2,3].map(i => <div key={i} className="admin-skeleton-card" />)}
            </div>
          ) : filteredVerifications.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-icon">🎉</div>
              <h3>No pending verifications</h3>
              <p>All volunteer applications are up to date. Great job!</p>
            </div>
          ) : (
            filteredVerifications.map(v => (
              <div key={v.id} className={`admin-verif-card ${expandedCard === v.id ? 'expanded' : ''}`}>
                <div className="admin-verif-header" onClick={() => setExpandedCard(expandedCard === v.id ? null : v.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="admin-user-avatar">
                      {v.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <h4 className="admin-verif-name">{v.name}</h4>
                      <span className="admin-verif-email">{v.email}</span>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.1rem' }}>
                        Submitted: {new Date(v.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`admin-status-badge status-${v.verification_status}`}>
                      {v.verification_status.toUpperCase()}
                    </span>
                    <ChevronDown size={18} style={{ color: 'var(--text-muted)', transform: expandedCard === v.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
                  </div>
                </div>

                {expandedCard === v.id && (
                  <div className="admin-verif-body">
                    <div className="admin-photos-grid">
                      {/* ID Photo */}
                      <div className="admin-photo-box">
                        <div className="admin-photo-label">
                          <CreditCard size={14} /> Government ID
                        </div>
                        {v.id_card_url && !imgErrorMap[`id-${v.id}`] ? (
                          <img src={v.id_card_url} alt="Government ID" onError={() => handleImgError(`id-${v.id}`)} className="admin-photo-img" />
                        ) : (
                          <div className="admin-photo-placeholder blue">
                            <CreditCard size={36} />
                            <strong>ID Document Uploaded</strong>
                            <span>Government issued ID</span>
                          </div>
                        )}
                      </div>

                      {/* Selfie Photo */}
                      <div className="admin-photo-box">
                        <div className="admin-photo-label">
                          <Camera size={14} /> Selfie Verification
                        </div>
                        {v.selfie_url && !imgErrorMap[`selfie-${v.id}`] ? (
                          <img src={v.selfie_url} alt="Selfie" onError={() => handleImgError(`selfie-${v.id}`)} className="admin-photo-img" />
                        ) : (
                          <div className="admin-photo-placeholder green">
                            <Camera size={36} />
                            <strong>Live Selfie Photo</strong>
                            <span>Facial match ready</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="admin-verif-actions">
                      <button className="admin-approve-btn" onClick={() => handleVerificationAction(v.id, 'approve')}>
                        <Check size={18} /> APPROVE VOLUNTEER
                      </button>
                      <button className="admin-reject-btn" onClick={() => handleVerificationAction(v.id, 'reject')}>
                        <X size={18} /> REJECT APPLICATION
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ TAB: DISPUTES ═══ */}
      {activeTab === 'disputes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {disputes.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-icon">🛡️</div>
              <h3>No active disputes</h3>
              <p>The neighborhood is safe! No safety disputes have been reported.</p>
            </div>
          ) : (
            disputes.map(d => (
              <div key={d.id} className="admin-dispute-card">
                <div className="admin-dispute-severity">
                  <AlertTriangle size={16} />
                  <span>HIGH PRIORITY</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <strong className="admin-dispute-reporter">Reporter: {d.reporter_name}</strong>
                    <p className="admin-dispute-reason">"{d.reason}"</p>
                    <div className="admin-dispute-meta">
                      <span>Task Status: <b>{d.task_status}</b></span>
                      <span>•</span>
                      <span>Reported: {new Date(d.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  {d.status === 'open' && (
                    <button className="admin-resolve-btn" onClick={() => handleResolveDispute(d.id)}>
                      <CheckCircle2 size={16} /> Resolve Incident
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}



    </div>
  );
}
