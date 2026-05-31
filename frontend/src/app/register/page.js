"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadRegistrationAccountInfo, saveRegistrationAccountInfo } from "@/lib/registerAccountStorage";
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
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false,
  });
  const [accountDraftReady, setAccountDraftReady] = useState(false);
  const [showDraftNotice, setShowDraftNotice] = useState(false);

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

  const [validatingEmail, setValidatingEmail] = useState(false);

  useEffect(() => {
    const saved = loadRegistrationAccountInfo();
    if (!saved) {
      setAccountDraftReady(true);
      return;
    }
    const phoneTail = String(saved.phone_number || "").replace(/^\+?251/, "");
    setFormData({
      firstName: saved.first_name || "",
      lastName: saved.last_name || "",
      email: saved.email || "",
      password: saved.password || "",
      confirmPassword: saved.confirm_password || "",
      phoneTail,
    });
    setAccountDraftReady(true);
  }, []);

  useEffect(() => {
    if (!accountDraftReady) return;
    saveRegistrationAccountInfo({
      first_name: formData.firstName,
      last_name: formData.lastName,
      full_name: `${formData.firstName} ${formData.lastName}`.trim(),
      email: formData.email,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      phone_number: formData.phoneTail ? `+251${String(formData.phoneTail).replace(/\D/g, "")}` : "",
    });
  }, [accountDraftReady, formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setValidatingEmail(true);
    try {
      const check = await validateRegistrationEmail(formData.email);
      if (!check?.valid) {
        setError(check?.message || "Enter a real email address you can access.");
        return;
      }
    } catch (ex) {
      setError(ex.message || "Could not validate email. Try again.");
      return;
    } finally {
      setValidatingEmail(false);
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
    <div className="min-h-screen bg-[#eaf2ee] font-sans flex flex-col relative text-[#0a4d3c]">
      {/* Header */}
      <header className="absolute top-0 w-full px-5 py-5 flex justify-between items-center z-10">
        <Link href="/">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-[#0a4d3c] text-base tracking-tight">
              StartupConnect
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              saveRegistrationAccountInfo({
                first_name: formData.firstName,
                last_name: formData.lastName,
                full_name: `${formData.firstName} ${formData.lastName}`.trim(),
                email: formData.email,
                password: formData.password,
                confirm_password: formData.confirmPassword,
                phone_number: formData.phoneTail ? `+251${String(formData.phoneTail).replace(/\D/g, "")}` : "",
              });
              setShowDraftNotice(true);
              setTimeout(() => setShowDraftNotice(false), 2000);
            }}
            className="text-[12px] font-bold text-[#52746b] hover:text-[#0a4d3c] transition hidden sm:block"
          >
            Save as Draft
          </button>
          {showDraftNotice && (
            <span className="text-[11px] font-bold text-[#0a4d3c]">✓ Draft saved</span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/45 text-[#0a4d3c] rounded-full border border-[#c5d9d2]">
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
      <main className="flex-grow flex items-center justify-center pt-28 pb-12 px-4">
        <div className="w-full max-w-[480px]">
          <div className="text-center mb-9">
            <h1 className="font-serif text-[44px] leading-tight text-[#0a4d3c] mb-3 tracking-tight">
              Register
            </h1>
            <p className="text-[14px] font-medium text-[#52746b]">
              Create new account
            </p>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                    className="w-full px-5 py-3.5 bg-[#c9dbd5] border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#438265]/35 focus:bg-[#d3e2dd] transition text-[14px] text-[#315f55] placeholder-[#52746b]"
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
                    className="w-full px-5 py-3.5 bg-[#c9dbd5] border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#438265]/35 focus:bg-[#d3e2dd] transition text-[14px] text-[#315f55] placeholder-[#52746b]"
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
                  onChange={handleChange}
                  required
                  placeholder="abebe@example.com"
                  className="w-full px-5 py-3.5 bg-[#c9dbd5] border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#438265]/35 focus:bg-[#d3e2dd] transition text-[14px] text-[#315f55] placeholder-[#52746b]"
                />
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
                    className="w-full px-5 py-3.5 pr-12 bg-[#c9dbd5] border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#438265]/35 focus:bg-[#d3e2dd] transition text-[14px] text-[#315f55] placeholder-[#52746b]"
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
                    className="w-full px-5 py-3.5 pr-12 bg-[#c9dbd5] border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#438265]/35 focus:bg-[#d3e2dd] transition text-[14px] text-[#315f55] placeholder-[#52746b]"
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
                  <div className="w-20 px-4 py-3.5 bg-[#c9dbd5] border border-transparent rounded-full flex items-center justify-center text-[14px] text-[#315f55]">
                    +251
                  </div>
                  <input
                    type="tel"
                    name="phoneTail"
                    value={formData.phoneTail}
                    onChange={handleChange}
                    required
                    placeholder="9XX XXX XXX"
                    className="flex-1 px-5 py-3.5 bg-[#c9dbd5] border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#438265]/35 focus:bg-[#d3e2dd] transition text-[14px] text-[#315f55] placeholder-[#52746b]"
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
                disabled={validatingEmail}
                className="w-full py-3.5 bg-[#438265] hover:bg-[#356e56] disabled:opacity-60 text-white font-bold rounded-full shadow-md shadow-[#438265]/20 transition text-[14px] mt-2"
              >
                {validatingEmail ? "Checking email…" : "Continue"}
              </button>
            </form>

            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#9dbbb1]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#eaf2ee] px-4 font-medium text-[#315f55]">
                  Or continue with
                </span>
              </div>
            </div>

            <GoogleSignInButton onError={setError} mode="register" />
          </div>

          <p className="text-center text-[13px] text-[#52746b] mt-8">
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
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-[11px] font-medium text-[#78978e] uppercase tracking-wider">
          <span className="font-bold text-[#52746b] normal-case tracking-normal">
            StartupConnect Ethiopia
          </span>
          <Link href="/privacy-policy" className="hover:text-gray-800 transition">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="hover:text-gray-800 transition">
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
