import 'package:flutter/material.dart';
import 'login_page.dart';
import 'home_page.dart';

class InvestorVerificationSubmittedPage extends StatelessWidget {
  const InvestorVerificationSubmittedPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: Center(
        child: SingleChildScrollView(
          child: Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                )
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // ✅ Icon
                Stack(
                  alignment: Alignment.topRight,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE6F4EA),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Icon(
                        Icons.shield_outlined,
                        size: 48,
                        color: Color(0xFF1B5E20),
                      ),
                    ),
                    const CircleAvatar(
                      radius: 10,
                      backgroundColor: Color(0xFF1B5E20),
                      child: Icon(Icons.check, size: 14, color: Colors.white),
                    )
                  ],
                ),

                const SizedBox(height: 16),

                // ✅ Status
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    "PENDING APPROVAL",
                    style: TextStyle(fontSize: 12, letterSpacing: 1),
                  ),
                ),

                const SizedBox(height: 20),

                // ✅ Title
                const Text(
                  "Registration Submitted",
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 12),

                // ✅ Description
                const Text(
                  "Your investor account has been submitted for admin verification. "
                  "Your profile and uploaded documents are now under review.",
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),

                const SizedBox(height: 24),

                // ✅ Info box
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.info_outline, color: Colors.grey),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          "Standard review time is 24-48 business hours. "
                          "You will receive an automated notification via your registered email once your account has been approved and activated.",
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 70),

                // ✅ Buttons
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F3D2E),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const LoginPage(),
                            ),
                          );
                        },
                        child: const Text("Go to Login"),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey.shade300,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onPressed: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const HomePage(),
                            ),
                          );
                        },
                        child: const Text(
                          "Back to Home",
                          style: TextStyle(color: Colors.black),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 30),
                Divider(color: Colors.grey.shade300),
                const SizedBox(height: 20),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildFeature(Icons.shield_outlined, "SECURE VERIFICATION"),
                    _buildFeature(Icons.assignment_turned_in_outlined, "ADMIN REVIEWED"),
                    _buildFeature(Icons.verified_outlined, "VERIFIED PLATFORM"),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }


  Widget _buildFeature(IconData icon, String text) {
  return Column(
    children: [
      Icon(icon, color: Colors.grey, size: 28),
      const SizedBox(height: 8),
      Text(
        text,
        style: const TextStyle(
          fontSize: 11,
          letterSpacing: 1.2,
          color: Colors.grey,
        ),
      ),
    ],
  );
}
}