import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEmployeeStore } from "@/store/useEmployeeStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/use-toast";
import { api, Employee, EmployeeCreate } from "@/lib/api";
import {
  Users,
  Plus,
  Mail,
  Briefcase,
  Calendar,
  Target,
  Edit,
  Trash2,
  Eye,
  FileText,
} from "lucide-react";

export default function Employees() {
  const { employees, fetchEmployees, loading } = useEmployeeStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [formData, setFormData] = useState<EmployeeCreate>({
    firstName: "",
    lastName: "",
    jobTitle: "",
    department: "",
    hireDate: "",
    extractedSkills: [],
    careerGoals: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleAddEmployee = async () => {
    try {
      await api.employees.createEmployee(formData);
      await fetchEmployees();
      setIsAddDialogOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        jobTitle: "",
        department: "",
        hireDate: "",
        extractedSkills: [],
        careerGoals: "",
      });
      toast({
        title: "Success",
        description: "Employee added successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      await api.employees.updateEmployee(selectedEmployee._id, formData);
      await fetchEmployees();
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      toast({
        title: "Success",
        description: "Employee updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this employee? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.employees.deleteEmployee(employeeId);
      await fetchEmployees();
      toast({
        title: "Success",
        description: "Employee deleted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      jobTitle: employee.jobTitle,
      department: employee.department,
      hireDate: employee.hireDate,
      extractedSkills: employee.extractedSkills || [],
      careerGoals: employee.careerGoals || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleViewDocuments = (employeeId: string) => {
    // Navigate to a documents page or show a proper modal
    const employee = employees.find((emp) => emp._id === employeeId);
    if (employee) {
      toast({
        title: "Employee Documents",
        description: `Opening documents for ${employee.firstName} ${employee.lastName}`,
      });
      // TODO: Navigate to documents page when implemented
      // navigate(`/employees/${employeeId}/documents`);
    }
  };

  const handleInputChange = (
    field: keyof EmployeeCreate,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading employees...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Employee Management</h1>
          </div>
          {(user?.role === "admin" || user?.role === "manager") && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Fill in the employee details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) =>
                        handleInputChange("jobTitle", e.target.value)
                      }
                      placeholder="Enter job title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                      placeholder="Enter department"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Hire Date</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={formData.hireDate}
                      onChange={(e) =>
                        handleInputChange("hireDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="careerGoals">Career Goals (Optional)</Label>
                    <Textarea
                      id="careerGoals"
                      value={formData.careerGoals}
                      onChange={(e) =>
                        handleInputChange("careerGoals", e.target.value)
                      }
                      placeholder="Enter career goals"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddEmployee}>Add Employee</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {employees.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No employees found.</p>
                  {(user?.role === "admin" || user?.role === "manager") && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Add your first employee to get started.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            employees.map((employee) => (
              <Card
                key={employee._id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {employee.firstName[0]}
                        {employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {employee.firstName} {employee.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {employee.jobTitle}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {employee.department}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      Hired {new Date(employee.hireDate).toLocaleDateString()}
                    </div>
                    {employee.careerGoals && (
                      <div className="flex items-start text-sm text-muted-foreground">
                        <Target className="h-4 w-4 mr-2 mt-0.5" />
                        <span className="line-clamp-2">
                          {employee.careerGoals}
                        </span>
                      </div>
                    )}
                  </div>

                  {employee.extractedSkills &&
                    employee.extractedSkills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {employee.extractedSkills
                            .slice(0, 4)
                            .map((skill, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            ))}
                          {employee.extractedSkills.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{employee.extractedSkills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewProfile(employee)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                    {(user?.role === "admin" || user?.role === "manager") && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(employee)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* View Profile Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Employee Profile</DialogTitle>
              <DialogDescription>
                Detailed information about the employee.
              </DialogDescription>
            </DialogHeader>
            {selectedEmployee && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {selectedEmployee.firstName[0]}
                      {selectedEmployee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedEmployee.jobTitle}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label className="text-sm font-medium">Department</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedEmployee.department}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Hire Date</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(selectedEmployee.hireDate).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedEmployee.careerGoals && (
                    <div>
                      <Label className="text-sm font-medium">
                        Career Goals
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedEmployee.careerGoals}
                      </p>
                    </div>
                  )}
                  {selectedEmployee.extractedSkills &&
                    selectedEmployee.extractedSkills.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Skills</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedEmployee.extractedSkills.map(
                            (skill, index) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteEmployee(selectedEmployee._id)}
                    className="text-red-600 hover:text-red-700 mr-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocuments(selectedEmployee._id)}
                    className="mx-auto"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Documents
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Employee</DialogTitle>
              <DialogDescription>
                Update the employee details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editJobTitle">Job Title</Label>
                <Input
                  id="editJobTitle"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    handleInputChange("jobTitle", e.target.value)
                  }
                  placeholder="Enter job title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDepartment">Department</Label>
                <Input
                  id="editDepartment"
                  value={formData.department}
                  onChange={(e) =>
                    handleInputChange("department", e.target.value)
                  }
                  placeholder="Enter department"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editHireDate">Hire Date</Label>
                <Input
                  id="editHireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) =>
                    handleInputChange("hireDate", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCareerGoals">Career Goals (Optional)</Label>
                <Textarea
                  id="editCareerGoals"
                  value={formData.careerGoals}
                  onChange={(e) =>
                    handleInputChange("careerGoals", e.target.value)
                  }
                  placeholder="Enter career goals"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditEmployee}>Update Employee</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
