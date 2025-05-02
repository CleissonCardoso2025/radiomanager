
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // We're now using hardcoded values instead of environment variables
  // These are kept for reference but no longer used
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  // add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
