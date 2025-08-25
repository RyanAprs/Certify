import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Plus, FileText, User, Copy, Check, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
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

const HolderDashboard: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const { actor, user } = useAuth();
  const [issuerId, setIssuerId] = useState<string>("");
  const [id, setId] = useState<string>("");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [memberId, setMemberId] = useState<string>("");
  const [memberName, setMemberName] = useState<string>("");

  const getCertificatesByHolderId = async () => {
    setCertificatesLoading(true);
    setLoadingPage(true);
    try {
      const principalId = Principal.fromText(id);
      const res = await actor.getCertificatesByHolderId(principalId);
      setCertificates(res.ok);
      console.log("sertif:", res);
    } catch (err) {
      console.error("Error getAllCertificates:", err);
      setCertificates([]);
    } finally {
      setCertificatesLoading(false);
      setLoadingPage(false);
    }
  };

  const checkMember = async () => {
    setLoadingPage(true);
    try {
      const principalId = Principal.fromText(id);
      const res = await actor.checkMembershipByHolderId(principalId);
      console.log(res);

      const issuerId = res.issuerIds.toString();
      setMemberId(issuerId);

      if (res.isMember) {
        setIsMember(true);
      } else {
        setIsMember(false);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingPage(false);
    }
  };

  const getMemberDetail = async () => {
    setLoadingPage(true);
    try {
      const principalId = Principal.fromText(memberId);
      const res = await actor.getUserById(principalId);
      setMemberName(res.ok.name);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingPage(false);
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
    checkMember();
    getCertificatesByHolderId();
    getMemberDetail();
  }, [id, memberId]);

  const handleJoinMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const issuerPrincipal = Principal.fromText(issuerId);

      await actor.joinIssuer(issuerPrincipal);
      toast.success("Joined successfully!");
      setIsDialogOpen(false);
      setIssuerId("");
      checkMember();
      getCertificatesByHolderId();
    } catch (error) {
      console.error(error);
      toast.error("Failed to join issuer");
    } finally {
      setLoading(false);
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
      console.log(err);
      toast.error("Failed to copy User ID");
    }
  };

  const openCertificateImage = (ipfsHash: string) => {
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    window.open(imageUrl, "_blank");
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      console.log(err);
      toast.error(`Failed to copy ${label}`);
    }
  };

  if (loadingPage) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Section */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Holder Information
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
                <div className="flex items-center justify-between">
                  <span className="font-medium">Member:</span>
                  <span>{memberName}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Owned Certificates</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              {isMember ? null : (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Join Issuer
                </Button>
              )}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Join Issuer's Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleJoinMember} className="space-y-4">
                <div className="flex w-full">
                  <div className="flex gap-4 flex-col w-full">
                    <Label htmlFor="issuerId">Issuer ID (Principal)</Label>
                    <Input
                      id="issuerId"
                      value={issuerId}
                      onChange={(e) => setIssuerId(e.target.value)}
                      placeholder="Enter issuer's principal ID"
                      required
                    />
                  </div>
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
                    {loading ? "loading..." : "Join"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Certificates Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificatesLoading ? (
            // Loading state
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500">Loading certificates...</p>
                </CardContent>
              </Card>
            </div>
          ) : certificates &&
            Array.isArray(certificates) &&
            certificates.length > 0 ? (
            certificates.map((certificate) => (
              <Card
                key={certificate.id}
                className="overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {certificate.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Certificate Image */}
                  {certificate.ipfsHash && (
                    <div className="relative group">
                      <img
                        src={`https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`}
                        alt={certificate.title}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity duration-200 border border-gray-200"
                        onClick={() =>
                          openCertificateImage(certificate.ipfsHash)
                        }
                        onError={(e) => {
                          // Handle image load error
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 hover:bg-white border shadow-sm"
                        onClick={() =>
                          openCertificateImage(certificate.ipfsHash)
                        }
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Description */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {certificate.description || "No description provided"}
                    </p>
                  </div>

                  {/* Certificate Details */}
                  <div className="space-y-3 border-t pt-3">
                    {/* Certificate ID */}
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-800 mb-1">
                          Certificate ID
                        </p>
                        <p className="text-xs text-blue-600 font-mono truncate">
                          {certificate.id}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2 h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                        onClick={() =>
                          copyToClipboard(certificate.id, "Certificate ID")
                        }
                        title="Copy Certificate ID"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* ZK Proof */}
                    {certificate.zkProof && (
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-green-800 mb-1">
                            ZK Proof
                          </p>
                          <p className="text-xs text-green-600 font-mono truncate">
                            {certificate.zkProof}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-2 h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                          onClick={() =>
                            copyToClipboard(certificate.zkProof, "ZK Proof")
                          }
                          title="Copy ZK Proof"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Metadata */}
                    {certificate.metadata && (
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-800 mb-1">
                          Metadata
                        </p>
                        <p className="text-xs text-gray-600 break-words">
                          {certificate.metadata}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer with date and status */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Issued: </span>
                      {new Date(
                        Number(certificate.issuedAt) / 1000000
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        certificate.isValid
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {certificate.isValid ? "✓ Valid" : "✗ Invalid"}
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
                    You haven't owned any certificates yet.
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

export default HolderDashboard;
