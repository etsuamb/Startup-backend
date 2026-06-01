import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'startup_dashboard_page.dart';
import 'investor_dashboard_page.dart';
import 'mentor_dashboard_page.dart';
import 'register_page.dart';
import '../widgets/google_sign_in_button.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  bool rememberMe = false;
  bool obscurePassword = true;
  bool loading = false;
  String? error;

  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  Future<void> _login() async {
    if (emailController.text.trim().isEmpty || passwordController.text.isEmpty) {
      setState(() => error = "Please enter your email and password");
      return;
    }
    setState(() { loading = true; error = null; });
    final result = await AuthService.login(
      emailController.text.trim(),
      passwordController.text,
    );
    if (result['error'] != null) {
      setState(() { error = result['error']; loading = false; });
      return;
    }
    final user = result['user'];
    String role = user['role'] ?? 'startup';
    Widget page;
    switch (role) {
      case 'investor':
        page = const InvestorDashboardPage();
        break;
      case 'mentor':
        page = const MentorDashboardPage();
        break;
      default:
        page = const StartupDashboardPage();
    }
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => page));
  }

  void _onGoogleSuccess(Map<String, dynamic> result) {
    if (result['needsRoleSelection'] == true) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const StartupDashboardPage()));
      return;
    }
    if (result['token'] != null) {
      _navigateToDashboard();
    }
  }

  Future<void> _navigateToDashboard() async {
    final me = await AuthService.getMe();
    if (!mounted) return;
    final user = me['user'] ?? me;
    final role = user['role'] ?? 'startup';
    Widget page;
    switch (role) {
      case 'investor':
        page = const InvestorDashboardPage();
        break;
      case 'mentor':
        page = const MentorDashboardPage();
        break;
      default:
        page = const StartupDashboardPage();
    }
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isMobile = size.width < 700;
    return Scaffold(
      backgroundColor: const Color(0xffF5F7FA),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: isMobile ? 16 : 40, vertical: 20),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 700),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Image.asset("images/logo.png", width: 44, height: 44, fit: BoxFit.contain),
                    const SizedBox(width: 10),
                    Flexible(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("StartupConnect Ethiopia", overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xff0D3B36))),
                        Text("FOUNDER PORTAL", overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 10, letterSpacing: 1.5, fontWeight: FontWeight.w600, color: Color(0xff98A2B3))),
                      ],
                    )),
                  ]),
                  SizedBox(height: isMobile ? 32 : 56),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text("Startup Login", style: TextStyle(fontSize: isMobile ? 32 : 46, fontWeight: FontWeight.bold, color: const Color(0xff0D1B2A))),
                  ),
                  SizedBox(height: isMobile ? 12 : 16),
                  Text("Access your dashboard to manage your project, connect with investors, and track your progress.",
                    style: TextStyle(fontSize: isMobile ? 15 : 20, height: 1.5, color: const Color(0xff475467))),
                  SizedBox(height: isMobile ? 28 : 40),
                  Container(
                    padding: EdgeInsets.all(isMobile ? 20 : 34),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      if (error != null) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12)),
                          child: Text(error!, style: TextStyle(color: Colors.red.shade800, fontSize: 14)),
                        ),
                        const SizedBox(height: 14),
                      ],
                      const Text("Email or Phone Number", style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xff101828), fontSize: 14)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: emailController,
                        decoration: InputDecoration(
                          hintText: "investor@institution.com",
                          hintStyle: const TextStyle(color: Color(0xff98A2B3), fontSize: 15),
                          prefixIcon: const Icon(Icons.mail_outline, color: Color(0xff98A2B3), size: 20),
                          filled: true, fillColor: const Color(0xffF9FAFB),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                          contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                        ),
                      ),
                      SizedBox(height: isMobile ? 22 : 26),
                      const Text("Password", style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xff101828), fontSize: 14)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: passwordController,
                        obscureText: obscurePassword,
                        decoration: InputDecoration(
                          hintText: "••••••••",
                          hintStyle: const TextStyle(color: Color(0xff98A2B3), fontSize: 15),
                          prefixIcon: const Icon(Icons.lock_outline, color: Color(0xff98A2B3), size: 20),
                          suffixIcon: IconButton(
                            onPressed: () => setState(() => obscurePassword = !obscurePassword),
                            icon: Icon(obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: const Color(0xff98A2B3), size: 20),
                          ),
                          filled: true, fillColor: const Color(0xffF9FAFB),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                          contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          SizedBox(
                            height: 24, width: 24,
                            child: Checkbox(
                              value: rememberMe,
                              activeColor: const Color(0xff0B7A5B),
                              onChanged: (value) => setState(() => rememberMe = value ?? false),
                              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text("Remember me", style: TextStyle(color: Color(0xff344054), fontWeight: FontWeight.w600, fontSize: 14)),
                          const Spacer(),
                          TextButton(
                            onPressed: (){},
                            child: const Text("Forgot password?", style: TextStyle(color: Color(0xff0B7A5B), fontWeight: FontWeight.bold, fontSize: 14)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity, height: 56,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xff0B7A5B),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            elevation: 4, shadowColor: Colors.black26,
                          ),
                          onPressed: loading ? null : _login,
                          child: loading
                              ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text("Log In", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                                    SizedBox(width: 8),
                                    Icon(Icons.login, color: Colors.white, size: 20),
                                  ],
                                ),
                        ),
                      ),
                      const SizedBox(height: 28),
                      Row(children: [
                        const Expanded(child: Divider(color: Color(0xffE0E3E8))),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text("or", style: TextStyle(color: const Color(0xff9AA3B2), fontWeight: FontWeight.w600, fontSize: 15)),
                        ),
                        const Expanded(child: Divider(color: Color(0xffE0E3E8))),
                      ]),
                      const SizedBox(height: 28),
                      GoogleSignInButton(
                        mode: 'login',
                        onSuccess: _onGoogleSuccess,
                      ),
                      const SizedBox(height: 24),
                      Center(
                        child: Wrap(alignment: WrapAlignment.center, children: [
                          const Text("Don't have an account? ", style: TextStyle(color: Color(0xff667085), fontSize: 15)),
                          GestureDetector(
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterPage())),
                            child: const Text("Register", style: TextStyle(color: Color(0xff0B7A5B), fontWeight: FontWeight.bold, fontSize: 15)),
                          ),
                        ]),
                      ),
                    ]),
                  ),
                  SizedBox(height: isMobile ? 28 : 36),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      buildBadge(Icons.verified_user_outlined, "SECURE LOGIN"),
                      const SizedBox(width: 8),
                      buildBadge(Icons.account_balance_outlined, "VERIFIED INVESTOR PLATFORM"),
                      const SizedBox(width: 8),
                      buildBadge(Icons.security_outlined, "ADMIN-APPROVED ACCESS"),
                    ]),
                  ),
                  const SizedBox(height: 22),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: const Color(0xffF8FAFC), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xffEAECF0))),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Icon(Icons.info_outline, color: Color(0xff0D3B36), size: 18),
                      SizedBox(width: 10),
                      Expanded(child: Text("Only verified and approved users can access the dashboard. Applications are reviewed within 48 hours.",
                        style: TextStyle(fontSize: isMobile ? 13 : 15, height: 1.5, color: const Color(0xff475467)))),
                    ]),
                  ),
                  SizedBox(height: isMobile ? 28 : 36),
                  Wrap(
                    alignment: WrapAlignment.center, spacing: 16, runSpacing: 8,
                    children: [
                      Text("© 2026 STARTUPCONNECT ETHIOPIA", style: const TextStyle(fontSize: 10, letterSpacing: 1.2, color: Color(0xff98A2B3), fontWeight: FontWeight.w600)),
                      GestureDetector(onTap: (){}, child: const Text("PRIVACY POLICY", style: TextStyle(fontSize: 10, letterSpacing: 1.2, color: Color(0xff667085), fontWeight: FontWeight.w600))),
                      GestureDetector(onTap: (){}, child: const Text("TERMS OF SERVICE", style: TextStyle(fontSize: 10, letterSpacing: 1.2, color: Color(0xff667085), fontWeight: FontWeight.w600))),
                    ],
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget buildBadge(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(color: const Color(0xffE8F5EE), borderRadius: BorderRadius.circular(30), border: Border.all(color: const Color(0xffB7E4CF))),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 14, color: const Color(0xff0B7A5B)),
        const SizedBox(width: 6),
        Text(text, style: const TextStyle(color: Color(0xff0B7A5B), fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 0.8)),
      ]),
    );
  }
}
