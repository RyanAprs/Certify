import type React from "react";
import { useState } from "react";
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
import { Checkbox } from "../components/ui/checkbox";
import { Shield, CheckCircle, XCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { useCertificate } from "@/contexts/Certification";

const VerifierDashboard: React.FC = () => {
  const { actor } = useAuth();
  const { verifyCertificate } = useCertificate();
  const [verificationData, setVerificationData] = useState({
    certificateId: "",
    zkProof: "",
  });
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    certificate: any;
    selectedFields: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const availableFields = [
    { id: "title", label: "Certificate Title" },
    { id: "description", label: "Description" },
    { id: "issuer", label: "Issuer" },
    { id: "holder", label: "Holder" },
    { id: "issuedAt", label: "Issue Date" },
    { id: "metadata", label: "Additional Metadata" },
  ];

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationData.certificateId || !verificationData.zkProof) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      // First verify the certificate
      const isValid = await verifyCertificate(
        verificationData.certificateId,
        verificationData.zkProof
      );

      if (isValid) {
        // Get certificate details
        const result = await actor.getCertificate(
          verificationData.certificateId
        );
        if ("ok" in result) {
          setVerificationResult({
            isValid: true,
            certificate: result.ok,
            selectedFields,
          });
          toast.success("Certificate verified successfully!");
        } else {
          toast.error("Certificate not found");
        }
      } else {
        setVerificationResult({
          isValid: false,
          certificate: null,
          selectedFields: [],
        });
        toast.error("Certificate verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const viewCertificateFile = (ipfsHash: string) => {
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    window.open(ipfsUrl, "_blank");
  };

  const renderFieldValue = (certificate: any, fieldId: string) => {
    switch (fieldId) {
      case "title":
        return certificate.title;
      case "description":
        return certificate.description;
      case "issuer":
        return `${certificate.issuer.slice(0, 10)}...`;
      case "holder":
        return `${certificate.holder.slice(0, 10)}...`;
      case "issuedAt":
        return new Date(
          Number(certificate.issuedAt) / 1000000
        ).toLocaleDateString();
      case "metadata":
        try {
          const metadata = JSON.parse(certificate.metadata);
          return (
            <div className="space-y-1">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="font-medium">{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          );
        } catch {
          return certificate.metadata;
        }
      default:
        return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Verification Form */}
          <Card>
            <CardHeader>
              <CardTitle>Verify Certificate</CardTitle>
              <CardDescription>
                Enter certificate details to verify authenticity using
                Zero-Knowledge Proofs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="certificateId">Certificate ID</Label>
                  <Input
                    id="certificateId"
                    value={verificationData.certificateId}
                    onChange={(e) =>
                      setVerificationData((prev) => ({
                        ...prev,
                        certificateId: e.target.value,
                      }))
                    }
                    placeholder="Enter certificate ID"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zkProof">ZK Proof Hash</Label>
                  <Input
                    id="zkProof"
                    value={verificationData.zkProof}
                    onChange={(e) =>
                      setVerificationData((prev) => ({
                        ...prev,
                        zkProof: e.target.value,
                      }))
                    }
                    placeholder="Enter ZK proof hash"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>
                    Select fields to display (Zero-Knowledge selective
                    disclosure)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={field.id}
                          checked={selectedFields.includes(field.id)}
                          onCheckedChange={() => handleFieldToggle(field.id)}
                        />
                        <Label htmlFor={field.id} className="text-sm">
                          {field.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Verify Certificate"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Verification Result */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Result</CardTitle>
              <CardDescription>
                Certificate verification status and selective data disclosure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!verificationResult ? (
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter certificate details to verify</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg ${
                      verificationResult.isValid
                        ? "bg-green-50 text-green-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {verificationResult.isValid ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    <span className="font-medium">
                      {verificationResult.isValid
                        ? "Certificate Valid"
                        : "Certificate Invalid"}
                    </span>
                  </div>

                  {verificationResult.isValid &&
                    verificationResult.certificate && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Certificate Details</h3>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              viewCertificateFile(
                                verificationResult.certificate.ipfsHash
                              )
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View File
                          </Button>
                        </div>

                        {verificationResult.selectedFields.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">
                            No fields selected for disclosure
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {verificationResult.selectedFields.map(
                              (fieldId) => {
                                const field = availableFields.find(
                                  (f) => f.id === fieldId
                                );
                                return (
                                  <div
                                    key={fieldId}
                                    className="border-l-4 border-blue-500 pl-3"
                                  >
                                    <div className="text-sm font-medium text-gray-700">
                                      {field?.label}
                                    </div>
                                    <div className="text-sm text-gray-900">
                                      {renderFieldValue(
                                        verificationResult.certificate,
                                        fieldId
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}

                        <div className="pt-3 border-t">
                          <div className="text-xs text-gray-500">
                            <div>
                              Certificate ID:{" "}
                              {verificationResult.certificate.id}
                            </div>
                            <div>Verified with Zero-Knowledge Proof</div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VerifierDashboard;
