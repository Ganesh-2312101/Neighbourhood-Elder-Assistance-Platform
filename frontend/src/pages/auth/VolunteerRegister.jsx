import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, UserCheck, ShieldAlert, CheckCircle, Bell } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import fcmClient from '../../services/fcmClient';

export default function VolunteerRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [idCardFile, setIdCardFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!idCardFile || !selfieFile) {
      setError('Please select both your Government ID photo and a clear Selfie photo for verification.');
      return;
    }

    setLoading(true);

    try {
      // 1. Register account
      await register({
        name,
        email,
        password,
        role: 'volunteer',
        phone,
        full_address: fullAddress || '',
        latitude: 9.1824,
        longitude: 77.8732,
        approximate_area_text: fullAddress ? fullAddress.split(',')[0] : ''
      });

      // 2. Upload ID card & selfie
      const formData = new FormData();
      formData.append('id_card', idCardFile);
      formData.append('selfie', selfieFile);

      await api.post('/verification/upload-id', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(true);

      // 3. Request browser notification permission & get real Firebase FCM token.
      //    The token is sent to the backend which fires a real Firebase welcome push
      //    notification to this device via Firebase Admin SDK.
      try {
        const fcmToken = await fcmClient.requestPermission(true); // true = isNewRegistration
        if (fcmToken) {
          // Also show an immediate in-browser welcome notification as visual confirmation
          fcmClient.showWelcomeNotification({ volunteerName: name, phone });
        }
      } catch (notifErr) {
        // Non-critical — don't block the registration success flow
        console.warn('[Register] Notification setup note:', notifErr.message);
      }

      setTimeout(() => {
        navigate('/volunteer');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flow-page auth-page register-page" style={{ maxWidth: 640, margin: '2rem auto', width: '100%', padding: '0 0.5rem' }}>
      <div className="admin-card" style={{ borderRadius: '24px', padding: '2.25rem 2rem', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-main)' }}>
        
        {/* Ambient Gradient Glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(22,163,74,0.06) 0%, rgba(99,102,241,0.04) 50%, rgba(29,78,216,0.04) 100%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>

          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.25rem 0.85rem', borderRadius: 99, marginBottom: '0.6rem' }}>
              <UserCheck size={14} style={{ color: '#16a34a' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '1px', color: '#16a34a' }}>VOLUNTEER VERIFICATION</span>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.35rem', letterSpacing: '-0.5px' }}>
              Volunteer Application Signup
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
              All volunteers undergo identity verification before claiming local tasks to protect elders.
            </p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#991b1b', padding: '0.85rem 1rem', borderRadius: '14px', marginBottom: '1.25rem', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert style={{ width: 18, height: 18, flexShrink: 0, color: '#dc2626' }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#166534', padding: '0.85rem 1rem', borderRadius: '14px', marginBottom: '1.25rem', fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle style={{ width: 18, height: 18, flexShrink: 0, color: '#16a34a' }} />
              <span>Registration & ID photos submitted! A welcome notification was sent to your device. Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="vol-name" style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
              Full Name
            </label>
            <input
              id="vol-name"
              type="text"
              className="input-field"
              value={name || ''}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marcus Chen"
              required
            />
          </div>

          <div>
            <label htmlFor="vol-email" style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <input
              id="vol-email"
              type="email"
              className="input-field"
              value={email || ''}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. marcus@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="vol-phone" style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
              Mobile Phone Number (For Task Alerts & Calls)
            </label>
            <input
              id="vol-phone"
              type="tel"
              className="input-field"
              value={phone || ''}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              required
            />
          </div>

          <div>
            <label htmlFor="vol-pass" style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
              Password
            </label>
            <input
              id="vol-pass"
              type="password"
              className="input-field"
              value={password || ''}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
              required
            />
          </div>

          <div>
            <label htmlFor="vol-address" style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
              Home Address / Base Neighborhood
            </label>
            <input
              id="vol-address"
              type="text"
              className="input-field"
              value={fullAddress || ''}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="e.g. 120 West St, Apt 4A, Downtown"
              required
            />
          </div>

          {/* ID Photo Upload */}
          <div style={{ border: '2px dashed var(--border-color)', padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-primary)' }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
              <Upload style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--accent-primary)' }} />
              Upload Government ID Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setIdCardFile(e.target.files[0])}
              required
              style={{ marginTop: '0.5rem', width: '100%' }}
            />
          </div>

          {/* Selfie Photo Upload */}
          <div style={{ border: '2px dashed var(--border-color)', padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-primary)' }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem' }}>
              <UserCheck style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--accent-success)' }} />
              Upload Selfie Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelfieFile(e.target.files[0])}
              required
              style={{ marginTop: '0.5rem', width: '100%' }}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
            <span>{loading ? 'Submitting Verification...' : 'Submit & Register'}</span>
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
