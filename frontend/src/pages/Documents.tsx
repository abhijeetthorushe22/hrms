import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  Calendar,
  User,
  FolderOpen,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: "resume" | "contract" | "policy" | "handbook" | "certificate" | "other";
  size: string;
  uploadDate: string;
  uploadedBy: string;
  url: string;
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Employee_Handbook_2024.pdf",
    type: "handbook",
    size: "2.3 MB",
    uploadDate: "2024-01-15",
    uploadedBy: "HR Admin",
    url: "#",
  },
  {
    id: "2",
    name: "Code_of_Conduct.pdf",
    type: "policy",
    size: "1.8 MB",
    uploadDate: "2024-01-10",
    uploadedBy: "HR Admin",
    url: "#",
  },
  {
    id: "3",
    name: "Employment_Contract_Template.docx",
    type: "contract",
    size: "456 KB",
    uploadDate: "2024-01-08",
    uploadedBy: "Legal Team",
    url: "#",
  },
  {
    id: "4",
    name: "Safety_Training_Certificate.pdf",
    type: "certificate",
    size: "890 KB",
    uploadDate: "2024-01-05",
    uploadedBy: "Training Dept",
    url: "#",
  },
  {
    id: "5",
    name: "John_Doe_Resume.pdf",
    type: "resume",
    size: "1.2 MB",
    uploadDate: "2024-01-03",
    uploadedBy: "John Doe",
    url: "#",
  },
];

const getDocumentTypeColor = (type: Document["type"]) => {
  const colors = {
    resume: "bg-blue-100 text-blue-800",
    contract: "bg-green-100 text-green-800",
    policy: "bg-purple-100 text-purple-800",
    handbook: "bg-orange-100 text-orange-800",
    certificate: "bg-pink-100 text-pink-800",
    other: "bg-gray-100 text-gray-800",
  };
  return colors[type] || colors.other;
};

export default function Documents() {
  const [documents] = useState<Document[]>(mockDocuments);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const { toast } = useToast();

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleUpload = () => {
    toast({
      title: "Upload Feature",
      description: "Document upload functionality will be available soon.",
    });
  };

  const handleDownload = (doc: Document) => {
    toast({
      title: "Downloading",
      description: `Downloading ${doc.name}...`,
    });
  };

  const handleView = (doc: Document) => {
    toast({
      title: "Viewing Document",
      description: `Opening ${doc.name} in viewer...`,
    });
  };

  const handleDelete = (doc: Document) => {
    toast({
      title: "Delete Document",
      description: `${doc.name} has been deleted.`,
      variant: "destructive",
    });
  };

  const documentTypes = [
    { value: "all", label: "All Documents" },
    { value: "resume", label: "Resumes" },
    { value: "contract", label: "Contracts" },
    { value: "policy", label: "Policies" },
    { value: "handbook", label: "Handbooks" },
    { value: "certificate", label: "Certificates" },
    { value: "other", label: "Other" },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-3xl font-bold">My Documents</h1>
          </div>
          <Button onClick={handleUpload}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{documents.length}</p>
                  <p className="text-xs text-muted-foreground">
                    Total Documents
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {documents.filter((d) => d.type === "resume").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Resumes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {documents.filter((d) => d.type === "policy").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Policies</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {documents.filter((d) => d.type === "contract").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Contracts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Document Library</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDocuments.map((doc, index) => (
                <div key={doc.id}>
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-10 w-10 text-gray-400" />
                      <div>
                        <h3 className="font-medium">{doc.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {doc.uploadDate}
                          </span>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {doc.uploadedBy}
                          </span>
                          <span>{doc.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getDocumentTypeColor(doc.type)}>
                        {doc.type}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {index < filteredDocuments.length - 1 && <Separator />}
                </div>
              ))}
              {filteredDocuments.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No documents found matching your criteria.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
