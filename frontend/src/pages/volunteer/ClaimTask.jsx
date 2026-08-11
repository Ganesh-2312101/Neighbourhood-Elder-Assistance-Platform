import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, MapPin, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import TaskMapView from '../../components/TaskMapView';

export default function ClaimTask() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/tasks/${id}`)
      .then(res => setTask(res.data.task))
      .catch(err => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleClaimConfirm = async () => {
    setClaiming(true);
    setError('');

    try {
      await api.post(`/tasks/${id}/claim`);
      navigate(`/volunteer/task/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Claim failed.');
      setClaiming(false);
    }
  };

  if (loading) return <div className="card"><p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading task preview...</p></div>;

  return (
    <div className="flow-page task-claim-page" style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
      <button onClick={() => navigate('/volunteer')} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
        <ArrowLeft style={{ width: 22, height: 22 }} /> Back to Feed
      </button>

      <div className="card">
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Confirm Task Acceptance
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 600 }}>
          Please review the details and neighborhood area map below before committing to assist your neighbor.
        </p>

        {error && (
          <div style={{ background: '#fff7ed', color: '#c2410c', padding: '1.25rem', borderRadius: '16px', border: '2px solid #f97316', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <AlertCircle style={{ width: 24, height: 24, color: '#ea580c' }} />
              <strong style={{ fontSize: '1.15rem' }}>⚡ Request Already Accepted</strong>
            </div>
            <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
            <button onClick={() => navigate('/volunteer')} className="btn btn-primary" style={{ marginTop: '0.85rem', width: '100%' }}>
              Return to Feed &amp; See Other Requests
            </button>
          </div>
        )}

        {task && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <span className="badge badge-pending">PENDING CLAIM</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-primary)' }}>
                {task.category.toUpperCase()}
              </h3>
            </div>

            <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <strong style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Task Description:</strong>
              <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>"{task.description}"</p>
            </div>

            {/* Privacy Masked Neighborhood Map */}
            <div>
              <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Neighborhood Proximity Map:
              </strong>
              <TaskMapView 
                mode="masked" 
                lat={task.latitude || 40.7128} 
                lng={task.longitude || -74.0060} 
                approxArea={task.approximate_area_text} 
              />
            </div>

            <button
              onClick={handleClaimConfirm}
              className="btn btn-success btn-large"
              disabled={claiming}
              style={{ marginTop: '1rem', fontSize: '1.3rem' }}
            >
              <CheckCircle style={{ width: 30, height: 30 }} />
              <span>{claiming ? 'Claiming Task...' : 'CONFIRM & CLAIM THIS TASK'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
