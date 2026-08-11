import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HeartHandshake, ShieldCheck, Clock, MapPin, Users, CheckCircle, Navigation } from 'lucide-react';
import api from '../../services/api';
import TaskMapView from '../../components/TaskMapView';

export default function SharedTaskView() {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/safety/shared-task/${taskId}`)
      .then(res => setTask(res.data.task))
      .catch(err => setError('Shared link invalid or task expired.'))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <div className="card" style={{ maxWidth: 650, margin: '2rem auto' }}><p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading shared family tracking details...</p></div>;
  if (error) return <div className="card" style={{ maxWidth: 650, margin: '2rem auto', border: '2px solid #ef4444' }}><p style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.2rem' }}>{error}</p></div>;

  // Step tracker mapping
  const getStepIndex = (status) => {
    switch (status) {
      case 'pending': return 1;
      case 'assigned': return 2;
      case 'in_progress': return 3;
      case 'completed': return 4;
      default: return 1;
    }
  };

  const currentStep = task ? getStepIndex(task.status) : 1;

  return (
    <div className="flow-page shared-task-page" style={{ maxWidth: 650, margin: '1.5rem auto', width: '100%' }}>
      <div className="card" style={{ border: '3px solid var(--accent-primary)', boxShadow: '0 8px 30px rgba(29, 78, 216, 0.12)' }}>
        
        {/* Header Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#dbeafe', padding: '0.65rem', borderRadius: '14px', display: 'flex' }}>
            <HeartHandshake style={{ width: 36, height: 36, color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Trusted Family & Neighbor Task Tracker
            </h2>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Live read-only safety tracking link for relatives & neighbors
            </span>
          </div>
        </div>

        {task && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
            
            {/* Status & Title */}
            <div>
              <span className={`badge badge-${task.status}`}>
                STATUS: {task.status.replace('_', ' ').toUpperCase()}
              </span>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-primary)' }}>
                Help Request for {task.senior_first_name}
              </h3>
            </div>

            {/* 4-Step Progress Bar */}
            <div style={{ background: 'var(--bg-primary)', padding: '1.15rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <strong style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Live Assistance Progress:
              </strong>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', textAlign: 'center' }}>
                <div style={{ opacity: currentStep >= 1 ? 1 : 0.4 }}>
                  <div style={{ background: currentStep >= 1 ? '#1d4ed8' : '#cbd5e1', height: 8, borderRadius: 4, marginBottom: '0.4rem' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: currentStep >= 1 ? '#1d4ed8' : 'var(--text-secondary)' }}>1. Requested</span>
                </div>
                <div style={{ opacity: currentStep >= 2 ? 1 : 0.4 }}>
                  <div style={{ background: currentStep >= 2 ? '#1d4ed8' : '#cbd5e1', height: 8, borderRadius: 4, marginBottom: '0.4rem' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: currentStep >= 2 ? '#1d4ed8' : 'var(--text-secondary)' }}>2. Accepted</span>
                </div>
                <div style={{ opacity: currentStep >= 3 ? 1 : 0.4 }}>
                  <div style={{ background: currentStep >= 3 ? '#7c3aed' : '#cbd5e1', height: 8, borderRadius: 4, marginBottom: '0.4rem' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: currentStep >= 3 ? '#7c3aed' : 'var(--text-secondary)' }}>3. On Way</span>
                </div>
                <div style={{ opacity: currentStep >= 4 ? 1 : 0.4 }}>
                  <div style={{ background: currentStep >= 4 ? '#15803d' : '#cbd5e1', height: 8, borderRadius: 4, marginBottom: '0.4rem' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: currentStep >= 4 ? '#15803d' : 'var(--text-secondary)' }}>4. Done</span>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Category: {task.category.toUpperCase()}</strong>
              <p style={{ marginTop: '0.35rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>"{task.description}"</p>
            </div>

            {/* Interactive OpenStreetMap */}
            <div>
              <strong style={{ display: 'block', marginBottom: '0.4rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
                Assistance Neighborhood Map:
              </strong>
              <TaskMapView 
                mode={task.status === 'assigned' || task.status === 'in_progress' ? 'unlocked' : 'masked'}
                lat={task.latitude || 9.1712}
                lng={task.longitude || 77.8695}
                fullAddress={task.full_address}
                approxArea={task.area}
              />
            </div>

            {/* Helper Safety Trust Shield */}
            {task.volunteer_first_name ? (
              <div style={{ background: '#f0fdf4', color: '#166534', padding: '1.25rem', borderRadius: '16px', border: '2px solid #16a34a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {task.volunteer_photo ? (
                    <img 
                      src={task.volunteer_photo} 
                      alt={task.volunteer_first_name} 
                      style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '3px solid #16a34a', flexShrink: 0, boxShadow: '0 4px 10px rgba(22, 163, 74, 0.25)' }}
                    />
                  ) : (
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#dcfce7', border: '3px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <ShieldCheck style={{ width: 34, height: 34, color: '#15803d' }} />
                    </div>
                  )}
                  <div>
                    <strong style={{ fontSize: '1.25rem', color: '#14532d', display: 'block' }}>
                      Assigned Helper: {task.volunteer_first_name}
                    </strong>
                    <p style={{ fontSize: '0.95rem', color: '#15803d', fontWeight: 800, margin: '0.2rem 0 0' }}>
                      {task.volunteer_is_verified ? '✅ Official Aadhaar & ID Photo Verified' : 'Verification Under Review'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '2px dashed var(--border-thick)', padding: '1.25rem', borderRadius: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 700 }}>
                ⏳ Waiting for a nearby verified volunteer to claim...
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
