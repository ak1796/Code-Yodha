import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts and Pages would be lazily loaded in a real app, but imports are fine for now
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import CitizenDashboard from './pages/citizen/Dashboard';
import ComplaintDetail from './pages/citizen/ComplaintDetail';
import AnonymousTracker from './pages/citizen/AnonymousTracker';

import OfficerLayout from './components/layout/OfficerLayout';
import OfficerDashboard from './pages/officer/Dashboard';
import TicketDetail from './pages/officer/TicketDetail';
import Performance from './pages/officer/Performance';
import IngestionFeed from './pages/officer/IngestionFeed';
import OfficerAudit from './pages/officer/AuditLog';

import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminHeatmap from './pages/admin/Heatmap';
import AATSTrustPanel from './pages/admin/TrustPanel';
import OfficerManagement from './pages/admin/OfficerManagement';
import DailyInsights from './pages/admin/DailyInsights';
import CivicMemory from './pages/admin/CivicMemory';
import SilentCrisis from './pages/admin/SilentCrisis';
import AuditExplorer from './pages/admin/AuditExplorer';
import SLABreachManager from './pages/admin/SLABreachManager';
import StrategicAnalytics from './pages/admin/Analytics';
import AdminTickets from './pages/admin/AdminTickets';

// Role-based protection wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { profile, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-bg font-sora font-extrabold text-navy animate-pulse">Loading NagarVaani Authentication...</div>;
  if (!profile) return <Navigate to="/auth" replace />;
  
  const effectiveRole = localStorage.getItem('nagarvaani_demo_role') || profile.role;
  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    return <Navigate to={effectiveRole === 'admin' ? '/admin/heatmap' : `/${effectiveRole}/dashboard`} replace />;
  }
  
  return children;
};

// Route redirection logic if logged in
const PublicOnlyRoute = ({ children }) => {
  const { profile, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-bg font-sora font-extrabold text-navy animate-pulse">Loading NagarVaani Authentication...</div>;
  
  const effectiveRole = localStorage.getItem('nagarvaani_demo_role') || profile?.role;
  if (profile) return <Navigate to={effectiveRole === 'admin' ? '/admin/heatmap' : `/${effectiveRole}/dashboard`} replace />;
  
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="font-sans text-text-primary min-h-screen bg-bg antialiased">
          <Toaster 
            position="top-right" 
            toastOptions={{ 
              style: { borderRadius: '16px', fontSora: '700', border: '1px solid #E5E9F0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' },
              success: { iconTheme: { primary: '#10B981', secondary: '#fff' } }
            }} 
          />
          <Suspense fallback={<div className="p-12 text-center text-navy font-sora font-extrabold text-2xl animate-pulse">Initializing Civic Systems...</div>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/track" element={<AnonymousTracker />} />
              <Route path="/auth" element={
                <PublicOnlyRoute>
                  <Auth />
                </PublicOnlyRoute>
              } />

              {/* Citizen Routes */}
              <Route path="/citizen/dashboard" element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <CitizenDashboard />
                </ProtectedRoute>
              } />
              <Route path="/citizen/complaints/:id" element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <ComplaintDetail />
                </ProtectedRoute>
              } />

              {/* Officer / Admin Shared Detail */}
              <Route path="/officer/dashboard" element={
                <ProtectedRoute allowedRoles={['officer', 'admin']}>
                  <OfficerLayout><OfficerDashboard /></OfficerLayout>
                </ProtectedRoute>
              } />
              <Route path="/officer/ingestion" element={
                <ProtectedRoute allowedRoles={['officer', 'admin']}>
                  <OfficerLayout><IngestionFeed /></OfficerLayout>
                </ProtectedRoute>
              } />
              <Route path="/officer/performance" element={
                <ProtectedRoute allowedRoles={['officer', 'admin']}>
                  <OfficerLayout><Performance /></OfficerLayout>
                </ProtectedRoute>
              } />
              <Route path="/officer/audit" element={
                <ProtectedRoute allowedRoles={['officer', 'admin']}>
                  <OfficerLayout><OfficerAudit /></OfficerLayout>
                </ProtectedRoute>
              } />
              <Route path="/officer/tickets/:id" element={
                <ProtectedRoute allowedRoles={['officer', 'admin']}>
                  <TicketDetail />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout><AdminDashboard /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/heatmap" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout><AdminHeatmap /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/trust" element={
                <ProtectedRoute allowedRoles={['admin']}>
                   <AdminLayout><AATSTrustPanel /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/officers" element={
                <ProtectedRoute allowedRoles={['admin']}>
                   <AdminLayout><OfficerManagement /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/insights" element={
                <ProtectedRoute allowedRoles={['admin']}>
                   <AdminLayout><DailyInsights /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/silent" element={
                <ProtectedRoute allowedRoles={['admin']}>
                   <AdminLayout><SilentCrisis /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/civic-memory" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout><CivicMemory /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/audit" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout><AuditExplorer /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/breaches" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout><SLABreachManager /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout><StrategicAnalytics /></AdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/tickets" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout><AdminTickets /></AdminLayout>
                </ProtectedRoute>
              } />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
}
