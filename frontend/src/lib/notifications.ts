import { create } from 'zustand';
import { toast } from 'sonner';

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationStore {
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    description?: string;
    timestamp: Date;
  }>;
  addNotification: (notification: Omit<NotificationStore['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = {
      ...notification,
      id,
      timestamp: new Date(),
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications.slice(0, 49)], // Keep only last 50
    }));
  },
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  clearAll: () => set({ notifications: [] }),
}));

// Enhanced notification functions
export const notifications = {
  success: (message: string, options?: ToastOptions) => {
    useNotificationStore.getState().addNotification({
      type: 'success',
      title: options?.title || 'Success',
      description: message,
    });
    
    toast.success(options?.title || 'Success', {
      description: message,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    useNotificationStore.getState().addNotification({
      type: 'error',
      title: options?.title || 'Error',
      description: message,
    });
    
    toast.error(options?.title || 'Error', {
      description: message,
      duration: options?.duration || 6000,
      action: options?.action,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title: options?.title || 'Warning',
      description: message,
    });
    
    toast.warning(options?.title || 'Warning', {
      description: message,
      duration: options?.duration || 5000,
      action: options?.action,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    useNotificationStore.getState().addNotification({
      type: 'info',
      title: options?.title || 'Info',
      description: message,
    });
    
    toast.info(options?.title || 'Info', {
      description: message,
      duration: options?.duration || 4000,
      action: options?.action,
    });
  },

  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ): void => {
    toast.promise(promise, options);
  },

  // API-specific notifications
  apiError: (error: any, action?: string) => {
    let message = 'An unexpected error occurred';
    let title = 'API Error';
    
    if (error?.response?.status) {
      title = `Error ${error.response.status}`;
      
      if (error.response.status === 401) {
        message = 'Your session has expired. Please log in again.';
        title = 'Authentication Required';
      } else if (error.response.status === 403) {
        message = 'You do not have permission to perform this action.';
        title = 'Access Denied';
      } else if (error.response.status === 404) {
        message = 'The requested resource was not found.';
        title = 'Not Found';
      } else if (error.response.status === 422) {
        message = error.response.data?.detail || 'Invalid data provided.';
        title = 'Validation Error';
      } else if (error.response.status >= 500) {
        message = 'Server error. Please try again later.';
        title = 'Server Error';
      } else if (error.response.data?.detail) {
        message = error.response.data.detail;
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      }
    } else if (error?.message) {
      if (error.message.includes('Network Error')) {
        message = 'Network error. Please check your connection.';
        title = 'Connection Error';
      } else {
        message = error.message;
      }
    }
    
    if (action) {
      message = `Failed to ${action.toLowerCase()}: ${message}`;
    }
    
    notifications.error(message, { title });
  },

  apiSuccess: (message: string, action?: string) => {
    const finalMessage = action ? `${action} completed successfully` : message;
    notifications.success(finalMessage);
  },

  // Upload-specific notifications
  uploadStart: (filename: string) => {
    notifications.info(`Uploading ${filename}...`, {
      title: 'Upload Started',
      duration: 2000,
    });
  },

  uploadSuccess: (filename: string) => {
    notifications.success(`${filename} uploaded successfully`, {
      title: 'Upload Complete',
    });
  },

  uploadError: (filename: string, error?: string) => {
    notifications.error(
      error || 'Upload failed. Please try again.',
      { title: `Failed to upload ${filename}` }
    );
  },

  // Form validation notifications
  formError: (message: string) => {
    notifications.error(message, {
      title: 'Form Validation Error',
      duration: 4000,
    });
  },

  formSuccess: (action: string) => {
    notifications.success(`${action} saved successfully`, {
      title: 'Form Saved',
    });
  },

  // Connection status notifications
  connectionLost: () => {
    notifications.warning(
      'Connection to server lost. Some features may not work properly.',
      {
        title: 'Connection Lost',
        duration: 8000,
      }
    );
  },

  connectionRestored: () => {
    notifications.success(
      'Connection to server restored.',
      {
        title: 'Connection Restored',
        duration: 3000,
      }
    );
  },

  // Feature-specific notifications
  aiProcessing: (action: string) => {
    notifications.info(`AI is processing your ${action}...`, {
      title: 'AI Processing',
      duration: 3000,
    });
  },

  aiComplete: (action: string) => {
    notifications.success(`AI ${action} completed`, {
      title: 'AI Processing Complete',
    });
  },

  aiError: (action: string) => {
    notifications.error(`AI ${action} failed. Please try again.`, {
      title: 'AI Processing Error',
    });
  },
};

export default notifications;