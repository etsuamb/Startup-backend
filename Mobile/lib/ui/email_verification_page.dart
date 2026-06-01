import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'startup_dashboard_page.dart';
import 'investor_dashboard_page.dart';
import 'mentor_dashboard_page.dart';
import 'login_page.dart';

class EmailVerificationPage extends StatefulWidget {
  final String email;
  final String role;
  final Map<String, dynamic>? accountData;

  const EmailVerificationPage({
    super.key,
    required this.email,
    required this.role,
    this.accountData,
  });

  @override
  State<EmailVerificationPage> createState() => _EmailVerificationPageState();
}

class _EmailVerificationPageState extends State<EmailVerificationPage> {
  bool _resending = false;
  bool _checking = false;
  String? _message;

  Future<void> _resend() async {
    setState(() { _resending = true; _message = null; });
    final result = await ApiService.post('/auth/resend-verification', body: {'email': widget.email});
    setState(() {
      _resending = false;
      _message = result['message'] as String? ?? 'Verification email resent';
    });
  }

  Future<void> _checkAndContinue() async {
    setState(() { _checking = true; _message = null; });
    final me = await ApiService.get('/auth/me');
    final user = me['user'] ?? me;
    if (user['email_verified'] == true || user['emailVerified'] == true) {
      if (!mounted) return;
      Widget page;
      switch (widget.role.toLowerCase()) {
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
      return;
    }
    setState(() {
      _checking = false;
      _message = 'Email not yet verified. Please check your inbox and click the verification link.';
    });
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isMobile = size.width < 700;

    return Scaffold(
      backgroundColor: const Color(0xffF7F8FA),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(isMobile ? 20 : 40),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 460),
              padding: EdgeInsets.all(isMobile ? 24 : 40),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 15)],
              ),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Container(
                  width: 72, height: 72,
                  decoration: BoxDecoration(color: const Color(0xffE9F7F0), shape: BoxShape.circle),
                  child: const Icon(Icons.mark_email_unread, color: Color(0xff065F46), size: 36),
                ),
                const SizedBox(height: 24),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text("Verify Your Email", style: TextStyle(fontSize: isMobile ? 24 : 28, fontWeight: FontWeight.bold, color: const Color(0xff0D1833))),
                ),
                const SizedBox(height: 12),
                Text(
                  "We sent a verification email to",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: isMobile ? 14 : 16, color: const Color(0xff7B8494)),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: const Color(0xffF0FDF6), borderRadius: BorderRadius.circular(8)),
                  child: Text(widget.email, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xff065F46), fontSize: 14)),
                ),
                const SizedBox(height: 20),
                Text(
                  "Click the link in the email to verify your account, then come back and tap continue.",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: isMobile ? 13 : 15, color: const Color(0xff667085), height: 1.5),
                ),
                const SizedBox(height: 30),
                if (_message != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: _message!.contains('not yet verified') ? Colors.orange.shade50 : const Color(0xffF0FDF6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(_message!, textAlign: TextAlign.center,
                      style: TextStyle(
                        color: _message!.contains('not yet verified') ? Colors.orange.shade800 : const Color(0xff065F46),
                        fontSize: 13,
                      ),
                    ),
                  ),
                SizedBox(
                  width: double.infinity, height: 52,
                  child: ElevatedButton(
                    onPressed: _checking ? null : _checkAndContinue,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xff065F46), foregroundColor: Colors.white, elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: _checking
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text("I've Verified — Continue", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity, height: 44,
                  child: TextButton(
                    onPressed: _resending ? null : _resend,
                    style: TextButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                    child: _resending
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text("Resend Verification Email", style: TextStyle(color: Color(0xff065F46), fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginPage())),
                  child: const Text("Use a different account", style: TextStyle(color: Color(0xff7B8494), fontSize: 13)),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
