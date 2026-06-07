// Frontend configuration based on environment variables
export const config = {
  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  },

  // Application Information
  app: {
    name: import.meta.env.VITE_APP_NAME || 'AuraHR',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'AI-Powered Human Resource Management System',
    author: import.meta.env.VITE_APP_AUTHOR || 'AuraHR Team',
  },

  // Environment Settings
  env: {
    isDevelopment: import.meta.env.VITE_NODE_ENV === 'development',
    isProduction: import.meta.env.VITE_NODE_ENV === 'production',
    isDevMode: import.meta.env.VITE_DEV_MODE === 'true',
    isDebugMode: import.meta.env.VITE_DEBUG === 'true',
  },

  // Feature Flags
  features: {
    ai: import.meta.env.VITE_ENABLE_AI_FEATURES === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    chat: import.meta.env.VITE_ENABLE_CHAT === 'true',
    notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
    serviceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true',
    bundleAnalyzer: import.meta.env.VITE_ENABLE_BUNDLE_ANALYZER === 'true',
  },

  // Upload Configuration
  upload: {
    maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB
    allowedFileTypes: import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || ['.pdf', '.docx', '.txt'],
  },

  // UI Configuration
  ui: {
    darkMode: import.meta.env.VITE_ENABLE_DARK_MODE === 'true',
    defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'light',
    paginationSize: parseInt(import.meta.env.VITE_PAGINATION_SIZE) || 10,
  },

  // Security Configuration
  security: {
    sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000, // 30 minutes
    autoLogoutWarning: parseInt(import.meta.env.VITE_AUTO_LOGOUT_WARNING) || 300000, // 5 minutes
  },

  // Validation helpers
  validation: {
    isValidFileType: (filename: string): boolean => {
      const extension = '.' + filename.split('.').pop()?.toLowerCase();
      return config.upload.allowedFileTypes.includes(extension);
    },
    
    isValidFileSize: (size: number): boolean => {
      return size <= config.upload.maxFileSize;
    },
    
    formatFileSize: (bytes: number): string => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
  },

  // URL helpers
  urls: {
    login: '/login',
    dashboard: '/dashboard',
    api: {
      auth: '/auth',
      jobs: '/jobs',
      candidates: '/candidates',
      employees: '/employees',
      chat: '/chat',
      uploads: '/uploads',
    }
  },

  // Development helpers
  dev: {
    logLevel: import.meta.env.VITE_DEBUG === 'true' ? 'debug' : 'warn',
    
    log: (...args: any[]) => {
      if (config.env.isDebugMode) {
        console.log('[AuraHR]', ...args);
      }
    },
    
    warn: (...args: any[]) => {
      if (config.env.isDebugMode || !config.env.isProduction) {
        console.warn('[AuraHR]', ...args);
      }
    },
    
    error: (...args: any[]) => {
      console.error('[AuraHR]', ...args);
    },
  },
};

// Environment validation
const validateConfig = () => {
  const errors: string[] = [];

  // Check required environment variables
  if (!config.api.baseURL) {
    errors.push('VITE_API_URL is required');
  }

  if (config.upload.maxFileSize <= 0) {
    errors.push('VITE_MAX_FILE_SIZE must be a positive number');
  }

  if (config.upload.allowedFileTypes.length === 0) {
    errors.push('VITE_ALLOWED_FILE_TYPES must contain at least one file type');
  }

  // Warn about development settings in production
  if (config.env.isProduction) {
    if (config.env.isDebugMode) {
      config.dev.warn('Debug mode is enabled in production');
    }
    
    if (config.env.isDevMode) {
      config.dev.warn('Dev mode is enabled in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};

// Validate configuration on load
if (typeof window !== 'undefined') {
  try {
    validateConfig();
    config.dev.log('Configuration validated successfully', config);
  } catch (error) {
    config.dev.error('Configuration validation failed:', error);
    throw error;
  }
}

export default config;