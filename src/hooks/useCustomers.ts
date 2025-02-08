import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  successful_transactions: number;
  created_at: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            customer:customer_id (
              id,
              email,
              name,
              phone,
              created_at
            ),
            status
          `)
          .order('created_at', { ascending: false });

        if (paymentsError) throw paymentsError;

        // Process customers data
        const customersMap = new Map<string, Customer>();
        
        paymentsData?.forEach(payment => {
          if (payment.customer) {
            const customerId = payment.customer.id;
            const existingCustomer = customersMap.get(customerId);
            
            if (existingCustomer) {
              if (payment.status === 'completed') {
                existingCustomer.successful_transactions++;
              }
            } else {
              customersMap.set(customerId, {
                id: payment.customer.id,
                email: payment.customer.email,
                name: payment.customer.name,
                phone: payment.customer.phone || '',
                successful_transactions: payment.status === 'completed' ? 1 : 0,
                created_at: payment.customer.created_at
              });
            }
          }
        });

        setCustomers(Array.from(customersMap.values()));
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError(err instanceof Error ? err.message : 'Error fetching customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();

    // Subscribe to changes
    const subscription = supabase
      .channel('customers_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'payments'
      }, (payload) => {
        // Handle new payment
        const newPayment = payload.new;
        if (newPayment.customer_id) {
          setCustomers(current => {
            const existingCustomerIndex = current.findIndex(c => c.id === newPayment.customer_id);
            
            if (existingCustomerIndex >= 0) {
              const updatedCustomers = [...current];
              if (newPayment.status === 'completed') {
                updatedCustomers[existingCustomerIndex].successful_transactions++;
              }
              return updatedCustomers;
            }
            
            return current;
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    customers,
    loading,
    error
  };
}