/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
  readonly GIVEWP_URL: string;
  readonly GIVEWP_API_KEY: string;
  readonly GIVEWP_API_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}