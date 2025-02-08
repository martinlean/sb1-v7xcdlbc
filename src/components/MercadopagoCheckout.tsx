import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, QrCode, Copy, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { IMaskInput } from 'react-imask';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import NoProductFound from './NoProductFound';

interface FormData {
  email: string;
  name: string;
  phone: string;
  document: string;
}

export default function MercadopagoCheckout() {
  const { productId, offerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [offer, setOffer] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    phone: '',
    document: ''
  });
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    copyPaste: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProductAndOffer();
  }, [productId, offerId]);

  const loadProductAndOffer = async () => {
    try {
      if (!productId || !offerId) {
        throw new Error('Produto ou oferta não encontrados');
      }

      // First get the offer to validate it exists
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .eq('product_id', productId)
        .single();

      if (offerError) throw offerError;
      if (!offerData) throw new Error('Oferta não encontrada');

      setOffer(offerData);

      // Then get the product with payment settings
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*, payment_settings')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      if (!productData) throw new Error('Produto não encontrado');

      // Check payment processor and redirect if necessary
      if (productData.payment_settings?.processor !== 'mercadopago') {
        window.location.href = `https://checkout.rewardsmidia.online/${productId}/${offerId}`;
        return;
      }

      setProduct(productData);
    } catch (err) {
      console.error('Error loading product/offer:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setProcessing(true);
      setError(null);

      // Validate form
      if (!formData.email || !formData.name || !formData.phone || !formData.document) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      // Call the new create_pix_payment_v2 function
      const { data, error } = await supabase.rpc('create_pix_payment_v2', {
        p_amount: offer.price,
        p_customer_name: formData.name,
        p_customer_document: formData.document,
        p_customer_email: formData.email
      });

      if (error) throw error;

      setPixData({
        qrCode: data.qr_code,
        qrCodeBase64: data.qr_code_base64,
        copyPaste: data.copy_paste,
        expiresAt: data.expires_at
      });
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar PIX');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.copyPaste) {
      navigator.clipboard.writeText(pixData.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!product || !offer) return <NoProductFound />;

  // Ensure we have a valid image URL
  const productImage = product.image || 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&q=80&w=800&h=600';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {!pixData ? (
            <form onSubmit={handleSubmit}>
              {/* Personal Info */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium text-gray-900">Dados pessoais</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Digite seu melhor e-mail"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone <span className="text-red-500">*</span>
                    </label>
                    <IMaskInput
                      mask="(00) 00000-0000"
                      value={formData.phone}
                      onAccept={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CPF/CNPJ <span className="text-red-500">*</span>
                    </label>
                    <IMaskInput
                      mask={[
                        { mask: '000.000.000-00', maxLength: 11 },
                        { mask: '00.000.000/0000-00', maxLength: 14 }
                      ]}
                      value={formData.document}
                      onAccept={(value) => setFormData(prev => ({ ...prev, document: value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-blue-500 text-white py-4 rounded-xl font-medium text-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {processing ? 'Processando...' : 'Gerar PIX'}
              </button>
            </form>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
              <div className="text-center">
                <QrCode className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-gray-900 mb-2">PIX Gerado</h2>
                <p className="text-gray-600">
                  Escaneie o QR Code ou copie o código PIX abaixo para pagar
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleCopyPix}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Código PIX copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copiar código PIX
                    </>
                  )}
                </button>

                <p className="text-sm text-center text-gray-500">
                  Expira em: {new Date(pixData.expiresAt).toLocaleString()}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>Enviamos as instruções para:</span>
                </div>
                <p className="text-gray-900 font-medium">{formData.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:sticky lg:top-8 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="aspect-w-16 aspect-h-9 mb-6">
              <img
                src={productImage}
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&q=80&w=800&h=600';
                }}
              />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-6">{product.description}</p>
            
            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">R$ {offer.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">R$ {offer.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Ambiente 100% seguro</span>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Precisa de ajuda? Fale com o vendedor pelo e-mail:</p>
            <a href={`mailto:${product.support_email}`} className="text-blue-500 hover:text-blue-600">
              {product.support_email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}