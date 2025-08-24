import React, { useState } from "react";

import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Registration = () => {
  const { registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [registrationData, setRegistrationData] = useState({
    name: "",
    email: "",
    role: "" as "Issuer" | "Holder" | "Verifier" | "",
  });

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
            <SelectItem value="Holder">Holder (Certificate Owner)</SelectItem>
            <SelectItem value="Verifier">
              Verifier (Certificate Checker)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Registering..." : "Register"}
      </Button>
    </form>
  );
};

export default Registration;
