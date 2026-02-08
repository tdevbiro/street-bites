/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_MAP_DEFAULT_CENTER_LAT?: string;
  readonly VITE_MAP_DEFAULT_CENTER_LNG?: string;
  readonly VITE_MAP_DEFAULT_ZOOM?: string;
  readonly VITE_GPS_UPDATE_INTERVAL?: string;
  readonly VITE_GPS_HIGH_ACCURACY?: string;
  readonly VITE_ENABLE_PUSH_NOTIFICATIONS?: string;
  readonly VITE_ENABLE_AI_PREDICTIONS?: string;
  readonly VITE_ENABLE_SOCIAL_FEATURES?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
