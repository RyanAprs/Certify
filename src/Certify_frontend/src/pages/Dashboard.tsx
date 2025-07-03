import type React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Award, GraduationCap, Shield, Users } from "lucide-react";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role) {
      switch (user.role) {
        case "Issuer":
          navigate("/issuer");
          break;
        case "Holder":
          navigate("/holder");
          break;
        case "Verifier":
          navigate("/verifier");
          break;
      }
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Certificate Verification System
                </h1>
                <p className="text-sm text-gray-500">Welcome, {user.name}</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Role
          </h2>
          <p className="text-lg text-gray-600">
            Select the appropriate dashboard based on your role in the
            certificate verification system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/issuer")}
          >
            <CardHeader className="text-center">
              <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Issuer Dashboard</CardTitle>
              <CardDescription>
                Create and issue certificates to holders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Issue new certificates</li>
                <li>• Manage certificate holders</li>
                <li>• Track issued certificates</li>
                <li>• Upload to IPFS</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/holder")}
          >
            <CardHeader className="text-center">
              <GraduationCap className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Holder Dashboard</CardTitle>
              <CardDescription>
                View and share your certificates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• View your certificates</li>
                <li>• Join certificate issuers</li>
                <li>• Share certificates securely</li>
                <li>• Download certificate files</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate("/verifier")}
          >
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Verifier Dashboard</CardTitle>
              <CardDescription>Verify certificate authenticity</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Verify certificates with ZKP</li>
                <li>• Selective data disclosure</li>
                <li>• Blockchain verification</li>
                <li>• Anti-forgery protection</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-4">System Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium">Zero-Knowledge Proofs</h4>
              <p className="text-sm text-gray-600">
                Privacy-preserving verification
              </p>
            </div>
            <div className="text-center">
              <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium">Blockchain Security</h4>
              <p className="text-sm text-gray-600">
                Immutable certificate records
              </p>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium">IPFS Storage</h4>
              <p className="text-sm text-gray-600">
                Decentralized file storage
              </p>
            </div>
            <div className="text-center">
              <GraduationCap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h4 className="font-medium">Internet Identity</h4>
              <p className="text-sm text-gray-600">Secure authentication</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
