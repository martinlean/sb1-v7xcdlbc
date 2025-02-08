import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Transaction {
  id: string;
  customer_email: string;
  customer_name: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  payment_method: string;
  created_at: string;
  product_name: string;
}

interface TransactionStats {
  available_balance: number;
  pending_balance: number;
  withdrawn_balance: number;
  net_profit: number;
  transactions_count: {
    paid: number;
    pending: number;
    failed: number;
    chargeback: number;
    refunded: number;
  };
}

const emptyStats: TransactionStats = {
  available_balance: 0,
  pending_balance: 0,
  withdrawn_balance: 0,
  net_profit: 0,
  transactions_count: {
    paid: 0,
    pending: 0,
    failed: 0,
    chargeback: 0,
    refunded: 0
  }
};

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchTransactions = async () => {
      try {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            status,
            payment_method,
            created_at,
            metadata,
            customer:customer_id (
              email,
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (paymentsError) throw paymentsError;

        if (!mounted) return;

        const formattedTransactions = (paymentsData || []).map(payment => ({
          id: payment.id,
          customer_email: payment.customer?.email || payment.metadata?.customer_email || '',
          customer_name: payment.customer?.name || payment.metadata?.customer_name || '',
          amount: payment.amount,
          status: payment.status,
          payment_method: payment.payment_method,
          created_at: payment.created_at,
          product_name: payment.metadata?.product_name || ''
        }));

        setTransactions(formattedTransactions);
        calculateStats(formattedTransactions);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error fetching transactions');
          setTransactions([]);
          setStats(emptyStats);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTransactions();

    // Set up realtime subscription
    const subscription = supabase
      .channel('payments_changes')
      .on('postgres_changes', {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'payments'
      }, (payload) => {
        if (!mounted) return;

        // Handle different event types
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const payment = payload.new;
          const formattedPayment = {
            id: payment.id,
            customer_email: payment.metadata?.customer_email || '',
            customer_name: payment.metadata?.customer_name || '',
            amount: payment.amount,
            status: payment.status,
            payment_method: payment.payment_method,
            created_at: payment.created_at,
            product_name: payment.metadata?.product_name || ''
          };

          setTransactions(current => {
            const index = current.findIndex(t => t.id === payment.id);
            if (index >= 0) {
              // Update existing transaction
              const updated = [...current];
              updated[index] = formattedPayment;
              return updated;
            } else {
              // Add new transaction
              return [formattedPayment, ...current];
            }
          });

          // Recalculate stats
          setTransactions(current => {
            calculateStats(current);
            return current;
          });
        }
      })
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const calculateStats = (transactions: Transaction[]) => {
    const stats = transactions.reduce((acc, transaction) => {
      const amount = transaction.amount;

      switch (transaction.status) {
        case 'completed':
          acc.available_balance += amount;
          acc.net_profit += amount;
          acc.transactions_count.paid++;
          break;
        case 'pending':
          acc.pending_balance += amount;
          acc.transactions_count.pending++;
          break;
        case 'failed':
          acc.transactions_count.failed++;
          break;
        case 'refunded':
          acc.transactions_count.refunded++;
          acc.net_profit -= amount; // Subtract refunded amount from net profit
          break;
      }

      return acc;
    }, {
      available_balance: 0,
      pending_balance: 0,
      withdrawn_balance: 0,
      net_profit: 0,
      transactions_count: {
        paid: 0,
        pending: 0,
        failed: 0,
        chargeback: 0,
        refunded: 0
      }
    });

    setStats(stats);
  };

  return {
    transactions,
    stats,
    loading,
    error
  };
}