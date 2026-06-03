import Link from "next/link";
import TeamMemberPhoto from "@/components/public/TeamMemberPhoto";

const TEAM_MEMBERS = [
  {
    name: "Blien Moges",
    role: "Full Stack Developer",
    initials: "BM",
    image: "/team/blien-moges.jpg.jpg",
  },
  {
    name: "Eyerusalem Rufael",
    role: "UI/UX Designer and Team Organizer",
    initials: "ER",
    image: "/team/eyerusalem-rufael.jpg.jpg",
  },
  {
    name: "Eyerusalem Kidane",
    role: "Frontend Developer",
    initials: "EK",
    image: "/team/eyerusalem-kidane.jpg.jpg",
  },
  {
    name: "Rahel Belay",
    role: "Backend Developer",
    initials: "RB",
    image: "/team/rahel-belay.jpg.jpg",
  },
  {
    name: "Etsub Grima",
    role: "Full Stack Developer",
    initials: "EG",
    image: "/team/etsub-grima.jpg.jpg",
  },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group cursor-pointer"
            >
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
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              href="/"
              className="text-gray-500 hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link href="/about" className="text-primary transition-colors">
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
              className="text-sm font-medium text-white bg-primary hover:bg-primary-dark transition-colors px-4 py-2 rounded-md shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
            Empowering Ethiopia&apos;s Startup <br className="hidden md:block" />{" "}
            Ecosystem
          </h1>
          <p className="text-lg text-gray-600 mb-10 mx-auto leading-relaxed">
            StartupConnect Ethiopia is a digital platform that brings together
            startups, investors, <br className="hidden md:block" /> and mentors
            in one trusted environment.
          </p>
        </section>

        {/* The Challenge Section */}
        <section className="py-20 bg-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center border-t border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            The Challenge
          </h2>
          <div className="text-gray-600 space-y-6 text-lg leading-relaxed max-w-3xl mx-auto">
            <p>
              Many Ethiopian startups struggle to move beyond the idea or
              prototype stage because they lack access to funding, mentorship,
              and visibility. Investors also face difficulty finding credible,
              verified startups.
            </p>
            <p>
              There is no centralized digital platform that connects all
              stakeholders in the ecosystem, making collaboration difficult and
              slowing down innovation.
            </p>
          </div>
        </section>

        {/* Our Solution Section */}
        <section className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8 bg-[#fdfdfd]">
          <div className="max-w-6xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Solution
            </h2>
            <p className="text-lg text-gray-600">
              StartupConnect Ethiopia provides a centralized platform where:
            </p>

            <div className="grid md:grid-cols-4 gap-6 mt-12 text-left">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <div className="text-primary mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Startup Showcase</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Startups can showcase their ideas and upload pitch materials.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <div className="text-primary mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Investor Discovery</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Investors can discover verified startups with potential.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <div className="text-primary mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  Structured Mentorship
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Mentors can guide founders through structured programs.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                <div className="text-primary mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">Communication</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  All users can communicate through chat and meetings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission and Vision */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 shadow-md">
              <div className="text-orange-400 mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To empower Ethiopian startups by providing access to funding,
                mentorship, and visibility through a trusted digital platform.
              </p>
            </div>
            <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 shadow-md">
              <div className="text-orange-400 mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To become the leading digital hub for startup innovation and
                investment across Ethiopia.
              </p>
            </div>
          </div>
        </section>

        {/* What We Stand For */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-gray-100">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            What We Stand For
          </h2>
          <div className="grid md:grid-cols-4 gap-6 text-left">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col text-left">
              <div className="text-primary mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Trust and Verification</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Verified profiles for startups, investors, and mentors.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col text-left">
              <div className="text-primary mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Collaboration</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Encouraging meaningful connections and partnerships.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col text-left">
              <div className="text-primary mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Local Focus</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Built specifically for Ethiopia&apos;s startup ecosystem.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col text-left">
              <div className="text-primary mb-4">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Accessibility</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Available via web and mobile, with local payment integration.
              </p>
            </div>
          </div>
        </section>

        {/* Our Team */}
        <section className="border-t border-gray-100 bg-[#f6faf8] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-[#167b66]">The people behind the platform</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Our Team</h2>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                A focused team bringing product design, frontend, backend, and full-stack development together.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {TEAM_MEMBERS.map((member) => (
                <article
                  key={member.name}
                  className="flex flex-col items-center rounded-lg border border-[#dbe9e4] bg-white px-5 pt-7 text-center shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <TeamMemberPhoto src={member.image} name={member.name} initials={member.initials} />
                  <div className="min-h-28 w-full px-1 py-5">
                    <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                    <p className="mt-1 text-sm font-medium leading-5 text-[#167b66]">{member.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="py-20 bg-[#167b66] text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">
              Join the platform and be part of Ethiopia&apos;s innovation future.
            </h2>
            <Link
              href="/register"
              className="px-8 py-3 mt-4 inline-block bg-white text-[#167b66] font-bold rounded-md hover:bg-gray-100 transition shadow-lg"
            >
              Create an Account
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-gray-800">
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
                <Link href="/register" className="hover:text-white transition">
                  Join as Startup
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">
                  Join as Investor
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">
                  Join as Mentor
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition">
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
