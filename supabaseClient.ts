import { createClient } from '@supabase/supabase-js';

// Get environment variables with support for both Vite and legacy React Create App prefixes
const env = (import.meta as any).env;

// REPLACE THESE WITH YOUR NEW SUPABASE KEYS FROM PROJECT SETTINGS
const supabaseUrl = env?.VITE_SUPABASE_URL || env?.REACT_APP_SUPABASE_URL || "https://suschmjoogvoufhozbet.supabase.co";
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || env?.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1c2NobWpvb2d2b3VmaG96YmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODk3MjIsImV4cCI6MjA4MDQ2NTcyMn0.2kra7DebQzcaSMGCrGmBgB_zSrVlsCjJ5gZ8ZB0LpZ8";

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("YOUR_NEW")) {
    console.warn('Supabase keys are missing or not configured. The app will not connect to the database.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);