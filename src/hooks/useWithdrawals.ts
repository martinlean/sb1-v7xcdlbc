import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  bank_info: {
    bank: string;
    agency: string;
    account: string;
    type: 'checking' | 'savings';
    document: string;
  };
  created_at: string;
}

export function useWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    available_balance: 0,
    pending_balance: 0,
    withdrawn_balance: 0
  });

  useEffect(() => {
    loadWithdrawals();
    loadStats();
  }, []);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: fetchError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setWithdrawals(data || []);
    } catch (err) {
      console.error('Error loading withdrawals:', err);
      setError(err instanceof Error ? err.message : 'Error loading withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get completed payments total
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (paymentsError) throw paymentsError;

      const totalPayments = (paymentsData || []).reduce((sum, payment) => sum + payment.amount, 0);

      // Get withdrawals by status
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('amount, status')
        .eq('user_id', user.id);

      if (withdrawalsError) throw withdrawalsError;

      const pendingBalance = (withdrawalsData || [])
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0);

      const withdrawnBalance = (withdrawalsData || [])
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.amount, 0);

      setStats({
        available_balance: totalPayments - pendingBalance - withdrawnBalance,
        pending_balance: pendingBalance,
        withdrawn_balance: withdrawnBalance
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const requestWithdrawal = async (amount: number, bankInfo: Withdrawal['bank_info']) => {
    try {
      if (amount <= 0) throw new Error('Amount must be greater than zero');
      if (amount > stats.available_balance) throw new Error('Insufficient balance');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert([{
          user_id: user.id,
          amount,
          status: 'pending',
          bank_info: bankInfo
        }]);

      if (withdrawalError) throw withdrawalError;

      await loadWithdrawals();
      await loadStats();
      return true;
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      throw err;
    }
  };

  return {
    withdrawals,
    stats,
    loading,
    error,
    refresh: loadWithdrawals,
    requestWithdrawal
  };
}