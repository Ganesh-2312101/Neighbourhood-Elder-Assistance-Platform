import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Eye, Settings } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function AccessibilityWidget() {
  const { fontScale, increaseFont, decreaseFont, highContrast, toggleHighContrast } = useAccessibility();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--bg-card)',
        padding: '0.6rem 0.85rem',
        borderRadius: '24px',
        border: '3px solid var(--accent-primary)',
        boxShadow: '0 8px 25px rgba(29, 78, 216, 0.25)'
      }}
      aria-label="Accessibility Controls Panel"
    >
      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Text Size:
      </span>

      <button 
        onClick={decreaseFont} 
        className="btn btn-secondary" 
        title="Decrease Text Size"
        aria-label="Decrease text size"
        style={{ padding: '0.35rem 0.7rem', minHeight: '42px', fontSize: '0.9rem' }}
      >
        <ZoomOut style={{ width: 20, height: 20 }} /> -
      </button>
      
      <span style={{ fontWeight: 800, fontSize: '1rem', padding: '0 0.35rem', color: 'var(--accent-primary)', minWidth: '48px', textAlign: 'center' }}>
        {Math.round(fontScale * 100)}%
      </span>

      <button 
        onClick={increaseFont} 
        className="btn btn-secondary" 
        title="Increase Text Size"
        aria-label="Increase text size"
        style={{ padding: '0.35rem 0.7rem', minHeight: '42px', fontSize: '0.9rem' }}
      >
        <ZoomIn style={{ width: 20, height: 20 }} /> +
      </button>

      <div style={{ width: '2px', height: '26px', background: 'var(--border-thick)', margin: '0 0.35rem' }} />

      <button 
        onClick={toggleHighContrast} 
        className="btn btn-secondary"
        title="Toggle High Contrast Mode"
        aria-label="Toggle high contrast mode"
        style={{ 
          padding: '0.35rem 0.85rem', 
          minHeight: '42px',
          fontSize: '0.9rem',
          backgroundColor: highContrast ? '#ffea00' : 'var(--bg-card)',
          color: highContrast ? '#000000' : 'var(--text-primary)',
          borderColor: highContrast ? '#ffffff' : 'var(--border-thick)'
        }}
      >
        <Eye style={{ width: 20, height: 20 }} />
        <span style={{ fontWeight: 800 }}>Contrast</span>
      </button>
    </div>
  );
}
