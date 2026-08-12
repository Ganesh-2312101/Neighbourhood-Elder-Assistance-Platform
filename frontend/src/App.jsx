import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import VoiceCommandButton from './components/VoiceCommandButton';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import SeniorRegister from './pages/auth/SeniorRegister';
import VolunteerRegister from './pages/auth/VolunteerRegister';
import SeniorHome from './pages/senior/SeniorHome';
import CreateTask from './pages/senior/CreateTask';
import VolunteerFeed from './pages/volunteer/VolunteerFeed';
import ClaimTask from './pages/volunteer/ClaimTask';
import ActiveTask from './pages/volunteer/ActiveTask';
import ChatRoom from './pages/ChatRoom';
import AdminDashboard from './pages/admin/AdminDashboard';
import SharedTaskView from './pages/family/SharedTaskView';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="card"><p style={{ fontSize: '1.2rem' }}>Loading session...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'senior') return <Navigate to="/senior" replace />;
    if (user.role === 'volunteer') return <Navigate to="/volunteer" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-container">
        <Navbar />
        <div className="app-body-layout">
          <main className="main-content-container" id="main-content" role="main" aria-label="Main content area">
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              !user ? <Landing /> :
              user.role === 'senior' ? <Navigate to="/senior" replace /> :
              user.role === 'volunteer' ? <Navigate to="/volunteer" replace /> :
              <Navigate to="/admin" replace />
            } />
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-senior" element={<SeniorRegister />} />
            <Route path="/register-volunteer" element={<VolunteerRegister />} />
            <Route path="/share/:taskId" element={<SharedTaskView />} />

            {/* Senior Flow */}
            <Route path="/senior" element={
              <ProtectedRoute roles={['senior', 'admin']}>
                <SeniorHome />
              </ProtectedRoute>
            } />
            <Route path="/senior/create-task" element={
              <ProtectedRoute roles={['senior', 'admin']}>
                <CreateTask />
              </ProtectedRoute>
            } />

            {/* Volunteer Flow */}
            <Route path="/volunteer" element={
              <ProtectedRoute roles={['volunteer', 'admin']}>
                <VolunteerFeed />
              </ProtectedRoute>
            } />
            <Route path="/volunteer/claim/:id" element={
              <ProtectedRoute roles={['volunteer', 'admin']}>
                <ClaimTask />
              </ProtectedRoute>
            } />
            <Route path="/volunteer/task/:id" element={
              <ProtectedRoute roles={['volunteer', 'admin']}>
                <ActiveTask />
              </ProtectedRoute>
            } />

            {/* Chat Route */}
            <Route path="/chat/:taskId" element={
              <ProtectedRoute>
                <ChatRoom />
              </ProtectedRoute>
            } />

            {/* Admin Dashboard */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </main>
        </div>
        {user && <VoiceCommandButton />}
      </div>
    </BrowserRouter>
  );
}
