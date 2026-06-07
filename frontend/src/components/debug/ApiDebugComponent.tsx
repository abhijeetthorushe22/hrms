import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";

export const ApiDebugComponent = () => {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();
  const [loginForm, setLoginForm] = useState({
    email: "admin@aurahr.com",
    password: "admin123",
  });
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginForm.email, loginForm.password);
      addTestResult("Login", "Success", "User logged in successfully");
    } catch (error: any) {
      addTestResult("Login", "Error", error.message);
    }
  };

  const addTestResult = (test: string, status: string, message: string) => {
    setTestResults((prev) => [
      ...prev,
      {
        test,
        status,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const testEndpoint = async (name: string, apiCall: () => Promise<any>) => {
    setIsLoading(true);
    try {
      const result = await apiCall();
      addTestResult(
        name,
        "Success",
        `Got ${Array.isArray(result) ? result.length : "one"} result(s)`
      );
    } catch (error: any) {
      const message =
        error.response?.data?.detail || error.message || "Unknown error";
      addTestResult(name, "Error", message);
    }
    setIsLoading(false);
  };

  const runAllTests = async () => {
    if (!isAuthenticated) {
      addTestResult("Test Suite", "Error", "Please login first");
      return;
    }

    // Test various endpoints
    await testEndpoint("Get Jobs", () => api.jobs.getJobs());
    await testEndpoint("Get Employees", () => api.employees.getEmployees());
    await testEndpoint("Get Candidates", () => api.candidates.getCandidates());
    await testEndpoint("Get User Profile", () => api.auth.getProfile());
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">API Integration Debug Tool</h1>

      {/* Authentication Section */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
          <CardDescription>
            Current authentication state and login controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAuthenticated ? (
            <div className="space-y-2">
              <Alert>
                <AlertDescription>
                  ✅ Logged in as: {user?.email} (Role: {user?.role})
                </AlertDescription>
              </Alert>
              <div className="text-xs text-muted-foreground">
                Token: {token?.substring(0, 20)}...
              </div>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <Button type="submit">Login</Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* API Testing Section */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Testing</CardTitle>
          <CardDescription>
            Test various API endpoints to verify connectivity and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={runAllTests}
              disabled={!isAuthenticated || isLoading}
            >
              {isLoading ? "Testing..." : "Run All Tests"}
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Individual Tests:</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!isAuthenticated || isLoading}
                onClick={() =>
                  testEndpoint("Get Jobs", () => api.jobs.getJobs())
                }
              >
                Test Jobs API
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!isAuthenticated || isLoading}
                onClick={() =>
                  testEndpoint("Get Employees", () =>
                    api.employees.getEmployees()
                  )
                }
              >
                Test Employees API
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!isAuthenticated || isLoading}
                onClick={() =>
                  testEndpoint("Get Candidates", () =>
                    api.candidates.getCandidates()
                  )
                }
              >
                Test Candidates API
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!isAuthenticated || isLoading}
                onClick={() =>
                  testEndpoint("Get Profile", () => api.auth.getProfile())
                }
              >
                Test Profile API
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results Section */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Latest API test results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-sm border-l-4 ${
                    result.status === "Success"
                      ? "border-l-green-500 bg-green-50"
                      : "border-l-red-500 bg-red-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{result.test}</strong>: {result.message}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {result.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Information */}
      <Card>
        <CardHeader>
          <CardTitle>Network Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <div>
              <strong>Frontend URL:</strong> {window.location.origin}
            </div>
            <div>
              <strong>API Base URL:</strong>{" "}
              {import.meta.env.VITE_API_URL || "http://localhost:8000/api"}
            </div>
            <div>
              <strong>Current Page:</strong> {window.location.pathname}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
