import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

interface ApiResponse {
  endpoint: string;
  status: "success" | "error" | "loading";
  data?: any;
  error?: string;
}

export const ApiIntegrationExample: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [apiResponses, setApiResponses] = useState<ApiResponse[]>([]);

  const testEndpoint = async (
    endpointName: string,
    apiCall: () => Promise<any>
  ) => {
    setApiResponses((prev) => [
      ...prev,
      { endpoint: endpointName, status: "loading" },
    ]);

    try {
      const data = await apiCall();
      setApiResponses((prev) =>
        prev.map((response) =>
          response.endpoint === endpointName && response.status === "loading"
            ? { ...response, status: "success", data }
            : response
        )
      );
    } catch (error: any) {
      setApiResponses((prev) =>
        prev.map((response) =>
          response.endpoint === endpointName && response.status === "loading"
            ? {
                ...response,
                status: "error",
                error: error.message || "Unknown error",
              }
            : response
        )
      );
    }
  };

  const runApiTests = async () => {
    if (!isAuthenticated) return;

    setApiResponses([]);

    // Test various API endpoints
    await testEndpoint("Get Jobs", () => api.jobs.getJobs());
    await testEndpoint("Get Employees", () => api.employees.getEmployees());
    await testEndpoint("Get Candidates", () => api.candidates.getCandidates());
    await testEndpoint("Get Performance Reviews", () =>
      api.performance.getReviews()
    );
    await testEndpoint("Get Dashboard Analytics", () =>
      api.analytics.getDashboardStats()
    );
    await testEndpoint("Get User Profile", () => api.auth.getProfile());
  };

  const clearResults = () => {
    setApiResponses([]);
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>API Integration Test</CardTitle>
          <CardDescription>
            Please log in to test the API integration
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>API Integration Test Dashboard</CardTitle>
        <CardDescription>
          Test the comprehensive API integration between frontend and backend
        </CardDescription>
        <div className="flex gap-2 mt-4">
          <Button
            onClick={runApiTests}
            disabled={apiResponses.some((r) => r.status === "loading")}
          >
            {apiResponses.some((r) => r.status === "loading")
              ? "Testing..."
              : "Run API Tests"}
          </Button>
          <Button variant="outline" onClick={clearResults}>
            Clear Results
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">User: {user?.email}</Badge>
            <Badge variant="outline">Role: {user?.role}</Badge>
          </div>

          {apiResponses.length === 0 && (
            <Alert>
              <AlertDescription>
                Click "Run API Tests" to test the frontend-backend integration
              </AlertDescription>
            </Alert>
          )}

          {apiResponses.map((response, index) => (
            <Card
              key={`${response.endpoint}-${index}`}
              className="border-l-4 border-l-blue-500"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {response.endpoint}
                  </CardTitle>
                  <Badge
                    variant={
                      response.status === "success"
                        ? "default"
                        : response.status === "error"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {response.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {response.status === "loading" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    Testing endpoint...
                  </div>
                )}

                {response.status === "success" && (
                  <div className="space-y-2">
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Success -{" "}
                      {Array.isArray(response.data)
                        ? response.data.length
                        : Object.keys(response.data || {}).length}{" "}
                      items returned
                    </div>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View Response Data
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded-md overflow-auto max-h-40">
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}

                {response.status === "error" && (
                  <div className="text-sm text-red-600">
                    ✗ Error: {response.error}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
