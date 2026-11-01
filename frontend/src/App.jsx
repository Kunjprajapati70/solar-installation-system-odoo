import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';

import LandingPage from './pages/LandingPage';

// Auth Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Profile from './pages/auth/Profile';

// Error Pages
import ErrorPage from './pages/errors/ErrorPage';

// Pages
import AdminDashboard from './pages/AdminDashboard';
import EnquiriesView from './pages/EnquiriesView';
import CustomersView from './pages/CustomersView';
import SurveysView from './pages/SurveysView';
import QuotationsView from './pages/QuotationsView';
import OrdersView from './pages/OrdersView';
import SmartEquipmentView from './pages/SmartEquipmentView';
import InventoryView from './pages/InventoryView';
import TechnicianMobilePortal from './pages/TechnicianMobilePortal';
import InstallationPipelineView from './pages/InstallationPipelineView';
import WarrantyManagementView from './pages/WarrantyManagementView';
import ServiceTicketsView from './pages/ServiceTicketsView';
import CustomerPortal from './pages/CustomerPortal';
import FinancialsView from './pages/FinancialsView';
import SubsidiesView from './pages/SubsidiesView';
import TechniciansManagementView from './pages/TechniciansManagementView';
import ReportsView from './pages/ReportsView';
import AdminReviewCenter from './pages/AdminReviewCenter';
import UserManagementView from './pages/UserManagementView';

import { Sun } from 'lucide-react';
import { canAccessRoute, homePathForRole } from './config/permissions';

// Route Guards
const ProtectedRoute = ({ children }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-midnight-950 text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-solar-600 via-solar-500 to-amber-300 flex items-center justify-center shadow-glow-solar animate-pulse mb-4">
          <Sun className="w-7 h-7 text-midnight-950 font-bold" />
        </div>
        <p className="text-sm font-medium text-slate-200">Initializing SunPower Solutions...</p>
        <p className="text-xs text-slate-500 mt-1">Verifying encrypted session</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RoleRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!canAccessRoute(user?.role, location.pathname)) {
    return <Navigate to={homePathForRole(user?.role)} replace />;
  }
  return children;
};

const PublicAuthRoute = ({ children }) => {
  const { user, token, loading } = useAuth();

  // If already verified and authenticated, redirect to appropriate role portal
  if (!loading && token && user) {
    if (user.role === 'technician') return <Navigate to="/technician-portal" replace />;
    if (user.role === 'customer') return <Navigate to="/customer-portal" replace />;
    return <Navigate to="/" replace />;
  }

  // Always render login page immediately
  return children;
};

const RoleBasedHome = () => {
  const { user } = useAuth();
  if (user?.role === 'technician') {
    return <Navigate to="/technician-portal" replace />;
  }
  if (user?.role === 'customer') {
    return <Navigate to="/customer-portal" replace />;
  }
  return <AdminDashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Standalone Auth Routes */}
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<PublicAuthRoute><Login /></PublicAuthRoute>} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Standalone Error Routes */}
                <Route path="/error/:code" element={<ErrorPage />} />
                <Route path="/error" element={<ErrorPage code="500" />} />

                {/* Application Layout with Protected Workspace */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <RoleRoute>
                        <Layout />
                      </RoleRoute>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<RoleBasedHome />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="enquiries" element={<EnquiriesView />} />
                  <Route path="customers" element={<CustomersView />} />
                  <Route path="surveys" element={<SurveysView />} />
                  <Route path="quotations" element={<QuotationsView />} />
                  <Route path="orders" element={<OrdersView />} />
                  <Route path="equipment-tracking" element={<SmartEquipmentView />} />
                  <Route path="inventory" element={<InventoryView />} />
                  <Route path="technician-portal" element={<TechnicianMobilePortal />} />
                  <Route path="installations" element={<InstallationPipelineView />} />
                  <Route path="warranties" element={<WarrantyManagementView />} />
                  <Route path="service-tickets" element={<ServiceTicketsView />} />
                  <Route path="customer-portal" element={<CustomerPortal />} />
                  <Route path="financials" element={<FinancialsView />} />
                  <Route path="subsidies" element={<SubsidiesView />} />
                  <Route path="technicians" element={<TechniciansManagementView />} />
                  <Route path="reports" element={<ReportsView />} />
                  <Route path="approvals" element={<AdminReviewCenter />} />
                  <Route path="users" element={<UserManagementView />} />
                  
                  {/* Catch-all 404 Route */}
                  <Route path="*" element={<ErrorPage code="404" />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
