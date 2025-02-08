import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../../components/layouts/AppLayout';
import Profile from '../settings/Profile';
import Documents from '../settings/Documents';
import Security from '../settings/Security';

export default function AppSettings() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<Profile />} />
        <Route path="documents" element={<Documents />} />
        <Route path="security" element={<Security />} />
      </Routes>
    </AppLayout>
  );
}