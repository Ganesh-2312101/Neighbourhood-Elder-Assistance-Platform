import React, { useState } from 'react';
import { Heart, Users, ShieldCheck, Sparkles } from 'lucide-react';

export default function InteractiveLogo({ size = 'large' }) {
  const [activeTab, setActiveTab] = useState('care');
  const [isHovered, setIsHovered] = useState(false);

  const isBig = size === 'large';

  return (
    <div 
      className={`interactive-logo-container ${isBig ? 'hero-logo-box' : 'nav-logo-box'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {/* Dynamic Animated Vector Logo Icon */}
      <div 
        className="interactive-svg-wrapper"
        style={{
          width: isBig ? '170px' : '44px',
          height: isBig ? '170px' : '44px',
          borderRadius: isBig ? '32px' : '12px',
          background: activeTab === 'care' 
            ? 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)' 
            : activeTab === 'community' 
            ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)' 
            : 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isHovered 
            ? '0 20px 40px rgba(29, 78, 216, 0.35), 0 0 0 6px rgba(29, 78, 216, 0.15)' 
            : '0 10px 25px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: isHovered ? 'scale(1.06) rotate(1deg)' : 'scale(1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Background Glow Radial Effect */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Vector SVG Emblem inside logo */}
        <svg 
          width={isBig ? "105" : "28"} 
          height={isBig ? "105" : "28"} 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ transition: 'transform 0.3s ease' }}
        >
          {/* Roof / House Structure */}
          <path 
            d="M20 52 L50 22 L80 52 M30 45 V80 H70 V45" 
            stroke="#FFFFFF" 
            strokeWidth="6" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Heart Emblem in House Center */}
          <path 
            d="M50 68 C42 60 38 52 44 45 C48 40 52 43 50 47 C48 43 52 40 56 45 C62 52 58 60 50 68 Z" 
            fill="#FFEA00" 
            stroke="#FFFFFF" 
            strokeWidth="3"
            style={{
              transformOrigin: 'center',
              animation: isHovered ? 'pulse 1.2s infinite ease-in-out' : 'none'
            }}
          />
          {/* Helping Hands Rays */}
          <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeDasharray="6 6" />
        </svg>

        {isBig && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(4px)',
            padding: '2px 10px',
            borderRadius: '12px',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1px'
          }}>
            INTERACTIVE LOGO
          </div>
        )}
      </div>

      {isBig && (
        <>
          {/* Interactive Feature Pills Switcher */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1.25rem',
            background: 'var(--bg-card)',
            padding: '0.35rem 0.5rem',
            borderRadius: '30px',
            border: '2px solid var(--border-color)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('care')}
              style={{
                background: activeTab === 'care' ? '#1d4ed8' : 'transparent',
                color: activeTab === 'care' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.4rem 0.9rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
                minHeight: '36px'
              }}
            >
              <Heart style={{ width: 14, height: 14 }} /> Elder Care
            </button>
            
            <button
              type="button"
              onClick={() => setActiveTab('community')}
              style={{
                background: activeTab === 'community' ? '#15803d' : 'transparent',
                color: activeTab === 'community' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.4rem 0.9rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
                minHeight: '36px'
              }}
            >
              <Users style={{ width: 14, height: 14 }} /> Volunteers
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('safety')}
              style={{
                background: activeTab === 'safety' ? '#b45309' : 'transparent',
                color: activeTab === 'safety' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '0.4rem 0.9rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s ease',
                minHeight: '36px'
              }}
            >
              <ShieldCheck style={{ width: 14, height: 14 }} /> Verified Trust
            </button>
          </div>

          {/* Dynamic Interactive Explanation Card */}
          <div style={{
            marginTop: '0.85rem',
            padding: '0.75rem 1.25rem',
            background: 'var(--bg-primary)',
            border: '2px dashed var(--border-color)',
            borderRadius: '16px',
            textAlign: 'center',
            maxWidth: '420px'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {activeTab === 'care' && "🤝 Connecting neighborhood seniors with trusted local volunteers for groceries, walks & medicine."}
              {activeTab === 'community' && "🏡 Neighbors helping neighbors—building strong, compassionate local support networks."}
              {activeTab === 'safety' && "🛡️ Admin ID verification, live GPS safety tracking, and family member updates for peace of mind."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
