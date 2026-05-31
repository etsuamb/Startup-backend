import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_service.dart';
import 'role_selection_page.dart';
import 'login_page.dart';
import '../widgets/google_sign_in_button.dart';
import 'startup_dashboard_page.dart';
import 'investor_dashboard_page.dart';
import 'mentor_dashboard_page.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final firstNameController = TextEditingController();
  final lastNameController = TextEditingController();
  final emailController = TextEditingController();
  final phoneController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  String? error;
  bool validatingEmail = false;
  bool emailValid = false;
  bool hasTriedContinue = false;
  bool draftSaved = false;

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  Future<void> _loadDraft() async {
    final prefs = await SharedPreferences.getInstance();
    final draft = prefs.getString('register_draft');
    if (draft != null && draft.isNotEmpty) {
      final parts = draft.split('\x00');
      if (parts.length >= 5) {
        firstNameController.text = parts[0];
        lastNameController.text = parts[1];
        emailController.text = parts[2];
        phoneController.text = parts[3];
        passwordController.text = parts[4];
        confirmPasswordController.text = parts[4];
      }
    }
  }

  Future<void> _saveDraft() async {
    final prefs = await SharedPreferences.getInstance();
    final data = [
      firstNameController.text.trim(),
      lastNameController.text.trim(),
      emailController.text.trim(),
      phoneController.text.trim(),
      passwordController.text,
    ].join('\x00');
    await prefs.setString('register_draft', data);
    if (!mounted) return;
    setState(() => draftSaved = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => draftSaved = false);
    });
  }

  String _normalizePhone(String raw) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.length == 9 && digits.startsWith('9')) return '+251$digits';
    if (digits.length == 10 && digits.startsWith('09')) return '+251${digits.substring(1)}';
    if (digits.length == 12 && digits.startsWith('251')) return '+$digits';
    if (digits.length == 13 && digits.startsWith('+251')) return '+$digits';
    return raw;
  }

  bool _isValidEthiopianPhone(String raw) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.length == 9 && digits.startsWith('9')) return true;
    if (digits.length == 10 && digits.startsWith('09')) return true;
    if (digits.length == 12 && digits.startsWith('251')) return true;
    if (digits.length == 13 && digits.startsWith('251')) return true;
    return false;
  }

  Future<void> _continueToRole() async {
    hasTriedContinue = true;

    final fn = firstNameController.text.trim();
    final ln = lastNameController.text.trim();
    final em = emailController.text.trim();
    final ph = phoneController.text.trim();
    final pw = passwordController.text;
    final cp = confirmPasswordController.text;

    if (fn.isEmpty || ln.isEmpty || em.isEmpty || pw.isEmpty || cp.isEmpty) {
      setState(() => error = "Please fill in all required fields");
      return;
    }
    if (pw != cp) {
      setState(() => error = "Passwords do not match");
      return;
    }
    if (pw.length < 8) {
      setState(() => error = "Password must be at least 8 characters");
      return;
    }
    if (!RegExp(r'(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d)').hasMatch(pw)) {
      setState(() => error = "Password must include 1 capital letter, 1 special character (!@#\$%^&*), and 1 number");
      return;
    }
    if (ph.isEmpty) {
      setState(() => error = "Please enter your phone number");
      return;
    }
    if (!_isValidEthiopianPhone(ph)) {
      setState(() => error = "Enter a valid Ethiopian phone number in the format 9XX XXX XXX");
      return;
    }

    // Validate email via backend
    setState(() { validatingEmail = true; error = null; });
    final validation = await AuthService.validateEmail(em);
    setState(() => validatingEmail = false);

    if (validation['valid'] == false) {
      setState(() => error = validation['message'] ?? "Invalid email address");
      return;
    }
    if (validation['error'] != null) {
      setState(() => error = validation['error']);
      return;
    }

    final normalizedPhone = _normalizePhone(ph);

    if (!mounted) return;
    // Clear draft on successful submission
    SharedPreferences.getInstance().then((p) => p.remove('register_draft'));
    Navigator.push(context, MaterialPageRoute(builder: (_) => RoleSelectionPage(
      firstName: fn,
      lastName: ln,
      email: em,
      password: pw,
      phoneNumber: normalizedPhone,
    )));
  }

  void _onGoogleSuccess(Map<String, dynamic> result) {
    if (result['needsRoleSelection'] == true) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const RoleSelectionPage()));
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
      backgroundColor: const Color(0xffF7F8FA),
      body: SafeArea(
        child: LayoutBuilder(builder: (context, constraints) {
          final narrow = constraints.maxWidth < 700;
          return SingleChildScrollView(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: narrow ? 20 : 40, vertical: 20),
              child: Column(children: [
                LayoutBuilder(builder: (context, inner) {
                  final mobile = inner.maxWidth < 700;
                  return Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                    Expanded(child: FittedBox(
                      fit: BoxFit.scaleDown, alignment: Alignment.centerLeft,
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Image.asset("images/logo.png", width: mobile ? 34 : 42, height: mobile ? 34 : 42, fit: BoxFit.contain),
                        const SizedBox(width: 8),
                        Text("StartupConnect", overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: mobile ? 16 : 18, fontWeight: FontWeight.bold, color: const Color(0xff0D3B36))),
                      ]),
                    )),
                    Flexible(child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        TextButton(onPressed: _saveDraft, child: Text(draftSaved ? "Draft Saved!" : "Save as Draft", style: TextStyle(color: draftSaved ? const Color(0xff065F46) : const Color(0xff5C6672), fontWeight: FontWeight.w600, fontSize: mobile ? 12 : 14))),
                        const SizedBox(width: 8),
                        Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), decoration: BoxDecoration(color: const Color(0xffE9F7F0), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xffB8E7D2))), child: Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.lock_outline, size: 16, color: Color(0xff0E6245)),
                          const SizedBox(width: 6),
                          Text("SECURE", style: TextStyle(color: const Color(0xff0E6245), fontWeight: FontWeight.bold, fontSize: mobile ? 9 : 11, letterSpacing: 1)),
                        ])),
                      ]),
                    )),
                  ]);
                }),
                SizedBox(height: isMobile ? 40 : 60),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text("Create your account", textAlign: TextAlign.center, style: TextStyle(fontSize: isMobile ? 28 : 44, fontWeight: FontWeight.bold, color: const Color(0xff0D1833))),
                ),
                const SizedBox(height: 10),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text("Enter your details to get started with StartupConnect Ethiopia",
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: isMobile ? 14 : 18, color: const Color(0xff7B8494))),
                ),
                const SizedBox(height: 30),
                Center(child: Container(
                  constraints: const BoxConstraints(maxWidth: 700),
                  padding: EdgeInsets.all(isMobile ? 18 : 40),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15, offset: const Offset(0, 6))]),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    if (error != null) ...[
                      Container(width: double.infinity, padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12)), child: Text(error!, style: TextStyle(color: Colors.red.shade800))),
                      const SizedBox(height: 16),
                    ],
                    if (hasTriedContinue && firstNameController.text.trim().isEmpty) Container(width: double.infinity, margin: const EdgeInsets.only(bottom: 12), child: const Text("First name is required", style: TextStyle(color: Colors.red, fontSize: 13))),
                    narrow
                        ? Column(children: [
                            buildInputField(title: "First Name *", hint: "e.g. Abebe", controller: firstNameController),
                            const SizedBox(height: 16),
                            buildInputField(title: "Last Name *", hint: "e.g. Kebede", controller: lastNameController),
                          ])
                        : Row(children: [
                            Expanded(child: buildInputField(title: "First Name *", hint: "e.g. Abebe", controller: firstNameController)),
                            const SizedBox(width: 16),
                            Expanded(child: buildInputField(title: "Last Name *", hint: "e.g. Kebede", controller: lastNameController)),
                          ]),
                    const SizedBox(height: 18),
                    buildInputField(title: "Email Address *", hint: "abebe@example.com", controller: emailController),
                    if (hasTriedContinue && emailController.text.trim().isNotEmpty && !validatingEmail) ...[
                      if (emailValid)
                        Container(width: double.infinity, margin: const EdgeInsets.only(top: 4), child: Row(children: [
                          Icon(Icons.check_circle, size: 14, color: Colors.green.shade600),
                          const SizedBox(width: 4),
                          Text("Email is valid", style: TextStyle(color: Colors.green.shade600, fontSize: 13)),
                        ])),
                    ],
                    const SizedBox(height: 18),
                    buildInputField(title: "Phone Number *", hint: "9XX XXX XXX (e.g. 912 345 678)", controller: phoneController),
                    if (hasTriedContinue && phoneController.text.isNotEmpty && !_isValidEthiopianPhone(phoneController.text))
                      Container(width: double.infinity, margin: const EdgeInsets.only(top: 4), child: const Text("Enter a valid Ethiopian phone number: 9XX XXX XXX", style: TextStyle(color: Colors.red, fontSize: 13))),
                    const SizedBox(height: 18),
                    buildInputField(title: "Password *", hint: "••••••••", controller: passwordController, obscure: true),
                    if (hasTriedContinue && passwordController.text.isNotEmpty && passwordController.text.length < 8)
                      Container(width: double.infinity, margin: const EdgeInsets.only(top: 4), child: const Text("Password must be at least 8 characters with 1 capital, 1 number, 1 special character", style: TextStyle(color: Colors.red, fontSize: 13))),
                    const SizedBox(height: 18),
                    buildInputField(title: "Confirm Password *", hint: "••••••••", controller: confirmPasswordController, obscure: true),
                    if (hasTriedContinue && confirmPasswordController.text.isNotEmpty && passwordController.text != confirmPasswordController.text)
                      Container(width: double.infinity, margin: const EdgeInsets.only(top: 4), child: const Text("Passwords do not match", style: TextStyle(color: Colors.red, fontSize: 13))),
                    const SizedBox(height: 28),
                    SizedBox(
                      width: double.infinity, height: 56,
                      child: ElevatedButton(
                        onPressed: validatingEmail ? null : _continueToRole,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xff065F46), foregroundColor: Colors.white, elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: validatingEmail
                            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text("Continue", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
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
                      mode: 'register',
                      onSuccess: _onGoogleSuccess,
                    ),
                  ]),
                )),
                const SizedBox(height: 30),
                Wrap(alignment: WrapAlignment.center, children: [
                  const Text("Already have an account? ", style: TextStyle(color: Color(0xff7B8494), fontSize: 15)),
                  InkWell(onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginPage())), child: const Text("Log in", style: TextStyle(color: Color(0xff0D3B36), fontSize: 15, fontWeight: FontWeight.bold))),
                ]),
                const SizedBox(height: 40),
                Wrap(alignment: WrapAlignment.center, spacing: 20, runSpacing: 10, children: [
                  footerButton("StartupConnect Ethiopia"),
                  footerButton("PRIVACY POLICY"),
                  footerButton("TERMS OF SERVICE"),
                  footerButton("CONTACT SUPPORT"),
                ]),
                const SizedBox(height: 14),
                const Text("© 2026 STARTUPCONNECT ETHIOPIA. ALL RIGHTS RESERVED.",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xff9AA3B2), fontSize: 12, letterSpacing: 0.6),
                ),
                const SizedBox(height: 24),
              ]),
            ),
          );
        }),
      ),
    );
  }

  Widget buildInputField({required String title, required String hint, required TextEditingController controller, bool obscure = false}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xff111827), fontSize: 14)),
      const SizedBox(height: 8),
      TextField(controller: controller, obscureText: obscure, decoration: InputDecoration(
        hintText: hint, hintStyle: const TextStyle(color: Color(0xffA0A8B5)),
        filled: true, fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade300)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.grey.shade300)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xff065F46), width: 1.5)),
      )),
    ]);
  }

  Widget footerButton(String text) {
    return InkWell(onTap: (){}, child: Text(text, style: const TextStyle(color: Color(0xff8A94A6), fontSize: 13, fontWeight: FontWeight.w600, letterSpacing: 0.5)));
  }
}
