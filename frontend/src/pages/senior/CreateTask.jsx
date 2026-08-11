import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Wrench, Smartphone, Car, HelpCircle, Send, ArrowLeft, PlusCircle, CalendarDays, Zap } from 'lucide-react';
import api from '../../services/api';
import { cleanTranscript } from '../../services/speech';
import { translateText } from '../../utils/translation';
import VoiceInput from '../../components/VoiceInput';
import SpeechPlayer from '../../components/SpeechPlayer';
import MapPicker from '../../components/MapPicker';

const CATEGORIES = [
  { id: 'groceries', label: 'Groceries / Heavy Items', icon: ShoppingBag },
  { id: 'repair', label: 'Home Repair / Bulb', icon: Wrench },
  { id: 'tech', label: 'Tech & Phone Help', icon: Smartphone },
  { id: 'transport', label: 'Local Transport', icon: Car },
  { id: 'other', label: 'Other Everyday Help', icon: HelpCircle }
];

export default function CreateTask() {
  const [category, setCategory] = useState('groceries');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('today');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [spokenLang, setSpokenLang] = useState('en-US'); // Default to English
  const [isTranslating, setIsTranslating] = useState(false);
  
  const [locationData, setLocationData] = useState({
    lat: 9.1712,
    lng: 77.8695,
    full_address: '',
    approximate_area_text: ''
  });

  const navigate = useNavigate();

  // Auto-fetch live location on mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
        },
        (err) => {
          console.warn('Geolocation blocked or failed. Using default.', err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleVoiceTranscript = async (text) => {
    if (!text) return;
    
    if (spokenLang !== 'en-US') {
      setIsTranslating(true);
      const englishTranslation = await translateText(text, spokenLang, 'en-US');
      setIsTranslating(false);
      
      setDescription((prev) => {
        const combined = prev ? `${prev} ${englishTranslation}` : englishTranslation;
        return cleanTranscript(combined);
      });
    } else {
      setDescription((prev) => {
        const combined = prev ? `${prev} ${text}` : text;
        return cleanTranscript(combined);
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a short description of what you need help with (or use the voice button below).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/tasks', {
        category,
        description: description.trim(),
        urgency,
        latitude: locationData.lat,
        longitude: locationData.lng,
        approximate_area_text: locationData.approximate_area_text,
        full_address: locationData.full_address
      });

      navigate('/senior');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flow-page create-task-page">
      <button onClick={() => navigate('/senior')} className="btn btn-secondary task-back-link">
        <ArrowLeft style={{ width: 22, height: 22 }} /> Back to Home
      </button>

      <div className="admin-card create-task-card">
        
        {/* Ambient Gradient Glow */}
        <div className="create-task-glow" />

        <div className="create-task-content">

          <div className="create-task-header">
            <div className="create-task-kicker">
              <PlusCircle size={14} />
              <span>New assistance request</span>
            </div>
            <h2>
              Ask for Help from a Neighbor
            </h2>
            <p>Tell us what you need, where you are, and when help would be most useful.</p>
            <div className="create-task-read-aloud">
              <SpeechPlayer text="Choose a category below, speak or type what you need help with, mark your exact location pin on the map, select when you need it, and tap Submit." />
            </div>
          </div>

        {error && (
          <div className="create-task-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-task-form">
          
          {/* Step 1: Category Selection Tile Grid */}
          <div className="task-form-section">
            <label className="task-section-label">
              <span>01</span> Choose what you need help with
            </label>
            <div className="category-grid">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-tile ${isSelected ? 'selected' : ''}`}
                    onClick={() => setCategory(cat.id)}
                    aria-pressed={isSelected}
                  >
                    <IconComponent style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Voice Dictation & Text Description */}
          <div className="task-form-section">
            <label htmlFor="task-description" className="task-section-label">
              <span>02</span> Describe your request
            </label>
            <p className="task-section-hint">A few details—such as items, timing, or access needs—help volunteers prepare.</p>
            
            <div className="description-input-tools">
              <select 
                value={spokenLang} 
                onChange={e => setSpokenLang(e.target.value)}
                className="input-field description-language"
              >
                <option value="en-US">English</option>
                <option value="ta-IN">Tamil (தமிழ்)</option>
                <option value="hi-IN">Hindi (हिंदी)</option>
                <option value="te-IN">Telugu (తెలుగు)</option>
                <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                <option value="ml-IN">Malayalam (മലയാളം)</option>
                <option value="es-ES">Spanish (Español)</option>
              </select>
              
              {/* Voice Input Button */}
              <div className="description-voice">
                <VoiceInput onTranscript={handleVoiceTranscript} label="Speak Your Request" lang={spokenLang} />
              </div>
            </div>
            
            {isTranslating && (
              <div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Translating to English...
              </div>
            )}

            <textarea
              id="task-description"
              className="input-field task-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Need help bringing two heavy grocery bags up to the 3rd floor..."
            />
          </div>

          {/* Step 3: Interactive Location Map Selector */}
          <div className="task-form-section">
            <label className="task-section-label">
              <span>03</span> Pinpoint your residence
            </label>
            <p className="task-section-hint">Your address is shared only with the volunteer assigned to this request.</p>
            <MapPicker 
              initialLat={locationData.lat} 
              initialLng={locationData.lng} 
              onLocationSelect={(data) => setLocationData(data)} 
            />
          </div>

          {/* Step 4: Urgency Toggle Buttons */}
          <div className="task-form-section">
            <label className="task-section-label">
              <span>04</span> When do you need help?
            </label>
            <div className="urgency-toggle-group">
              <button
                type="button"
                className={`btn ${urgency === 'today' ? 'btn-primary' : 'btn-secondary'} urgency-btn`}
                onClick={() => setUrgency('today')}
              >
                <span>🚨 Needed Today</span>
              </button>

              <button
                type="button"
                className={`btn ${urgency === 'this_week' ? 'btn-primary' : 'btn-secondary'} urgency-btn`}
                onClick={() => setUrgency('this_week')}
              >
                <span>📅 Sometime This Week</span>
              </button>
            </div>
          </div>

          {/* Step 5: Submit Button */}
          <button type="submit" className="btn btn-success btn-large create-task-submit" disabled={loading}>
            <Send />
            <span>{loading ? 'Submitting request...' : 'Submit help request'}</span>
          </button>

        </form>
        </div>
      </div>
    </div>
  );
}
