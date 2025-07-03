"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Plus, FileText, Users, Award } from "lucide-react";
import toast from "react-hot-toast";
// import { useCertificate } from "@/contexts/Certification";

const IssuerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  //   const { certificates, loading, issueCertificate, getCertificates } =
  //     useCertificate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    holderId: "",
    title: "",
    description: "",
    file: null as File | null,
    metadata: {
      institution: "",
      course: "",
      grade: "",
      completionDate: "",
    },
  });

  //   useEffect(() => {
  //     getCertificates();
  //   }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.holderId || !formData.title) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      //   await issueCertificate(formData);
      toast.success("Certificate issued successfully!");
      setIsDialogOpen(false);
      setFormData({
        holderId: "",
        title: "",
        description: "",
        file: null,
        metadata: {
          institution: "",
          course: "",
          grade: "",
          completionDate: "",
        },
      });
    } catch (error) {
      toast.error("Failed to issue certificate");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Award className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Issuer Dashboard
                </h1>
                <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Certificates
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">{certificates.length}</div> */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Members
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {/* {new Set(certificates.map((cert) => cert.holder)).size} */}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {/* <div className="text-2xl font-bold">
                {
                  certificates.filter((cert) => {
                    const certDate = new Date(Number(cert.issuedAt) / 1000000);
                    const now = new Date();
                    return (
                      certDate.getMonth() === now.getMonth() &&
                      certDate.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </div> */}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Issued Certificates</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Issue Certificate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Issue New Certificate</DialogTitle>
                <DialogDescription>
                  Create and issue a new certificate to a holder
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="holderId">Holder ID (Principal)</Label>
                    <Input
                      id="holderId"
                      value={formData.holderId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          holderId: e.target.value,
                        }))
                      }
                      placeholder="Enter holder's principal ID"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Certificate Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="e.g., Bachelor of Computer Science"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Certificate description..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution</Label>
                    <Input
                      id="institution"
                      value={formData.metadata.institution}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            institution: e.target.value,
                          },
                        }))
                      }
                      placeholder="Institution name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      value={formData.metadata.course}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            course: e.target.value,
                          },
                        }))
                      }
                      placeholder="Course name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Input
                      id="grade"
                      value={formData.metadata.grade}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          metadata: { ...prev.metadata, grade: e.target.value },
                        }))
                      }
                      placeholder="e.g., A, 3.8 GPA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="completionDate">Completion Date</Label>
                    <Input
                      id="completionDate"
                      type="date"
                      value={formData.metadata.completionDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          metadata: {
                            ...prev.metadata,
                            completionDate: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Certificate File (PDF)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  {/* <Button type="submit" disabled={loading}>
                    {loading ? "Issuing..." : "Issue Certificate"}
                  </Button> */}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* {certificates.map((certificate) => (
            <Card key={certificate.id}>
              <CardHeader>
                <CardTitle className="text-lg">{certificate.title}</CardTitle>
                <CardDescription>
                  Issued to: {certificate.holder.slice(0, 10)}...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  {certificate.description}
                </p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    {new Date(
                      Number(certificate.issuedAt) / 1000000
                    ).toLocaleDateString()}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full ${
                      certificate.isValid
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {certificate.isValid ? "Valid" : "Invalid"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))} */}
        </div>
      </main>
    </div>
  );
};

export default IssuerDashboard;
