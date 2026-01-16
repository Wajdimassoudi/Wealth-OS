
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aizstviwidggsgcjycob.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MClkQM_-7uHtaleRt-fUyg_rYRUJfx4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('IP detection failed:', error);
    return '0.0.0.0';
  }
};
