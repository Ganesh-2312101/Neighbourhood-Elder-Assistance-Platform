import React from 'react';
import { Search, Bell, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const calendarDays = [
    { day: 30, currentMonth: false }, { day: 1, currentMonth: true }, { day: 2, currentMonth: true }, { day: 3, currentMonth: true }, { day: 4, currentMonth: true }, { day: 5, currentMonth: true }, { day: 6, currentMonth: true },
    { day: 7, currentMonth: true }, { day: 8, currentMonth: true }, { day: 9, currentMonth: true }, { day: 10, currentMonth: true }, { day: 11, currentMonth: true, active: true }, { day: 12, currentMonth: true }, { day: 13, currentMonth: true },
    { day: 14, currentMonth: true }, { day: 15, currentMonth: true }, { day: 16, currentMonth: true }, { day: 17, currentMonth: true }, { day: 18, currentMonth: true }, { day: 19, currentMonth: true }, { day: 20, currentMonth: true },
    { day: 21, currentMonth: true }, { day: 22, currentMonth: true }, { day: 23, currentMonth: true }, { day: 24, currentMonth: true }, { day: 25, currentMonth: true }, { day: 26, currentMonth: true }, { day: 27, currentMonth: true },
    { day: 28, currentMonth: true }, { day: 29, currentMonth: true }, { day: 30, currentMonth: true }, { day: 31, currentMonth: true }, { day: 1, currentMonth: false }, { day: 2, currentMonth: false }, { day: 3, currentMonth: false }
  ];

  return (
    <aside className="sidebar-container">
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Logo Placeholder */}
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #1976D2, #64B5F6)' }}></div>
          <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)' }}>SilverLink Care</span>
        </div>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '0.2rem', minHeight: 'unset', boxShadow: 'none' }}>
          <Search size={20} />
        </button>
      </div>

      {/* Recent Updates */}
      <div className="card sidebar-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>Recent Updates</h3>
        
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ color: '#D32F2F', marginTop: '0.2rem', position: 'relative' }}>
            <Bell size={18} fill="currentColor" />
            <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '6px', height: '6px', background: '#D32F2F', borderRadius: '50%', border: '1px solid #fff' }}></div>
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.2rem', lineHeight: '1.3' }}>Request: Caregiver Assistance booking at SilverLink Care</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>1 days ago</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            <MessageSquare size={18} fill="currentColor" />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.2rem', lineHeight: '1.3' }}>Notifications home turns off suggested</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>3 days ago</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card sidebar-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Calendar</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '0.2rem', minHeight: 'unset', boxShadow: 'none' }}><ChevronLeft size={18} /></button>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '0.2rem', minHeight: 'unset', boxShadow: 'none' }}><ChevronRight size={18} /></button>
          </div>
        </div>

        {/* Days Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '0.5rem' }}>
          {daysOfWeek.map((day, idx) => (
            <span key={idx} style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>{day}</span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', rowGap: '0.5rem' }}>
          {calendarDays.map((date, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <span style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: date.active ? '700' : '500',
                color: date.active ? '#ffffff' : date.currentMonth ? 'var(--text-primary)' : 'var(--text-muted)',
                background: date.active ? 'var(--accent-primary)' : 'transparent',
                borderRadius: '50%',
                cursor: 'pointer'
              }}>
                {date.day}
              </span>
            </div>
          ))}
        </div>

        {/* Upcoming Events List */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ width: '20px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '0.3rem' }}>14</div>
            <div style={{ flex: 1, background: '#E3F2FD', borderRadius: '6px', padding: '0.6rem 0.75rem', borderLeft: '3px solid #1976D2' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>Upcoming Events</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>7:20 pm</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ width: '20px' }}></div>
            <div style={{ flex: 1, padding: '0 0.75rem', borderLeft: '3px solid #F57C00' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>Events Session • <span style={{ color: 'var(--text-muted)' }}>7:30 pm</span></p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
