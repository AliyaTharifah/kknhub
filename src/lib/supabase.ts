import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Detect if we are using the default placeholder URLs
export const isSandboxMode =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes("your-project-id") ||
  supabaseAnonKey.includes("placeholder");

if (isSandboxMode && typeof window !== "undefined") {
  console.warn(
    "⚠️ KKNHub is running in local Sandbox Mode because Supabase credentials are not configured in .env.local. All Auth and Database features will use client-side mock fallback states."
  );
}

// Fallback URL and Key to prevent Supabase constructor from throwing runtime errors
const url = isSandboxMode ? "https://placeholder-project.supabase.co" : supabaseUrl;
const key = isSandboxMode ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sandbox-placeholder" : supabaseAnonKey;

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
