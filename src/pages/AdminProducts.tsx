import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layouts/AdminLayout';
import ProductsList from './products/ProductsList';
import ProductForm from './products/ProductForm';
import ProductsAffiliations from './products/ProductsAffiliations';
import ProductsCoproductions from './products/ProductsCoproductions';
import ProductSettings from './products/settings/ProductSettings';
import OfferForm from './products/OfferForm';

export default function AdminProducts() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<ProductsList />} />
        <Route path="new" element={<ProductForm />} />
        <Route path=":id/edit" element={<ProductForm />} />
        <Route path=":id/settings/*" element={<ProductSettings />} />
        <Route path=":productId/offers/new" element={<OfferForm />} />
        <Route path=":productId/offers/:id" element={<OfferForm />} />
        <Route path="affiliations" element={<ProductsAffiliations />} />
        <Route path="co-productions" element={<ProductsCoproductions />} />
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </AdminLayout>
  );
}