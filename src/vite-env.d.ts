interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  /** Optional: the public site address QR codes open (default https://roselle-salon.vercel.app). */
  readonly VITE_PUBLIC_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
