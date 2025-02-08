import { useState } from 'react';
import { AffiliateService } from '../services/affiliates';

export function useAffiliates() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyForProgram = async (productId: string, data: {
    motivation: string;
    experience: string;
    promotion_strategy: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const affiliateService = AffiliateService.getInstance();
      return await affiliateService.applyForProgram(productId, data);
    } catch (err) {
      console.error('Error applying for affiliate program:', err);
      setError(err instanceof Error ? err.message : 'Error applying for program');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approveAffiliate = async (affiliateId: string) => {
    try {
      setLoading(true);
      setError(null);

      const affiliateService = AffiliateService.getInstance();
      return await affiliateService.approveAffiliate(affiliateId);
    } catch (err) {
      console.error('Error approving affiliate:', err);
      setError(err instanceof Error ? err.message : 'Error approving affiliate');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectAffiliate = async (affiliateId: string, reason: string) => {
    try {
      setLoading(true);
      setError(null);

      const affiliateService = AffiliateService.getInstance();
      return await affiliateService.rejectAffiliate(affiliateId, reason);
    } catch (err) {
      console.error('Error rejecting affiliate:', err);
      setError(err instanceof Error ? err.message : 'Error rejecting affiliate');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAffiliateStats = async (affiliateId: string) => {
    try {
      setLoading(true);
      setError(null);

      const affiliateService = AffiliateService.getInstance();
      return await affiliateService.getAffiliateStats(affiliateId);
    } catch (err) {
      console.error('Error getting affiliate stats:', err);
      setError(err instanceof Error ? err.message : 'Error getting stats');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestWithdrawal = async (amount: number, paymentInfo: {
    method: 'pix' | 'bank_transfer';
    pix_key?: string;
    bank_info?: {
      bank: string;
      agency: string;
      account: string;
      document: string;
    };
  }) => {
    try {
      setLoading(true);
      setError(null);

      const affiliateService = AffiliateService.getInstance();
      return await affiliateService.requestWithdrawal(amount, paymentInfo);
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      setError(err instanceof Error ? err.message : 'Error requesting withdrawal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAffiliateLinks = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);

      const affiliateService = AffiliateService.getInstance();
      return await affiliateService.getAffiliateLinks(productId);
    } catch (err) {
      console.error('Error getting affiliate links:', err);
      setError(err instanceof Error ? err.message : 'Error getting links');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    applyForProgram,
    approveAffiliate,
    rejectAffiliate,
    getAffiliateStats,
    requestWithdrawal,
    getAffiliateLinks
  };
}