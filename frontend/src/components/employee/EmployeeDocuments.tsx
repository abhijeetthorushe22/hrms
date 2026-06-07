import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Plus,
  AlertCircle,
} from "lucide-react";
import { documentsApi } from "@/lib/api";
import { toast } from "sonner";

interface Document {
  _id: string;
  filename: string;
  documentType: string;
  description: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

interface EmployeeDocumentsProps {
  employeeId: string;
  canManage: boolean; // Whether current user can upload/delete documents
}

export function EmployeeDocuments({
  employeeId,
  canManage,
}: EmployeeDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [employeeId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.getEmployeeDocuments(employeeId);
      setDocuments(data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await documentsApi.uploadEmployeeDocument(
        employeeId,
        file,
        "general",
        "Employee document"
      );
      toast.success("Document uploaded successfully");
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error("Failed to upload document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = "";
    }
  };

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const downloadUrl = documentsApi.downloadEmployeeDocument(
        employeeId,
        documentId
      );
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (error) {
      console.error("Failed to download document:", error);
      toast.error("Failed to download document");
    }
  };

  const handleDelete = async (documentId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      await documentsApi.deleteEmployeeDocument(employeeId, documentId);
      toast.success("Document deleted successfully");
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Documents</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Documents</span>
            <Badge variant="secondary">{documents.length}</Badge>
          </div>
          {canManage && (
            <div className="relative">
              <input
                type="file"
                id="document-upload"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
              <Button
                variant="outline"
                disabled={uploading}
                className="relative"
              >
                {uploading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No Documents</h3>
            <p className="mb-4 text-muted-foreground">
              No documents have been uploaded for this employee.
            </p>
            {canManage && (
              <div className="relative inline-block">
                <input
                  type="file"
                  id="document-upload-empty"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <Button variant="outline" disabled={uploading}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload First Document
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="group rounded-lg border transition-all duration-200"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "hsl(238, 67%, 53%)";
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.borderColor = "hsl(238, 67%, 53%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "";
                  e.currentTarget.style.color = "";
                  e.currentTarget.style.borderColor = "";
                }}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground group-hover:text-white" />
                    <div>
                      <p className="font-medium group-hover:text-white">
                        {doc.filename}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground group-hover:text-white">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                        {doc.documentType !== "general" && (
                          <>
                            <span>•</span>
                            <Badge
                              variant="outline"
                              className="text-xs group-hover:border-white/20 group-hover:bg-white/10 group-hover:!text-white"
                            >
                              {doc.documentType}
                            </Badge>
                          </>
                        )}
                      </div>
                      {doc.description && (
                        <p className="mt-1 text-xs text-muted-foreground group-hover:!text-white">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc._id, doc.filename)}
                      title="Download document"
                      className="group-hover:text-white group-hover:hover:bg-white/10"
                    >
                      <Download className="h-4 w-4 group-hover:text-white" />
                    </Button>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc._id, doc.filename)}
                        title="Delete document"
                        className="text-destructive hover:text-destructive group-hover:!text-white group-hover:hover:bg-white/10"
                      >
                        <Trash2 className="h-4 w-4 group-hover:!text-white" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
