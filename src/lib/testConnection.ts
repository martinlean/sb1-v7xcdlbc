import { supabase } from './supabase';

export async function testSupabaseConnection() {
  try {
    // First test basic connection
    const { data: versionData, error: versionError } = await supabase
      .rpc('version');

    if (versionError) {
      console.error('Basic connection test failed:', versionError);
      return {
        connected: false,
        error: 'Could not connect to Supabase. Please check your credentials.'
      };
    }

    // Then test products table
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Products table test failed:', error);
      if (error.message.includes('does not exist')) {
        return {
          connected: false,
          error: 'The products table does not exist. Please run the database migrations.'
        };
      }
      return {
        connected: false,
        error: error.message
      };
    }

    return {
      connected: true,
      data
    };
  } catch (error) {
    console.error('Connection test error:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}