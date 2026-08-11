import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, ShieldAlert, Eye, EyeOff, ShieldCheck, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import InteractiveLogo from '../../components/InteractiveLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      // Auto-route user based on role returned from DB
      if (user.role === 'senior') navigate('/senior');
      else if (user.role === 'volunteer') navigate('/volunteer');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flow-page auth-page" style={{ maxWidth: 480, margin: '2.5rem auto', width: '100%', padding: '0 0.5rem' }}>
      
      <div className="admin-card" style={{ padding: '2.25rem 2rem', borderRadius: '24px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-main)' }}>
        
        {/* Ambient Gradient Glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(29,78,216,0.04) 50%, rgba(245,158,11,0.04) 100%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <InteractiveLogo size="small" />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '0.25rem 0.85rem', borderRadius: 99, marginBottom: '0.6rem' }}>
              <ShieldCheck size={14} style={{ color: '#6366f1' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', color: '#6366f1' }}>NEAP AUTHENTICATION</span>
            </div>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: '0 0 0.35rem' }}>
              Sign In
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
              Enter your email and password to access your account
            </p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#991b1b', padding: '0.85rem 1rem', borderRadius: '14px', marginBottom: '1.25rem', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert style={{ width: 18, height: 18, flexShrink: 0, color: '#dc2626' }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label htmlFor="login-email" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, marginBottom: '0.4rem', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                <Mail size={14} style={{ color: 'var(--accent-primary)' }} />
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                value={email || ''}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, marginBottom: '0.4rem', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                <Lock size={14} style={{ color: 'var(--accent-primary)' }} />
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  style={{ paddingRight: '2.75rem' }}
                  value={password || ''}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    minHeight: 'auto',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                padding: '0.85rem 1.5rem',
                fontWeight: 800,
                fontSize: '1.05rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '52px',
                boxShadow: '0 4px 14px rgba(29,78,216,0.3)',
                marginTop: '0.5rem',
                fontFamily: 'inherit'
              }}
            >
              <LogIn style={{ width: 20, height: 20 }} />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>
              New Senior?{' '}
              <Link to="/register-senior" style={{ color: 'var(--accent-primary)', fontWeight: 800, textDecoration: 'none' }}>
                Register Senior Account →
              </Link>
            </p>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0 }}>
              Want to Volunteer?{' '}
              <Link to="/register-volunteer" style={{ color: '#16a34a', fontWeight: 800, textDecoration: 'none' }}>
                Sign Up as Volunteer →
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
