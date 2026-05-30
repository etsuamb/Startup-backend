"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveRegistrationAccountInfo } from "@/lib/registerAccountStorage";
import { validateRegistrationEmail } from "@/lib/authApi";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function RegisterAccountInfo() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneTail: "",
  });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailChecking, setEmailChecking] = useState(false);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const cleanedValue =
      name === "firstName" || name === "lastName"
        ? value.replace(/[^A-Za-z ]/g, "")
        : value;
    setFormData({ ...formData, [name]: cleanedValue });
  };

  const togglePassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  async function validateEmailField() {
    const email = formData.email.trim();
    if (!email) {
      setEmailError("");
      return true;
    }
    setEmailChecking(true);
    setEmailError("");
    try {
      await validateRegistrationEmail(email);
      return true;
    } catch (ex) {
      setEmailError(ex.message || "Invalid email address");
      return false;
    } finally {
      setEmailChecking(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const emailOk = await validateEmailField();
    if (!emailOk) {
      setError("Please use a valid, real email address.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    const rawPhone = String(formData.phoneTail || "").replace(/\D/g, "");
    if (
      !(
        rawPhone.length === 9 ||
        (rawPhone.length === 12 && rawPhone.startsWith("251"))
      )
    ) {
      setError(
        "Enter a valid Ethiopian phone number in the format 9XX XXX XXX.",
      );
      return;
    }

    const phoneNumber = rawPhone.startsWith("251")
      ? `+${rawPhone}`
      : `+251${rawPhone}`;

    saveRegistrationAccountInfo({
      first_name: formData.firstName,
      last_name: formData.lastName,
      full_name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      phone_number: phoneNumber,
    });

    router.push("/register/role");
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] font-sans flex flex-col relative">
      {/* Header */}
      <header className="absolute top-0 w-full px-6 py-6 flex justify-between items-center z-10">
        <Link href="/">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-[#0a4d3c] text-lg tracking-tight">
              StartupConnect
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <button className="text-[12px] font-bold text-gray-500 hover:text-gray-800 transition hidden sm:block">
            Save as Draft
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e8fbf0] text-[#0a4d3c] rounded-md border border-[#c2eadd]">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              ></path>
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Secure Encryption
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center pt-24 pb-12 px-4">
        <div className="w-full max-w-[480px]">
          <div className="text-center mb-10">
            <h1 className="text-[28px] font-bold text-gray-900 mb-2 tracking-tight">
              Create your account
            </h1>
            <p className="text-[14px] text-gray-500">
              Enter your details to get started with StartupConnect Ethiopia
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
            <div className="mb-6">
              <GoogleSignInButton onError={setError} />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400 font-bold uppercase tracking-wider">
                  or
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-gray-900 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Abebe"
                    className="w-full px-4 py-3 bg-[#fafbfc] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4d3c] focus:border-transparent transition text-[14px] text-gray-800 placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-900 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Kebede"
                    className="w-full px-4 py-3 bg-[#fafbfc] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4d3c] focus:border-transparent transition text-[14px] text-gray-800 placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-900 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => {
                    handleChange(e);
                    if (emailError) setEmailError("");
                  }}
                  onBlur={validateEmailField}
                  required
                  placeholder="you@gmail.com"
                  className={`w-full px-4 py-3 bg-[#fafbfc] border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4d3c] focus:border-transparent transition text-[14px] text-gray-800 placeholder-gray-400 ${
                    emailError ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {emailChecking ? (
                  <p className="text-xs text-gray-500 mt-1">Checking email…</p>
                ) : null}
                {emailError ? (
                  <p className="text-xs text-red-600 mt-1 font-medium">{emailError}</p>
                ) : null}
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-900 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword.password ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    pattern="(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}"
                    title="Password must be at least 8 characters with 1 capital letter, 1 special character (!@#$%^&*), and 1 number"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 bg-[#fafbfc] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4d3c] focus:border-transparent transition text-[14px] text-gray-800 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword("password")}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-900"
                    aria-label={
                      showPassword.password ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword.password ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19.5c-5.523 0-10-4.477-10-10 0-1.269.237-2.482.665-3.61m4.92 1.31a4 4 0 015.496 5.496m1.135 1.135A3.978 3.978 0 0016 12c0-2.21-1.79-4-4-4a3.978 3.978 0 00-2.85 1.165M15 15l4.5 4.5M4.5 4.5L9 9"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm3.535 3.535A9 9 0 115.464 5.464M15 12l4.5 4.5M4.5 4.5L9 9"
                        ></path>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  8+ chars, 1 capital letter, 1 special character, 1 number
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-900 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    pattern="(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}"
                    title="Password must be at least 8 characters with 1 capital letter, 1 special character (!@#$%^&*), and 1 number"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 bg-[#fafbfc] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4d3c] focus:border-transparent transition text-[14px] text-gray-800 placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword("confirmPassword")}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-900"
                    aria-label={
                      showPassword.confirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showPassword.confirmPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13.875 18.825A10.05 10.05 0 0112 19.5c-5.523 0-10-4.477-10-10 0-1.269.237-2.482.665-3.61m4.92 1.31a4 4 0 015.496 5.496m1.135 1.135A3.978 3.978 0 0016 12c0-2.21-1.79-4-4-4a3.978 3.978 0 00-2.85 1.165M15 15l4.5 4.5M4.5 4.5L9 9"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm3.535 3.535A9 9 0 115.464 5.464M15 12l4.5 4.5M4.5 4.5L9 9"
                        ></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-900 mb-2">
                  Phone Number
                </label>
                <div className="flex gap-3">
                  <div className="w-20 px-4 py-3 bg-[#fafbfc] border border-gray-200 rounded-xl flex items-center justify-center text-[14px] text-gray-700">
                    +251
                  </div>
                  <input
                    type="tel"
                    name="phoneTail"
                    value={formData.phoneTail}
                    onChange={handleChange}
                    required
                    placeholder="9XX XXX XXX"
                    className="flex-1 px-4 py-3 bg-[#fafbfc] border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4d3c] focus:border-transparent transition text-[14px] text-gray-800 placeholder-gray-400"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-2">
                  Enter your phone number in Ethiopian format without the +251
                  prefix.
                </p>
              </div>

              {error ? <p className="text-sm text-red-500">{error}</p> : null}

              <button
                type="submit"
                className="w-full py-3.5 bg-[#0a4d3c] hover:bg-[#083b2e] text-white font-bold rounded-xl shadow-sm shadow-[#0a4d3c]/20 transition text-[14px] mt-2"
              >
                Continue
              </button>
            </form>
          </div>

          <p className="text-center text-[13px] text-gray-500 mt-8">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#0a4d3c] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-6 flex justify-center mt-auto">
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          <span className="font-bold text-gray-500 normal-case tracking-normal">
            StartupConnect Ethiopia
          </span>
          <Link href="#" className="hover:text-gray-800 transition">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-gray-800 transition">
            Terms of Service
          </Link>
          <Link href="#" className="hover:text-gray-800 transition">
            Contact Support
          </Link>
          <span>
            &copy; {new Date().getFullYear()} StartupConnect Ethiopia. All
            rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
