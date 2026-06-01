import 'package:flutter/material.dart';

import 'home_page.dart';
import 'startup_registration_page.dart';
import 'company_details_page.dart';
import 'verification_documents_page.dart';
import 'registration_submitted_page.dart';

class ReviewSubmitPage extends StatefulWidget {
  const ReviewSubmitPage({super.key});

  @override
  State<ReviewSubmitPage> createState() => _ReviewSubmitPageState();
}

class _ReviewSubmitPageState extends State<ReviewSubmitPage> {
  bool accuracyChecked = false;
  bool termsChecked = false;

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 700;

    return Scaffold(
      backgroundColor: const Color(0xffF6F7F9),

      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xff0D3B36)),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
        title: const Text(
          "Review & Submit",
          style: TextStyle(
            color: Color(0xff0D3B36),
            fontWeight: FontWeight.bold,
          ),
        ),
      ),

      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(
            horizontal: isMobile ? 18 : 40,
            vertical: 20,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              const Text(
                "Review & Submit",
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.bold,
                  color: Color(0xff0D3B36),
                ),
              ),

              const SizedBox(height: 8),

              const Text(
                "Double-check your application details before sending them for official verification.",
                style: TextStyle(
                  color: Color(0xff667085),
                  fontSize: 16,
                ),
              ),

              const SizedBox(height: 30),

              // PROFILE COMPLETE
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xffDDF2EA),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        color: const Color(0xff0B7A5B),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white,
                          width: 3,
                        ),
                      ),
                      child: const Center(
                        child: Text(
                          "100%",
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(width: 18),

                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Profile Complete",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              color: Color(0xff0D3B36),
                            ),
                          ),

                          SizedBox(height: 4),

                          Text(
                            "All required fields have been successfully populated.",
                            style: TextStyle(
                              color: Color(0xff5C6672),
                            ),
                          ),
                        ],
                      ),
                    ),

                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xffFFF1E6),
                        borderRadius: BorderRadius.circular(30),
                      ),
                      child: const Text(
                        "READY FOR REVIEW",
                        style: TextStyle(
                          color: Color(0xffD97706),
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 30),

              // ACCOUNT INFORMATION
              buildSection(
                title: "Account Information",
                onEdit: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const StartupRegistrationPage(),
                    ),
                  );
                },
                child: buildInfoContainer(
                  children: [
                    buildInfoItem("FULL NAME", "Abebe Kebede"),
                    buildInfoItem("WORK EMAIL", "abebe.k@startupeth.et"),
                    buildInfoItem("PHONE NUMBER", "+251 911 234 567"),
                    buildInfoItem("ROLE", "Founder | CEO"),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // COMPANY DETAILS
              buildSection(
                title: "Company Details",
                onEdit: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const CompanyDetailsPage(),
                    ),
                  );
                },
                child: buildInfoContainer(
                  children: [
                    buildInfoItem(
                      "COMPANY NAME",
                      "EthioAgriTech Solutions",
                    ),
                    buildInfoItem(
                      "INDUSTRY",
                      "Agri-Tech / AI",
                    ),
                    buildInfoItem(
                      "REGISTRATION NUMBER",
                      "ET-98219-150",
                    ),
                    buildInfoItem(
                      "BUSINESS SUMMARY",
                      "Providing data-driven soil analysis for smallholder farmers across the Oromia region to optimize fertilizer usage and increase crop yields by 40%.",
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // DOCUMENTS
              buildSection(
                title: "Verification Documents",
                onEdit: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) =>
                          const VerificationDocumentsPage(),
                    ),
                  );
                },
                child: Wrap(
                  spacing: 14,
                  runSpacing: 14,
                  children: [
                    buildDocumentCard(
                      "trade_license.pdf",
                      "4.2 MB",
                    ),
                    buildDocumentCard(
                      "tin_certificate.pdf",
                      "1.1 MB",
                    ),
                    buildDocumentCard(
                      "office_photos.zip",
                      "12.4 MB",
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              const Text(
                "Final Acknowledgements",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xff0D3B36),
                ),
              ),

              const SizedBox(height: 24),

              CheckboxListTile(
                value: accuracyChecked,
                activeColor: const Color(0xff0B7A5B),
                onChanged: (value) {
                  setState(() {
                    accuracyChecked = value!;
                  });
                },
                title: const Text(
                  "Accuracy Declaration",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                subtitle: const Text(
                  "I certify that all information provided is true and accurate.",
                ),
                controlAffinity:
                    ListTileControlAffinity.leading,
              ),

              CheckboxListTile(
                value: termsChecked,
                activeColor: const Color(0xff0B7A5B),
                onChanged: (value) {
                  setState(() {
                    termsChecked = value!;
                  });
                },
                title: const Text(
                  "Terms of Service & Privacy Policy",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                subtitle: const Text(
                  "I agree to StartupConnect Ethiopia terms and policies.",
                ),
                controlAffinity:
                    ListTileControlAffinity.leading,
              ),

              const SizedBox(height: 30),

              // SUBMIT CARD
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(30),
                decoration: BoxDecoration(
                  color: const Color(0xff0B6B53),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [

                    const Text(
                      "Ready to Join the Ecosystem?",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 34,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    const SizedBox(height: 16),

                    const Text(
                      "Once submitted, our administrators will review your application within 3-5 business days. You will receive an email notification upon approval.",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 16,
                      ),
                    ),

                    const SizedBox(height: 30),
                    Wrap(
                      spacing: 16,
                      runSpacing: 16,
                      alignment: WrapAlignment.center,
                      children: [

                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor:
                                const Color(0xff0B6B53),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 34,
                              vertical: 18,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(14),
                            ),
                          ),
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const RegistrationSubmittedPage(),
                              ),
                            );
                          },
                          child: const Text(
                            "Submit for Verification",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),

                        OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(
                              color: Colors.white30,
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 34,
                              vertical: 18,
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
                            "Cancel",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),

                    Wrap(
                      alignment: WrapAlignment.center,
                      spacing: 24,
                      runSpacing: 12,
                      children: const [

                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.lock_outline,
                              size: 16,
                              color: Color(0xffA7F3D0),
                            ),
                            SizedBox(width: 6),
                            Text(
                              "ENCRYPTED CONNECTION",
                              style: TextStyle(
                                color: Color(0xffA7F3D0),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),

                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.shield_outlined,
                              size: 16,
                              color: Color(0xffA7F3D0),
                            ),
                            SizedBox(width: 6),
                            Text(
                              "SECURE FORM SSL TLS",
                              style: TextStyle(
                                color: Color(0xffA7F3D0),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),

                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.public,
                              size: 16,
                              color: Color(0xffA7F3D0),
                            ),
                            SizedBox(width: 6),
                            Text(
                              "DATA IN ETHIOPIA",
                              style: TextStyle(
                                color: Color(0xffA7F3D0),
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 1,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 30),

              Divider(
                color: Colors.white.withOpacity(0.2),
              ),

              const SizedBox(height: 20),

              Wrap(
                alignment: WrapAlignment.center,
                spacing: 24,
                runSpacing: 12,
                children: const [

                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.fingerprint,
                        size: 18,
                        color: Color.fromARGB(255, 155, 157, 161),
                      ),
                      SizedBox(width: 8),
                      Text(
                        "SECURE GATEWAY",
                        style: TextStyle(
                          color: Color.fromARGB(255, 155, 157, 161),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),

                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.storage_outlined,
                        size: 18,
                        color: Color.fromARGB(255, 155, 157, 161),
                      ),
                      SizedBox(width: 8),
                      Text(
                        "DATA HOSTED ET",
                        style: TextStyle(
                          color: Color.fromARGB(255, 155, 157, 161),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),

                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.workspace_premium_outlined,
                        size: 18,
                        color: Color.fromARGB(255, 155, 157, 161),
                      ),
                      SizedBox(width: 8),
                      Text(
                        "MINT APPROVED",
                        style: TextStyle(
                          color: Color.fromARGB(255, 155, 157, 161),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 20),

              const Text(
                "StartupConnect Ethiopia is an initiative managed by the Ministry of Innovation and Technology (MinT). In short, your data is protected by the Ethiopia Personal Data Protection Proclamation.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color.fromARGB(255, 155, 157, 161),
                  fontSize: 12,
                  height: 1.6,
                ),
              ),

            ],
          ),
        ),
      ),
    );
  }

  Widget buildSection({
    required String title,
    required Widget child,
    required VoidCallback onEdit,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xffF1F3F5),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        children: [

          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 24,
                    color: Color(0xff0D3B36),
                  ),
                ),
              ),

              GestureDetector(
                onTap: onEdit,
                child: const Text(
                  "EDIT SECTION",
                  style: TextStyle(
                    color: Color(0xff0B7A5B),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          child,
        ],
      ),
    );
  }

  Widget buildInfoContainer({
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Wrap(
        spacing: 30,
        runSpacing: 24,
        children: children,
      ),
    );
  }

  Widget buildInfoItem(String title, String value) {
    return SizedBox(
      width: 260,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          Text(
            title,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Color(0xff98A2B3),
              letterSpacing: 1,
            ),
          ),

          const SizedBox(height: 8),

          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 17,
            ),
          ),
        ],
      ),
    );
  }

  Widget buildDocumentCard(String title, String size) {
    return Container(
      width: 220,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [

          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xffFFF4E8),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.insert_drive_file_outlined,
              color: Color(0xffD97706),
            ),
          ),

          const SizedBox(width: 12),

          Expanded(
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [

                Text(
                  title,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 4),

                Text(
                  size,
                  style: const TextStyle(
                    color: Color(0xff98A2B3),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}