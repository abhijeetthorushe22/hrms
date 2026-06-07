import { create } from "zustand";
import { employeesApi, Employee, DevelopmentPlan } from "@/lib/api";

interface EmployeeState {
  employees: Employee[];
  developmentPlans: { [employeeId: string]: DevelopmentPlan };
  loading: boolean;
  error: string | null;
  fetchEmployees: () => Promise<void>;
  getEmployee: (id: string) => Promise<Employee>;
  getDevelopmentPlan: (employeeId: string) => Promise<DevelopmentPlan>;
  generateDevelopmentPlan: (employeeId: string) => Promise<DevelopmentPlan>;
  clearError: () => void;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  developmentPlans: {},
  loading: false,
  error: null,

  fetchEmployees: async () => {
    set({ loading: true, error: null });
    try {
      const employees = await employeesApi.getEmployees();
      set({ employees, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to fetch employees",
        loading: false,
      });
    }
  },

  getEmployee: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const employee = await employeesApi.getEmployee(id);
      set({ loading: false });
      return employee;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to fetch employee",
        loading: false,
      });
      throw error;
    }
  },

  getDevelopmentPlan: async (employeeId: string) => {
    set({ loading: true, error: null });
    try {
      const plan = await employeesApi.getDevelopmentPlan(employeeId);
      set((state) => ({
        developmentPlans: {
          ...state.developmentPlans,
          [employeeId]: plan,
        },
        loading: false,
      }));
      return plan;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to fetch development plan",
        loading: false,
      });
      throw error;
    }
  },

  generateDevelopmentPlan: async (employeeId: string) => {
    set({ loading: true, error: null });
    try {
      const plan = await employeesApi.generateDevelopmentPlan(employeeId);
      set((state) => ({
        developmentPlans: {
          ...state.developmentPlans,
          [employeeId]: plan,
        },
        loading: false,
      }));
      return plan;
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || "Failed to generate development plan",
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));