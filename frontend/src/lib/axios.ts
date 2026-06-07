import axios from "axios";

// Environment-aware API configuration
const getApiUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_URL;

  // In development, use environment variable or fallback to proxy
  if (import.meta.env.DEV) {
    return envApiUrl || "/api";
  }

  // In production, use environment variable or construct from window location
  if (envApiUrl) {
    return envApiUrl;
  }

  // Fallback: construct API URL from current origin
  const { protocol, hostname, port } = window.location;
  const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ""}`;
  return `${baseUrl}/api`;
};

const API_BASE_URL = getApiUrl();
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Create axios instance with comprehensive configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  // Enable cookies for authentication
  withCredentials: false,
});

// Request interceptor for authentication and request logging
api.interceptors.request.use(
  (config) => {
    // Add auth token to requests
    const authStore = localStorage.getItem("auth-storage");
    if (authStore) {
      try {
        const { state } = JSON.parse(authStore);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (e) {
        console.error("Error parsing auth token", e);
        // Clean up corrupted auth data
        localStorage.removeItem("auth-storage");
      }
    }

    // Add request timestamp for debugging
    if (import.meta.env.VITE_DEBUG === "true") {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        {
          data: config.data,
          params: config.params,
          headers: {
            ...config.headers,
            Authorization: config.headers.Authorization
              ? "[REDACTED]"
              : undefined,
          },
        }
      );
    }

    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and response logging
api.interceptors.response.use(
  (response) => {
    // Log successful responses in debug mode
    if (import.meta.env.VITE_DEBUG === "true") {
      console.log(`[API Response] ${response.status} ${response.config.url}`, {
        data: response.data,
        headers: response.headers,
      });
    }

    return response;
  },
  (error) => {
    const { response, request, message } = error;

    // Enhanced error logging
    if (import.meta.env.VITE_DEBUG === "true") {
      console.group(
        `[API Error] ${response?.status || "Unknown"} ${response?.config?.url || "Unknown URL"}`
      );
      console.error("Error Details:", {
        message,
        status: response?.status,
        statusText: response?.statusText,
        url: response?.config?.url,
        method: response?.config?.method?.toUpperCase(),
        requestData: response?.config?.data,
        responseData: response?.data,
        headers: response?.headers,
      });
      console.groupEnd();
    }

    // Handle different types of errors
    if (response) {
      // Server responded with error status
      const { status, data } = response;

      switch (status) {
        case 401: {
          const requestUrl = response.config?.url || "";
          const isAuthRequest =
            requestUrl.includes("/auth/login") ||
            requestUrl.includes("/auth/register");

          // Don't clear session or redirect for failed login/register attempts
          if (isAuthRequest) {
            break;
          }

          console.warn("Authentication expired or invalid");
          localStorage.removeItem("auth-storage");
          delete api.defaults.headers.common.Authorization;

          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
          break;
        }

        case 403:
          // Forbidden - user doesn't have permission
          console.warn("Access forbidden - insufficient permissions");
          break;

        case 404:
          // Not found
          console.warn("Resource not found:", response.config.url);
          break;

        case 422:
          // Validation error - usually has detailed error info
          console.warn("Validation error:", data);
          break;

        case 429:
          // Rate limiting
          console.warn("Too many requests - rate limited");
          break;

        case 500:
          // Server error
          console.error("Internal server error");
          break;

        case 502:
        case 503:
        case 504:
          // Gateway/service errors
          console.error("Service unavailable - server may be down");
          break;

        default:
          console.error(`HTTP Error ${status}:`, data?.message || message);
      }

      // Enhance error object with more context
      error.isApiError = true;
      error.statusCode = status;
      error.errorData = data;
    } else if (request) {
      // Request was made but no response received (network error)
      console.error("Network error - no response received");
      error.isNetworkError = true;
    } else {
      // Something else happened
      console.error("Request setup error:", message);
      error.isSetupError = true;
    }

    return Promise.reject(error);
  }
);

// Utility functions for common API patterns
export const apiUtils = {
  // Check if error is a specific type
  isAuthError: (error: any) => error?.response?.status === 401,
  isValidationError: (error: any) => error?.response?.status === 422,
  isNetworkError: (error: any) => error?.isNetworkError === true,
  isServerError: (error: any) => {
    const status = error?.response?.status;
    return status >= 500 && status < 600;
  },

  // Get error message from response
  getErrorMessage: (error: any) => {
    if (error?.response?.data?.detail) {
      // FastAPI error format
      return typeof error.response.data.detail === "string"
        ? error.response.data.detail
        : JSON.stringify(error.response.data.detail);
    }

    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.message) {
      return error.message;
    }

    return "An unexpected error occurred";
  },

  // Create abort controller for request cancellation
  createAbortController: () => new AbortController(),

  // Helper for handling file uploads with progress
  uploadWithProgress: (
    url: string,
    formData: FormData,
    onProgress?: (progressEvent: any) => void
  ) => {
    return api.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onProgress,
    });
  },
};

// Export configured axios instance as default
export default api;
