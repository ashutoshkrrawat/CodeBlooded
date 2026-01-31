import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {toast} from "sonner"

import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Info,
  ShieldCheck,
} from "lucide-react";

export default function RegisterNGO() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "",
    email: "",
    password: "",
    address: "",
    phone: "",
    website: "",
    about: "",
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
          import.meta.env.VITE_SERVER_URL + '/api/v1/ngo/register',
          {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(form),
          }
      );

      if (!res.ok) throw new Error("Registration failed");

      toast.success("NGO registered successfully!");
    } catch (err) {
      toast.error(err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-xl border border-[var(--border)] animate-[fadeUp_0.6s_ease-out]">

        {/* LEFT ILLUSTRATION (DESKTOP ONLY) */}
        <div className="hidden lg:block relative bg-[var(--accent-green-lighter)]">
          <img
            src="/images/ngo-illustration.png"
            alt="NGO Relief Illustration"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* RIGHT FORM */}
        <Card className="rounded-none border-0 p-8">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Register Your NGO
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Join the crisis intelligence network and coordinate relief faster
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">

            {/* NGO NAME */}
            <div>
              <Label>
                NGO Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  required
                  className="pl-9"
                  placeholder="Helping Hands Foundation"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
            </div>

            {/* NGO TYPE */}
            <div>
              <Label>
                NGO Type <span className="text-red-500">*</span>
              </Label>
              <Select
                required
                onValueChange={(v) => handleChange("type", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select NGO type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Disaster">Disaster</SelectItem>
                  <SelectItem value="Environment">Environment</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* EMAIL */}
            <div>
              <Label>
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  type="email"
                  required
                  className="pl-9"
                  placeholder="ngo@example.org"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <Label>
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  type="password"
                  required
                  minLength={6}
                  className="pl-9"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                />
              </div>
            </div>

            {/* ADDRESS */}
            <div>
              <Label>
                Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  required
                  className="pl-9"
                  placeholder="City, State, Country"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>
            </div>

            {/* PHONE */}
            <div>
              <Label>
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  required
                  className="pl-9"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>

            {/* WEBSITE */}
            <div>
              <Label>Website</Label>
              <div className="relative mt-1">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
                <Input
                  className="pl-9"
                  placeholder="https://ngo.org"
                  value={form.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                />
              </div>
            </div>

            {/* ABOUT */}
            <div>
              <Label>About NGO</Label>
              <div className="relative mt-1">
                <Info className="absolute left-3 top-3 h-4 w-4 text-[var(--muted-foreground)]" />
                <Textarea
                  className="pl-9"
                  rows={3}
                  placeholder="Brief description of your NGO's mission"
                  value={form.about}
                  onChange={(e) => handleChange("about", e.target.value)}
                />
              </div>
            </div>

            {/* SUBMIT */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            >
              {loading ? "Registering..." : "Register NGO"}
            </Button>
            <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
              Already have a account?{" "}
              <Link
                to="/login/ngo"
                className="text-[var(--primary)] hover:underline font-medium"
              >
                Login here
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
