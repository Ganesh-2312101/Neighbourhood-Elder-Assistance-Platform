import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Heart, ShieldAlert, User, Phone, Users, MapPin, ArrowLeft, Accessibility } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const MOBILITY_OPTIONS = [
  { id: 'standard', label: 'Standard Support', icon: '🚶' },
  { id: 'wheelchair', label: 'Wheelchair / Walking Frame Support', icon: '👩‍🦽' },
  { id: 'hearing', label: 'Hearing Support', icon: '👂' },
  { id: 'visual', label: 'Visual Support', icon: '👓' },
  { id: 'memory', label: 'Memory / Dementia Friendly', icon: '🧠' }
];

export default function SeniorRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneCode, setPhoneCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [mobilityNeeds, setMobilityNeeds] = useState('standard');

  // Address & Landmark
  const [fullAddress, setFullAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [approxArea, setApproxArea] = useState('');

  // Trusted Neighbor / Relative Contact Details
  const [trustedName, setTrustedName] = useState('');
  const [trustedPhoneCode, setTrustedPhoneCode] = useState('+91');
  const [trustedPhone, setTrustedPhone] = useState('');
  const [trustedRelation, setTrustedRelation] = useState('Next-door Neighbor');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedMobilityLabel = MOBILITY_OPTIONS.find(m => m.id === mobilityNeeds)?.label || 'Standard Support';

      await api.post('/auth/register', {
        name,
        email,
        password,
        role: 'senior',
        phone: phone ? `${phoneCode}${phone}` : '',
        age: parseInt(age) || 70,
        mobility_needs: selectedMobilityLabel,
        landmark,
        latitude: 9.1712,
        longitude: 77.8695,
        full_address: fullAddress,
        approximate_area_text: approxArea,
        trusted_contact_name: trustedName || 'Trusted Neighbor',
        trusted_contact_phone: trustedPhone ? `${trustedPhoneCode}${trustedPhone}` : '9876543210',
        trusted_contact_relation: trustedRelation
      });

      // Auto login
      await login(email, password);
      navigate('/senior');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Senior Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flow-page auth-page register-page" style={{ maxWidth: 680, margin: '1rem auto', width: '100%' }}>
      <button onClick={() => navigate('/login')} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
        <ArrowLeft style={{ width: 22, height: 22 }} /> Back to Sign In
      </button>

      <div className="admin-card" style={{ borderRadius: '24px', padding: '2.25rem 2rem', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-main)' }}>
        
        {/* Ambient Gradient Glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(29,78,216,0.06) 0%, rgba(99,102,241,0.04) 50%, rgba(245,158,11,0.04) 100%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>

          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.25rem 0.85rem', borderRadius: 99, marginBottom: '0.6rem' }}>
              <Heart size={14} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', color: 'var(--accent-primary)' }}>SENIOR REGISTRATION</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
              Senior Profile Details
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.35rem', fontSize: '0.95rem' }}>
              Fill in your details below to create your account & add a trusted neighbor contact.
            </p>
          </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '2px solid #ef4444', color: '#991b1b', padding: '1rem', borderRadius: '14px', marginBottom: '1.25rem', fontWeight: 700 }}>
            <ShieldAlert style={{ display: 'inline', marginRight: '0.5rem' }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          
          {/* Step 1: Senior Personal & Age Details */}
          <div style={{ background: 'var(--bg-primary)', padding: '1.1rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User style={{ color: 'var(--accent-primary)', width: 22, height: 22, flexShrink: 0 }} />
              Step 1: Senior Profile Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div>
                <label htmlFor="sr-name" style={{ display: 'block', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Full Name
                </label>
                <input
                  id="sr-name"
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  required
                />
              </div>

              <div>
                <label htmlFor="sr-age" style={{ display: 'block', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Age (Years)
                </label>
                <input
                  id="sr-age"
                  type="number"
                  className="input-field"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 72"
                  min="50"
                  max="120"
                  required
                />
              </div>

              <div>
                <label htmlFor="sr-email" style={{ display: 'block', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Email Address
                </label>
                <input
                  id="sr-email"
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. senior@neap.org"
                  required
                />
              </div>

              <div>
                <label htmlFor="sr-password" style={{ display: 'block', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Password
                </label>
                <input
                  id="sr-password"
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
              </div>

              <div>
                <label htmlFor="sr-phone" style={{ display: 'block', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Primary Senior Phone Number
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="input-field"
                    style={{ width: '100px', flexShrink: 0 }}
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US/CA)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+61">+61 (AU)</option>
                  </select>
                  <input
                    id="sr-phone"
                    type="tel"
                    className="input-field"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Special Assistance & Mobility Needs */}
          <div style={{ background: '#f8fafc', padding: '1.1rem', borderRadius: '16px', border: '2px solid var(--border-thick)', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Accessibility style={{ color: 'var(--accent-primary)', width: 22, height: 22, flexShrink: 0 }} />
              Step 2: Special Assistance & Mobility Needs
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%' }}>
              {MOBILITY_OPTIONS.map((opt) => {
                const isSelected = mobilityNeeds === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMobilityNeeds(opt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '14px',
                      border: isSelected ? '3px solid var(--accent-primary)' : '2px solid var(--border-color)',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                      boxShadow: isSelected ? '0 4px 12px rgba(29, 78, 216, 0.15)' : 'none',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{opt.icon}</span>
                    <span style={{ wordBreak: 'break-word' }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Residence Address & Local Landmark */}
          <div style={{ background: 'var(--bg-primary)', padding: '1.1rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin style={{ color: 'var(--accent-primary)', width: 22, height: 22, flexShrink: 0 }} />
              Step 3: Residence Address & Local Landmark
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div>
                <label htmlFor="sr-landmark" style={{ display: 'block', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Nearby Landmark / Gate / Door Details
                </label>
                <input
                  id="sr-landmark"
                  type="text"
                  className="input-field"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Door No. 12/4, Opposite DMart Main Gate, Kovilpatti"
                />
              </div>

              <div>
                <label htmlFor="sr-full-address" style={{ display: 'block', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  Full Street Address
                </label>
                <input
                  id="sr-full-address"
                  type="text"
                  className="input-field"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="Full address string"
                />
              </div>
            </div>
          </div>

          {/* Step 4: Trusted Neighbor / Relative Contact (Mobile Responsive Single Column) */}
          <div style={{ background: '#eff6ff', padding: '1.1rem', borderRadius: '16px', border: '2px solid #bfdbfe', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e40af', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users style={{ color: '#2563eb', width: 22, height: 22, flexShrink: 0 }} />
              Step 4: Trusted Neighbor Contact
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div>
                <label htmlFor="tn-name" style={{ display: 'block', fontWeight: 800, marginBottom: '0.35rem', color: '#1e40af' }}>
                  Trusted Contact Name
                </label>
                <input
                  id="tn-name"
                  type="text"
                  className="input-field"
                  value={trustedName}
                  onChange={(e) => setTrustedName(e.target.value)}
                  placeholder="e.g. John / Relative / Neighbor"
                />
              </div>

              <div>
                <label htmlFor="tn-phone" style={{ display: 'block', fontWeight: 800, marginBottom: '0.35rem', color: '#1e40af' }}>
                  Neighbor Phone / WhatsApp Number
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={trustedPhoneCode}
                    onChange={(e) => setTrustedPhoneCode(e.target.value)}
                    className="input-field"
                    style={{ width: '100px', flexShrink: 0 }}
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US/CA)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+61">+61 (AU)</option>
                  </select>
                  <input
                    id="tn-phone"
                    type="tel"
                    className="input-field"
                    value={trustedPhone}
                    onChange={(e) => setTrustedPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tn-relation" style={{ display: 'block', fontWeight: 800, marginBottom: '0.35rem', color: '#1e40af' }}>
                  Relationship
                </label>
                <select
                  id="tn-relation"
                  className="input-field"
                  value={trustedRelation}
                  onChange={(e) => setTrustedRelation(e.target.value)}
                >
                  <option value="Next-door Neighbor">Next-door Neighbor</option>
                  <option value="Local Relative">Local Relative</option>
                  <option value="Daughter / Son">Daughter / Son</option>
                  <option value="Family Friend">Family Friend</option>
                </select>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-large" disabled={loading} style={{ fontSize: '1.3rem', marginTop: '0.5rem', width: '100%' }}>
            <UserPlus style={{ width: 28, height: 28 }} />
            <span>{loading ? 'Creating Senior Account...' : 'REGISTER SENIOR ACCOUNT'}</span>
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>
              Sign In Here
            </Link>
          </p>
        </div>

        </div>
      </div>
    </div>
  );
}
