import Image from "next/image";
import Link from "next/link";
import FeaturedStartups from "@/components/FeaturedStartups";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">

      <header className="border-b border-gray-100 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo */}
            <div className="flex items-center gap-2 group cursor-pointer">
              <img
                src="/logo.png"
                alt="StartupConnect Logo"
                className="w-10 h-10 object-contain"
              />
              <div className="flex flex-col -gap-1">
                <span className="font-bold text-xl text-gray-900 tracking-tight leading-tight">
                  StartupConnect
                </span>
                <span className="text-sm text-primary tracking-wide leading-tight">
                  Ethiopia
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              href="/"
              className="text-secondary hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-gray-500 hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="/startups"
              className="text-gray-500 hover:text-primary transition-colors"
            >
              Browse Startups
            </Link>
            <Link
              href="/contact"
              className="text-gray-500 hover:text-primary transition-colors"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-700 hover:text-primary transition-colors px-4 py-2 border border-primary text-primary rounded-md"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-white bg-primary hover:bg-[#115b4c] transition-colors px-4 py-2 rounded-md shadow-sm"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-32 pb-28 px-4 sm:px-6 lg:px-8 min-h-[600px] flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/landing-bg.png"
              alt="StartupConnect Background"
              fill
              className="object-cover object-center"
              priority
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gray-900/75"></div>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight drop-shadow-sm">
              Connecting Ethiopian Startups with{" "}
              <br className="hidden md:block" /> Investors and Mentors
            </h1>
            <p className="text-xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed">
              A digital platform that helps startups gain visibility, secure{" "}
              <br className="hidden md:block" /> funding, and receive structured
              mentorship.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-10 py-3.5 flex items-center justify-center bg-primary text-white font-bold rounded-md hover:bg-[#115b4c] transition shadow-md text-lg"
              >
                Join Us
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-16">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-green-50 text-primary rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Create your profile
                </h3>
                <p className="text-gray-600">
                  Set up your startup, investor, or mentor profile in minutes.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-green-50 text-primary rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Connect with partners
                </h3>
                <p className="text-gray-600">
                  Find the right investors and mentors using smart matching
                  algorithms.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-green-50 text-primary rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Grow your startup
                </h3>
                <p className="text-gray-600">
                  Secure funding, get expert advice, and scale your business.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits By Role Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Benefits by Role
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {/* Startups */}
            <div className="flex flex-col gap-4">
              <h3 className="text-2xl font-semibold text-primary mb-2">
                For Startups
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-700">
                  <CheckIcon /> Showcase your startup to active local investors
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <CheckIcon /> Find mentors based on your operational stage
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <CheckIcon /> Gain visibility through Startup profiles
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <CheckIcon /> Form relationships with top experts
                </li>
              </ul>
            </div>
            {/* Investors */}
            <div className="flex flex-col gap-4 border-t md:border-t-0 md:border-l border-gray-200 pt-8 md:pt-0 md:pl-10">
              <h3 className="text-2xl font-semibold text-primary mb-2">
                For Investors
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-700">
                  <CheckIcon /> Discover verified Ethiopian startups
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <CheckIcon /> Filter by industry, funding needed and size
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <CheckIcon /> Manage your deal flow completely
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <CheckIcon /> Co-invest with other investors
                </li>
              </ul>
            </div>
            {/* Mentors */}
            <div className="flex flex-col gap-4 border-t md:border-t-0 md:border-l border-gray-200 pt-8 md:pt-0 md:pl-10">
              <h3 className="text-2xl font-semibold text-primary mb-2">
                For Mentors
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-700">
                  <CheckIcon /> Give back to the ecosystem
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <CheckIcon /> Share your expertise and experience
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <CheckIcon /> Track startup progress
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <CheckIcon /> Build your mentorship portfolio
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Featured Startups */}
        <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
          <FeaturedStartups />
        </section>

        {/* Call to Action Banner */}
        <section className="py-20 bg-[#167b66] text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">
              Be part of Ethiopia&apos;s growing startup ecosystem
            </h2>
            <p className="text-green-50 mb-10 text-lg opacity-90">
              Join thousands of startups, investors, and mentors building the
              future.
            </p>
            <Link
              href="/register"
              className="inline-flex px-8 py-3 bg-white text-primary font-bold rounded-md hover:bg-gray-100 transition shadow-lg"
            >
              Create your account
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-gray-700">
          <div className="col-span-1">
            <h3 className="text-white text-xl font-bold mb-4">
              StartupConnect Ethiopia
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Connecting innovators with investors and mentors across Ethiopia.
            </p>
            <div className="flex gap-4">
              {/* Social icons */}
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 cursor-pointer transition">
                <span className="text-xs">FB</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 cursor-pointer transition">
                <span className="text-xs">TW</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 cursor-pointer transition">
                <span className="text-xs">IN</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="/startups" className="hover:text-white transition">
                  Browse Startups
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">For Users</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/register"
                  className="hover:text-white transition"
                >
                  Join as Startup
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-white transition"
                >
                  Join as Investor
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-white transition"
                >
                  Join as Mentor
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blog" className="hover:text-white transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-white transition"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="hover:text-white transition"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} StartupConnect Ethiopia. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Simple check icon component
function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
