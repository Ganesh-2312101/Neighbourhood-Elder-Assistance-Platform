import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ZoomIn, ZoomOut, LogOut, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import InteractiveLogo from './InteractiveLogo';

const ROLE_COLORS = {
  senior:    { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  volunteer: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  admin:     { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
};

const ROLE_COLORS_DARK = {
  senior:    { bg: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  volunteer: { bg: 'rgba(22,163,74,0.15)', color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  admin:     { bg: 'rgba(217,119,6,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { increaseFont, decreaseFont, fontScale, darkMode, toggleDarkMode } = useAccessibility();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleMap = darkMode ? ROLE_COLORS_DARK : ROLE_COLORS;
  const roleStyle = user ? (roleMap[user.role] || { bg: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: 'var(--border-color)' }) : {};

  return (
    <header className="full-width-header">
      <div className="header-content-container">

        {/* Brand */}
        <div className="nav-brand-section">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', color: 'var(--text-primary)' }}>
            <InteractiveLogo size="small" />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                NEAP
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1px' }}>
                Elder Assistance Platform
              </div>
            </div>
          </Link>
        </div>

        {/* Text Size Controls */}
        <div className="nav-controls-section">
          <button
            onClick={decreaseFont}
            className="btn btn-secondary nav-item-btn"
            title="Decrease Font Size"
            aria-label="Decrease text size"
            style={{ gap: '0.2rem' }}
          >
            <ZoomOut style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: '11px', fontWeight: 700 }}>A-</span>
          </button>

          <span className="nav-item-indicator">
            {Math.round(fontScale * 100)}%
          </span>

          <button
            onClick={increaseFont}
            className="btn btn-secondary nav-item-btn"
            title="Increase Font Size"
            aria-label="Increase text size"
            style={{ gap: '0.2rem' }}
          >
            <ZoomIn style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>A+</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              width: 64,
              height: 32,
              minHeight: 32,
              borderRadius: 99,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: darkMode
                ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                : 'linear-gradient(135deg, #e0f2fe, #bfdbfe)',
              boxShadow: darkMode
                ? '0 0 0 1px #334155, inset 0 0 8px rgba(59,130,246,0.2)'
                : '0 0 0 1px #bfdbfe, inset 0 0 8px rgba(255,255,255,0.5)',
              position: 'relative',
              transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
              flexShrink: 0,
              marginLeft: '0.1rem'
            }}
          >
            {/* Track icons */}
            <Sun
              size={13}
              style={{
                position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)',
                color: darkMode ? '#475569' : '#f59e0b',
                opacity: darkMode ? 0.4 : 1,
                transition: 'all 0.3s ease'
              }}
            />
            <Moon
              size={13}
              style={{
                position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
                color: darkMode ? '#60a5fa' : '#cbd5e1',
                opacity: darkMode ? 1 : 0.4,
                transition: 'all 0.3s ease'
              }}
            />
            {/* Thumb */}
            <div style={{
              position: 'absolute',
              top: 3,
              left: darkMode ? 33 : 3,
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: darkMode
                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                : 'linear-gradient(135deg, #ffffff, #f1f5f9)',
              boxShadow: darkMode
                ? '0 2px 8px rgba(59,130,246,0.5)'
                : '0 2px 6px rgba(15,23,42,0.2)',
              transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s ease, box-shadow 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {darkMode
                ? <Moon size={13} style={{ color: 'white' }} />
                : <Sun size={13} style={{ color: '#f59e0b' }} />
              }
            </div>
          </button>
        </div>

        {/* Auth Actions */}
        <div className="nav-auth-section" style={{ gap: '0.5rem', display: 'flex', alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{
                background: roleStyle.bg,
                color: roleStyle.color,
                border: `1px solid ${roleStyle.border}`,
                padding: '0.25rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                transition: 'all 0.25s ease'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: roleStyle.color, display: 'inline-block' }} />
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-secondary nav-item-btn"
                aria-label="Log out"
                style={{ color: 'var(--text-secondary)' }}
              >
                <LogOut style={{ width: 14, height: 14 }} />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary nav-item-btn" style={{ textDecoration: 'none' }}>
              <User style={{ width: 14, height: 14 }} />
              Sign In
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
