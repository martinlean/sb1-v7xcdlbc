import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

export function useProducts(type?: 'own' | 'affiliate' | 'coproduction') {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [type]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let query = supabase.from('products').select('*');

      switch (type) {
        case 'own':
          query = query.eq('user_id', user.id);
          break;
        case 'affiliate':
          // Buscar produtos onde o usuário é afiliado
          const { data: affiliateProducts } = await supabase
            .from('affiliates')
            .select('product_id')
            .eq('user_id', user.id)
            .eq('status', 'approved');
          
          if (affiliateProducts?.length) {
            query = query.in('id', affiliateProducts.map(p => p.product_id));
          } else {
            return setProducts([]);
          }
          break;
        case 'coproduction':
          // Buscar produtos onde o usuário é coprodutor
          const { data: coproductionProducts } = await supabase
            .from('coproducers')
            .select('product_id')
            .eq('user_id', user.id)
            .eq('status', 'approved');
          
          if (coproductionProducts?.length) {
            query = query.in('id', coproductionProducts.map(p => p.product_id));
          } else {
            return setProducts([]);
          }
          break;
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Error loading products');
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    refresh: loadProducts
  };
}