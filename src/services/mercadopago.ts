import { supabase } from '../lib/supabase';

export const createPixPayment = async (data: {
  amount: number;
  customer: {
    name: string;
    email: string;
    document: string;
  };
}) => {
  try {
    // Call Supabase RPC function
    const { data: pixData, error } = await supabase.rpc(
      'create_pix_payment',
      {
        p_amount: data.amount,
        p_customer_name: data.customer.name,
        p_customer_document: data.customer.document.replace(/\D/g, ''),
        p_customer_email: data.customer.email
      }
    );

    if (error) {
      console.error('Error creating PIX payment:', error);
      throw new Error('Erro ao gerar PIX. Por favor, tente novamente.');
    }

    if (!pixData) {
      throw new Error('Erro ao gerar PIX. Nenhum dado retornado.');
    }

    return {
      qrCode: pixData.qr_code,
      qrCodeBase64: pixData.qr_code_base64,
      copyPaste: pixData.copy_paste || pixData.qr_code,
      expiresAt: pixData.expires_at
    };
  } catch (err) {
    console.error('Error creating PIX payment:', err);
    throw new Error(err instanceof Error ? err.message : 'Erro ao gerar PIX');
  }
};