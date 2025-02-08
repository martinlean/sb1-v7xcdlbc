import { supabase } from './supabase';

export async function validateProductImage(file: File): Promise<void> {
  // Validar tipo
  if (!file.type.startsWith('image/')) {
    throw new Error('O arquivo deve ser uma imagem');
  }

  // Validar tamanho (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('A imagem deve ter no máximo 5MB');
  }

  // Validar dimensões
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

  if (img.width < 200 || img.height < 200) {
    throw new Error('A imagem deve ter no mínimo 200x200 pixels');
  }
}

export async function uploadProductImage(file: File, userId: string): Promise<string> {
  try {
    // Validar imagem
    await validateProductImage(file);

    // Gerar nome único
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('Storage error:', error);
      if (error.message.includes('Permission denied')) {
        throw new Error('Erro de permissão ao fazer upload da imagem. Verifique se você está logado.');
      }
      throw new Error('Erro ao fazer upload da imagem. Por favor, tente novamente.');
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export async function deleteProductImage(url: string): Promise<void> {
  try {
    // Extrair caminho da URL
    const path = url.split('/').slice(-2).join('/');
    
    const { error } = await supabase.storage
      .from('product-images')
      .remove([path]);

    if (error) {
      console.error('Storage error:', error);
      throw new Error('Erro ao excluir imagem');
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

export async function createProduct(data: {
  name: string;
  description: string;
  price: number;
  image: string;
  active?: boolean;
  membership_type?: string;
  membership_platform?: string;
  membership_url?: string;
  membership_webhook?: string;
  affiliate_commission?: number;
  affiliate_cookie_days?: number;
  affiliate_enabled?: boolean;
  coproduction_enabled?: boolean;
  coproduction_split?: number;
}) {
  try {
    // Validate required fields
    if (!data.name) throw new Error('Nome do produto é obrigatório');
    if (!data.description) throw new Error('Descrição do produto é obrigatória');
    if (!data.price || data.price <= 0) throw new Error('Preço deve ser maior que zero');
    if (!data.image) throw new Error('Imagem do produto é obrigatória');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Create product with billing name
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...data,
        user_id: user.id,
        billing_name: data.name // Set billing_name same as product name
      })
      .select()
      .single();

    if (error) throw error;
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function updateProduct(productId: string, data: {
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  active?: boolean;
  membership_type?: string;
  membership_platform?: string;
  membership_url?: string;
  membership_webhook?: string;
  affiliate_commission?: number;
  affiliate_cookie_days?: number;
  affiliate_enabled?: boolean;
  coproduction_enabled?: boolean;
  coproduction_split?: number;
}) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update({
        ...data,
        billing_name: data.name || undefined // Update billing_name if name is provided
      })
      .eq('id', productId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return product;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}