import React, { useState, useEffect } from 'react';
import { ShoppingBag, Pill, Footprints, Wrench, MessageSquare, CheckCircle, Search, Sparkles, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';

export default function InteractiveSimulator() {
  const [selectedCategory, setSelectedCategory] = useState('groceries');
  const [urgency, setUrgency] = useState('today');
  const [isScanning, setIsScanning] = useState(false);
  const [matchedVolunteer, setMatchedVolunteer] = useState(null);
  const [simulatedStep, setSimulatedStep] = useState(0);

  const categories = [
    { id: 'groceries', label: 'Grocery Pickup', icon: ShoppingBag, color: '#1d4ed8', bg: '#dbeafe' },
    { id: 'medicine', label: 'Pharmacy Refill', icon: Pill, color: '#15803d', bg: '#dcfce7' },
    { id: 'walk', label: 'Companionship Walk', icon: Footprints, color: '#b45309', bg: '#fef3c7' },
    { id: 'repair', label: 'Minor Home Repair', icon: Wrench, color: '#7c3aed', bg: '#f3e8ff' }
  ];

  const sampleVolunteers = {
    groceries: { name: 'Sarah Miller', distance: '0.4 miles away', rating: '4.9 ★', badge: 'Verified Top Volunteer', avatar: '👩‍🦰' },
    medicine: { name: 'Rajesh Kumar', distance: '0.6 miles away', rating: '5.0 ★', badge: 'Verified Pharmacy Assistant', avatar: '👨‍⚕️' },
    walk: { name: 'Priya Sharma', distance: '0.2 miles away', rating: '4.9 ★', badge: 'Verified Senior Companion', avatar: '👩' },
    repair: { name: 'David Chen', distance: '0.8 miles away', rating: '4.8 ★', badge: 'Verified Handyman', avatar: '👨‍🔧' }
  };

  const handleSimulate = () => {
    setIsScanning(true);
    setMatchedVolunteer(null);
    setSimulatedStep(1);

    setTimeout(() => {
      setSimulatedStep(2);
    }, 1200);

    setTimeout(() => {
      setIsScanning(false);
      setMatchedVolunteer(sampleVolunteers[selectedCategory]);
      setSimulatedStep(3);
    }, 2400);
  };

  return (
    <div className="interactive-sandbox-card">
      <div className="sandbox-header">
        <span className="sandbox-badge">
          <Sparkles style={{ width: 14, height: 14 }} /> Interactive Platform Demo
        </span>
        <h3>Try How Assistance Requesting Works Live</h3>
        <p>Select a category below to test real-time volunteer matching</p>
      </div>

      {/* Category Pills */}
      <div className="sandbox-categories">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setMatchedVolunteer(null);
                setSimulatedStep(0);
              }}
              className={`sandbox-cat-btn ${isSelected ? 'active' : ''}`}
              style={{
                borderColor: isSelected ? cat.color : 'var(--border-color)',
                background: isSelected ? cat.bg : 'var(--bg-card)',
                color: isSelected ? cat.color : 'var(--text-primary)'
              }}
            >
              <Icon style={{ width: 18, height: 18 }} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Urgency Selector */}
      <div className="sandbox-urgency-row">
        <span className="urgency-label">Urgency Level:</span>
        <button
          type="button"
          onClick={() => setUrgency('today')}
          className={`urgency-pill ${urgency === 'today' ? 'active-today' : ''}`}
        >
          ⚡ High Urgency (Today)
        </button>
        <button
          type="button"
          onClick={() => setUrgency('this_week')}
          className={`urgency-pill ${urgency === 'this_week' ? 'active-week' : ''}`}
        >
          📅 Scheduled (This Week)
        </button>
      </div>

      {/* Interactive Trigger Button */}
      <button 
        type="button" 
        onClick={handleSimulate} 
        disabled={isScanning}
        className="btn btn-primary sandbox-submit-btn"
      >
        {isScanning ? (
          <>
            <Search className="spin" style={{ width: 18, height: 18 }} />
            <span>Scanning Nearby Verified Volunteers...</span>
          </>
        ) : (
          <>
            <span>Simulate Request & Match Volunteer</span>
            <ArrowRight style={{ width: 18, height: 18 }} />
          </>
        )}
      </button>

      {/* Real-time Simulated Output Box */}
      {simulatedStep > 0 && (
        <div className="simulated-result-box">
          
          {simulatedStep === 1 && (
            <div className="sim-step-indicator">
              <Search className="spin" style={{ color: 'var(--accent-primary)', width: 22, height: 22 }} />
              <span>Broadcasted request to 12 background-checked volunteers in your neighborhood...</span>
            </div>
          )}

          {simulatedStep === 2 && (
            <div className="sim-step-indicator">
              <ShieldCheck style={{ color: 'var(--accent-success)', width: 22, height: 22 }} />
              <span>Checking background verification tier & distance...</span>
            </div>
          )}

          {simulatedStep === 3 && matchedVolunteer && (
            <div className="sim-match-card">
              <div className="volunteer-avatar-large">
                {matchedVolunteer.avatar}
              </div>
              <div className="volunteer-info-details">
                <div className="match-title-row">
                  <h4>{matchedVolunteer.name} Accepted!</h4>
                  <span className="badge badge-assigned">{matchedVolunteer.rating}</span>
                </div>
                <p className="volunteer-sub">
                  <UserCheck style={{ width: 14, height: 14, display: 'inline', marginRight: 4 }} />
                  {matchedVolunteer.badge} • <strong>{matchedVolunteer.distance}</strong>
                </p>
                <div className="sim-action-row">
                  <span className="sim-live-status">🟢 Live Chat & GPS Safety Active</span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
