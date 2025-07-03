import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Shield } from "lucide-react";
import toast from "react-hot-toast";

const Login: React.FC = () => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: "",
    email: "",
    role: "" as "Issuer" | "Holder" | "Verifier" | "",
  });
  const { login, registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await login();
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      toast.error("Login failed");
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !registrationData.name ||
      !registrationData.email ||
      !registrationData.role
    ) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await registerUser(
        registrationData.name,
        registrationData.email,
        registrationData.role
      );
      toast.success("Registration successful!");
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      toast.error("Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Certificate Verification System
          </CardTitle>
          <CardDescription>
            Secure blockchain-based certificate verification with Zero-Knowledge
            Proofs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showRegistration ? (
            <>
              <Button
                onClick={handleLogin}
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Connecting..." : "Login with Internet Identity"}
              </Button>
              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => setShowRegistration(true)}
                  className="text-sm"
                >
                  New user? Register here
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleRegistration} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={registrationData.name}
                  onChange={(e) =>
                    setRegistrationData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={registrationData.email}
                  onChange={(e) =>
                    setRegistrationData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  onValueChange={(value) =>
                    setRegistrationData((prev) => ({
                      ...prev,
                      role: value as any,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Issuer">
                      Issuer (Certificate Publisher)
                    </SelectItem>
                    <SelectItem value="Holder">
                      Holder (Certificate Owner)
                    </SelectItem>
                    <SelectItem value="Verifier">
                      Verifier (Certificate Checker)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registering..." : "Register & Login"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRegistration(false)}
                className="w-full"
              >
                Back to Login
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
