// Re-export main modules for better compatibility
export { api } from "./api";
export { default as axiosApi } from "./axios";
export * from "./config";
export * from "./utils";
export * from "./notifications";

// Export types
export type * from "./api";

// Default export for api
export { api as default } from "./api";
