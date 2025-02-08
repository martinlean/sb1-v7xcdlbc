import { supabase } from './supabase';

export async function createAdminUser(email: string, password: string) {
  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          is_admin: true
        }
      }
    });

    if (signUpError) throw signUpError;

    // Confirmar o email automaticamente
    const { error: updateError } = await supabase.rpc('confirm_user_email', {
      user_id: authData.user?.id
    });

    if (updateError) throw updateError;

    return { success: true, userId: authData.user?.id };
  } catch (error) {
    console.error('Error creating admin user:', error);
    return { success: false, error };
  }
}