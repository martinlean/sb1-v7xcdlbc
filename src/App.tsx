import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import RegisterSuccess from './pages/RegisterSuccess';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminTransactions from './pages/AdminTransactions';
import AdminWithdrawals from './pages/AdminWithdrawals';
import AdminProducts from './pages/AdminProducts';
import AdminSettings from './pages/AdminSettings';
import AppLogin from './pages/app/AppLogin';
import AppDashboard from './pages/app/AppDashboard';
import AppProducts from './pages/app/AppProducts';
import AppTransactions from './pages/app/AppTransactions';
import AppCustomers from './pages/app/AppCustomers';
import AppWithdrawals from './pages/app/AppWithdrawals';
import AppSettings from './pages/app/AppSettings';
import Integrations from './pages/Integrations';
import CheckoutForm from './components/CheckoutForm';
import MercadopagoCheckout from './components/MercadopagoCheckout';
import UpsellPage from './pages/UpsellPage';
import DownsellPage from './pages/DownsellPage';
import LoadingSpinner from './components/LoadingSpinner';
import NoProductFound from './components/NoProductFound';
import ConnectionTest from './components/ConnectionTest';

export default function App() {
  const hostname = window.location.hostname;
  const isTestDomain = hostname === 'test.rewardsmidia.online';
  const isAdminDomain = hostname === 'admin.rewardsmidia.online';
  const isAppDomain = hostname === 'app.rewardsmidia.online';
  const isCheckoutDomain = hostname === 'checkout.rewardsmidia.online';
  const isPayDomain = hostname === 'pay.rewardsmidia.online';
  const isLandingDomain = hostname === 'lp.rewardsmidia.online';
  
  if (isTestDomain) {
    return <ConnectionTest />;
  }

  if (isLandingDomain) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/success" element={<RegisterSuccess />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  if (isAdminDomain) {
    return (
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/users/*" element={<AdminUsers />} />
        <Route path="/transactions" element={<AdminTransactions />} />
        <Route path="/withdrawals/*" element={<AdminWithdrawals />} />
        <Route path="/products/*" element={<AdminProducts />} />
        <Route path="/settings/*" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }

  if (isAppDomain) {
    return (
      <Routes>
        <Route path="/login" element={<AppLogin />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<AppDashboard />} />
        <Route path="/products/*" element={<AppProducts />} />
        <Route path="/transactions" element={<AppTransactions />} />
        <Route path="/customers" element={<AppCustomers />} />
        <Route path="/withdrawals" element={<AppWithdrawals />} />
        <Route path="/settings/*" element={<AppSettings />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    );
  }

  if (isCheckoutDomain) {
    return (
      <Routes>
        <Route path="/:productId/:offerId" element={<CheckoutForm />} />
        <Route path="/upsell/:offerId" element={<UpsellPage />} />
        <Route path="/downsell/:offerId" element={<DownsellPage />} />
        <Route path="*" element={<NoProductFound />} />
      </Routes>
    );
  }

  if (isPayDomain) {
    return (
      <Routes>
        <Route path="/:productId/:offerId" element={<MercadopagoCheckout />} />
        <Route path="*" element={<NoProductFound />} />
      </Routes>
    );
  }

  // Redirect unknown domains to landing page
  window.location.href = 'https://lp.rewardsmidia.online';
  return null;
}