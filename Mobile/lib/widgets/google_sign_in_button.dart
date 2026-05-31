import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../services/auth_service.dart';

class GoogleSignInButton extends StatefulWidget {
  final String mode;
  final void Function(Map<String, dynamic> result)? onSuccess;
  final VoidCallback? onError;

  const GoogleSignInButton({super.key, this.mode = 'login', this.onSuccess, this.onError});

  @override
  State<GoogleSignInButton> createState() => _GoogleSignInButtonState();
}

class _GoogleSignInButtonState extends State<GoogleSignInButton> {
  bool loading = false;

  Future<void> handleSignIn() async {
    setState(() => loading = true);
    try {
      final GoogleSignIn googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
      );
      final GoogleSignInAccount? account = await googleSignIn.signIn();
      if (account == null) {
        setState(() => loading = false);
        return;
      }
      final GoogleSignInAuthentication auth = await account.authentication;
      final String? idToken = auth.idToken;
      if (idToken == null) {
        if (mounted) _showError("Could not retrieve Google credentials");
        return;
      }
      final result = await AuthService.googleAuth(idToken, mode: widget.mode);
      if (!mounted) return;
      if (result['error'] != null) {
        _showError(result['error']);
        return;
      }
      widget.onSuccess?.call(result);
    } on PlatformException catch (e) {
      final msg = e.message ?? '';
      if (msg.contains('SIGN_IN_REQUIRED') || msg.contains('NETWORK_ERROR')) {
        if (mounted) _showError("Network error. Please check your connection and try again.");
      } else if (msg.contains('DEVELOPER_ERROR') || msg.contains('10')) {
        if (mounted) _showError("Google Sign-In is not configured for this app. Please use email registration.");
      } else {
        if (mounted) _showError("Google Sign-In failed: ${e.message ?? 'Unknown error'}");
      }
    } catch (e) {
      final msg = e.toString();
      if (msg.contains('PlatformException') || msg.contains('sign_in')) {
        if (mounted) _showError("Google Sign-In is not available. Please use email registration.");
      } else {
        if (mounted) _showError("Google sign-in failed: ${e.toString()}");
      }
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red.shade700));
    setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: loading ? null : handleSignIn,
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          side: const BorderSide(color: Color(0xffD0D5DD)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xff344054),
          elevation: 0,
        ),
        icon: loading
            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2))
            : Container(
                width: 22, height: 22,
                decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                child: const Center(
                  child: Text("G", style: TextStyle(color: Color(0xFF4285F4), fontWeight: FontWeight.bold, fontSize: 18)),
                ),
              ),
        label: Text(
          loading ? "Signing in..." : "Continue with Google",
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: Color(0xff344054)),
        ),
      ),
    );
  }
}
