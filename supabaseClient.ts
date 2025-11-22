
import { createClient } from '@supabase/supabase-js';

// Attempt to read from environment variables first.
// If they are missing (e.g. in a preview environment that doesn't load .env), fall back to the hardcoded keys.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://gmfoaogddxpgssxoffcx.supabase.co";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZm9hb2dkZHhwZ3NzeG9mZmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDE5MzksImV4cCI6MjA3OTM3NzkzOX0.pDe7b3jT6mYLdC0ZO_mO0pCcIGR35ExZ_fnq1uvSwok";

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase keys are missing. The app will likely crash.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
