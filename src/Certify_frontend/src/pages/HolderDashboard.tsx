import type React from "react";
import { useState, useEffect } from "react";
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
import {
  Plus,
  FileText,
  Users,
  User,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCertificate } from "@/contexts/Certification";
import { Principal } from "@dfinity/principal";
import { useAuth } from "@/contexts/AuthContext";

interface Certificate {
  id: string;
  issuer: string;
  holder: string;
  title: string;
  description: string;
  ipfsHash: string;
  zkProof: string;
  metadata: string;
  issuedAt: bigint;
  isValid: boolean;
}

const IssuerDashboard: React.FC = () => {
  const { loading, issueCertificate } = useCertificate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { actor, user } = useAuth();
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
  const [id, setId] = useState<string>("");
  const [totalUser, setTotalUser] = useState(0);
  const [totalCertificate, setTotalCertificate] = useState(0);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const getAllCertificates = async () => {
    try {
      const res = await actor.getAllCertificates();
      console.log("sertif:", res);

      if (Array.isArray(res)) {
        setCertificates(res);
      } else if (res === null || res === undefined) {
        setCertificates([]);
      } else {
        console.warn("getAllCertificates did not return an array:", res);
        setCertificates([]);
      }
    } catch (err) {
      console.error("Error getAllCertificates:", err);
      setCertificates([]);
    }
  };

  const getCountCertificates = async () => {
    if (!id) return;
    try {
      const principalId = Principal.fromText(id);
      const res = await actor.getCertificateCountByIssuerId(principalId);
      setTotalCertificate(Number(res) || 0);
    } catch (err) {
      console.error("Error getCountCertificates:", err);
      setTotalCertificate(0);
    }
  };

  const getCountUser = async () => {
    if (!id) return;
    try {
      const principalId = Principal.fromText(id);
      const res = await actor.getMemberCountByIssuerId(principalId);
      setTotalUser(Number(res) || 0);
    } catch (err) {
      console.error("Error getCountUser:", err);
      setTotalUser(0);
    }
  };

  useEffect(() => {
    if (user?.id) {
      const userId = typeof user.id === "string" ? user.id : user.id.toString();
      setId(userId);
    }
  }, [user]);

  useEffect(() => {
    if (!id) return;
    getAllCertificates();
    getCountCertificates();
    getCountUser();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.holderId || !formData.title) {
      toast.error("Please fill all required fields");
      return;
    }

    let holderPrincipal: Principal;
    try {
      holderPrincipal = Principal.fromText(formData.holderId);
    } catch (err) {
      toast.error("Invalid holder Principal ID");
      return;
    }

    try {
      await issueCertificate({
        ...formData,
        holderId: holderPrincipal,
      });
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
      // Refresh certificates list
      getAllCertificates();
      getCountCertificates();
    } catch (error) {
      console.error(error);
      toast.error("Failed to issue certificate");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  const handleCopyUserId = async () => {
    if (!user?.id) return;

    try {
      const userIdString =
        typeof user.id === "string" ? user.id : user.id.toString();
      await navigator.clipboard.writeText(userIdString);
      setIsCopied(true);
      toast.success("User ID copied to clipboard!");

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      toast.error("Failed to copy User ID");
    }
  };

  const openCertificateImage = (ipfsHash: string) => {
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    window.open(imageUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Section */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Issuer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">User ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {user?.id
                        ? typeof user.id === "string"
                          ? user.id
                          : user.id.toString()
                        : "Not logged in"}
                    </span>
                    {user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyUserId}
                        className="h-8 w-8 p-0"
                        title="Copy User ID"
                      >
                        {isCopied ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {user?.name && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{user.name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Certificates
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCertificate}</div>
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
              <div className="text-2xl font-bold">{totalUser}</div>
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
                  <Button type="submit" disabled={loading}>
                    {loading ? "Issuing..." : "Issue Certificate"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Certificates Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates && certificates.length > 0 ? (
            certificates.map((certificate) => (
              <Card key={certificate.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">{certificate.title}</CardTitle>
                  <CardDescription>
                    Issued to: {certificate.holder.slice(0, 10)}...
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {certificate.ipfsHash && (
                    <div className="relative">
                      <img
                        src={`https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`}
                        alt={certificate.title}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() =>
                          openCertificateImage(certificate.ipfsHash)
                        }
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                      <div className=" w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <FileText className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Image not available</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 opacity-80 hover:opacity-100"
                        onClick={() =>
                          openCertificateImage(certificate.ipfsHash)
                        }
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <p className="text-sm text-gray-600">
                    {certificate.description}
                  </p>

                  {certificate.metadata && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>
                        <strong>Metadata:</strong> {certificate.metadata}
                      </p>
                    </div>
                  )}

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
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No certificates yet
                  </h3>
                  <p className="text-gray-500 text-center mb-4">
                    You haven't issued any certificates yet. Click the "Issue
                    Certificate" button to get started.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default IssuerDashboard;
