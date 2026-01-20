import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// Helper to check if Supabase is configured
const isSupabaseConfigured = () => {
  return typeof supabaseUrl === 'string' && 
         supabaseUrl.length > 0 && 
         typeof supabaseAnonKey === 'string' && 
         supabaseAnonKey.length > 0;
};

// Create a client or a mock to prevent crashes
const createSafeClient = () => {
  if (isSupabaseConfigured()) {
    return createClient(supabaseUrl!, supabaseAnonKey!);
  }

  // Mock client that always returns errors for operations
  // This triggers the fallback logic in App.tsx to use LocalStorage
  const mockBuilder = {
    select: () => mockBuilder,
    insert: () => mockBuilder,
    delete: () => mockBuilder,
    eq: () => mockBuilder,
    order: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    then: (resolve: any) => resolve({ data: null, error: { message: 'Supabase not configured' } })
  };

  return {
    from: () => mockBuilder
  } as any;
};

export const supabase = createSafeClient();