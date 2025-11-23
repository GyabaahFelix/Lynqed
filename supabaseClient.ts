import { createClient } from '@supabase/supabase-js';

// Vite uses import.meta.env. We check for VITE_ prefix (standard) or REACT_APP_ prefix (legacy)
// Casting import.meta to any to avoid TypeScript errors if vite-env.d.ts is missing or not picked up
const env = (import.meta as any).env;

const supabaseUrl = env?.VITE_SUPABASE_URL || env?.REACT_APP_SUPABASE_URL || "https://gmfoaogddxpgssxoffcx.supabase.co";
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || env?.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZm9hb2dkZHhwZ3NzeG9mZmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDE5MzksImV4cCI6MjA3OTM3NzkzOX0.pDe7b3jT6mYLdC0ZO_mO0pCcIGR35ExZ_fnq1uvSwok";

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase keys are missing. The app will likely crash.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);