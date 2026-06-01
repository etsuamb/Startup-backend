import 'package:flutter/material.dart';

import 'home_page.dart';
import 'login_page.dart';
// import 'contact_us_page.dart';

class RegistrationSubmittedPage extends StatelessWidget {
  const RegistrationSubmittedPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F7FA),

      body: SafeArea(
        child: Column(
          children: [

            // =========================
            // TOP BAR
            // =========================

            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 18,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(
                  bottom: BorderSide(
                    color: Color(0xffE5E7EB),
                  ),
                ),
              ),
              child: Row(
                children: [

                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xff0D3B36),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.auto_awesome,
                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(width: 12),

                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "StartupConnect",
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xff0D3B36),
                        ),
                      ),

                      Text(
                        "FOUNDER PORTAL",
                        style: TextStyle(
                          fontSize: 11,
                          letterSpacing: 1.5,
                          color: Color(0xff98A2B3),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),

                  const Spacer(),

                  TextButton(
                    onPressed: () {
                      // Navigator.push(
                      //   context,
                      //   MaterialPageRoute(
                      //     builder: (_) => const ContactUsPage(),
                      //   ),
                      // );
                    },
                    child: const Text(
                      "Need Help?",
                      style: TextStyle(
                        color: Color(0xff667085),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),

                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const LoginPage(),
                        ),
                      );
                    },
                    child: const Text(
                      "Go to Login",
                      style: TextStyle(
                        color: Color(0xff0D3B36),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // =========================
            // BODY
            // =========================

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: Container(
                    constraints: const BoxConstraints(
                      maxWidth: 780,
                    ),
                    padding: const EdgeInsets.all(40),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                    ),

                    child: Column(
                      children: [

                        // ICON
                        Container(
                          width: 90,
                          height: 90,
                          decoration: BoxDecoration(
                            color: const Color(0xffDDF2E9),
                            borderRadius: BorderRadius.circular(22),
                          ),
                          child: const Icon(
                            Icons.verified,
                            color: Color(0xff0B7A5B),
                            size: 44,
                          ),
                        ),

                        const SizedBox(height: 28),

                        // PENDING
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 18,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xffE8F5EE),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: const Text(
                            "• PENDING APPROVAL",
                            style: TextStyle(
                              color: Color(0xff0B7A5B),
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                              fontSize: 12,
                            ),
                          ),
                        ),

                        const SizedBox(height: 30),

                        const Text(
                          "Registration Submitted",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 42,
                            fontWeight: FontWeight.bold,
                            color: Color(0xff0D1B2A),
                          ),
                        ),

                        const SizedBox(height: 20),

                        const Text(
                          "Your founder account has been submitted for admin\nverification. Your profile and uploaded documents are now\nunder review.",
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 20,
                            height: 1.7,
                            color: Color(0xff475467),
                          ),
                        ),

                        const SizedBox(height: 40),

                        // INFO BOX
                        Container(
                          padding: const EdgeInsets.all(22),
                          decoration: BoxDecoration(
                            color: const Color(0xffF8FAFC),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: const Color(0xffEAECF0),
                            ),
                          ),
                          child: const Row(
                            children: [

                              Icon(
                                Icons.info_outline,
                                color: Color(0xff0D3B36),
                              ),

                              SizedBox(width: 14),

                              Expanded(
                                child: Text(
                                  "Standard review time is 24-48 business hours. You will receive an automated notification via your registered email once your account has been approved and activated.",
                                  style: TextStyle(
                                    fontSize: 16,
                                    height: 1.6,
                                    color: Color(0xff475467),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 42),

                        // BUTTONS
                        Wrap(
                          spacing: 18,
                          runSpacing: 18,
                          alignment: WrapAlignment.center,
                          children: [

                            SizedBox(
                              width: 220,
                              height: 58,
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor:
                                      const Color(0xff0B7A5B),
                                  shape: RoundedRectangleBorder(
                                    borderRadius:
                                        BorderRadius.circular(14),
                                  ),
                                ),
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          const LoginPage(),
                                    ),
                                  );
                                },
                                child: const Text(
                                  "Go to Login",
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),

                            SizedBox(
                              width: 220,
                              height: 58,
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(
                                    color: Color(0xffD0D5DD),
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius:
                                        BorderRadius.circular(14),
                                  ),
                                ),
                                onPressed: () {
                                  Navigator.pushAndRemoveUntil(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          const HomePage(),
                                    ),
                                    (route) => false,
                                  );
                                },
                                child: const Text(
                                  "Back to Home",
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xff344054),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 50),

                        const Divider(),

                        const SizedBox(height: 36),

                        Wrap(
                          alignment: WrapAlignment.center,
                          spacing: 40,
                          runSpacing: 20,
                          children: [

                            buildFooterItem(
                              Icons.verified_user_outlined,
                              "SECURE VERIFICATION",
                            ),

                            buildFooterItem(
                              Icons.description_outlined,
                              "ADMIN REVIEWED",
                            ),

                            buildFooterItem(
                              Icons.check_circle_outline,
                              "VERIFIED PLATFORM",
                            ),
                          ],
                        ),

                        const SizedBox(height: 30),

                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 18,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(30),
                            boxShadow: [
                              BoxShadow(
                                color:
                                    Colors.black.withOpacity(0.08),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min, mainAxisAlignment: MainAxisAlignment.end,
                            children: [

                              CircleAvatar(
                                radius: 6,
                                backgroundColor: Color(0xffA16207),
                              ),

                              SizedBox(width: 10),

                              Text(
                                "Live Support Active",
                                style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xff0D3B36),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget buildFooterItem(
    IconData icon,
    String title,
  ) {
    return Column(
      children: [

        Icon(
          icon,
          color: const Color(0xff0D3B36),
        ),

        const SizedBox(height: 10),

        Text(
          title,
          style: const TextStyle(
            fontSize: 11,
            letterSpacing: 1.2,
            fontWeight: FontWeight.bold,
            color: Color(0xff667085),
          ),
        ),
      ],
    );
  }
}