import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore, useAuthHydrated } from "@/store/useAuthStore";
import ErrorBoundary from "@/components/ErrorBoundary";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Recruitment from "./pages/Recruitment";
import MyDevelopment from "./pages/MyDevelopment";
import Analytics from "./pages/Analytics";
import Employees from "./pages/Employees";
import Performance from "./pages/Performance";
import Team from "./pages/Team";
import Development from "./pages/Development";
import SettingsPage from "./pages/Settings";
import Jobs from "./pages/Jobs";
import Candidates from "./pages/Candidates";
import Screening from "./pages/Screening";
import MyPerformance from "./pages/MyPerformance";
import Documents from "./pages/Documents";
import PublicChat from "./pages/PublicChat";
import NotFound from "./pages/NotFound";
import Debug from "./pages/Debug";
import JobDetails from "./pages/JobDetails";
import JobEdit from "./pages/JobEdit";
import CandidateDetails from "./pages/CandidateDetails";
import ResumeViewer from "./pages/ResumeViewer";
import ChatPage from "./pages/ChatPage";
import EmployeeDetails from "./pages/EmployeeDetails";
import EmployeeEdit from "./pages/EmployeeEdit";

// Configure React Query with production-ready defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408, 429
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          if (error.response.status === 408 || error.response.status === 429) {
            return failureCount < 2;
          }
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (renamed from cacheTime)
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  const hasHydrated = useAuthHydrated();

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  const hasHydrated = useAuthHydrated();

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
};

const App = () => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      // In production, send error to monitoring service
      if (import.meta.env.VITE_NODE_ENV === 'production') {
        console.error('Application Error:', error, errorInfo);
        // TODO: Send to error tracking service (e.g., Sentry)
      }
    }}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/recruitment"
            element={
              <PrivateRoute>
                <Recruitment />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-development"
            element={
              <PrivateRoute>
                <MyDevelopment />
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <Analytics />
              </PrivateRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <PrivateRoute>
                <Employees />
              </PrivateRoute>
            }
          />
          <Route
            path="/performance"
            element={
              <PrivateRoute>
                <Performance />
              </PrivateRoute>
            }
          />
          <Route
            path="/team"
            element={
              <PrivateRoute>
                <Team />
              </PrivateRoute>
            }
          />
          <Route
            path="/development"
            element={
              <PrivateRoute>
                <Development />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <PrivateRoute>
                <Jobs />
              </PrivateRoute>
            }
          />
          <Route
            path="/candidates"
            element={
              <PrivateRoute>
                <Candidates />
              </PrivateRoute>
            }
          />
          <Route
            path="/screening"
            element={
              <PrivateRoute>
                <Screening />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-performance"
            element={
              <PrivateRoute>
                <MyPerformance />
              </PrivateRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <PrivateRoute>
                <Documents />
              </PrivateRoute>
            }
          />
          <Route path="/debug" element={<Debug />} />
          {/* Public routes - no authentication required */}
          <Route path="/public-chat/:token" element={<PublicChat />} />
          {/* Additional routes for detailed views */}
          <Route
            path="/jobs/:id"
            element={
              <PrivateRoute>
                <JobDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/jobs/:id/edit"
            element={
              <PrivateRoute>
                <JobEdit />
              </PrivateRoute>
            }
          />
          <Route
            path="/candidates/:id"
            element={
              <PrivateRoute>
                <CandidateDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/candidates/:id/resume"
            element={
              <PrivateRoute>
                <ResumeViewer />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat/:chatId"
            element={
              <PrivateRoute>
                <ChatPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/employees/:id"
            element={
              <PrivateRoute>
                <EmployeeDetails />
              </PrivateRoute>
            }
          />
          <Route
            path="/employees/:id/edit"
            element={
              <PrivateRoute>
                <EmployeeEdit />
              </PrivateRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
