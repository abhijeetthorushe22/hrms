/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Backend API Configuration
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;

  // Application Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_DESCRIPTION: string;
  readonly VITE_APP_AUTHOR: string;

  // Environment Configuration
  readonly VITE_NODE_ENV: string;
  readonly VITE_DEV_MODE: string;
  readonly VITE_DEBUG: string;

  // Feature Flags
  readonly VITE_ENABLE_AI_FEATURES: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_CHAT: string;
  readonly VITE_ENABLE_NOTIFICATIONS: string;

  // Upload Configuration
  readonly VITE_MAX_FILE_SIZE: string;
  readonly VITE_ALLOWED_FILE_TYPES: string;

  // UI Configuration
  readonly VITE_ENABLE_DARK_MODE: string;
  readonly VITE_DEFAULT_THEME: string;
  readonly VITE_PAGINATION_SIZE: string;

  // Security Configuration
  readonly VITE_SESSION_TIMEOUT: string;
  readonly VITE_AUTO_LOGOUT_WARNING: string;

  // Performance Configuration
  readonly VITE_ENABLE_SERVICE_WORKER: string;
  readonly VITE_ENABLE_BUNDLE_ANALYZER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
