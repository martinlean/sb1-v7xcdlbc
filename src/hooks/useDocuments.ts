import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Document {
  id: string;
  type: 'selfie' | 'identity' | 'address' | 'social_contract';
  status: 'pending' | 'verified' | 'rejected';
  url: string;
  created_at: string;
  updated_at: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: fetchError } = await supabase
        .from('seller_documents')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err instanceof Error ? err.message : 'Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (type: string, file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('seller-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('seller-documents')
        .getPublicUrl(fileName);

      // Create document record
      const { error: insertError } = await supabase
        .from('seller_documents')
        .insert([{
          user_id: user.id,
          type,
          status: 'pending',
          url: publicUrl
        }]);

      if (insertError) throw insertError;

      await loadDocuments();
      return true;
    } catch (err) {
      console.error('Error uploading document:', err);
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    refresh: loadDocuments,
    uploadDocument
  };
}