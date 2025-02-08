import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layouts/AdminLayout';
import UsersList from './users/UsersList';
import PendingVerifications from './users/PendingVerifications';
import UserDocuments from './users/UserDocuments';

export default function AdminUsers() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<UsersList />} />
        <Route path="pending" element={<PendingVerifications />} />
        <Route path="documents" element={<UserDocuments />} />
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Routes>
    </AdminLayout>
  );
}