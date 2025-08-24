import type React from "react";
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

import { Shield } from "lucide-react";
import toast from "react-hot-toast";

const Login: React.FC = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const userExists = await login();

      if (userExists) {
        // User exists, navigate to dashboard
        navigate("/dashboard");
        toast.success("Welcome back!");
      } else {
        // User doesn't exist, navigate to register
        navigate("/register");
        toast.success("Please complete your registration");
      }
    } catch (error) {
      console.log(error);
      toast.error("Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Certify</CardTitle>
          <CardDescription>
            Secure blockchain-based certificate verification with Zero-Knowledge
            Proofs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <>
            <Button
              onClick={handleLogin}
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? "Connecting..." : "Login with Internet Identity"}
            </Button>
          </>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
